import { getCircularPdfResponse } from '@/lib/circulars-file';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  return getCircularPdfResponse(id);
}
