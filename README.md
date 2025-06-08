# CV Matcher Database Schema

This project implements a multi-tenant CV matching system for recruitment agencies. The database is designed to efficiently process and match large volumes of CVs (500+) against job requirements using AI.

## Core Features

- **Multi-tenant architecture** with proper data isolation between companies
- **CV processing and matching** with customizable scoring criteria
- **Batch upload system** to handle processing 500+ CVs at once
- **Candidate pipeline management** from application to hiring
- **Team collaboration tools** for recruiters to work together
- **Advanced search and filtering** capabilities
- **Performance analytics** for large-scale CV processing

## Database Schema

### Core Entities

1. **Companies** - Multi-tenant separation
2. **Users** - User management with role-based access control
3. **Jobs** - Job postings with detailed requirements
4. **Candidates** - CV data with parsed skills and experience
5. **Job Matches** - AI-generated matches between candidates and jobs

### Enhanced Features

6. **Batch Uploads** - For processing large volumes of CVs at once
7. **Job Match Configs** - Customize matching criteria for each job
8. **Saved Searches** - Store common search parameters
9. **Candidate Tags** - Organize candidates with custom tags
10. **Processing Metrics** - Monitor system performance
11. **Candidate Statuses** - Track recruitment pipeline progress
12. **Candidate Comments** - Team collaboration on candidates

## Security Model

The database uses PostgreSQL Row Level Security (RLS) to ensure proper data isolation between companies. Each table has company-specific policies that restrict access to data owned by the company associated with the current user.

## Getting Started

### Database Setup

1. Run the setup script to create the database:
   ```
   ./scripts/setup_database.sh
   ```

2. Run migrations to create tables and seed data:
   ```
   ./scripts/run_migrations.sh
   ```

## Migration and Seed Files

The database is structured with migration files that create the schema and seed files that populate sample data.

### Migration Sequence

1. Companies
2. Users
3. Jobs
4. Candidates
5. Job Matches
6. AI Processing Queue
7. Audit Logs
8. RLS Policies
9. Batch Upload System
10. Job Match Configurations
11. Saved Searches
12. Candidate Tags
13. Processing Metrics
14. Candidate Statuses
15. Candidate Comments

## Usage Examples

### Processing a Batch of CVs

1. Upload batch of CVs
2. System extracts text and structures data
3. AI matching processes against job requirements
4. Results are ranked by match score
5. Recruiters can view, filter, and take action on matches

### Collaboration on Candidates

1. Add comments on promising candidates
2. Tag candidates for organization
3. Update candidate status through the pipeline
4. Track metrics on processing performance
