import { BatchUploadPageClient } from './BatchUploadPageClient';

interface BatchUploadPageProps {
  params: {
    jobId: string;
  };
}

export default function BatchUploadPage({ params }: BatchUploadPageProps) {
  return <BatchUploadPageClient jobId={params.jobId} />;
} 