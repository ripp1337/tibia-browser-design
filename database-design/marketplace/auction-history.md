ENTITY: AuctionHistory

PRIMARY KEY
-----------
AuctionHistoryId

FOREIGN KEYS
------------
AuctionListingId
    → AuctionListings.AuctionListingId

SellerCharacterId
    → Characters.CharacterId

BuyerCharacterId
    → Characters.CharacterId

ItemId
    → Items.ItemId
    (nullable)

MaterialId
    → Materials.MaterialId
    (nullable)

ConsumableDefinitionId
    → ConsumableDefinitions.ConsumableDefinitionId
    (nullable)

CARDINALITY
-----------
AuctionListings
└── AuctionHistory (1:N)

Characters
└── AuctionHistory (1:N)

PURPOSE
-------
Stores completed marketplace transactions.

BUSINESS RULES
--------------
Records are immutable.

Used for:
- price history
- market analytics
- last 20 sales display

CORE COLUMNS
------------
AuctionHistoryId

AuctionListingId

SellerCharacterId
BuyerCharacterId

ItemId
MaterialId
ConsumableDefinitionId

Quantity

UnitPrice

TotalPrice

SoldAt

CreatedAt

INDEXES
-------
PK_AuctionHistoryId

IX_AuctionHistory_SellerCharacterId

IX_AuctionHistory_BuyerCharacterId

IX_AuctionHistory_SoldAt

IX_AuctionHistory_ItemId

IX_AuctionHistory_MaterialId

IX_AuctionHistory_ConsumableDefinitionId