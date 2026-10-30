export type EventSession = 'first_half' | 'second_half' | 'both';
export type EventGame = 'BGMI' | 'Free Fire' | 'Table Tennis' | 'Chess';
export type EventParticipantType = 'member' | 'non_member';

export const FIRST_HALF_GAMES: readonly EventGame[] = ['BGMI', 'Free Fire'];
export const SECOND_HALF_GAMES: readonly EventGame[] = ['Table Tennis', 'Chess'];

export const EVENT_REGISTRATION = {
  key: 'esports-2026',
  publicFormId: '37567b20-114a-47c1-ad51-548d6bfba605',
  title: 'E-Sports Swiss-League Tournament',
  subtitle: 'Trophies & certificates',
  venue: 'Auditorium',
  eventDate: '2026-11-01',
  startsAt: '2026-11-01T09:00:00+05:30',
  closesAt: '2026-11-01T09:00:00+05:30',
  firstHalf: {
    label: 'First Half',
    time: '9:00 AM – 12:00 PM',
    games: FIRST_HALF_GAMES,
  },
  secondHalf: {
    label: 'Second Half',
    time: '2:00 PM – 4:00 PM',
    games: SECOND_HALF_GAMES,
  },
  fees: {
    first_half: 40,
    second_half: 30,
    both: 60,
    member: 0,
  },
  rules: [
    'Choose exactly one game from each selected half: BGMI or Free Fire in the First Half, and Table Tennis or Chess in the Second Half.',
    'Table Tennis follows a best-of-2 blitz format.',
    'Chess is Solo only and uses 5-minute blitz rounds.',
    'Use of hacks, cheats, or emulators is not allowed.',
    'Participants must arrive on time for their selected session.',
    'Solo and Duo participants must enter a team name. Both Duo players submit their own registration with the same team name. For both sessions, Duo applies only to the First Half game.',
  ],
} as const;

export function getEventFee(participantType: EventParticipantType, session: EventSession): number {
  return participantType === 'member' ? 0 : EVENT_REGISTRATION.fees[session];
}

export function isEventRegistrationOpen(now = Date.now()): boolean {
  return now < new Date(EVENT_REGISTRATION.closesAt).getTime();
}

export function getGamesForSession(session: EventSession, selectedGames: EventGame[]): EventGame[] {
  const games: EventGame[] = [];
  if (session === 'first_half' || session === 'both') {
    const game = FIRST_HALF_GAMES.find((candidate) => selectedGames.includes(candidate));
    if (game) games.push(game);
  }
  if (session === 'second_half' || session === 'both') {
    const game = SECOND_HALF_GAMES.find((candidate) => selectedGames.includes(candidate));
    if (game) games.push(game);
  }
  return games;
}
