export interface CircularRecord {
  id: string;
  title: string;
  description: string | null;
  circular_date: string;
  category: string;
  uploaded_at: string;
}

export function getCircularDisplayTitle(circular: Pick<CircularRecord, 'title' | 'description'>) {
  const title = circular.title.trim();
  const looksLikeFilename = /\.pdf$/i.test(title) || (title.length >= 48 && !/\s/.test(title));
  if (!looksLikeFilename) return title;
  return circular.description?.trim() || 'Official circular';
}
