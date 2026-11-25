CREATE UNIQUE INDEX faculties_id_university_unique ON faculties(id, university_id);
ALTER TABLE memberships ADD CONSTRAINT membership_faculty_university_fk FOREIGN KEY (faculty_id, university_id) REFERENCES faculties(id, university_id);
CREATE INDEX memberships_scope_status_idx ON memberships(university_id, status);
CREATE INDEX courses_scope_published_idx ON courses(university_id, published, created_at);
CREATE INDEX posts_scope_published_idx ON posts(university_id, published, created_at);
CREATE INDEX resources_course_position_idx ON resources(course_id, position);
CREATE INDEX saved_courses_user_created_idx ON saved_courses(user_id, created_at);
CREATE INDEX audit_scope_created_idx ON audit_events(university_id, created_at);
