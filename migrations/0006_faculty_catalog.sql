CREATE TABLE IF NOT EXISTS faculties (
  id text PRIMARY KEY,
  university_id text NOT NULL REFERENCES universities(id),
  name text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  UNIQUE (university_id, name)
);
ALTER TABLE memberships ADD COLUMN IF NOT EXISTS faculty_id text REFERENCES faculties(id);
