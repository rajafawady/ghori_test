"use client";

import { JobManagement } from '@/components/jobs/JobManagement';
import { DashboardSummary } from '@/components/dashboard/DashboardSummary';

export default function HomePage() {
  return (
    <div>
      <DashboardSummary />
      <JobManagement />
    </div>
  );
}