import type { Card, Suit } from '../engine/model/card';
import type { PlayerView, TrickCardPlay } from '../engine/model/gameState';
import { nextPlayer, PLAYER_IDS, type PlayerId } from '../engine/model/player';
import { trumpSuitOf } from '../engine/rules/trick';
import { isBoss, knownVoids, playedCards, unseenCards } from './cardMemory';

export interface PlayOptions {
  /** Remember played cards and shown-out suits; without it only the current trick is seen. */
  memory: boolean;
}

/**
 * maxTricks: declarer of a trump/no-trump contract, or a defender (the two defenders are a team).
 * avoidTricks: rozpasovka (everyone for themselves) or the misère declarer.
 * catchMisere: the two defenders against a misère, trying to force the declarer to win a trick.
 */
type Goal = 'maxTricks' | 'avoidTricks' | 'catchMisere';

interface Ctx {
  me: PlayerId;
  hand: Card[];
  trump: Suit | null;
  goal: Goal;
  /** The other defender; null for the declarer and at rozpasovka. */
  partner: PlayerId | null;
  declarer: PlayerId | null;
  trick: TrickCardPlay[];
  unseen: Card[];
  voids: Record<PlayerId, Set<Suit>>;
  /** The declarer's cards when they lie open (misère ouvert). */
  declarerHand?: Card[];
}

const byRank = (a: Card, b: Card) => a.rank - b.rank;
const lowest = (cards: Card[]) => [...cards].sort(byRank)[0];
const highest = (cards: Card[]) => [...cards].sort(byRank)[cards.length - 1];
const suitCount = (cards: Card[], suit: Suit) => cards.filter((c) => c.suit === suit).length;

function beats(card: Card, best: Card, trump: Suit | null): boolean {
  if (card.suit === best.suit) return card.rank > best.rank;
  return trump !== null && card.suit === trump;
}

function winningPlay(trick: TrickCardPlay[], trump: Suit | null): TrickCardPlay {
  return trick.reduce((best, play) => (beats(play.card, best.card, trump) ? play : best));
}

function buildCtx(view: PlayerView, opts: PlayOptions): Ctx {
  const phase = view.phase;
  if (phase.tag !== 'trickPlay') throw new Error('Card play outside trick play');
  const { contract, tricks, currentTrick } = phase;
  const me = view.viewer;
  const played = opts.memory ? playedCards(tricks, currentTrick) : currentTrick.map((p) => p.card);
  const voids = opts.memory
    ? knownVoids(tricks, currentTrick)
    : (Object.fromEntries(PLAYER_IDS.map((p) => [p, new Set<Suit>()])) as Record<PlayerId, Set<Suit>>);
  const base = { me, hand: view.myHand, trump: trumpSuitOf(contract), trick: currentTrick, unseen: unseenCards(view.myHand, played), voids };

  if (!contract) return { ...base, goal: 'avoidTricks', partner: null, declarer: null };
  const declarer = contract.declarer;
  const otherDefender = PLAYER_IDS.find((p) => p !== me && p !== declarer) ?? null;
  const isMisere = contract.kind === 'misere' || contract.kind === 'misere-ouvert';
  if (declarer === me) return { ...base, goal: isMisere ? 'avoidTricks' : 'maxTricks', partner: null, declarer };
  return {
    ...base,
    goal: isMisere ? 'catchMisere' : 'maxTricks',
    partner: otherDefender,
    declarer,
    declarerHand: view.openHands?.[declarer],
  };
}

function opponents(ctx: Ctx): PlayerId[] {
  return PLAYER_IDS.filter((p) => p !== ctx.me && p !== ctx.partner);
}

/** Could `player` trump this card: shown out of its suit and maybe still holding trumps. */
function ruffRisk(card: Card, ctx: Ctx, player: PlayerId): boolean {
  if (!ctx.trump || card.suit === ctx.trump) return false;
  const trumpsOut = ctx.unseen.some((c) => c.suit === ctx.trump);
  return trumpsOut && ctx.voids[player].has(card.suit) && !ctx.voids[player].has(ctx.trump);
}

