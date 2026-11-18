export type WorkshopCategory = 'society' | 'iert' | 'iit_madras';
export type WorkshopJoinChance = '100%' | '60%-70%' | '50%' | '20%';

export const WORKSHOP_REGISTRATION = {
  key: 'technical-workshop-meetup-2026',
  publicFormId: '7b4d9f21-2e6a-4dc8-a5f4-0d38c71e9b62',
  title: 'Technical Workshop & Meetup',
  eventDate: '2026-11-24',
  reportingTime: '8:30 AM',
  startsAt: '2026-11-24T09:00:00+05:30',
  closesAt: '2026-11-24T08:30:00+05:30',
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
