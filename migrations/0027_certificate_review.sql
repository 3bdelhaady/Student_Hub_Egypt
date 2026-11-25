CREATE TABLE certificate_changes (
 id text PRIMARY KEY, record_id text, serial text NOT NULL,
 institution_id text NOT NULL REFERENCES institutions(id), university_id text REFERENCES universities(id),
 faculty_id text REFERENCES faculties(id), organization_id text REFERENCES student_organizations(id), department text NOT NULL,
 recipient_name text NOT NULL, certificate_title text NOT NULL, issued_on text NOT NULL,
 author_id text NOT NULL REFERENCES "user"(id), base_updated_at timestamp,
 status text NOT NULL DEFAULT 'pending', reviewer_id text REFERENCES "user"(id), reviewed_at timestamp,
 created_at timestamp NOT NULL DEFAULT now()
);
CREATE INDEX certificate_changes_scope_idx ON certificate_changes(university_id, faculty_id, status);
CREATE UNIQUE INDEX certificate_changes_pending_serial ON certificate_changes(serial) WHERE status='pending';
CREATE UNIQUE INDEX certificate_changes_pending_record ON certificate_changes(record_id) WHERE status='pending';
