ENTITY: Announcements

PRIMARY KEY
-----------
AnnouncementId

FOREIGN KEYS
------------
None

PURPOSE
-------
Stores global game announcements.

Examples:
- Maintenance
- New Season
- Patch Notes
- Event Notice

CORE COLUMNS
------------
AnnouncementId

Title

Content

Priority
(
  Low,
  Normal,
  High,
  Critical
)

IsActive

PublishedAt

ExpiresAt

CreatedAt
UpdatedAt

INDEXES
-------
PK_AnnouncementId

IX_Announcements_IsActive
IX_Announcements_PublishedAt
IX_Announcements_ExpiresAt