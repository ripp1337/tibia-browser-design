ENTITY: AuctionListings

PRIMARY KEY
-----------
AuctionListingId

FOREIGN KEYS
------------
CharacterId
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
Characters
└── AuctionListings (1:N)

Items
└── AuctionListings (1:N)

Materials
└── AuctionListings (1:N)

ConsumableDefinitions
└── AuctionListings (1:N)

REFERENCED BY
-------------
AuctionHistory.AuctionListingId

UNIQUE CONSTRAINTS
------------------
None

PURPOSE
-------
Stores active marketplace listings.

BUSINESS RULES
--------------
Exactly one of:

- ItemId
- MaterialId
- ConsumableDefinitionId

must be populated.

Maximum active listings:
10 per character

Maximum duration:
24 hours

CORE COLUMNS
------------
AuctionListingId

CharacterId

ItemId
MaterialId
ConsumableDefinitionId

Quantity

UnitPrice

ListingFeePaid

Status
(
 Active,
 Sold,
 Expired,
 Cancelled
)

ExpiresAt

CreatedAt
UpdatedAt

INDEXES
-------
PK_AuctionListingId

IX_AuctionListings_CharacterId

IX_AuctionListings_Status

IX_AuctionListings_ExpiresAt

IX_AuctionListings_ItemId

IX_AuctionListings_MaterialId

IX_AuctionListings_ConsumableDefinitionId