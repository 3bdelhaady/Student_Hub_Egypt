CREATE TABLE certificate_records (
 id text PRIMARY KEY, serial text NOT NULL UNIQUE,
 institution_id text NOT NULL REFERENCES institutions(id),
 university_id text REFERENCES universities(id), faculty_id text REFERENCES faculties(id),
 organization_id text REFERENCES student_organizations(id), department text NOT NULL,
 recipient_name text NOT NULL, certificate_title text NOT NULL, issued_on text NOT NULL,
 deleted boolean NOT NULL DEFAULT false, published boolean NOT NULL DEFAULT false, author_id text NOT NULL REFERENCES "user"(id),
 created_at timestamp NOT NULL DEFAULT now(), updated_at timestamp NOT NULL DEFAULT now(),
 CONSTRAINT certificate_serial_format CHECK (serial ~ '^[A-Z0-9][A-Z0-9-]{11,63}$'),
 CONSTRAINT certificate_institution_scope FOREIGN KEY (institution_id, university_id) REFERENCES institutions(id, university_id),
 CONSTRAINT certificate_faculty_scope FOREIGN KEY (faculty_id, university_id) REFERENCES faculties(id, university_id),
 CONSTRAINT certificate_organization_scope FOREIGN KEY (organization_id, institution_id, faculty_id, department) REFERENCES student_organizations(id, institution_id, faculty_id, kind)
);
CREATE INDEX certificate_scope_idx ON certificate_records(institution_id,faculty_id);
CREATE TABLE certificate_lookup_attempts (id text PRIMARY KEY, user_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE, created_at timestamp NOT NULL DEFAULT now());
CREATE INDEX certificate_lookup_rate_idx ON certificate_lookup_attempts(user_id,created_at);
