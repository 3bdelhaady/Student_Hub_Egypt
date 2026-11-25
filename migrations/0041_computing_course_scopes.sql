INSERT INTO agent_course_scopes (course_id,institution_id,university_id,faculty_id,organization_id,department)
SELECT c.id,o.institution_id,c.university_id,o.faculty_id,o.id,'student_union'
FROM courses c
JOIN student_organizations o ON o.id='demo-union-computing' AND o.university_id=c.university_id AND o.faculty_id='demo-computing' AND o.kind='student_union'
WHERE c.id IN ('math-2','programming','communication','presentation-v2-course') AND c.university_id='demo-university'
ON CONFLICT (course_id) DO NOTHING;
