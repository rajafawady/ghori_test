import { BatchDetailsView } from '@/components/candidates/BatchDetailsView';

interface BatchDetailsPageProps {
  params: Promise<{ id: string }>;
}

export default async function BatchDetailsPage({ params }: BatchDetailsPageProps) {
  const { id } = await params;
  return <BatchDetailsView batchId={id} />;
}
