ALTER TABLE universities ADD COLUMN IF NOT EXISTS governorate text NOT NULL DEFAULT '';
ALTER TABLE institutions ADD COLUMN IF NOT EXISTS governorate text NOT NULL DEFAULT '';
ALTER TABLE institutions ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'general';
UPDATE universities SET governorate = 'قنا' WHERE id = 'demo-university' AND governorate = '';
UPDATE universities SET governorate = 'الأقصر' WHERE id = 'luxor-national' AND governorate = '';
UPDATE institutions SET governorate = universities.governorate FROM universities WHERE institutions.university_id = universities.id AND institutions.kind = 'university' AND institutions.governorate = '';
