ALTER TABLE resources DROP CONSTRAINT resources_kind_check;
ALTER TABLE resources ADD CONSTRAINT resources_kind_check CHECK(kind IN ('lecture','file','section','assignment','video'));
ALTER TABLE resources ADD COLUMN IF NOT EXISTS url text;
ALTER TABLE resources ADD COLUMN IF NOT EXISTS due_at timestamp;
CREATE TABLE IF NOT EXISTS assignment_submissions (
  id text PRIMARY KEY,
  resource_id text NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  user_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  body text NOT NULL,
  url text,
  submitted_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now(),
  UNIQUE(resource_id, user_id)
);
CREATE INDEX IF NOT EXISTS submissions_resource ON assignment_submissions(resource_id);
