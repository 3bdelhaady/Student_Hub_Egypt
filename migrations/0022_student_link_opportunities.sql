ALTER TABLE portal_entries ADD COLUMN opportunity_type text NOT NULL DEFAULT '';
ALTER TABLE portal_entries ADD COLUMN provider text NOT NULL DEFAULT '';
ALTER TABLE portal_entries ADD COLUMN requirements text NOT NULL DEFAULT '';
ALTER TABLE portal_entries ADD CONSTRAINT portal_opportunity_type_check CHECK (opportunity_type IN ('', 'job', 'internship', 'scholarship'));
