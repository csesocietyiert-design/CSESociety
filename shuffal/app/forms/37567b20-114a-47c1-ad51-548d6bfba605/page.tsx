import type { Metadata } from 'next';
import EventRegistrationForm from '@/components/EventRegistrationForm';
import { EVENT_REGISTRATION } from '@/lib/event-registration';

export const metadata: Metadata = {
  title: `${EVENT_REGISTRATION.title} | CSE Society`,
  description: 'Register for the CSE Society E-Sports Swiss-League Tournament.',
  openGraph: {
    title: `${EVENT_REGISTRATION.title} | CSE Society`,
    description: 'Register for the CSE Society E-Sports Swiss-League Tournament.',
    type: 'website',
    images: [{ url: '/logo.png', width: 500, height: 382, alt: 'CSE Society logo' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${EVENT_REGISTRATION.title} | CSE Society`,
    description: 'Register for the CSE Society E-Sports Swiss-League Tournament.',
    images: ['/logo.png'],
  },
};

export default function SharedEventRegistrationPage() {
  return <EventRegistrationForm />;
}
