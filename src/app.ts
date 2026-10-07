import {
  createServer,
  type Server,
} from "node:http";

import { databasePool } from "./database/pool.js";
import { PostgresAuthenticationProvider } from "./http/postgres-authentication.provider.js";
import { SystemClock } from "./infrastructure/clock/system-clock.js";

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

  const calculateCharacterStatsService =
    new CalculateCharacterStatsService(
      characterStatisticsRepository
    );

  const authenticationProvider =
    new PostgresAuthenticationProvider(
      databasePool
    );

  const clock = new SystemClock();

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

  return createServer(
    (request, response) => {
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
