CREATE TABLE IF NOT EXISTS national_id_vault (
 user_id text PRIMARY KEY REFERENCES "user"(id) ON DELETE CASCADE,
 ciphertext text NOT NULL,
 updated_at timestamp NOT NULL DEFAULT now()
);
