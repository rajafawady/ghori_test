# CV Matcher System Architecture

## Overview

CV Matcher is a SaaS product designed for recruitment agencies to efficiently process large volumes of CVs (500+ per job) and match them to job requirements using AI technology. The system provides sophisticated scoring, team collaboration features, and a complete candidate pipeline management system.

## Key Components

### 1. Multi-Tenant Database Design

The database is designed with a multi-tenant architecture that:
- Isolates each company's data using PostgreSQL Row Level Security (RLS)
- Enforces company-level access control
- Provides role-based permissions (admin, recruiter, viewer)

### 2. Batch Processing System

To handle 500+ CVs per job:
- CVs can be uploaded in batch via ZIP files
- Background processing handles text extraction and parsing
- Queue management ensures efficient resource use
- Processing metrics track performance

### 3. AI Matching Engine

The core matching functionality:
- Extracts skills, experience, and keywords from CVs
- Scores candidates against job requirements
- Provides customizable matching criteria per job
- Generates AI summaries and recommendations

### 4. Candidate Pipeline Management

Track candidates through the recruitment process:
- Status tracking (new → reviewed → shortlisted → interviewed → offered → hired/rejected)
- Team comments and collaboration
- Custom tagging system for organization
- Audit logging of all actions

## Scalability Considerations

The system is designed to scale efficiently:
- Optimized database indexes for fast querying
- Batch processing for large CV volumes
- Background processing queue with retry mechanisms
- Performance monitoring built-in

## Getting Started

### Setup Instructions

1. Clone the repository
2. Run the database setup script:
   ```
   .\scripts\setup_database.ps1
   ```
3. Apply the migrations and seed data:
   ```
   .\scripts\run_migrations.ps1
   ```

## Schema Highlights

### Custom Match Configuration

Each job can have custom matching criteria:
- Configurable weights for skills, experience, education, and keywords
- Minimum score thresholds for automatic filtering
- Per-job configuration to reflect different priorities

### Advanced Search and Filtering

The system enables:
- Full-text search across CV content
- Filtering by skills, experience, location, and more
- Saved searches for common filters
- Tag-based organization

## Future Enhancements

Potential areas for expansion:
1. Machine learning to improve match quality over time
2. Interview scheduling integration
3. Candidate communication tools
4. ATS integration capabilities
5. Custom reporting and analytics
