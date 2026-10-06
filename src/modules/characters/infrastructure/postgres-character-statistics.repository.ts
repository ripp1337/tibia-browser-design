import type {
  Pool,
  QueryResult,
  QueryResultRow,
} from "pg";

import type {
  CharacterStatisticsRepository,
  CharacterStatisticsSources,
} from "../application/character-statistics.repository.js";
import type {
  CharacterId,
} from "../domain/character.types.js";

type Queryable = {
  query<Row extends QueryResultRow>(
    queryText: string,
    values?: unknown[]
  ): Promise<QueryResult<Row>>;
};

type CharacterStatisticsSourcesRow = {
  level: number;
  current_spell_power: string;
  equipment_attack: string;
  equipment_defense: string;
  equipment_spell_power: string;
  equipment_health: string;
  equipment_mana: string;
  equipment_energy: string;
  equipment_gold_percent: string;
  equipment_experience_percent: string;
  achievement_attack: string;
  achievement_defense: string;
  achievement_gold_percent: string;
  achievement_experience_percent: string;
  boost_attack: string;
  boost_defense: string;
  boost_spell_power: string;
  boost_gold_percent: string;
  boost_experience_percent: string;
  permanent_attack: string;
  permanent_defense: string;
  permanent_spell_power: string;
  permanent_health: string;
  permanent_mana: string;
  permanent_energy: string;
  permanent_gold_percent: string;
  permanent_experience_percent: string;
};

