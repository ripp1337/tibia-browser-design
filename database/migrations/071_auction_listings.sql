-- 071_auction_listings.sql
-- Requires: characters, items, materials, consumable_definitions
CREATE TABLE auction_listings (
 auction_listing_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 character_id UUID NOT NULL,
 item_id UUID NULL,
 material_id UUID NULL,
 consumable_definition_id UUID NULL,
 quantity BIGINT NOT NULL,
 unit_price BIGINT NOT NULL,
 listing_fee_paid BIGINT NOT NULL DEFAULT 0,
 status VARCHAR(20) NOT NULL DEFAULT 'Active',
 expires_at TIMESTAMPTZ NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 CONSTRAINT fk_auction_listings_character FOREIGN KEY (character_id) REFERENCES characters(character_id) ON DELETE RESTRICT,
 CONSTRAINT fk_auction_listings_item FOREIGN KEY (item_id) REFERENCES items(item_id) ON DELETE RESTRICT,
 CONSTRAINT fk_auction_listings_material FOREIGN KEY (material_id) REFERENCES materials(material_id) ON DELETE RESTRICT,
 CONSTRAINT fk_auction_listings_consumable FOREIGN KEY (consumable_definition_id) REFERENCES consumable_definitions(consumable_definition_id) ON DELETE RESTRICT,
 CONSTRAINT chk_auction_listings_asset CHECK ((item_id IS NOT NULL)::integer + (material_id IS NOT NULL)::integer + (consumable_definition_id IS NOT NULL)::integer = 1),
 CONSTRAINT chk_auction_listings_quantity CHECK (quantity > 0),
 CONSTRAINT chk_auction_listings_unit_price CHECK (unit_price > 0),
 CONSTRAINT chk_auction_listings_fee CHECK (listing_fee_paid >= 0),
 CONSTRAINT chk_auction_listings_status CHECK (status IN ('Active','Sold','Expired','Cancelled')),
 CONSTRAINT chk_auction_listings_expiration CHECK (expires_at > created_at AND expires_at <= created_at + INTERVAL '24 hours')
);
CREATE INDEX ix_auction_listings_character_id ON auction_listings(character_id);
CREATE INDEX ix_auction_listings_status ON auction_listings(status);
CREATE INDEX ix_auction_listings_expires_at ON auction_listings(expires_at);
CREATE INDEX ix_auction_listings_item_id ON auction_listings(item_id);
CREATE INDEX ix_auction_listings_material_id ON auction_listings(material_id);
CREATE INDEX ix_auction_listings_consumable_id ON auction_listings(consumable_definition_id);
