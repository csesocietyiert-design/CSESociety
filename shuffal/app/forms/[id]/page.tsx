import FormOpenGate from '@/components/FormOpenGate';

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
