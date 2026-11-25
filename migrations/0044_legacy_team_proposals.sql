INSERT INTO portal_entries (id,institution_id,university_id,faculty_id,organization_id,department,kind,title,description,team_course_id,team_marker,capacity,published,author_id)
SELECT 'legacy-team-' || r.id, s.institution_id,s.university_id,s.faculty_id,s.organization_id,'student_union','team',r.subject,r.body,p.course_id,p.marker,GREATEST(COALESCE(t.max_members,5)-1,0),false,r.user_id
FROM portal_requests r JOIN academic_team_proposals p ON p.request_id=r.id
JOIN agent_course_scopes s ON s.course_id=p.course_id AND s.university_id=p.university_id
JOIN memberships m ON m.user_id=r.user_id AND m.faculty_id=s.faculty_id AND m.university_id=s.university_id
LEFT JOIN team_course_settings t ON t.course_id=s.course_id AND t.faculty_id=s.faculty_id
WHERE r.kind='team_creation' AND r.entry_id IS NULL AND r.status IN ('pending','reviewing') AND s.department='student_union'
ON CONFLICT DO NOTHING;
UPDATE portal_requests r SET entry_id=e.id FROM portal_entries e WHERE r.entry_id IS NULL AND e.id='legacy-team-' || r.id AND r.kind='team_creation' AND r.status IN ('pending','reviewing');
