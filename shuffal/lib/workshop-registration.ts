export type WorkshopCategory = 'society' | 'iert' | 'iit_madras';
export type WorkshopJoinChance = '100%' | '60%-70%' | '50%' | '20%';

export const WORKSHOP_REGISTRATION = {
  key: 'technical-workshop-meetup-2026',
  publicFormId: '7b4d9f21-2e6a-4dc8-a5f4-0d38c71e9b62',
  title: 'Technical Workshop & Meetup',
  eventDate: '2026-11-24',
  reportingTime: '8:30 AM',
  startsAt: '2026-11-24T09:00:00+05:30',
  closesAt: '2026-11-23T17:00:00+05:30',
  venue: 'PPT Hall, IERT Prayagraj',
  organisers: 'CSE Society IERT Prayagraj & Kanha Group, IIT Madras',
  sponsor: 'Anjaan Musafir',
  level: 'Beginner',
  fee: 149,
  joinChoices: ['100%', '60%-70%', '50%', '20%'] as readonly WorkshopJoinChance[],
} as const;

export function isWorkshopRegistrationOpen(now = Date.now()): boolean {
  return now < new Date(WORKSHOP_REGISTRATION.closesAt).getTime();
}

export function toIndiaDateTimeInput(value: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(value));
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value || '';
  return `${part('year')}-${part('month')}-${part('day')}T${part('hour')}:${part('minute')}`;
}

export function fromIndiaDateTimeInput(value: string): string {
  const date = new Date(`${value}:00+05:30`);
  if (!Number.isFinite(date.getTime())) throw new Error('Choose a valid registration deadline.');
  return date.toISOString();
}

export function formatWorkshopDeadline(value: string): string {
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZoneName: 'short',
  }).format(new Date(value));
}
