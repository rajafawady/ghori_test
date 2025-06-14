import { BatchUploadPageClient } from './BatchUploadPageClient';

interface BatchUploadPageProps {
  params: Promise<{
    jobId: string;
  }>;
}

export default async function BatchUploadPage({ params }: BatchUploadPageProps) {
  const { jobId } = await params;
  return <BatchUploadPageClient jobId={jobId} />;
}