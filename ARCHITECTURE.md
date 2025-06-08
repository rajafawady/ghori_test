# CV Matcher System Architecture

## Overview

CV Matcher is a SaaS product designed for recruitment agencies to efficiently process large volumes of CVs (500+ per job) and match them to job requirements using AI technology. The system provides sophisticated scoring, team collaboration features, a complete candidate pipeline management system, and comprehensive API usage tracking for billing purposes.

## Key Components

### 1. Multi-Tenant Database Design

The database is designed with a multi-tenant architecture that:
- Isolates each company's data using PostgreSQL Row Level Security (RLS)
- Enforces company-level access control across all 16 core tables
- Provides role-based permissions (admin, recruiter, viewer)
- Implements comprehensive audit logging for compliance

### 2. Batch Processing System

To handle 500+ CVs per job:
- CVs can be uploaded in batch via ZIP files
- Background processing handles text extraction and parsing
- Queue management ensures efficient resource use with retry mechanisms
- Processing metrics track performance and billing usage
- Automatic status tracking from upload to completion

### 3. AI Matching Engine

The core matching functionality:
- Extracts skills, experience, and keywords from CVs
- Scores candidates against job requirements using configurable weights
- Provides customizable matching criteria per job (skills, experience, education, keywords)
- Generates AI summaries and recommendations
- Supports minimum score thresholds for automatic filtering

### 4. Candidate Pipeline Management

Comprehensive recruitment process tracking:
- Status tracking (new → reviewed → shortlisted → interviewed → offered → hired/rejected)
- Team comments and collaboration features
- Custom tagging system for organization and filtering
- Full audit logging of all candidate interactions
- Advanced search and filtering capabilities

### 5. API Usage Tracking & Billing

SaaS billing and usage management:
- Tracks API calls and candidates processed per company
- Monthly usage limits with overage billing
- Real-time usage monitoring and alerting
- Historical usage analytics for capacity planning

## Scalability Considerations

The system is designed to scale efficiently:
- Optimized database indexes for fast querying across all 16 core tables
- Batch processing for large CV volumes with queue management
- Background processing queue with retry mechanisms and status tracking
- Performance monitoring and metrics collection built-in
- Row-level security policies optimized for multi-tenant performance
- API usage tracking for capacity planning and billing optimization

## Database Schema

### Complete Table Structure (16 Tables)

**Core Business Tables:**
1. **Companies** - Multi-tenant separation with billing configuration
2. **Users** - Role-based access control (admin, recruiter, viewer)
3. **Jobs** - Job postings with detailed requirements and custom match configs
4. **Candidates** - CV data with parsed skills, experience, and full-text search
5. **Job Matches** - AI-generated matches with scores and detailed analysis

**Advanced Features:**
6. **Batch Uploads** - Large-scale CV processing with status tracking
7. **Job Match Configs** - Per-job customizable matching criteria and weights
8. **Saved Searches** - Persistent search configurations for recruiters
9. **Candidate Tags** - Flexible tagging system for organization
10. **Candidate Statuses** - Pipeline tracking with enum-based status management
11. **Candidate Comments** - Team collaboration and notes
12. **AI Processing Queue** - Background job management with retry logic

**System & Monitoring:**
13. **Processing Metrics** - Performance tracking and analytics
14. **Audit Logs** - Comprehensive activity tracking for compliance
15. **API Usage Tracking** - SaaS billing and usage monitoring
16. **Usage Limits** - Company-level billing and overage management

## Testing Strategy

### Comprehensive Test Coverage with pgTAP

The system includes extensive automated testing:

**Test Categories:**
- **Schema Tests**: Table structure, constraints, indexes, and data types
- **RLS Tests**: Company isolation and role-based access control
- **CRUD Tests**: Create, Read, Update, Delete operations for all entities
- **Function Tests**: Database functions and business logic validation
- **Integration Tests**: End-to-end workflow testing (matching flow, candidate pipeline)
- **Performance Tests**: Query performance and scalability validation

**Test Structure:**
```
tests/
├── pgtap/
│   ├── schema/        # Database structure tests
│   ├── rls/          # Security policy tests
│   ├── crud/         # CRUD operation tests
│   ├── functions/    # Database function tests
│   ├── integration/  # End-to-end workflow tests
│   └── performance/  # Performance benchmark tests
└── helpers/          # Test utilities and setup scripts
```

## Getting Started

### Setup Instructions

1. **Clone the repository**
2. **Run the database setup script:**
   ```powershell
   .\scripts\setup_database.ps1
   ```
   *Or on Unix systems:*
   ```bash
   ./scripts/setup_database.sh
   ```

3. **Apply the migrations and seed data:**
   ```powershell
   .\scripts\run_migrations.ps1
   ```
   *Or on Unix systems:*
   ```bash
   ./scripts/run_migrations.sh
   ```

### Running Tests

Execute the comprehensive test suite:
```powershell
.\tests\run_tests.ps1
```
*Or on Unix systems:*
```bash
./tests/run_tests.sh
```

## Schema Highlights

### Custom Match Configuration

Each job supports highly customizable matching criteria:
- **Configurable weights** for skills, experience, education, and keywords
- **Minimum score thresholds** for automatic filtering and shortlisting
- **Per-job configuration** to reflect different priorities and requirements
- **Real-time weight adjustment** based on recruiter feedback

### Advanced Search and Filtering

The system enables sophisticated candidate discovery:
- **Full-text search** across all CV content with PostgreSQL's advanced search
- **Multi-criteria filtering** by skills, experience, location, status, and custom tags
- **Saved searches** for common filter combinations
- **Tag-based organization** with hierarchical tagging support
- **Status-based pipeline filtering** for recruitment workflow management

### API Usage and Billing Management

Built-in SaaS features for commercial deployment:
- **Real-time usage tracking** for API calls and candidates processed
- **Monthly limits** with automatic overage calculation
- **Billing integration** ready with usage analytics
- **Company-level controls** for usage monitoring and alerts

## Future Enhancements

Potential areas for expansion:
1. **Machine learning optimization** to improve match quality over time using historical hiring data
2. **Interview scheduling integration** with calendar systems and video conferencing
3. **Advanced candidate communication** tools including email templates and automated workflows
4. **ATS integration capabilities** for seamless data exchange with existing systems
5. **Custom reporting and analytics** with interactive dashboards and export capabilities
6. **Mobile application** for recruiters to review candidates on-the-go
7. **Advanced AI features** including sentiment analysis and cultural fit assessment
8. **Webhook integrations** for real-time notifications and third-party system updates
9. **Advanced security features** including SSO, 2FA, and compliance certifications
10. **Multi-language support** for international recruitment agencies
