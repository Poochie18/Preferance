import { useEffect, useState } from 'react';
import { useGame, HUMAN } from '../../context/GameContext';
import { getVisibleState } from '../../../engine/rules/view';
import { legalCardsToPlay } from '../../../engine/rules/trick';
import { pickupTalon } from '../../../engine/rules/talonExchange';
import { currentActingPlayer } from '../../../ai/orchestrator';
import { Hand } from '../Hand/Hand';
import { BiddingControls } from '../BiddingControls/BiddingControls';
import { TalonExchange } from '../TalonExchange/TalonExchange';
import { WhistControls } from '../WhistControls/WhistControls';
import { TrickArea } from '../TrickArea/TrickArea';
import { ScoreSheet } from '../ScoreSheet/ScoreSheet';
import { TableSettingsPopover } from '../TableSettingsPopover/TableSettingsPopover';
import { useTranslation } from '../../../i18n';
import { useSettings } from '../../../settings/context';
import { cardLabel, isRedSuit } from '../../cardLabel';
import type { PlayerId } from '../../../engine/model/player';
import type { GameState } from '../../../engine/model/gameState';

const DEBUG = new URLSearchParams(window.location.search).get('debug') === '1';

export function Table() {
  const { game, paused, setPaused, dispatchHuman, nextDeal, resetGame } = useGame();
  const { settings } = useSettings();
  const { t } = useTranslation();
  const [settingsOpen, setSettingsOpen] = useState(false);

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

  function renderBotSeat(p: Extract<PlayerId, 1 | 2>, side: 'left' | 'right') {
    return (
      <div className={`bot-seat bot-seat-${side}`}>
        <div className={`opponent ${acting === p && phase!.tag !== 'scored' ? 'is-acting' : ''}`}>
          <div className="seat-badge">{t.playerNames[p].charAt(0).toUpperCase()}</div>
          <div className="opponent-name">
            {t.playerNames[p]}
            {phase!.tag !== 'scored' && acting === p && <span className="turn-indicator"> {t.table.yourTurn}</span>}
          </div>
          <div className="bot-card-count">{t.table.cardsCount(view.handCounts[p])}</div>
          <div className="rotated-hand">
            <div className="opponent-cards">
              {DEBUG
                ? (game as GameState).deal.hands[p].map((c) => (
                    <span key={`${c.suit}${c.rank}`} className={`card tiny ${isRedSuit(c.suit) ? 'red' : 'black'}`}>
                      {cardLabel(c)}
                    </span>
                  ))
                : Array.from({ length: view.handCounts[p] }).map((_, i) => <span key={i} className="card-back" />)}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="table">
      <button className="pause-corner" onClick={() => setSettingsOpen((v) => !v)}>
        {t.menu.settings}
      </button>
      {settingsOpen && (
        <TableSettingsPopover
          paused={paused}
          pauseEnabled={settings.pauseEnabled}
          onTogglePause={() => setPaused(!paused)}
          onClose={() => setSettingsOpen(false)}
        />
      )}
      <button className="newgame-corner" onClick={resetGame}>
        {t.table.newGame}
      </button>

      {renderBotSeat(1, 'left')}

      <div className="center-column">
        <ScoreSheet totals={game.totals} dealNumber={game.deal.dealNumber} pulyaLength={game.pulyaLength} />

        <div className="playing-surface panel">
          {phase!.tag === 'trickPlay' ? <TrickArea plays={phase!.currentTrick} /> : <p className="trick-empty">{t.trick.empty}</p>}
        </div>

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
          {showScored && (
            <div className="panel deal-scored">
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
          {phase!.tag !== 'scored' && isHumanTurn && <span className="turn-indicator"> {t.table.yourTurn}</span>}
        </div>
        <Hand
          cards={view.myHand}
          legalCards={
            phase!.tag === 'trickPlay' && phase!.turn === HUMAN
              ? legalCardsToPlay(view.myHand, phase!.currentTrick)
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
