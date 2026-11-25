CREATE TABLE volunteer_divisions (
 id text PRIMARY KEY,
 entry_id text NOT NULL REFERENCES portal_entries(id) ON DELETE CASCADE,
 label text NOT NULL CHECK(char_length(label) BETWEEN 2 AND 100),
 description text NOT NULL DEFAULT '' CHECK(char_length(description)<=500),
 position integer NOT NULL DEFAULT 0 CHECK(position BETWEEN 0 AND 19),
 active boolean NOT NULL DEFAULT true
);
CREATE INDEX volunteer_divisions_entry ON volunteer_divisions(entry_id,position);
CREATE UNIQUE INDEX volunteer_divisions_label ON volunteer_divisions(entry_id,lower(label));
CREATE TABLE volunteer_request_choices (
 request_id text PRIMARY KEY REFERENCES portal_requests(id) ON DELETE CASCADE,
 division_id text REFERENCES volunteer_divisions(id) ON DELETE SET NULL,
 division_label text NOT NULL
);