const CALCULATION_SOURCES_QUERY = `
  SELECT
    c.level,
    csm.current_spell_power,

    COALESCE(SUM(ib.attack + COALESCE(ia.attack, 0)), 0) +
      COALESCE(MAX(sb.attack), 0) AS equipment_attack,

    COALESCE(SUM(ib.defense + COALESCE(ia.defense, 0)), 0) +
      COALESCE(MAX(sb.defense), 0) AS equipment_defense,

    COALESCE(SUM(ib.spell_power + COALESCE(ia.spell_power, 0)), 0) +
      COALESCE(MAX(sb.spell_power), 0) AS equipment_spell_power,

    COALESCE(SUM(ib.health + COALESCE(ia.health, 0)), 0) +
      COALESCE(MAX(sb.health), 0) AS equipment_health,

    COALESCE(SUM(ib.mana + COALESCE(ia.mana, 0)), 0) +
      COALESCE(MAX(sb.mana), 0) AS equipment_mana,

    COALESCE(SUM(ib.energy + COALESCE(ia.energy, 0)), 0)
      AS equipment_energy,

    COALESCE(
      SUM(ib.gold_percent + COALESCE(ia.gold_percent, 0)),
      0
    ) + COALESCE(MAX(sb.gold_percent), 0)
      AS equipment_gold_percent,

    COALESCE(
      SUM(
        ib.experience_percent +
        COALESCE(ia.experience_percent, 0)
      ),
      0
    ) + COALESCE(MAX(sb.experience_percent), 0)
      AS equipment_experience_percent,

    COALESCE(MAX(achievement.attack), 0)
      AS achievement_attack,
    COALESCE(MAX(achievement.defense), 0)
      AS achievement_defense,
    COALESCE(MAX(achievement.gold_percent), 0)
      AS achievement_gold_percent,
    COALESCE(MAX(achievement.experience_percent), 0)
      AS achievement_experience_percent,

    COALESCE(MAX(boost.attack), 0) AS boost_attack,
    COALESCE(MAX(boost.defense), 0) AS boost_defense,
    COALESCE(MAX(boost.spell_power), 0) AS boost_spell_power,
    COALESCE(MAX(boost.gold_percent), 0) AS boost_gold_percent,
    COALESCE(MAX(boost.experience_percent), 0)
      AS boost_experience_percent,

    COALESCE(MAX(cpb.attack), 0) AS permanent_attack,
    COALESCE(MAX(cpb.defense), 0) AS permanent_defense,
    COALESCE(MAX(cpb.spell_power), 0) AS permanent_spell_power,
    COALESCE(MAX(cpb.health), 0) AS permanent_health,
    COALESCE(MAX(cpb.mana), 0) AS permanent_mana,
    COALESCE(MAX(cpb.energy), 0) AS permanent_energy,
    COALESCE(MAX(cpb.gold_percent), 0) AS permanent_gold_percent,
    COALESCE(MAX(cpb.experience_percent), 0)
      AS permanent_experience_percent

  FROM characters c

  INNER JOIN character_spell_mastery csm
    ON csm.character_id = c.character_id

  INNER JOIN character_permanent_bonuses cpb
    ON cpb.character_id = c.character_id

  LEFT JOIN inventory_items ii
    ON ii.character_id = c.character_id
    AND ii.is_equipped = TRUE

  LEFT JOIN items i
    ON i.item_id = ii.item_id

  LEFT JOIN item_bases ib
    ON ib.item_base_id = i.item_base_id

  LEFT JOIN LATERAL (
    SELECT
      COALESCE(SUM(ia.roll_value) FILTER (
        WHERE at.affix_type = 'Attack'
      ), 0) AS attack,
      COALESCE(SUM(ia.roll_value) FILTER (
        WHERE at.affix_type = 'Defense'
      ), 0) AS defense,
      COALESCE(SUM(ia.roll_value) FILTER (
        WHERE at.affix_type = 'SpellPower'
      ), 0) AS spell_power,
      COALESCE(SUM(ia.roll_value) FILTER (
        WHERE at.affix_type = 'Health'
      ), 0) AS health,
      COALESCE(SUM(ia.roll_value) FILTER (
        WHERE at.affix_type = 'Mana'
      ), 0) AS mana,
      COALESCE(SUM(ia.roll_value) FILTER (
        WHERE at.affix_type = 'Energy'
      ), 0) AS energy,
      COALESCE(SUM(ia.roll_value) FILTER (
        WHERE at.affix_type = 'GoldPercent'
      ), 0) AS gold_percent,
      COALESCE(SUM(ia.roll_value) FILTER (
        WHERE at.affix_type = 'ExperiencePercent'
      ), 0) AS experience_percent
    FROM item_affixes ia
    INNER JOIN affix_templates at
      ON at.affix_template_id = ia.affix_template_id
    WHERE ia.item_id = i.item_id
  ) ia ON TRUE

  LEFT JOIN LATERAL (
    SELECT
      COALESCE(SUM(selected.bonus_value) FILTER (
        WHERE selected.bonus_type = 'Attack'
      ), 0) AS attack,
      COALESCE(SUM(selected.bonus_value) FILTER (
        WHERE selected.bonus_type = 'Defense'
      ), 0) AS defense,
      COALESCE(SUM(selected.bonus_value) FILTER (
        WHERE selected.bonus_type = 'SpellPower'
      ), 0) AS spell_power,
      COALESCE(SUM(selected.bonus_value) FILTER (
        WHERE selected.bonus_type = 'Health'
      ), 0) AS health,
      COALESCE(SUM(selected.bonus_value) FILTER (
        WHERE selected.bonus_type = 'Mana'
      ), 0) AS mana,
      COALESCE(SUM(selected.bonus_value) FILTER (
        WHERE selected.bonus_type = 'GoldPercent'
      ), 0) AS gold_percent,
      COALESCE(SUM(selected.bonus_value) FILTER (
        WHERE selected.bonus_type = 'ExperiencePercent'
      ), 0) AS experience_percent
    FROM (
      SELECT DISTINCT ON (
        bonus.set_template_id,
        bonus.bonus_type
      )
        bonus.set_template_id,
        bonus.bonus_type,
        bonus.bonus_value
      FROM set_bonuses bonus
      INNER JOIN (
        SELECT
          equipped_base.set_template_id,
          COUNT(*) AS equipped_pieces
        FROM inventory_items equipped_inventory
        INNER JOIN items equipped_item
          ON equipped_item.item_id = equipped_inventory.item_id
        INNER JOIN item_bases equipped_base
          ON equipped_base.item_base_id = equipped_item.item_base_id
        WHERE equipped_inventory.character_id = c.character_id
          AND equipped_inventory.is_equipped = TRUE
          AND equipped_base.set_template_id IS NOT NULL
        GROUP BY equipped_base.set_template_id
      ) equipped_sets
        ON equipped_sets.set_template_id = bonus.set_template_id
        AND bonus.required_pieces <= equipped_sets.equipped_pieces
      ORDER BY
        bonus.set_template_id,
        bonus.bonus_type,
        bonus.required_pieces DESC
    ) selected
  ) sb ON TRUE

  LEFT JOIN LATERAL (
    SELECT
      COALESCE(SUM(a.reward_attack), 0) AS attack,
      COALESCE(SUM(a.reward_defense), 0) AS defense,
      COALESCE(SUM(a.reward_gold_percent), 0) AS gold_percent,
      COALESCE(SUM(a.reward_experience_percent), 0)
        AS experience_percent
    FROM achievement_progress ap
    INNER JOIN achievements a
      ON a.achievement_id = ap.achievement_id
    WHERE ap.account_id = c.account_id
      AND ap.is_completed = TRUE
  ) achievement ON TRUE

  LEFT JOIN LATERAL (
    SELECT
      COALESCE(SUM(cb.value) FILTER (
        WHERE cb.buff_type = 'AttackBuff'
      ), 0) AS attack,
      COALESCE(SUM(cb.value) FILTER (
        WHERE cb.buff_type = 'DefenseBuff'
      ), 0) AS defense,
      COALESCE(SUM(cb.value) FILTER (
        WHERE cb.buff_type = 'SpellPowerBuff'
      ), 0) AS spell_power,
      COALESCE(SUM(cb.value) FILTER (
        WHERE cb.buff_type = 'GoldBoost'
      ), 0) AS gold_percent,
      COALESCE(SUM(cb.value) FILTER (
        WHERE cb.buff_type = 'ExperienceBoost'
      ), 0) AS experience_percent
    FROM character_buffs cb
    WHERE cb.character_id = c.character_id
      AND cb.is_positive = TRUE
      AND (
        cb.duration_type = 'Permanent'
        OR cb.duration_remaining > 0
      )
      AND (
        cb.expires_at IS NULL
        OR cb.expires_at > NOW()
      )
  ) boost ON TRUE

  WHERE c.character_id = $1

  GROUP BY
    c.character_id,
    c.level,
    csm.current_spell_power
`;

