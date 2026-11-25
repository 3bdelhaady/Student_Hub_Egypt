CREATE TABLE platform_admins (user_id text PRIMARY KEY REFERENCES "user"(id) ON DELETE CASCADE, created_at timestamp NOT NULL DEFAULT now());
CREATE TABLE institutions (
 id text PRIMARY KEY, university_id text REFERENCES universities(id), name text NOT NULL,
 kind text NOT NULL CHECK (kind IN ('university','private_sector')), description text NOT NULL DEFAULT '', website text NOT NULL DEFAULT '',
 active boolean NOT NULL DEFAULT true, demo boolean NOT NULL DEFAULT false,
 created_at timestamp NOT NULL DEFAULT now(), updated_at timestamp NOT NULL DEFAULT now(),
 UNIQUE(id,university_id), CHECK ((kind='university' AND university_id IS NOT NULL) OR (kind='private_sector' AND university_id IS NULL))
);
CREATE TABLE student_organizations (
 id text PRIMARY KEY, institution_id text NOT NULL REFERENCES institutions(id), university_id text NOT NULL REFERENCES universities(id), faculty_id text NOT NULL REFERENCES faculties(id),
 kind text NOT NULL CHECK(kind IN ('student_union','student_activity')), name text NOT NULL, active boolean NOT NULL DEFAULT true,
 created_at timestamp NOT NULL DEFAULT now(), UNIQUE(id,institution_id,faculty_id), UNIQUE(id,institution_id,faculty_id,kind),
 FOREIGN KEY(institution_id,university_id) REFERENCES institutions(id,university_id),
 FOREIGN KEY(faculty_id,university_id) REFERENCES faculties(id,university_id)
);
CREATE TABLE institution_agents (
 id text PRIMARY KEY, user_id text NOT NULL UNIQUE REFERENCES "user"(id) ON DELETE CASCADE,
 institution_id text NOT NULL REFERENCES institutions(id), university_id text REFERENCES universities(id), faculty_id text REFERENCES faculties(id), organization_id text REFERENCES student_organizations(id),
 department text NOT NULL CHECK(department IN ('student_affairs','youth_welfare','private_sector','student_union','student_activity')),
 position text NOT NULL CHECK(position IN ('representative','president','vice_president','member')),
 is_super_agent boolean NOT NULL DEFAULT false,
 can_read boolean NOT NULL DEFAULT true, can_edit boolean NOT NULL DEFAULT false, can_publish boolean NOT NULL DEFAULT false,
 status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','active','suspended')),
 created_at timestamp NOT NULL DEFAULT now(), updated_at timestamp NOT NULL DEFAULT now(),
 FOREIGN KEY(institution_id,university_id) REFERENCES institutions(id,university_id),
 FOREIGN KEY(faculty_id,university_id) REFERENCES faculties(id,university_id),
 FOREIGN KEY(organization_id,institution_id,faculty_id,department) REFERENCES student_organizations(id,institution_id,faculty_id,kind),
 CHECK((department='private_sector' AND university_id IS NULL AND faculty_id IS NULL AND organization_id IS NULL AND position='representative') OR (department IN ('student_affairs','youth_welfare') AND university_id IS NOT NULL AND faculty_id IS NOT NULL AND organization_id IS NULL AND position='representative') OR (department IN ('student_union','student_activity') AND university_id IS NOT NULL AND faculty_id IS NOT NULL AND organization_id IS NOT NULL AND position IN ('president','vice_president','member'))),
 CHECK(NOT is_super_agent OR (can_read AND can_edit AND can_publish)),
 CHECK((NOT can_edit OR can_read) AND (NOT can_publish OR (can_edit AND can_read)))
);
CREATE INDEX institution_agents_scope_status_idx ON institution_agents(institution_id,faculty_id,department,status);
CREATE TABLE institution_content (
 id text PRIMARY KEY, institution_id text NOT NULL REFERENCES institutions(id), university_id text REFERENCES universities(id), faculty_id text REFERENCES faculties(id), organization_id text REFERENCES student_organizations(id),
 department text NOT NULL CHECK(department IN ('student_affairs','youth_welfare','private_sector','student_union','student_activity')), title text NOT NULL, body text NOT NULL, published boolean NOT NULL DEFAULT false, author_id text NOT NULL REFERENCES "user"(id),
 created_at timestamp NOT NULL DEFAULT now(), updated_at timestamp NOT NULL DEFAULT now(),
 CHECK((department='private_sector' AND university_id IS NULL AND faculty_id IS NULL AND organization_id IS NULL) OR (department IN ('student_affairs','youth_welfare') AND university_id IS NOT NULL AND faculty_id IS NOT NULL AND organization_id IS NULL) OR (department IN ('student_union','student_activity') AND university_id IS NOT NULL AND faculty_id IS NOT NULL AND organization_id IS NOT NULL)),
 FOREIGN KEY(institution_id,university_id) REFERENCES institutions(id,university_id),
 FOREIGN KEY(faculty_id,university_id) REFERENCES faculties(id,university_id),
 FOREIGN KEY(organization_id,institution_id,faculty_id,department) REFERENCES student_organizations(id,institution_id,faculty_id,kind)
);
CREATE INDEX institution_content_scope_published_idx ON institution_content(institution_id,faculty_id,department,published);
CREATE TABLE institution_audit_events (id text PRIMARY KEY, actor_id text REFERENCES "user"(id), institution_id text NOT NULL REFERENCES institutions(id), action text NOT NULL, entity_id text NOT NULL, created_at timestamp NOT NULL DEFAULT now());
CREATE INDEX institution_audit_scope_created_idx ON institution_audit_events(institution_id,created_at);
CREATE TABLE demo_provision_runs (id text PRIMARY KEY, created_at timestamp NOT NULL DEFAULT now());
