export const COMBAT_STATUS = {
  inProgress: "InProgress",
  playerVictory: "PlayerVictory",
  playerDefeat: "PlayerDefeat",
} as const;

export const COMBAT_DEFEAT_REASON = {
  playerHealthDepleted: "PlayerHealthDepleted",
  turnLimitExceeded: "TurnLimitExceeded",
} as const;

export const COMBAT_EVENT_TYPE = {
  attackResolved: "AttackResolved",
  combatEnded: "CombatEnded",
  turnAdvanced: "TurnAdvanced",
} as const;

export const COMBAT_ACTOR = {
  player: "Player",
  monster: "Monster",
} as const;

export const PLAYER_ACTION_TYPE = {
  basicAttack: "basic_attack",
} as const;
