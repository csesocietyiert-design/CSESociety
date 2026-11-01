import type { Metadata } from 'next';
import CircularPageHeader from '@/components/CircularPageHeader';
import RegistrationFormsPanel from '@/components/RegistrationFormsPanel';

export const metadata: Metadata = {
  title: 'Forms | CSE Society IERT',
  description: 'Browse registration forms and activities from the CSE Society, IERT Prayagraj.',
};

export default function FormsPage() {
  return (
    <>
      <CircularPageHeader
        title="Forms"
        description="Browse registration forms and activities from the CSE Society, IERT Prayagraj."
      />
      <RegistrationFormsPanel publicPage />
    </>
  );
}
