-- Sample batch uploads

INSERT INTO batch_uploads (id, company_id, uploaded_by_user_id, job_id, file_path, original_filename, total_cvs, processed_cvs, status) VALUES
('dd0e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440000', '660e8400-e29b-41d4-a716-446655440001', 
 '770e8400-e29b-41d4-a716-446655440000', 'uploads/batches/senior_dev_batch1.zip', 'senior_dev_batch1.zip', 500, 500, 'completed'),
('dd0e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', '660e8400-e29b-41d4-a716-446655440001', 
 '770e8400-e29b-41d4-a716-446655440001', 'uploads/batches/devops_batch1.zip', 'devops_batch1.zip', 350, 350, 'completed'),
('dd0e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440004', 
 '770e8400-e29b-41d4-a716-446655440002', 'uploads/batches/frontend_batch1.zip', 'frontend_batch1.zip', 250, 250, 'completed');
