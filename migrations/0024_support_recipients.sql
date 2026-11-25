CREATE TABLE support_destinations (
 request_id text PRIMARY KEY REFERENCES portal_requests(id) ON DELETE CASCADE,
 institution_id text NOT NULL REFERENCES institutions(id), university_id text NOT NULL REFERENCES universities(id),
 faculty_id text NOT NULL REFERENCES faculties(id), organization_id text REFERENCES student_organizations(id), department text NOT NULL,
 label text NOT NULL, created_at timestamp NOT NULL DEFAULT now(),
 FOREIGN KEY (institution_id,university_id) REFERENCES institutions(id,university_id),
 FOREIGN KEY (faculty_id,university_id) REFERENCES faculties(id,university_id),
 FOREIGN KEY (organization_id,institution_id,faculty_id,department) REFERENCES student_organizations(id,institution_id,faculty_id,kind)
);
CREATE INDEX support_destination_scope_idx ON support_destinations(institution_id,faculty_id,department);
