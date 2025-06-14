# Job Matcher Frontend

This is the frontend for the **CV Matcher System**, a SaaS platform for recruitment agencies to efficiently process, match, and manage large volumes of CVs using AI-powered technology. The app is built with [Next.js](https://nextjs.org), React, and TypeScript, and is designed for multi-tenant, role-based, collaborative workflows.

---

## Features

- **Job Management**: Create, edit, and manage job postings with detailed requirements and custom matching configurations.
- **Batch CV Uploads**: Upload candidate CVs in bulk (ZIP, CSV, Excel, PDF) with real-time progress and status tracking.
- **AI Matching Engine**: Automated scoring and ranking of candidates against job requirements, with configurable weights for skills, experience, education, and keywords.
- **Candidate Pipeline**: Track candidates through all recruitment stages, with status management, comments, and tagging.
- **User Management**: Admin, recruiter, and viewer roles with granular permissions. Manage users, roles, and activity logs.
- **Dashboard**: Visual summary of jobs, candidates, matches, and batch uploads for quick insights.
- **Advanced Search & Filtering**: Full-text search, multi-criteria filtering, and saved searches for jobs and candidates.
- **Upload History**: View and manage all batch uploads, including per-job and per-company filtering.
- **PDF Resume Viewer**: Inline viewing of candidate resumes.
- **Notifications & Toasts**: Real-time feedback for user actions and system events.
- **Loader & Progress UI**: Modern loading indicators for all async operations.
- **Admin Tools**: Database reset, batch processing controls, and more (for development/demo).

---

## Project Structure

- `src/app/` — Next.js app directory (routing, layouts, pages)
  - `jobs/` — Job details, candidate matches, and job-specific uploads
  - `uploads/` — Upload history and batch details
  - `users/` — User management
  - `admin/` — Admin tools
- `src/components/` — UI and feature components
  - `jobs/` — JobList, JobForm, JobDetails, JobManagement
  - `candidates/` — BatchUpload, BatchUploadList, BatchDetailsView, UploadHistoryPage
  - `dashboard/` — DashboardSummary
  - `users/` — UserManagement, UserDialog, UserDetails, UserActivityLog
  - `ui/` — Reusable UI elements (badge, button, card, dialog, input, pdf-viewer, toast, loader, etc.)
  - `layout/` — AppLayout, MainLayout
- `src/contexts/` — React context for global app state
- `src/hooks/` — Custom hooks for jobs, candidates, matches, toasts
- `src/services/` — Data and business logic (jobService, candidateService, batchUploadService, jobMatchService, userService)
- `src/lib/` — Utilities, mock data, storage, database reset
- `src/types/` — TypeScript types for all entities
- `public/` — Static assets and sample resumes

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm, yarn, pnpm, or bun
- Backend API and database (see main repo for setup)

### Install Dependencies
```bash
npm install
# or
yarn install
# or
pnpm install
# or
bun install
```

### Run the Development Server
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Main Components & Pages

- **Dashboard** (`/`): Overview of jobs, candidates, matches, and uploads.
- **Job Management** (`/`): List, search, create, edit, and delete jobs.
- **Job Details** (`/jobs/[id]`): View job info, upload candidates, see upload history, and view matched candidates.
- **Batch Uploads** (`/uploads`): Upload candidate files, view upload progress, and see batch details.
- **Candidate Matching** (`/jobs/[id]/candidates`): Review AI match scores, filter, and view candidate resumes.
- **User Management** (`/users`): Manage users, roles, and activity logs (admin only).
- **Admin Tools** (`/admin`): Database reset and other admin actions (development/demo only).

---

## Key Technologies
- [Next.js 14+](https://nextjs.org/) (App Router)
- [React 18+](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/) (via PostCSS)
- [Lucide Icons](https://lucide.dev/)
- [React Dropzone](https://react-dropzone.js.org/) (for uploads)

---

## Environment Variables

Create a `.env.local` file and configure any required API endpoints or secrets. (See backend for details.)

---

## Contribution & Development
- PRs and issues welcome!
- For architecture, see `../ARCHITECTURE.md` in the main repo.
- For backend/database setup, see the main repo README.

---

## License

This project is licensed under the MIT License.
