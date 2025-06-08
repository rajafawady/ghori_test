INSERT INTO audit_logs (id, company_id, user_id, entity_type, entity_id, action, new_values, ip_address) VALUES
('bb0e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440000', '660e8400-e29b-41d4-a716-446655440001', 'job', '770e8400-e29b-41d4-a716-446655440000', 'create', 
 '{"title": "Senior Full Stack Developer", "status": "active"}', '192.168.1.100'),
 
('bb0e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', '660e8400-e29b-41d4-a716-446655440001', 'candidate', '880e8400-e29b-41d4-a716-446655440000', 'create',
 '{"full_name": "Alex Rodriguez", "cv_file_name": "alex_rodriguez_cv.pdf"}', '192.168.1.100'),
 
('bb0e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440000', '660e8400-e29b-41d4-a716-446655440001', 'job_match', '990e8400-e29b-41d4-a716-446655440000', 'create',
 '{"match_score": 92.5, "processing_status": "completed"}', '192.168.1.100'),
 
('bb0e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440004', 'candidate', '880e8400-e29b-41d4-a716-446655440003', 'download',
 '{"cv_file_name": "sophie_chen_cv.pdf"}', '192.168.1.101');