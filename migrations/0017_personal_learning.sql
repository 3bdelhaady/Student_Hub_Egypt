CREATE TABLE IF NOT EXISTS personal_learning_courses (
 id text PRIMARY KEY,
 user_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
 title text NOT NULL,
 description text NOT NULL DEFAULT '',
 status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','draft')),
 created_at timestamp NOT NULL DEFAULT now(),
 updated_at timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS personal_learning_owner ON personal_learning_courses(user_id, updated_at DESC);
CREATE TABLE IF NOT EXISTS personal_learning_resources (
 id text PRIMARY KEY,
 course_id text NOT NULL REFERENCES personal_learning_courses(id) ON DELETE CASCADE,
 title text NOT NULL,
 body text NOT NULL DEFAULT '',
 url text NOT NULL DEFAULT '',
 position integer NOT NULL DEFAULT 0,
 completed_at timestamp,
 created_at timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS personal_learning_resource_order ON personal_learning_resources(course_id, position, created_at);
