CREATE TABLE fitness_link_nonces (nonce text PRIMARY KEY, user_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE, created_at timestamptz NOT NULL DEFAULT now(), consumed_at timestamptz);
CREATE INDEX fitness_link_nonces_user ON fitness_link_nonces(user_id,created_at);
