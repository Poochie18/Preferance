import { useEffect, useState, type CSSProperties } from 'react';
import { useGame, HUMAN } from '../../context/GameContext';
import { getVisibleState } from '../../../engine/rules/view';
import { legalCardsToPlay } from '../../../engine/rules/trick';
import { pickupTalon } from '../../../engine/rules/talonExchange';
import { isContractMade } from '../../../engine/rules/contract';
import { currentActingPlayer } from '../../../ai/orchestrator';
import { Hand } from '../Hand/Hand';
import { BiddingControls } from '../BiddingControls/BiddingControls';
import { TalonExchange } from '../TalonExchange/TalonExchange';
import { WhistControls } from '../WhistControls/WhistControls';
import { TrickArea } from '../TrickArea/TrickArea';
import { ScoreSheet } from '../ScoreSheet/ScoreSheet';
import { TableSettingsPopover } from '../TableSettingsPopover/TableSettingsPopover';
import { HistoryPopover } from '../HistoryPopover/HistoryPopover';
import { useTranslation } from '../../../i18n';
import { useSettings } from '../../../settings/context';
import { cardLabel, isRedSuit } from '../../cardLabel';
import { formatContractLocalized } from '../../formatBid';
import { whistLabel } from '../../whistLabel';
import type { PlayerId } from '../../../engine/model/player';
import type { DealResult, GameState } from '../../../engine/model/gameState';

const DEBUG = new URLSearchParams(window.location.search).get('debug') === '1';

