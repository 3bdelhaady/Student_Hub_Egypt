ALTER TABLE portal_entries ADD COLUMN IF NOT EXISTS poll_audience text NOT NULL DEFAULT 'faculty' CHECK(poll_audience IN ('faculty','university'));
