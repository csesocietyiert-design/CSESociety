export interface CircularRecord {
  id: string;
  title: string;
  description: string | null;
  circular_date: string;
  category: string;
  uploaded_at: string;
}

export function getCircularDisplayTitle(circular: Pick<CircularRecord, 'title' | 'description'>) {
  return circular.title.trim();
}

export function getCircularDisplayDescription(circular: Pick<CircularRecord, 'title' | 'description'>) {
  const description = circular.description?.trim();
  if (!description || description.toLocaleLowerCase() === getCircularDisplayTitle(circular).toLocaleLowerCase()) {
    return null;
  }
  return description;
}
