import type { Metadata } from 'next';
import FormOpenGate from '@/components/FormOpenGate';
import { getFormsSupabase } from '@/lib/forms-server';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  let title = 'Registration form';

  try {
    const { data, error } = await getFormsSupabase()
      .from('registration_forms')
      .select('title')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    if (data?.title) title = data.title;
  } catch (error) {
    console.error('Registration form preview metadata could not be loaded:', error);
  }

  const description = `Register for ${title}, organized by CSE Society IERT.`;
  const image = {
    url: '/workshop-partners/collaboration-logo.png',
    width: 640,
    height: 640,
    alt: 'CSE Society IERT and IIT Madras Kanha House collaboration',
  };

  return {
    title: `${title} | CSE Society`,
    description,
    openGraph: { title: `${title} | CSE Society`, description, type: 'website', images: [image] },
    twitter: { card: 'summary_large_image', title: `${title} | CSE Society`, description, images: [image.url] },
  };
}

export default async function FormLinkPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ admin?: string; document?: string }>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  return <FormOpenGate formId={id} adminAccess={query.admin === '1'} documentAccess={query.document === '1'} />;
}