export function Table() {
  const { game, paused, log, setPaused, dispatchHuman, nextDeal, resetGame } = useGame();
  const { settings } = useSettings();
  const { t } = useTranslation();
  const [openPopover, setOpenPopover] = useState<'settings' | 'history' | null>(null);
  const togglePopover = (which: 'settings' | 'history') => setOpenPopover((v) => (v === which ? null : which));

  const phase = game?.deal.phase;
  const isBlindMisereTalon =
    !!phase &&
    phase.tag === 'talonExchange' &&
    phase.declarer === HUMAN &&
    (phase.finalBid.kind === 'misere' || phase.finalBid.kind === 'misere-ouvert') &&
    game!.rulesConfig.misereBiddingMode === 'blind';

  useEffect(() => {
    if (isBlindMisereTalon) {
      dispatchHuman({ type: 'EXCHANGE_TALON', player: HUMAN, discard: [] });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isBlindMisereTalon]);

  if (!game) return null;

  const view = getVisibleState(game, HUMAN);
  const acting = currentActingPlayer(game);
  const isHumanTurn = acting === HUMAN;
  const showTalonExchange = phase!.tag === 'talonExchange' && phase!.declarer === HUMAN && !isBlindMisereTalon;
  const showBidding = phase!.tag === 'bidding' && isHumanTurn;
  const showWhist = phase!.tag === 'whistDecisions' && phase!.turn === HUMAN;
  const showScored = phase!.tag === 'scored';
  const showWaiting = phase!.tag !== 'trickPlay' && !showBidding && !showTalonExchange && !showWhist && !showScored;

  /**
   * Role in the deal ("Вист", "Розыгрыш" + "6♠") and tricks taken so far; only once
   * cards are played. The contract is separate so it can be kept on one line.
   */
  function seatStats(p: PlayerId): { role: string | null; contract: string | null; taken: string } | null {
    const ph = phase!;
    if (ph.tag !== 'trickPlay' && ph.tag !== 'scored') return null;
    const { contract, whistDecisions } = ph.tag === 'scored' ? ph.result : ph;
    const tricks = ph.tag === 'scored' ? ph.result.tricksByPlayer[p] : ph.tricks.filter((tr) => tr.winner === p).length;
    const decision = whistDecisions[p];
    const isDeclarer = contract?.declarer === p;
    return {
      role: isDeclarer ? t.table.declarerRole : decision ? whistLabel(decision, t) : null,
      contract: isDeclarer ? formatContractLocalized(contract, t) : null,
      taken: t.history.tricksTaken(tricks),
    };
  }

  function dealOutcome(result: DealResult): { text: string; made?: boolean } {
    const { contract } = result;
    if (!contract) return { text: t.history.passout };
    const made = isContractMade(contract, result.tricksByPlayer[contract.declarer]);
    const verdict = made ? t.table.contractMade : t.table.contractFailed;
    return { text: `${t.playerNames[contract.declarer]}: ${formatContractLocalized(contract, t)} — ${verdict}`, made };
  }

  function renderBotSeat(p: Extract<PlayerId, 1 | 2>, side: 'left' | 'right') {
    const stats = seatStats(p);
    return (
      <div className={`bot-seat bot-seat-${side}`}>
        <div className={`opponent ${acting === p && phase!.tag !== 'scored' ? 'is-acting' : ''}`}>
          {/* Everything about the bot sits beside its cards, on the side facing the table centre. */}
          <div className="bot-hand-row">
            <div className="rotated-hand">
              <div className="opponent-cards" style={{ '--count': view.handCounts[p] } as CSSProperties}>
                {DEBUG
                  ? (game as GameState).deal.hands[p].map((c) => (
                      <span key={`${c.suit}${c.rank}`} className={`card tiny ${isRedSuit(c.suit) ? 'red' : 'black'}`}>
                        {cardLabel(c)}
                      </span>
                    ))
                  : Array.from({ length: view.handCounts[p] }).map((_, i) => <span key={i} className="card-back" />)}
              </div>
            </div>
            <div className="bot-info">
              <div className="opponent-name">{t.playerNames[p]}</div>
              {/* Always rendered (just hidden) so the seat doesn't jump when the turn changes. */}
              <div className={`turn-indicator ${acting === p && phase!.tag !== 'scored' ? '' : 'is-hidden'}`}>
                {t.table.playerTurn}
              </div>
              <div className="bot-card-count">{t.table.cardsCount(view.handCounts[p])}</div>
              {/* Role and tricks only once cards are played. */}
              {stats && (
                <div className="seat-stats">
                  {stats.role && (
                    <div className="seat-role">
                      {stats.role} {stats.contract && <span className="nowrap">{stats.contract}</span>}
                    </div>
                  )}
                  <div>{stats.taken}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const humanStats = seatStats(HUMAN);

  return (
    <div className="table">
      <div className="table-corner table-corner-left">
        <button onClick={() => togglePopover('settings')}>{t.menu.settings}</button>
        <button onClick={() => togglePopover('history')}>{t.history.title}</button>
      </div>
      {openPopover === 'settings' && (
        <TableSettingsPopover
          paused={paused}
          pauseEnabled={settings.pauseEnabled}
          onTogglePause={() => setPaused(!paused)}
          onClose={() => setOpenPopover(null)}
        />
      )}
      {openPopover === 'history' && <HistoryPopover log={log} onClose={() => setOpenPopover(null)} />}
      <button className="table-corner table-corner-right" onClick={resetGame}>
        {t.table.menu}
      </button>

      {renderBotSeat(1, 'left')}

      <div className="center-column">
        <ScoreSheet totals={game.totals} dealNumber={game.deal.dealNumber} pulyaLength={game.pulyaLength} />

        {/* The playing surface only matters while cards are being played; in every
            other phase its space goes to the controls (bidding, talon, whist...). */}
        {phase!.tag === 'trickPlay' && (
          <div className="playing-surface panel">
            <TrickArea plays={phase!.currentTrick} lastTrick={phase!.tricks.at(-1)} />
          </div>
        )}

        <div className="center-controls">
          {showBidding && (
            <BiddingControls biddingState={phase!} onBid={(bid) => dispatchHuman({ type: 'BID', player: HUMAN, bid })} />
          )}
          {showTalonExchange && phase!.tag === 'talonExchange' && (
            <TalonExchange
              combinedHand={pickupTalon(game.deal.hands[HUMAN], game.deal.talon)}
              finalBid={phase!.finalBid}
              declarerGora={game.totals[HUMAN].gora}
              rulesConfig={game.rulesConfig}
              onConfirm={(discard, onVyslu) => dispatchHuman({ type: 'EXCHANGE_TALON', player: HUMAN, discard, onVyslu })}
            />
          )}
          {showWhist && (
            <WhistControls onDecide={(decision) => dispatchHuman({ type: 'WHIST_DECISION', player: HUMAN, decision })} />
          )}
          {showScored && phase!.tag === 'scored' && (
            <div className="panel deal-scored">
              {(() => {
                const outcome = dealOutcome(phase!.result);
                const tone = outcome.made === undefined ? '' : outcome.made ? 'is-made' : 'is-failed';
                return <div className={`deal-outcome ${tone}`}>{outcome.text}</div>;
              })()}
              <button onClick={nextDeal}>
                {game.deal.dealNumber >= game.pulyaLength ? t.table.newPulya : t.table.nextDeal}
              </button>
            </div>
          )}
          {showWaiting && (
            <div className="bot-thinking">
              <span className="spinner" />
              <span>{t.table.botThinking}</span>
            </div>
          )}
        </div>
      </div>

      {renderBotSeat(2, 'right')}

      <div className={`human-area ${isHumanTurn && phase!.tag !== 'scored' ? 'is-acting' : ''}`}>
        <div className="opponent-name">
          {t.playerNames[HUMAN]}
          {humanStats && (
            <span className="seat-stats"> · {[humanStats.role && [humanStats.role, humanStats.contract].filter(Boolean).join(' '), humanStats.taken]
                .filter(Boolean)
                .join(' · ')}</span>
          )}
          {phase!.tag !== 'scored' && isHumanTurn && <span className="turn-indicator"> — {t.table.playerTurn}</span>}
        </div>
        <Hand
          cards={view.myHand}
          legalCards={
            phase!.tag === 'trickPlay' && phase!.turn === HUMAN
              ? legalCardsToPlay(view.myHand, phase!.currentTrick, phase!.contract)
              : undefined
          }
          onPlay={
            phase!.tag === 'trickPlay' && phase!.turn === HUMAN
              ? (card) => dispatchHuman({ type: 'PLAY_CARD', player: HUMAN, card })
              : undefined
          }
        />
      </div>
    </div>
  );
}
