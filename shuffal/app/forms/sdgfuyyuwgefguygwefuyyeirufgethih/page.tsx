import { redirect } from 'next/navigation';
import { TECHNICAL_WORKSHOP_FEEDBACK_FORM_ID } from '@/lib/technical-workshop-feedback';

export default function TechnicalWorkshopFeedbackPage() {
  redirect(`/forms/${TECHNICAL_WORKSHOP_FEEDBACK_FORM_ID}`);
}
