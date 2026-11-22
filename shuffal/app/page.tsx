import type { Metadata } from 'next';
import UniverseExperience from './digital-universe/UniverseExperience';

export const metadata: Metadata = {
  title: 'CSE Society | IERT Prayagraj',
  description: 'The official CSE Society portal at IERT Prayagraj for circulars, registrations and member access.',
};

export default function Home() {
  return (
    <UniverseExperience />
  );
}
