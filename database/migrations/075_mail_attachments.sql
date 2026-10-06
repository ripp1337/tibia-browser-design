-- 075_mail_attachments.sql
-- Requires: mail_messages, items, materials, consumable_definitions
CREATE TABLE mail_attachments (
 mail_attachment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 mail_message_id UUID NOT NULL,
 attachment_type VARCHAR(20) NOT NULL,
 gold_amount BIGINT NULL,
 item_id UUID NULL,
 material_id UUID NULL,
 material_quantity BIGINT NULL,
 consumable_definition_id UUID NULL,
 consumable_quantity BIGINT NULL,
 is_collected BOOLEAN NOT NULL DEFAULT FALSE,
 collected_at TIMESTAMPTZ NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 CONSTRAINT fk_mail_attachments_message FOREIGN KEY (mail_message_id) REFERENCES mail_messages(mail_message_id) ON DELETE CASCADE,
 CONSTRAINT fk_mail_attachments_item FOREIGN KEY (item_id) REFERENCES items(item_id) ON DELETE RESTRICT,
 CONSTRAINT fk_mail_attachments_material FOREIGN KEY (material_id) REFERENCES materials(material_id) ON DELETE RESTRICT,
 CONSTRAINT fk_mail_attachments_consumable FOREIGN KEY (consumable_definition_id) REFERENCES consumable_definitions(consumable_definition_id) ON DELETE RESTRICT,
 CONSTRAINT chk_mail_attachments_type CHECK (attachment_type IN ('Gold','Item','Material','Consumable')),
 CONSTRAINT chk_mail_attachments_payload CHECK ((attachment_type='Gold' AND gold_amount>0 AND item_id IS NULL AND material_id IS NULL AND material_quantity IS NULL AND consumable_definition_id IS NULL AND consumable_quantity IS NULL) OR (attachment_type='Item' AND item_id IS NOT NULL AND gold_amount IS NULL AND material_id IS NULL AND material_quantity IS NULL AND consumable_definition_id IS NULL AND consumable_quantity IS NULL) OR (attachment_type='Material' AND material_id IS NOT NULL AND material_quantity>0 AND gold_amount IS NULL AND item_id IS NULL AND consumable_definition_id IS NULL AND consumable_quantity IS NULL) OR (attachment_type='Consumable' AND consumable_definition_id IS NOT NULL AND consumable_quantity>0 AND gold_amount IS NULL AND item_id IS NULL AND material_id IS NULL AND material_quantity IS NULL)),
 CONSTRAINT chk_mail_attachments_collection CHECK ((is_collected=FALSE AND collected_at IS NULL) OR (is_collected=TRUE AND collected_at IS NOT NULL AND collected_at>=created_at))
);
CREATE INDEX ix_mail_attachments_message_id ON mail_attachments(mail_message_id);
CREATE INDEX ix_mail_attachments_is_collected ON mail_attachments(is_collected);
CREATE INDEX ix_mail_attachments_item_id ON mail_attachments(item_id);
CREATE INDEX ix_mail_attachments_material_id ON mail_attachments(material_id);
CREATE INDEX ix_mail_attachments_consumable_id ON mail_attachments(consumable_definition_id);
