import type { Metadata } from 'next';
import WorkshopRegistrationForm from '@/components/WorkshopRegistrationForm';
import { WORKSHOP_REGISTRATION } from '@/lib/workshop-registration';

export const metadata: Metadata = {
  title: `${WORKSHOP_REGISTRATION.title} | CSE Society`,
  description: 'Register for the Technical Workshop & Meetup organised by CSE Society IERT Prayagraj and Kanha Group, IIT Madras.',
};

export default function WorkshopRegistrationPage() {
  return <WorkshopRegistrationForm />;
}
