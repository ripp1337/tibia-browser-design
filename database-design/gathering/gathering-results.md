ENTITY: GatheringResults

PRIMARY KEY
-----------
GatheringResultId

FOREIGN KEYS
------------
GatheringSessionId
    → GatheringSessions.GatheringSessionId

MaterialId
    → Materials.MaterialId

CARDINALITY
-----------
GatheringSessions
└── GatheringResults (1:N)

Materials
└── GatheringResults (1:N)

PURPOSE
-------
Stores materials generated during a gathering session.

CORE COLUMNS
------------
GatheringResultId

GatheringSessionId

MaterialId

Quantity

SuccessfulRolls

CreatedAt

BUSINESS RULES
--------------
- One session may generate many materials
- Results are awarded when player collects rewards
- Results are stored separately from MaterialStorage

INDEXES
-------
PK_GatheringResultId

IX_GatheringResults_GatheringSessionId
IX_GatheringResults_MaterialId

UNIQUE CONSTRAINTS
------------------
(GatheringSessionId, MaterialId)