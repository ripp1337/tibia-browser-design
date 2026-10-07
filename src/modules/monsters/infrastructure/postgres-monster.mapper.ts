export type PostgreSqlMonsterRow = {
  monster_id: string;
  monster_family_id: string;

  code: string;
  name: string;
  description: string;
  artwork: string | null;

  monster_type: string;
  level: number;

  energy_cost: number;
  cooldown_seconds: number;
};

export type PostgreSqlMonsterListRow =
  PostgreSqlMonsterRow;

export type PostgreSqlMonsterDetailsRow =
  PostgreSqlMonsterRow;