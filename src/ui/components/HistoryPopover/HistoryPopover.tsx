import { useEffect, useRef, type ReactNode } from 'react';
import type { Card } from '../../../engine/model/card';
import { PLAYER_IDS } from '../../../engine/model/player';
import type { PlayerDelta } from '../../../engine/model/gameState';
import { useTranslation } from '../../../i18n';
import type { TranslationKeys } from '../../../i18n/types';
import { cardLabel, isRedSuit } from '../../cardLabel';
import { formatBidLocalized } from '../../formatBid';
import { whistLabel } from '../../whistLabel';
import type { HistoryEntry } from '../../history';

interface Props {
  log: HistoryEntry[];
  onClose: () => void;
}

function CardText({ card }: { card: Card }) {
  return <span className={`history-card ${isRedSuit(card.suit) ? 'red' : 'black'}`}>{cardLabel(card)}</span>;
}

function cardList(cards: Card[]): ReactNode {
  return cards.map((c, i) => (
    <span key={i}>
      {i > 0 && ' '}
      <CardText card={c} />
    </span>
  ));
}

function signed(n: number): string {
  return n > 0 ? `+${n}` : String(n);
}

/** Only the score-sheet lines that changed, e.g. "Пуля +16", "Висты → Бот 1 +4". */
function scoreChanges(delta: PlayerDelta, t: TranslationKeys): string[] {
  const s = t.scoreSheet;
  const changes: string[] = [];
  if (delta.pulya) changes.push(`${s.pulya} ${signed(delta.pulya)}`);
  if (delta.gora) changes.push(`${s.gora} ${signed(delta.gora)}`);
  for (const q of PLAYER_IDS) {
    if (delta.whists[q]) changes.push(`${s.whists} → ${t.playerNames[q]} ${signed(delta.whists[q])}`);
  }
  return changes;
}

function renderEntry(e: HistoryEntry, t: TranslationKeys): ReactNode {
  const h = t.history;
  switch (e.kind) {
    case 'dealStart':
      return h.deal(e.dealNumber, t.playerNames[e.dealer]);
    case 'bid':
      return `${t.playerNames[e.player]}: ${e.bid === 'pass' ? t.bidding.pass : formatBidLocalized(e.bid, t)}`;
    case 'passout':
      return h.passout;
    case 'contract': {
      const notes = [e.onVyslu && h.onVyslu, e.blind && h.blind].filter(Boolean).join(', ');
      return (
        <>
          <strong>{h.contract(t.playerNames[e.player], formatBidLocalized(e.bid, t))}</strong>
          {notes && ` (${notes})`}
          {e.talon && (
            <div className="history-sub">
              {h.talon}: {cardList(e.talon)}
            </div>
          )}
          {e.discard && (
            <div className="history-sub">
              {h.discard}: {cardList(e.discard)}
            </div>
          )}
        </>
      );
    }
    case 'whist':
      return `${t.playerNames[e.player]}: ${whistLabel(e.decision, t)}`;
    case 'trick':
      return (
        <>
          {h.trick(e.number)}:{' '}
          {e.plays.map((p, i) => (
            <span key={p.player}>
              {i > 0 && ' · '}
              {t.playerNames[p.player]} <CardText card={p.card} />
            </span>
          ))}{' '}
          → <strong>{t.playerNames[e.winner]}</strong>
        </>
      );
    case 'dealEnd':
      return (
        <>
          <strong>{h.result}</strong>
          {PLAYER_IDS.map((p) => (
            <div key={p} className="history-sub">
              {t.playerNames[p]} — {h.tricksTaken(e.result.tricksByPlayer[p])}
              {scoreChanges(e.result.pointsDelta[p], t).map((change) => ` · ${change}`)}
            </div>
          ))}
        </>
      );
  }
}

export function HistoryPopover({ log, onClose }: Props) {
  const { t } = useTranslation();
  const listRef = useRef<HTMLOListElement>(null);

  // Keep the newest move in view as the game goes on.
  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [log.length]);

  return (
    <div className="panel table-popover history-popover">
      <div className="popover-header">
        <h3>{t.history.title}</h3>
        <button className="popover-close" onClick={onClose} aria-label={t.settings.back}>
          ×
        </button>
      </div>
      {log.length === 0 ? (
        <p className="history-empty">{t.history.empty}</p>
      ) : (
        <ol className="history-list" ref={listRef}>
          {log.map((e, i) => (
            <li key={i} className={`history-${e.kind}`}>
              {renderEntry(e, t)}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
