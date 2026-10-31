import type { CircularRecord } from '@/lib/circulars';

export async function fetchPublicCirculars(): Promise<CircularRecord[]> {
  const response = await fetch('/api/circulars', { cache: 'no-store' });
  const payload = await response.json() as { circulars?: CircularRecord[]; error?: string };
  if (!response.ok) throw new Error(payload.error || 'Could not load circulars');
  return payload.circulars || [];
}
