CREATE TABLE agent_course_scopes (
 course_id text PRIMARY KEY REFERENCES courses(id) ON DELETE CASCADE,
 institution_id text NOT NULL REFERENCES institutions(id),
 university_id text NOT NULL REFERENCES universities(id),
 faculty_id text NOT NULL REFERENCES faculties(id),
 organization_id text NOT NULL REFERENCES student_organizations(id),
 department text NOT NULL CHECK(department IN ('student_union','student_activity')),
 FOREIGN KEY(course_id,university_id) REFERENCES courses(id,university_id),
 FOREIGN KEY(institution_id,university_id) REFERENCES institutions(id,university_id),
 FOREIGN KEY(faculty_id,university_id) REFERENCES faculties(id,university_id),
 FOREIGN KEY(organization_id,institution_id,faculty_id,department) REFERENCES student_organizations(id,institution_id,faculty_id,kind)
);
CREATE INDEX agent_course_scopes_domain ON agent_course_scopes(institution_id,faculty_id,organization_id,department);