function parseNumericValue(
  value: string,
  fieldName: string
): number {
  const parsedValue = Number(value);

  if (
    !Number.isFinite(parsedValue) ||
    parsedValue < 0
  ) {
    throw new Error(
      `${fieldName} must be a non-negative finite number.`
    );
  }

  return parsedValue;
}

export class PostgresCharacterStatisticsRepository
  implements CharacterStatisticsRepository
{
  public constructor(
    private readonly database: Queryable
  ) {}

  public async findCalculationSources(
    characterId: CharacterId
  ): Promise<CharacterStatisticsSources | null> {
    const result =
      await this.database.query<CharacterStatisticsSourcesRow>(
        CALCULATION_SOURCES_QUERY,
        [characterId]
      );

    const row = result.rows[0];

    if (row === undefined) {
      return null;
    }

    return {
      level: row.level,
      spellMasteryPower: parseNumericValue(
        row.current_spell_power,
        "current_spell_power"
      ),
           permanentBonuses: {
        attack: parseNumericValue(row.permanent_attack, "permanent_attack"),
        defense: parseNumericValue(row.permanent_defense, "permanent_defense"),
        spellPower: parseNumericValue(
          row.permanent_spell_power,
          "permanent_spell_power"
        ),
        maximumHealth: parseNumericValue(
          row.permanent_health,
          "permanent_health"
        ),
        maximumMana: parseNumericValue(
          row.permanent_mana,
          "permanent_mana"
        ),
        maximumEnergy: parseNumericValue(
          row.permanent_energy,
          "permanent_energy"
        ),
        goldBonusPercent: parseNumericValue(
          row.permanent_gold_percent,
          "permanent_gold_percent"
        ),
        experienceBonusPercent: parseNumericValue(
          row.permanent_experience_percent,
          "permanent_experience_percent"
        ),
      },
      progressionBoosts: {
        attack: parseNumericValue(
          row.boost_attack,
          "boost_attack"
        ),
        defense: parseNumericValue(
          row.boost_defense,
          "boost_defense"
        ),
        spellPower: parseNumericValue(
          row.boost_spell_power,
          "boost_spell_power"
        ),
        goldBonusPercent: parseNumericValue(
          row.boost_gold_percent,
          "boost_gold_percent"
        ),
        experienceBonusPercent: parseNumericValue(
          row.boost_experience_percent,
          "boost_experience_percent"
        ),
      },
      achievements: {
        attack: parseNumericValue(
          row.achievement_attack,
          "achievement_attack"
        ),
        defense: parseNumericValue(
          row.achievement_defense,
          "achievement_defense"
        ),
        goldBonusPercent: parseNumericValue(
          row.achievement_gold_percent,
          "achievement_gold_percent"
        ),
        experienceBonusPercent: parseNumericValue(
          row.achievement_experience_percent,
          "achievement_experience_percent"
        ),
      },
      equipment: {
        attack: parseNumericValue(
          row.equipment_attack,
          "equipment_attack"
        ),
        defense: parseNumericValue(
          row.equipment_defense,
          "equipment_defense"
        ),
        spellPower: parseNumericValue(
          row.equipment_spell_power,
          "equipment_spell_power"
        ),
        maximumHealth: parseNumericValue(
          row.equipment_health,
          "equipment_health"
        ),
        maximumMana: parseNumericValue(
          row.equipment_mana,
          "equipment_mana"
        ),
        maximumEnergy: parseNumericValue(
          row.equipment_energy,
          "equipment_energy"
        ),
        goldBonusPercent: parseNumericValue(
          row.equipment_gold_percent,
          "equipment_gold_percent"
        ),
        experienceBonusPercent: parseNumericValue(
          row.equipment_experience_percent,
          "equipment_experience_percent"
        ),
      },
    };
  }
}








