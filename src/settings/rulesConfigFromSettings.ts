import type { GameSettings } from './types';
import type { RulesConfig } from '../engine/rules/rulesConfig';
import {
  buildRulesConfig,
  parseRozpasovkaExit,
  POINTS_TARGET_TO_DEAL_COUNT,
  UNBOUNDED_PULYA_LENGTH,
} from '../engine/rules/ruleProfiles';

export function rulesConfigFromSettings(settings: GameSettings): RulesConfig {
  const pulyaLength =
    settings.winCondition === 'time' ? UNBOUNDED_PULYA_LENGTH : POINTS_TARGET_TO_DEAL_COUNT[settings.pointsTarget];

  return buildRulesConfig(settings.gameType, pulyaLength, {
    whistStyle: settings.whistStyle,
    whistPenaltyMode: settings.whistPenaltyMode,
    rozpasovkaExit: parseRozpasovkaExit(settings.rozpasovkaExit),
    finalDealMode: settings.finalDealMode,
    misereBiddingMode: settings.misereBiddingMode,
  });
}
