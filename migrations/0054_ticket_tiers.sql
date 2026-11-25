ALTER TABLE portal_entries ADD COLUMN ticket_tiers jsonb NOT NULL DEFAULT '[]';
ALTER TABLE portal_entries DROP CONSTRAINT portal_ticket_type_check;
ALTER TABLE portal_entries ADD CONSTRAINT portal_ticket_type_check CHECK (ticket_type IN ('','concert','graduation','standup','trip') AND (kind='ticket' OR ticket_type=''));
