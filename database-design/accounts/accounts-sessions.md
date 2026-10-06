ENTITY: AccountSessions

### PRIMARY KEY

AccountSessionId

### FOREIGN KEYS

AccountId → Accounts.AccountId

### CARDINALITY

Accounts
└── AccountSessions (1:N)

### PURPOSE

Stores active and historical authentication sessions.

Used for:
- Login
- Authentication
- Remember Me
- Session Validation
- Logout
- Account Security
- Forced Session Revocation

### CORE COLUMNS

AccountSessionId

AccountId

SessionTokenHash
RefreshTokenHash

IpAddress
UserAgent

CreatedAt
LastActivityAt

ExpiresAt

IsRevoked
RevokedAt

### INDEXES

PK_AccountSessionId

IX_AccountSessions_AccountId
IX_AccountSessions_ExpiresAt
IX_AccountSessions_LastActivityAt
IX_AccountSessions_IsRevoked

### BUSINESS RULES

- Multiple active sessions are allowed per account
- Session tokens must be stored hashed
- Refresh tokens must be stored hashed
- Expired sessions are invalid
- Revoked sessions are invalid
- Logout revokes the session
- Password changes may revoke all active sessions
- Banned accounts cannot create new sessions
- Session activity updates LastActivityAt
- Server is authoritative for all session validation
- Session records may be retained for security and audit purposes