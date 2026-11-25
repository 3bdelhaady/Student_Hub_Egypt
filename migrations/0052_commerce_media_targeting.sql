ALTER TABLE portal_entries ADD COLUMN image_urls jsonb NOT NULL DEFAULT '[]';
ALTER TABLE portal_entries ADD COLUMN target_university_id text REFERENCES universities(id);
ALTER TABLE portal_entries ADD COLUMN target_faculty_id text REFERENCES faculties(id);
ALTER TABLE portal_entries ADD COLUMN target_governorate text NOT NULL DEFAULT '';
CREATE TABLE portal_entry_images(id text PRIMARY KEY,entry_id text NOT NULL REFERENCES portal_entries(id) ON DELETE CASCADE,mime_type text NOT NULL,data text NOT NULL);
CREATE INDEX portal_entry_images_entry_idx ON portal_entry_images(entry_id);
