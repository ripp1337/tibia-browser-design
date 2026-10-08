import {
  createServer,
  type Server,
} from "node:http";

import { databasePool } from "./database/pool.js";
import { PostgresAuthenticationProvider } from "./http/postgres-authentication.provider.js";
import { SystemClock } from "./infrastructure/clock/system-clock.js";

import { GetActiveCombatService } from "./modules/combat/application/get-active-combat.service.js";
import { GetCombatLogService } from "./modules/combat/application/get-combat-log.service.js";
import { GetCombatSessionService } from "./modules/combat/application/get-combat-session.service.js";
import { ResolveCombatActionService } from "./modules/combat/application/resolve-combat-action.service.js";
import { StartCombatService } from "./modules/combat/application/start-combat.service.js";
import { CryptoRandomSource } from "./modules/combat/infrastructure/crypto-random-source.js";
import { PostgresCombatSessionRepository } from "./modules/combat/infrastructure/postgres-combat-session.repository.js";
import { createCombatHttpHandler } from "./modules/combat/http/combat-http.handler.js";

import { ArchiveCharacterService } from "./modules/characters/application/archive-character.service.js";
import { CalculateCharacterStatsService } from "./modules/characters/application/calculate-character-stats.service.js";
import { CreateCharacterService } from "./modules/characters/application/create-character.service.js";
import { GetCharacterSnapshotService } from "./modules/characters/application/get-character-snapshot.service.js";
import { ListCharactersService } from "./modules/characters/application/list-characters.service.js";
import { PostgresCharacterRepository } from "./modules/characters/infrastructure/postgres-character.repository.js";
import { PostgresCharacterStatisticsRepository } from "./modules/characters/infrastructure/postgres-character-statistics.repository.js";
import { createCharacterHttpHandler } from "./modules/characters/http/character-http.handler.js";

import { GetMonsterDetailsService } from "./modules/monsters/application/get-monster-details.service.js";
import { GetMonsterListService } from "./modules/monsters/application/get-monster-list.service.js";
import { PostgresMonsterDiscoveryRepository } from "./modules/monsters/infrastructure/postgres-monster-discovery.repository.js";
import { createMonsterHttpHandler } from "./modules/monsters/http/monster-http.handler.js";

function isCombatRoute(
  requestUrl: string | undefined
): boolean {
  const url = new URL(
    requestUrl ?? "/",
    "http://localhost"
  );

  return /^\/characters\/[^/]+\/combat(?:\/[^/]+(?:\/log)?|\/actions)?$/u.test(
    url.pathname
  );
}

function isMonsterRoute(
  requestUrl: string | undefined
): boolean {
  const url = new URL(
    requestUrl ?? "/",
    "http://localhost"
  );

  return /^\/characters\/[^/]+\/monsters(?:\/[^/]+)?$/u.test(
    url.pathname
  );
}

export function createApplicationServer(): Server {
  const characterRepository =
    new PostgresCharacterRepository(
      databasePool
    );

  const characterStatisticsRepository =
    new PostgresCharacterStatisticsRepository(
      databasePool
    );

  const monsterRepository =
    new PostgresMonsterDiscoveryRepository(
      databasePool
    );

  const combatRepository =
    new PostgresCombatSessionRepository(
      databasePool
    );

  const calculateCharacterStatsService =
    new CalculateCharacterStatsService(
      characterStatisticsRepository
    );

  const authenticationProvider =
    new PostgresAuthenticationProvider(
      databasePool
    );

  const clock = new SystemClock();
  const randomSource =
    new CryptoRandomSource();

  const createCharacterService =
    new CreateCharacterService(
      characterRepository
    );

  const listCharactersService =
    new ListCharactersService(
      characterRepository
    );

  const getCharacterSnapshotService =
    new GetCharacterSnapshotService(
      characterRepository,
      calculateCharacterStatsService,
      clock
    );

  const archiveCharacterService =
    new ArchiveCharacterService(
      characterRepository
    );

  const getMonsterListService =
    new GetMonsterListService(
      monsterRepository,
      clock
    );

  const getMonsterDetailsService =
    new GetMonsterDetailsService(
      monsterRepository,
      clock
    );

  const startCombatService =
    new StartCombatService(
      combatRepository,
      clock
    );

  const resolveCombatActionService =
    new ResolveCombatActionService(
      combatRepository,
      randomSource,
      clock
    );

  const getActiveCombatService =
    new GetActiveCombatService(
      combatRepository
    );

  const getCombatSessionService =
    new GetCombatSessionService(
      combatRepository
    );

  const getCombatLogService =
    new GetCombatLogService(
      combatRepository
    );

  const characterHandler =
    createCharacterHttpHandler({
      authenticationProvider,
      createCharacterService,
      listCharactersService,
      getCharacterSnapshotService,
      archiveCharacterService,
    });

  const monsterHandler =
    createMonsterHttpHandler({
      authenticationProvider,
      getMonsterListService,
      getMonsterDetailsService,
    });

  const combatHandler =
    createCombatHttpHandler({
      authenticationProvider,
      startCombatService,
      resolveCombatActionService,
      getActiveCombatService,
      getCombatSessionService,
      getCombatLogService,
    });

  return createServer(
    (request, response) => {
      if (isCombatRoute(request.url)) {
        void combatHandler(
          request,
          response
        );

        return;
      }

      if (isMonsterRoute(request.url)) {
        void monsterHandler(
          request,
          response
        );

        return;
      }

      void characterHandler(
        request,
        response
      );
    }
  );
}
