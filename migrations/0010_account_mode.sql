CREATE TABLE account_preferences (
 user_id text PRIMARY KEY REFERENCES "user"(id) ON DELETE CASCADE,
 active_mode text NOT NULL DEFAULT 'student' CHECK (active_mode IN ('student', 'agent')),
 updated_at timestamp NOT NULL DEFAULT now()
);
