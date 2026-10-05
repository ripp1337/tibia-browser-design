# MAIL SYSTEM

## Overview

The Mail System is used to deliver items and messages to players.

Purpose:

- Deliver Item Purchases
- Deliver Item Sales
- Deliver System Messages
- Deliver Season Results
- Deliver Admin Messages

Messages are used primarily for delivery.

Examples:

- Marketplace Sales
- Marketplace Purchases
- System Rewards
- Admin Messages
- Season Messages

---

# Mail Philosophy

Mailbox is not intended as a permanent archive.

Historical information is stored in dedicated systems such as:

- Auction History
- Season History
- Character Statistics

Messages with collected attachments may be automatically removed.

Mailbox acts as a delivery mechanism rather than a permanent storage system.

---

# Attachments

Mail messages may contain attachments.

Attachment Types:

- Gold
- Items
- Consumables

---

# Marketplace Integration

Purchased items are delivered through Mail.

Examples:

- Equipment
- Materials
- Potions
- Boosts
- Blessings
- Protection Stones

Gold from completed sales is also delivered through Mail.

---

# Expired Marketplace Listings

Expired listings are returned automatically.

Returned through:

- Mailbox

The listing fee remains consumed.

---

# Supported Delivery Sources

The Mail System is used by:

## Marketplace

Examples:

- Item Purchases
- Item Sales
- Expired Listings

---

## System Rewards

Examples:

- System Messages
- Reward Deliveries

---

## Season Systems

Examples:

- Season Results
- Season Messages

---

## Administration

Examples:

- Admin Messages

---

# Database

## Mail Domain

Purpose:

Deliver items and messages.

Used For:

- Item Purchases
- Item Sales
- System Messages
- Season Results
- Admin Messages

Tables:

- MailMessages
- MailAttachments

---

## MailAttachments

Stores attachment data.

Attachment Types:

- Gold
- Items
- Consumables

---

# Design Philosophy

The Mail System exists to provide:

System Event

↓

Mail Delivery

↓

Attachment Collection

The Mail System functions as a delivery mechanism rather than a permanent storage system.