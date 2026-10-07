import {
  COMBAT_ACTOR,
  COMBAT_DEFEAT_REASON,
  COMBAT_EVENT_TYPE,
  COMBAT_STATUS,
  PLAYER_ACTION_TYPE,
} from "./combat.constants.js";

export type CombatStatus =
  (typeof COMBAT_STATUS)[keyof typeof COMBAT_STATUS];

export type CombatDefeatReason =
  (typeof COMBAT_DEFEAT_REASON)[keyof typeof COMBAT_DEFEAT_REASON];

export type CombatActor =
  (typeof COMBAT_ACTOR)[keyof typeof COMBAT_ACTOR];

export type PlayerActionType =
  (typeof PLAYER_ACTION_TYPE)[keyof typeof PLAYER_ACTION_TYPE];

export type Combatant = {
  currentHealth: number;
  maximumHealth: number;
  attack: number;
  defense: number;
};

export type CombatEffect = never;

export type PlayerAction = {
  type: PlayerActionType;
};

export type CombatState = {
  player: Combatant;
  monster: Combatant;

  turn: number;

  status: CombatStatus;

  defeatReason: CombatDefeatReason | null;

  effects: readonly CombatEffect[];
};

export type AttackResolvedEvent = {
  type:
    (typeof COMBAT_EVENT_TYPE)["attackResolved"];

  actor: CombatActor;
  target: CombatActor;

  hit: boolean;
  damage: number;
};

export type CombatEndedEvent = {
  type:
    (typeof COMBAT_EVENT_TYPE)["combatEnded"];

  status: CombatStatus;

  defeatReason:
    | CombatDefeatReason
    | null;
};

export type TurnAdvancedEvent = {
  type:
    (typeof COMBAT_EVENT_TYPE)["turnAdvanced"];

  turn: number;
};

export type CombatEvent =
  | AttackResolvedEvent
  | CombatEndedEvent
  | TurnAdvancedEvent;

export type CombatResolution = {
  state: CombatState;

  events: readonly CombatEvent[];
};
