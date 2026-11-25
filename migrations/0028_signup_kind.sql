ALTER TABLE "user" ADD COLUMN IF NOT EXISTS signup_kind text NOT NULL DEFAULT 'student';
