ALTER TABLE "user" ADD COLUMN IF NOT EXISTS gender text CHECK (gender IN ('male', 'female'));
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS student_code text UNIQUE;
