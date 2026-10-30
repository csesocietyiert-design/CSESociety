export const EVENT_REGISTRATION = {
  key: 'esports-2026',
  title: 'E-Sports Swiss-League Tournament',
  subtitle: 'Trophies & certificates',
  venue: 'Auditorium',
  eventDate: '2026-11-01',
  startsAt: '2026-11-01T09:00:00+05:30',
  closesAt: '2026-11-01T09:00:00+05:30',
  firstHalf: {
    label: 'First Half',
    time: '9:00 AM – 12:00 PM',
    games: ['BGMI', 'Free Fire', 'Table Tennis'],
  },
  secondHalf: {
    label: 'Second Half',
    time: '2:00 PM – 4:00 PM',
    games: ['Chess'],
  },
  fees: {
    first_half: 40,
    second_half: 30,
    both: 60,
    member: 0,
  },
  rules: [
    'First-half games allow Solo (1 player) or Duo (2 players).',
    'Chess is Solo only, with 5-minute blitz rounds.',
    'Table Tennis follows a best-of-2 blitz format.',
    'Use of hacks, cheats, or emulators is not allowed.',
    'Participants must arrive on time for their selected session.',
    'Both Duo players must submit their own registration with the same team name.',
  ],
} as const;

export type EventSession = 'first_half' | 'second_half' | 'both';
export type EventGame = 'BGMI' | 'Free Fire' | 'Table Tennis';
export type EventParticipantType = 'member' | 'non_member';

export function getEventFee(participantType: EventParticipantType, session: EventSession): number {
  return participantType === 'member' ? 0 : EVENT_REGISTRATION.fees[session];
}

export function isEventRegistrationOpen(now = Date.now()): boolean {
  return now < new Date(EVENT_REGISTRATION.closesAt).getTime();
}

export function getGamesForSession(session: EventSession, firstHalfGames: EventGame[]): string[] {
  if (session === 'second_half') return ['Chess'];
  return session === 'both' ? [...firstHalfGames, 'Chess'] : firstHalfGames;
}
