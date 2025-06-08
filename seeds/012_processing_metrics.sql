-- Sample processing metrics

INSERT INTO processing_metrics (id, company_id, job_id, batch_id, total_candidates, start_time, end_time, processing_duration_seconds, candidates_per_second, ai_service_used) VALUES
('990e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440000', '770e8400-e29b-41d4-a716-446655440000', 
 'dd0e8400-e29b-41d4-a716-446655440000', 500, NOW() - INTERVAL '2 hours', NOW() - INTERVAL '1 hour 30 minutes', 1800, 0.28, 'OpenAI GPT-4'),
('990e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', '770e8400-e29b-41d4-a716-446655440001', 
 'dd0e8400-e29b-41d4-a716-446655440001', 350, NOW() - INTERVAL '1 hour 30 minutes', NOW() - INTERVAL '1 hour 10 minutes', 1200, 0.29, 'OpenAI GPT-4'),
('990e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440002', 
 'dd0e8400-e29b-41d4-a716-446655440002', 250, NOW() - INTERVAL '1 hour', NOW() - INTERVAL '45 minutes', 900, 0.28, 'OpenAI GPT-4');
