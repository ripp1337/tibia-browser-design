# Friend System

## Overview

The Friend System allows players to maintain a personal network of other players.

The system exists to:

- Track Favorite Players
- View Online Status
- View Last Seen Information
- Access Player Profiles Quickly
- Support Future Social Systems

The Friend System provides no gameplay bonuses.

It is a social and convenience feature only.

---

# Core Philosophy

The Friend System is designed to improve player interaction without affecting progression.

Friends should provide:

- Visibility
- Communication
- Convenience

Friends should not provide:

- Combat Advantages
- Economic Bonuses
- Progression Benefits

The system remains purely social.

---

# Account-Based Design

## Overview

Friendships belong to Accounts rather than Characters.

A friendship represents a relationship between two player accounts.

It does not belong to a specific character.

---

## Benefits

Account-based friendships provide persistence across all game systems.

Friendships survive:

- Character Deletion
- Character Archiving
- Character Transfers
- Seasonal Resets
- New Character Creation

The social network remains intact regardless of character progression.

---

# Friend Limits

## Maximum Friends

Each account may maintain:

- 20 Friends

Attempts to add additional friends beyond the limit are rejected.

---

# Friend Requests

## Overview

Friendships require mutual agreement.

Friendships are created through a request and acceptance flow.

---

## Creation Flow

Send Friend Request

↓

Recipient Receives Request

↓

Recipient Accepts

↓

Friendship Created

---

## Rules

Only accepted requests create friendships.

Pending requests do not create a friendship relationship.

---

# Incoming Requests

Players may receive multiple friend requests.

Each request can be:

- Accepted
- Declined

Declining a request does not create a friendship.

---

# Friendship State

## Active Friendship

Once accepted:

- Both accounts become friends
- Friend information becomes visible
- Profile access becomes available

The relationship is mutual.

---

# Friend Visibility

## Overview

Friends provide additional visibility into account activity.

The Friend System exists primarily to improve awareness of player activity.

---

## Online Status

Friends may view whether another account is:

- Online
- Offline

---

## Last Seen

Friends may view:

- Last Seen Timestamp

This allows players to determine recent activity.

---

# Character Visibility

## Overview

Friendships belong to accounts rather than characters.

Because of this, a friendship grants visibility into active characters owned by that account.

---

## Examples

A friend may view:

- Active Characters
- Character Profiles
- Character Progression Information

Visibility follows normal public profile rules.

---

# Profile Access

Friends may quickly access character profiles.

Profile access is intended as a convenience feature.

---

## Example Information

Profiles may include:

- Character Name
- Level
- Equipment
- Statistics
- Achievement Progress
- Bestiary Progress
- Holy Grail Progress
- Season History

The Friend System acts as a shortcut to profile visibility rather than providing unique profile data.

---

# Friendship Removal

## Overview

Friendships may be removed manually.

Either account may choose to remove the friendship.

---

## Result

After removal:

- Friend status is removed
- Online visibility is removed
- Last Seen visibility is removed

The relationship immediately ends.

---

## Re-Adding

Former friends may become friends again through a new Friend Request.

---

# Seasonal Interaction

## Overview

The Friend System is not seasonal.

Friendships persist across all seasons.

---

## Persistence

Friendships are unaffected by:

- Seasonal Resets
- Seasonal Character Creation
- Character Transfers To Non-Ladder

The relationship exists at the Account level.

---

# Character Archiving Interaction

## Overview

Friendships remain unchanged when characters are archived.

---

## Result

Archive Character

↓

Friendship Persists

↓

New Character Created

↓

Friendship Still Exists

No social progress is lost.

---

# Character Deletion Interaction

## Overview

Deleting a character does not affect friendships.

Because friendships belong to accounts, character removal does not remove social connections.

---

# Future Expansion Support

The Friend System is intentionally designed to support future social systems.

Potential future integrations include:

- Private Messaging
- Parties
- Guild Invitations
- Group Activities
- Raid Invitations

Current implementation does not require these systems.

---

# Privacy Rules

## Scope

Friends only gain access to information intended for friend visibility.

The Friend System does not grant administrative access or private account data.

---

## Examples Of Non-Shared Data

Friends do not gain access to:

- Account Credentials
- Email Address
- Internal Account Data
- Administrative Information

Only gameplay-related visibility is provided.

---

# Database Structure

## AccountFriends

Stores friendship relationships.

Example Data:

- Account A
- Account B
- Creation Date
- Friendship Status

---

## Friend Requests

Stores pending friendship invitations.

Example Data:

- Sender Account
- Recipient Account
- Creation Date
- Request Status

---

# System Relationships

The Friend System integrates with:

- Character Profiles
- Online Status
- Social Systems
- Future Messaging Systems
- Future Guild Systems

The system remains lightweight while serving as the foundation for future social features.

---

# Design Philosophy

The Friend System exists to create:

Find Players

↓

Add Friends

↓

Track Activity

↓

Access Profiles

↓

Build Social Connections

The system should provide:

- Convenience
- Visibility
- Persistence
- Social Connectivity

without introducing any direct gameplay advantage.

Friendships are intended to strengthen the community aspect of the game while keeping combat, progression, and economic systems completely unaffected.