-- Owner approved activity grant removal at 16:36 and refined demo.student to union at 16:37 Cairo on 2026-11-24.
UPDATE institution_agents SET department='student_union', organization_id='demo-union-computing'
WHERE id='395940c8-f6b7-43f2-8c1f-1cff2c9ab157' AND user_id IN (SELECT id FROM "user" WHERE email='demo.student@studenthub.test') AND department='student_activity' AND organization_id='demo-activity-computing' AND faculty_id='demo-computing';
UPDATE institution_agents SET section_permissions = jsonb_set(jsonb_set(COALESCE(section_permissions, '{}'::jsonb), '{academic}', '{"canRead":false,"canEdit":false,"canPublish":false}'::jsonb), '{team}', '{"canRead":false,"canEdit":false,"canPublish":false}'::jsonb)
WHERE id='05820c7d-eec7-44cf-ab75-ab694073cb74' AND user_id IN (SELECT id FROM "user" WHERE email='demo.activity.computing@studenthub.test') AND department='student_activity';
