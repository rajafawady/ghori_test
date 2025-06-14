import { UploadHistoryPage } from '@/components/candidates/UploadHistoryPage';

interface JobUploadsPageProps {
  params: Promise<{ jobId: string }>;
}

export default async function JobUploadsPage({ params }: JobUploadsPageProps) {
  const { jobId } = await params;
  return <UploadHistoryPage jobId={jobId} />;
}
