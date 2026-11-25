CREATE TABLE team_course_settings (
 course_id text NOT NULL REFERENCES courses(id),
 faculty_id text NOT NULL REFERENCES faculties(id),
 institution_id text NOT NULL REFERENCES institutions(id),
 university_id text NOT NULL REFERENCES universities(id),
 enabled boolean NOT NULL DEFAULT false,
 max_members integer NOT NULL DEFAULT 5 CHECK (max_members BETWEEN 2 AND 100),
 conditions text NOT NULL DEFAULT '',
 updated_by text NOT NULL REFERENCES "user"(id),
 updated_at timestamp NOT NULL DEFAULT now(),
 PRIMARY KEY(course_id, faculty_id)
);
CREATE TABLE team_course_counters (
 course_id text PRIMARY KEY REFERENCES courses(id),
 next_number integer NOT NULL DEFAULT 0 CHECK (next_number >= 0)
);
