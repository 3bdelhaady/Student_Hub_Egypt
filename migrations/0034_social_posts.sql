CREATE TABLE social_posts (
 id text PRIMARY KEY,
 author_id text NOT NULL REFERENCES "user"(id),
 institution_id text NOT NULL REFERENCES institutions(id),
 university_id text NOT NULL REFERENCES universities(id),
 faculty_id text NOT NULL REFERENCES faculties(id),
 channel text NOT NULL CHECK(channel IN ('facebook','instagram','linkedin','youtube')),
 scope text NOT NULL CHECK(scope IN ('faculty','university')),
 body text NOT NULL,
 status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected','scheduled','ready')),
 review_note text NOT NULL DEFAULT '',
 reviewer_id text REFERENCES "user"(id),
 scheduled_at timestamp,
 created_at timestamp NOT NULL DEFAULT now(), updated_at timestamp NOT NULL DEFAULT now()
);
CREATE INDEX social_posts_scope_idx ON social_posts(institution_id,university_id,faculty_id);
CREATE INDEX social_posts_author_idx ON social_posts(author_id);
