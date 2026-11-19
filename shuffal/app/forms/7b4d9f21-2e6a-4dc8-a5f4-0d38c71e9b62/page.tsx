import type { Metadata } from 'next';
import WorkshopRegistrationForm from '@/components/WorkshopRegistrationForm';
import { WORKSHOP_REGISTRATION } from '@/lib/workshop-registration';

export const metadata: Metadata = {
  title: `${WORKSHOP_REGISTRATION.title} | CSE Society`,
  description: 'Register for the Technical Workshop & Meetup organised by CSE Society IERT Prayagraj and Kanha Group, IIT Madras.',
  openGraph: {
    title: `${WORKSHOP_REGISTRATION.title} | CSE Society`,
    description: 'Register for the Technical Workshop & Meetup organised by CSE Society IERT Prayagraj and Kanha Group, IIT Madras.',
    type: 'website',
    images: [{ url: '/workshop-partners/collaboration-logo.png', width: 640, height: 640, alt: 'CSE Society IERT and IIT Madras Kanha House collaboration' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${WORKSHOP_REGISTRATION.title} | CSE Society`,
    description: 'Register for the Technical Workshop & Meetup organised by CSE Society IERT Prayagraj and Kanha Group, IIT Madras.',
    images: ['/workshop-partners/collaboration-logo.png'],
  },
};

export default function WorkshopRegistrationPage() {
  return <WorkshopRegistrationForm />;
}
