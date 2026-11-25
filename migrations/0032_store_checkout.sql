ALTER TABLE portal_requests ADD COLUMN recipient_id text REFERENCES "user"(id);
ALTER TABLE portal_requests ADD COLUMN payment_method text NOT NULL DEFAULT '' CHECK (payment_method IN ('','cash','electronic'));
ALTER TABLE portal_requests ADD COLUMN payment_status text NOT NULL DEFAULT '' CHECK (payment_status IN ('','unpaid','paid'));
ALTER TABLE portal_requests ADD COLUMN purpose text NOT NULL DEFAULT '' CHECK (purpose IN ('','purchase','inspection'));
ALTER TABLE portal_requests ADD COLUMN order_details jsonb NOT NULL DEFAULT '{}';
CREATE INDEX portal_requests_recipient_idx ON portal_requests(recipient_id,created_at);
