import {
  createServer,
  type Server,
} from "node:http";

import { SystemClock } from "./infrastructure/clock/system-clock.js";
import { databasePool } from "./database/pool.js";
import { PostgresAuthenticationProvider } from "./http/postgres-authentication.provider.js";
import { ArchiveCharacterService } from "./modules/characters/application/archive-character.service.js";
import { CreateCharacterService } from "./modules/characters/application/create-character.service.js";
import { GetCharacterSnapshotService } from "./modules/characters/application/get-character-snapshot.service.js";
import { ListCharactersService } from "./modules/characters/application/list-characters.service.js";
import { PostgresCharacterRepository } from "./modules/characters/infrastructure/postgres-character.repository.js";
import { createCharacterHttpHandler } from "./modules/characters/http/character-http.handler.js";

export function createApplicationServer(): Server {
  const characterRepository =
    new PostgresCharacterRepository(databasePool);

  const authenticationProvider =
    new PostgresAuthenticationProvider(databasePool);

  const clock = new SystemClock();

  const createCharacterService =
    new CreateCharacterService(characterRepository);

  const listCharactersService =
    new ListCharactersService(characterRepository);

  const getCharacterSnapshotService =
    new GetCharacterSnapshotService(
      characterRepository,
      clock
    );

  const archiveCharacterService =
    new ArchiveCharacterService(characterRepository);

  const characterHandler = createCharacterHttpHandler({
    authenticationProvider,
    createCharacterService,
    listCharactersService,
    getCharacterSnapshotService,
    archiveCharacterService,
  });

  return createServer((request, response) => {
    void characterHandler(request, response);
  });
}