/** A card that wins if led (or played second) against these players. */
function holds(card: Card, ctx: Ctx, against: PlayerId[]): boolean {
  return isBoss(card, ctx.unseen) && !against.some((p) => ruffRisk(card, ctx, p));
}

/** A card unlikely to matter: lowest non-boss, preferably from the shortest suit (to make a void). */
function shed(ctx: Ctx, legal: Card[]): Card {
  const spare = legal.filter((c) => !isBoss(c, ctx.unseen));
  const pool = spare.length > 0 ? spare : legal;
  return [...pool].sort((a, b) => a.rank - b.rank || suitCount(ctx.hand, a.suit) - suitCount(ctx.hand, b.suit))[0];
}

// --- Taking tricks -----------------------------------------------------------

function leadMax(ctx: Ctx, legal: Card[]): Card {
  const opps = opponents(ctx);
  const { trump } = ctx;
  const trumps = legal.filter((c) => c.suit === trump);
  const trumpsOut = trump ? ctx.unseen.filter((c) => c.suit === trump).length : 0;

  // The declarer draws the opponents' trumps first.
  if (ctx.declarer === ctx.me && trumps.length > 0 && trumpsOut > 0) {
    const bossTrumps = trumps.filter((c) => isBoss(c, ctx.unseen));
    if (bossTrumps.length > 0) return highest(bossTrumps);
    if (trumps.length > trumpsOut) return lowest(trumps);
  }

  // Cash a sure winner, from the longest suit first.
  const winners = legal.filter((c) => holds(c, ctx, opps));
  if (winners.length > 0) {
    return [...winners].sort((a, b) => suitCount(ctx.hand, b.suit) - suitCount(ctx.hand, a.suit) || b.rank - a.rank)[0];
  }

  // A defender gives the partner a ruff in a suit they've shown out of.
  if (ctx.partner !== null && trump) {
    const partner = ctx.partner;
    const ruffable = legal.filter(
      (c) =>
        c.suit !== trump &&
        ctx.voids[partner].has(c.suit) &&
        !ctx.voids[partner].has(trump) &&
        !opps.some((o) => ctx.voids[o].has(c.suit)),
    );
    if (ruffable.length > 0) return lowest(ruffable);
  }

  // Otherwise lead low from the longest side suit, but not away from a lone king or queen.
  const side = legal.filter((c) => c.suit !== trump);
  const pool = side.length > 0 ? side : legal;
  const suits = [...new Set(pool.map((c) => c.suit))];
  const score = (suit: Suit) => {
    const mine = ctx.hand.filter((c) => c.suit === suit);
    const top = highest(mine);
    const looseHonour = top.rank >= 12 && !isBoss(top, ctx.unseen);
    return mine.length - (looseHonour ? 2 : 0);
  };
  const suit = suits.reduce((a, b) => (score(b) > score(a) ? b : a));
  return lowest(pool.filter((c) => c.suit === suit));
}

function followMax(ctx: Ctx, legal: Card[]): Card {
  const win = winningPlay(ctx.trick, ctx.trump);
  const last = ctx.trick.length === 2;
  const after = last ? null : nextPlayer(ctx.me);
  const winners = legal.filter((c) => beats(c, win.card, ctx.trump));

  if (ctx.partner !== null && win.player === ctx.partner) {
    // Partner is winning: don't overtake unless their card might lose to the player after us.
    if (last || holds(win.card, ctx, [after!])) return shed(ctx, legal);
    const sure = winners.filter((c) => holds(c, ctx, [after!]));
    return sure.length > 0 ? lowest(sure) : shed(ctx, legal);
  }

  if (winners.length === 0) return shed(ctx, legal);
  // Last to play, or only the partner still to come: win as cheaply as possible.
  if (last || after === ctx.partner) return lowest(winners);

  // Second hand with an opponent still to play: commit only a card that will hold.
  const led = ctx.trick[0].card.suit;
  const sure = winners.filter((c) =>
    c.suit === ctx.trump && c.suit !== led
      ? !ctx.voids[after!].has(led) || isBoss(c, ctx.unseen) // a ruff holds unless they can overruff
      : holds(c, ctx, [after!]),
  );
  if (sure.length > 0) return lowest(sure);
  const ruffs = winners.filter((c) => c.suit === ctx.trump && c.suit !== led);
  if (ruffs.length > 0) return lowest(ruffs);
  return shed(ctx, legal); // second hand low
}

