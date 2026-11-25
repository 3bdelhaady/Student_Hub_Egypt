ALTER TABLE portal_entries ADD COLUMN ticket_type text NOT NULL DEFAULT '';
ALTER TABLE portal_entries ADD COLUMN archived boolean NOT NULL DEFAULT false;
UPDATE portal_entries SET ticket_type='concert' WHERE kind='ticket';
UPDATE portal_entries SET kind='ticket', ticket_type='trip', updated_at=now() WHERE kind='trip';
UPDATE portal_entries SET archived=true,published=false,updated_at=now() WHERE kind='training';
ALTER TABLE portal_entries ADD CONSTRAINT portal_ticket_type_check CHECK (ticket_type IN ('','concert','trip') AND (kind='ticket' OR ticket_type=''));
UPDATE institution_agents SET section_permissions=section_permissions - 'trip' - 'training',updated_at=now() WHERE user_id=(SELECT id FROM "user" WHERE email='demo.store.agent@studenthub.test') AND institution_id='review-demo-store' AND department='private_sector' AND section_permissions IS NOT NULL;
ALTER TABLE portal_entries ADD CONSTRAINT portal_retired_categories_check CHECK (kind <> 'trip' AND (kind <> 'training' OR (archived AND NOT published)));
