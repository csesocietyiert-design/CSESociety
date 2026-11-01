import { permanentRedirect } from 'next/navigation';

type PageProps = { params: Promise<{ id: string }> };

export default async function CircularPage({ params }: PageProps) {
  const { id } = await params;
  permanentRedirect(`/circulars/${encodeURIComponent(id)}`);
}
