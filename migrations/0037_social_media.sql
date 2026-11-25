ALTER TABLE social_posts ADD COLUMN content_type text NOT NULL DEFAULT 'text' CHECK (content_type IN ('text','image','video'));
ALTER TABLE social_posts ADD COLUMN media_name text;
ALTER TABLE social_posts ADD COLUMN media_type text;
ALTER TABLE social_posts ADD COLUMN media_size integer;
CREATE TABLE social_post_media (
 post_id text PRIMARY KEY REFERENCES social_posts(id) ON DELETE CASCADE,
 data text NOT NULL
);
