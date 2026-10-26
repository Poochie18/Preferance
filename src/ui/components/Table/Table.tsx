import { useEffect } from 'react';
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
import { GameLog } from '../GameLog/GameLog';
import { useTranslation } from '../../../i18n';
import { useSettings } from '../../../settings/context';
import { cardLabel } from '../../cardLabel';

const DEBUG = new URLSearchParams(window.location.search).get('debug') === '1';

export function Table() {
  const { game, log, paused, setPaused, dispatchHuman, nextDeal, resetGame } = useGame();
  const { settings } = useSettings();
  const { t } = useTranslation();

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

  return (
    <div className="table">
      <div className="opponents">
        {([1, 2] as const).map((p) => (
          <div key={p} className="opponent">
            <div className="opponent-name">
              {t.playerNames[p]}
              {phase!.tag !== 'scored' && acting === p && <span className="turn-indicator"> {t.table.yourTurn}</span>}
            </div>
            <div className="opponent-cards">
              {DEBUG
                ? game.deal.hands[p].map((c) => (
                    <span key={`${c.suit}${c.rank}`} className="card tiny">
                      {cardLabel(c)}
                    </span>
                  ))
                : Array.from({ length: view.handCounts[p] }).map((_, i) => <span key={i} className="card-back" />)}
            </div>
          </div>
        ))}
      </div>

      {phase!.tag === 'trickPlay' && <TrickArea plays={phase!.currentTrick} />}

      <div className="center-controls">
        {phase!.tag === 'bidding' && isHumanTurn && (
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
        {phase!.tag === 'whistDecisions' && phase!.turn === HUMAN && (
          <WhistControls onDecide={(decision) => dispatchHuman({ type: 'WHIST_DECISION', player: HUMAN, decision })} />
        )}
        {phase!.tag === 'scored' && (
          <div className="panel deal-scored">
            <button onClick={nextDeal}>
              {game.deal.dealNumber >= game.pulyaLength ? t.table.newPulya : t.table.nextDeal}
            </button>
          </div>
        )}
      </div>

      <div className="human-area">
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

      <div className="side-panels">
        <ScoreSheet totals={game.totals} dealNumber={game.deal.dealNumber} pulyaLength={game.pulyaLength} />
        <GameLog lines={log} />
        {settings.pauseEnabled && (
          <button className="pause-button" onClick={() => setPaused(!paused)}>
            {paused ? t.table.resume : t.table.pause}
          </button>
        )}
        <button className="reset-button" onClick={resetGame}>
          {t.table.newGame}
        </button>
      </div>
    </div>
  );
}
