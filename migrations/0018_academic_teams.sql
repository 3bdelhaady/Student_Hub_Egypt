CREATE UNIQUE INDEX IF NOT EXISTS courses_id_university_unique ON courses(id,university_id);
ALTER TABLE portal_entries ADD COLUMN team_course_id text;
ALTER TABLE portal_entries ADD COLUMN team_marker text NOT NULL DEFAULT '';
ALTER TABLE portal_entries ADD CONSTRAINT portal_team_course_university_fk FOREIGN KEY(team_course_id,university_id) REFERENCES courses(id,university_id);
ALTER TABLE portal_entries ADD CONSTRAINT portal_team_course_kind_check CHECK (team_course_id IS NULL OR (kind='team' AND university_id IS NOT NULL));
ALTER TABLE portal_entries ADD CONSTRAINT portal_team_marker_check CHECK (char_length(team_marker)<=6 AND (kind='team' OR team_marker=''));
CREATE TABLE academic_team_proposals (
 request_id text PRIMARY KEY REFERENCES portal_requests(id) ON DELETE CASCADE,
 course_id text NOT NULL,
 university_id text NOT NULL,
 course_title text NOT NULL,
 marker text NOT NULL CHECK(char_length(marker) BETWEEN 1 AND 6),
 CONSTRAINT team_proposal_course_university_fk FOREIGN KEY(course_id,university_id) REFERENCES courses(id,university_id)
);
CREATE INDEX academic_team_proposal_course ON academic_team_proposals(course_id);
