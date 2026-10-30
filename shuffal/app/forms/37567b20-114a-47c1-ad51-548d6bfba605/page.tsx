import type { Metadata } from 'next';
import EventRegistrationForm from '@/components/EventRegistrationForm';
import { EVENT_REGISTRATION } from '@/lib/event-registration';

export const metadata: Metadata = {
  title: `${EVENT_REGISTRATION.title} | CSE Society`,
  description: 'Register for the CSE Society E-Sports Swiss-League Tournament.',
};

export default function SharedEventRegistrationPage() {
  return <EventRegistrationForm />;
}
