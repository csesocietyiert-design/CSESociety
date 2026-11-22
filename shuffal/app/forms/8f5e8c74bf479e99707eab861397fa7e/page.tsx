import type { Metadata } from 'next';
import TechnicalWorkshopFeedbackForm from '@/components/TechnicalWorkshopFeedbackForm';

export const metadata: Metadata = {
  title: 'Technical Workshop Feedback | CSE Society',
  description: 'Share verified CSE Society member feedback about the Technical Workshop.',
  openGraph: {
    title: 'Technical Workshop Feedback | CSE Society',
    description: 'Share your experience to help CSE Society improve future workshops.',
    type: 'website',
    images: [{ url: '/logo-compact.png', width: 302, height: 317, alt: 'CSE Society logo' }],
  },
  twitter: {
    card: 'summary',
    title: 'Technical Workshop Feedback | CSE Society',
    description: 'Share your experience to help CSE Society improve future workshops.',
    images: ['/logo-compact.png'],
  },
};

export default function TechnicalWorkshopFeedbackPage() {
  return <TechnicalWorkshopFeedbackForm />;
}
