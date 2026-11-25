CREATE TABLE IF NOT EXISTS saved_courses (
  id text PRIMARY KEY,
  user_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  course_id text NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  created_at timestamp NOT NULL DEFAULT now(),
  UNIQUE(user_id, course_id)
);
CREATE TABLE IF NOT EXISTS resource_progress (
  id text PRIMARY KEY,
  user_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  resource_id text NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  completed_at timestamp NOT NULL DEFAULT now(),
  UNIQUE(user_id, resource_id)
);
