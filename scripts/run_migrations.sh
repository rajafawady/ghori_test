DB_NAME="cv-matcher"
DB_USER="postgres"
DB_PASSWORD="6731"

# Run migrations
echo "Running migrations for database: $DB_NAME"

export PGPASSWORD="$DB_PASSWORD"

# Execute migration SQL files in proper order
MIGRATIONS=(
  "001_create_companies.sql"
  "002_create_users.sql"
  "003_create_jobs.sql"
  "004_create_candidates.sql"
  "005_create_job_matches.sql"
  "006_create_ai_processing_queue.sql"
  "007_create_audit_logs.sql"
  "008_create_rls_policies.sql"
  "009_create_batch_upload_system.sql"
  "010_create_job_match_configs.sql"
  "011_create_saved_searches.sql"
  "012_create_candidate_tags.sql"
  "013_create_processing_metrics.sql"
  "014_create_candidate_statuses.sql"
  "015_create_candidate_comments.sql"
  "016_create_api_usage_tracking.sql"
)

for migration in "${MIGRATIONS[@]}"; do
    echo "Applying migration: $migration"
    psql -U $DB_USER -d $DB_NAME -f "migrations/$migration"
done

# Execute seed SQL files in proper order
SEEDS=(
  "001_companies.sql"
  "002_users.sql"
  "003_jobs.sql"
  "004_candidates.sql"
  "005_job_matches.sql"
  "006_ai_processing_queue.sql"
  "007_audit_logs.sql"
  "008_job_match_configs.sql"
  "009_batch_uploads.sql"
  "010_candidate_tags.sql"
  "011_saved_searches.sql"
  "012_processing_metrics.sql"
  "013_candidate_statuses.sql"
  "014_candidate_comments.sql"
  "015_api_usage.sql"
)

for seed in "${SEEDS[@]}"; do
    echo "Applying seed: $seed"
    psql -U $DB_USER -d $DB_NAME -f "seeds/$seed"
done

unset PGPASSWORD

echo "Migrations and seeding completed."