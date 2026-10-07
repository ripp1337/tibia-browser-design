import type {
  MonsterDiscoveryRepository,
  ListMonstersInput,
  MonsterListItem,
} from "./monster-discovery.repository.js";

export class GetMonsterListService {
  public constructor(
    private readonly repository:
      MonsterDiscoveryRepository
  ) {}

  public async execute(
    input: ListMonstersInput
  ): Promise<readonly MonsterListItem[]> {
    return this.repository.listMonsters(input);
  }
}
