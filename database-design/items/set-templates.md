ENTITY: SetTemplates

PRIMARY KEY
-----------
SetTemplateId

REFERENCED BY
-------------
ItemBases.SetTemplateId
SetBonuses.SetTemplateId
SetProgress.SetTemplateId

CARDINALITY
-----------
SetTemplates
├── ItemBases (1:N)
└── SetBonuses (1:N)

PURPOSE
-------
Stores equipment set definitions.

CORE COLUMNS
------------
SetTemplateId

Name
Description

RequiredPieces

CreatedAt
UpdatedAt

INDEXES
-------
PK_SetTemplateId

UX_SetTemplates_Name