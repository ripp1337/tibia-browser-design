ACCOUNTS
├── Characters (1:N)
├── AccountAchievements (1:N)
├── AccountHolyGrail (1:N)
├── AccountFriends (1:N)
├── FriendRequests (1:N)
├── AccountOutfits (1:N)
└── AccountAddons (1:N)

SEASONS
├── Characters (1:N)
├── SeasonRankings (1:N)
└── HallOfFame (1:N)

CHARACTERS
├── CharacterStatistics (1:1)
├── CharacterUnlocks (1:1)
├── CharacterSpellMastery (1:1)
├── CharacterSpells (1:N)
├── CharacterLoadouts (1:N)
├── EquipmentLoadouts (1:N)
├── InventoryItems (1:N)
├── MaterialStorage (1:N)
├── ConsumableStorage (1:N)
├── CharacterBuffs (1:N)
├── CombatLogs (1:N)
├── GatheringSessions (1:N)
├── CraftingQueue (1:N)
├── CraftingHistory (1:N)
├── AuctionListings (1:N)
├── MailMessages (1:N)
├── BestiaryEntries (1:N)
├── BestiaryStatistics (1:N)
├── CharacterDailyBossProgress (1:N)
├── AchievementProgress (1:N)
├── HolyGrailEntries (1:N)
├── SetProgress (1:N)
├── HourlyChestProgress (1:1)
├── DailyChestProgress (1:1)
└── LoginStreakProgress (1:1)

SPELLS
└── CharacterSpells (1:N)

ITEMBASES
├── Items (1:N)
└── LootTables (1:N)

ITEMS
├── InventoryItems (1:1)
├── ItemAffixes (1:N)
├── UniqueTemplates (N:1, optional)
└── SetTemplates (N:1, optional)

AFFIXTEMPLATES
└── ItemAffixes (1:N)

SETTEMPLATES
├── SetBonuses (1:N)
├── SetProgress (1:N)
└── HolyGrailEntries (1:N)

UNIQUETEMPLATES
└── HolyGrailEntries (1:N)

MONSTERFAMILIES
└── Monsters (1:N)

MONSTERS
├── MonsterAbilities (1:N)
├── LootTables (1:N)
├── OtherLootTables (1:N)
├── MonsterTasks (1:N)
├── BestiaryEntries (1:N)
├── BestiaryStatistics (1:N)
└── CharacterMonsterKills (1:N)

MONSTERABILITIES
└── MonsterAbilityWeights (1:N)

BOSSES
├── MonsterTasks (0:N)
├── DailyBossDefinitions (0:N)
└── LootTables (1:N)

DAILYBOSSDEFINITIONS
├── DailyBossPools (N:1)
└── CharacterDailyBossProgress (1:N)

DAILYBOSSROTATION
└── DailyBossPools (1:N)

LOOTTABLES
├── Monsters (N:1)
└── Bosses (N:1)

OTHERLOOTTABLES
└── Monsters (N:1)

RECIPES
├── RecipeMaterials (1:N)
├── CraftingQueue (1:N)
└── CraftingHistory (1:N)

MATERIALS
├── RecipeMaterials (1:N)
├── MaterialStorage (1:N)
└── GatheringResults (1:N)

CONSUMABLEDEFINITIONS
├── ConsumableStorage (1:N)
├── Recipes (1:N)
└── LootTables (1:N)

GATHERINGSESSIONS
└── GatheringResults (1:N)

COMBATLOGS
├── CombatLogTurns (1:N)
└── CombatEffects (1:N)

ACHIEVEMENTS
├── AchievementProgress (1:N)
└── AccountAchievements (1:N)

OUTFITDEFINITIONS
├── AccountOutfits (1:N)
└── AddonDefinitions (1:N)

ADDONDEFINITIONS
└── AccountAddons (1:N)

AUCTIONLISTINGS
└── AuctionHistory (1:N)

MAILMESSAGES
└── MailAttachments (1:N)

ANNOUNCEMENTS
└── Accounts (N:M, read tracking later if needed)