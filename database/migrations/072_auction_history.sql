-- 072_auction_history.sql
-- Requires: auction_listings, characters, items, materials, consumable_definitions
CREATE TABLE auction_history (
 auction_history_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 auction_listing_id UUID NOT NULL,
 seller_character_id UUID NOT NULL,
 buyer_character_id UUID NOT NULL,
 item_id UUID NULL,
 material_id UUID NULL,
 consumable_definition_id UUID NULL,
 quantity BIGINT NOT NULL,
 unit_price BIGINT NOT NULL,
 total_price BIGINT NOT NULL,
 sold_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 CONSTRAINT fk_auction_history_listing FOREIGN KEY (auction_listing_id) REFERENCES auction_listings(auction_listing_id) ON DELETE RESTRICT,
 CONSTRAINT fk_auction_history_seller FOREIGN KEY (seller_character_id) REFERENCES characters(character_id) ON DELETE RESTRICT,
 CONSTRAINT fk_auction_history_buyer FOREIGN KEY (buyer_character_id) REFERENCES characters(character_id) ON DELETE RESTRICT,
 CONSTRAINT fk_auction_history_item FOREIGN KEY (item_id) REFERENCES items(item_id) ON DELETE RESTRICT,
 CONSTRAINT fk_auction_history_material FOREIGN KEY (material_id) REFERENCES materials(material_id) ON DELETE RESTRICT,
 CONSTRAINT fk_auction_history_consumable FOREIGN KEY (consumable_definition_id) REFERENCES consumable_definitions(consumable_definition_id) ON DELETE RESTRICT,
 CONSTRAINT chk_auction_history_asset CHECK ((item_id IS NOT NULL)::integer + (material_id IS NOT NULL)::integer + (consumable_definition_id IS NOT NULL)::integer = 1),
 CONSTRAINT chk_auction_history_characters CHECK (seller_character_id <> buyer_character_id),
 CONSTRAINT chk_auction_history_quantity CHECK (quantity > 0),
 CONSTRAINT chk_auction_history_prices CHECK (unit_price > 0 AND total_price > 0 AND total_price = quantity * unit_price)
);
CREATE INDEX ix_auction_history_listing_id ON auction_history(auction_listing_id);
CREATE INDEX ix_auction_history_seller_id ON auction_history(seller_character_id);
CREATE INDEX ix_auction_history_buyer_id ON auction_history(buyer_character_id);
CREATE INDEX ix_auction_history_sold_at ON auction_history(sold_at);
CREATE INDEX ix_auction_history_item_id ON auction_history(item_id);
CREATE INDEX ix_auction_history_material_id ON auction_history(material_id);
CREATE INDEX ix_auction_history_consumable_id ON auction_history(consumable_definition_id);
