ALTER TABLE team_course_settings ADD COLUMN IF NOT EXISTS approval_required boolean NOT NULL DEFAULT true;
