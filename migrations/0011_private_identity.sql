ALTER TABLE "user" ADD COLUMN national_id_fingerprint text;
CREATE UNIQUE INDEX user_national_id_fingerprint_unique ON "user" (national_id_fingerprint) WHERE national_id_fingerprint IS NOT NULL;
