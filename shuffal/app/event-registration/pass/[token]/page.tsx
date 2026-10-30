import EventEntryPass from '@/components/EventEntryPass';

export const metadata = {
  robots: { index: false, follow: false },
};

export default async function EventEntryPassPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <EventEntryPass token={token} />;
}
