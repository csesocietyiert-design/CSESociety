export const FORM_CREATOR_ROLES = new Set([
  'admin',
  'general_secretary',
  'technical_secretary',
  'cultural_secretary',
]);

export function normalizeFormRole(role: string): string {
  return role.trim().toLowerCase().replace(/[\s-]+/g, '_');
}

export interface RegistrationForm {
  id: string;
  title: string;
  end_date: string;
  document_url: string | null;
  created_at: string;
}

export function getCurrentDateInIndia(): string {
  const dateParts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const part = (type: Intl.DateTimeFormatPartTypes) => dateParts.find((value) => value.type === type)?.value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}

export function isFormExpired(endDate: string, today = getCurrentDateInIndia()): boolean {
  return endDate < today;
}