// --- Avoiding tricks (rozpasovka, own misère) ---------------------------------

function leadAvoid(ctx: Ctx, legal: Card[]): Card {
  const others = PLAYER_IDS.filter((p) => p !== ctx.me);
  // The more unseen cards outrank it, the more likely someone else takes the trick.
  const cover = (c: Card) =>
    others.every((p) => ctx.voids[p].has(c.suit))
      ? -1
      : ctx.unseen.filter((u) => u.suit === c.suit && u.rank > c.rank).length;
  return [...legal].sort((a, b) => cover(b) - cover(a) || a.rank - b.rank)[0];
}

function followAvoid(ctx: Ctx, legal: Card[]): Card {
  const win = winningPlay(ctx.trick, ctx.trump);
  const led = ctx.trick[0].card.suit;
  if (legal.every((c) => c.suit === led)) {
    // Duck with the highest card that still loses; if every card wins, take it with the highest
    // when last, otherwise play low and hope the next player goes over.
    const under = legal.filter((c) => !beats(c, win.card, ctx.trump));
    if (under.length > 0) return highest(under);
    return ctx.trick.length === 2 ? highest(legal) : lowest(legal);
  }
  return dumpDanger(ctx, legal);
}

/** Discard the card most likely to win a trick later: the fewest unseen cards above it. */
function dumpDanger(ctx: Ctx, legal: Card[]): Card {
  const above = (c: Card) => ctx.unseen.filter((u) => u.suit === c.suit && u.rank > c.rank).length;
  return [...legal].sort((a, b) => above(a) - above(b) || b.rank - a.rank)[0];
}

// --- Catching a misère ----------------------------------------------------------

function leadCatch(ctx: Ctx, legal: Card[]): Card {
  const declarer = ctx.declarer!;
  const live = legal.filter((c) => !ctx.voids[declarer].has(c.suit));
  const pool = live.length > 0 ? live : legal;
  if (ctx.declarerHand) {
    // Lead under every card the declarer holds in a suit: they must win it.
    const forcing = pool.filter((c) => {
      const theirs = ctx.declarerHand!.filter((d) => d.suit === c.suit);
      return theirs.length > 0 && theirs.every((d) => d.rank > c.rank);
    });
    if (forcing.length > 0) return lowest(forcing);
  }
  return lowest(pool);
}

function followCatch(ctx: Ctx, legal: Card[]): Card {
  const declarer = ctx.declarer!;
  const win = winningPlay(ctx.trick, ctx.trump);
  const led = ctx.trick[0].card.suit;
  const declarerPlayed = ctx.trick.some((p) => p.player === declarer);
  if (declarerPlayed) {
    if (win.player === declarer) {
      // Leave the declarer on lead of the trick: duck under, shedding a high card.
      const under = legal.filter((c) => !beats(c, win.card, ctx.trump));
      if (under.length > 0) return highest(under);
    }
    // The trick is ours anyway: get rid of a high card, keep low ones for later leads.
    return highest(legal);
  }
  // The declarer still has to play: keep the card to duck under as low as possible.
  if (!legal.every((c) => c.suit === led)) return highest(legal);
  return lowest(legal);
}

/** Role-aware card choice shared by the medium and hard bots. */
export function chooseCard(view: PlayerView, legal: Card[], opts: PlayOptions): Card {
  if (legal.length === 1 || view.phase.tag !== 'trickPlay') return legal[0];
  const ctx = buildCtx(view, opts);
  const leading = ctx.trick.length === 0;
  switch (ctx.goal) {
    case 'maxTricks':
      return leading ? leadMax(ctx, legal) : followMax(ctx, legal);
    case 'avoidTricks':
      return leading ? leadAvoid(ctx, legal) : followAvoid(ctx, legal);
    case 'catchMisere':
      return leading ? leadCatch(ctx, legal) : followCatch(ctx, legal);
  }
}
