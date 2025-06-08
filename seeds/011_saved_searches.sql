-- Sample saved searches

INSERT INTO saved_searches (id, company_id, user_id, name, job_id, min_score, skills, min_experience, location) VALUES
('ff0e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440000', '660e8400-e29b-41d4-a716-446655440001',
 'Top React Developers', '770e8400-e29b-41d4-a716-446655440000', 85, ARRAY['React', 'Node.js', 'TypeScript'], 4, 'San Francisco'),
('ff0e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', '660e8400-e29b-41d4-a716-446655440002',
 'DevOps AWS Experts', '770e8400-e29b-41d4-a716-446655440001', 80, ARRAY['AWS', 'Kubernetes', 'Docker'], 3, NULL),
('ff0e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440004',
 'Frontend with Next.js', '770e8400-e29b-41d4-a716-446655440002', 75, ARRAY['React', 'Next.js', 'Tailwind'], 2, 'New York');
