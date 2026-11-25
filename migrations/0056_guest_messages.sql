CREATE TABLE IF NOT EXISTS guest_messages (id text PRIMARY KEY, name text NOT NULL, email text NOT NULL, subject text NOT NULL, body text NOT NULL, status text NOT NULL DEFAULT 'new' CHECK(status IN ('new','read','archived')), ip_hash text, created_at timestamp NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS guest_messages_created_idx ON guest_messages(created_at);
CREATE INDEX IF NOT EXISTS guest_messages_email_idx ON guest_messages(email,created_at);
CREATE INDEX IF NOT EXISTS guest_messages_ip_idx ON guest_messages(ip_hash,created_at)
