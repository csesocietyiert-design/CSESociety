'use client';

import { useEffect, useRef, useState } from 'react';

interface FormOpenGateProps {
  formId: string;
  adminAccess: boolean;
  documentAccess: boolean;
}

export default function FormOpenGate({ formId, adminAccess, documentAccess }: FormOpenGateProps) {
  const [message, setMessage] = useState('Checking form availability...');
  const alerted = useRef(false);

  useEffect(() => {
    let active = true;
    const queryParams = new URLSearchParams();
    if (adminAccess) queryParams.set('admin', '1');
    if (documentAccess) queryParams.set('document', '1');
    const query = queryParams.size ? `?${queryParams.toString()}` : '';
    fetch(`/api/forms/${encodeURIComponent(formId)}/open${query}`, { cache: 'no-store' })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) {
          if (response.status === 410) {
            if (!alerted.current) {
              alerted.current = true;
              window.alert('Form closed');
            }
            throw new Error('This registration form is closed.');
          }
          if (response.status === 403) throw new Error('Only admins can open expired forms from the dashboard.');
          throw new Error(payload.error || 'Could not open this form.');
        }
        return payload as { resourceUrl: string };
      })
      .then(({ resourceUrl }) => {
        if (active) window.location.replace(resourceUrl);
      })
      .catch((openError: unknown) => {
        if (active) setMessage(openError instanceof Error ? openError.message : 'Could not open this form.');
      });
    return () => {
      active = false;
    };
  }, [adminAccess, documentAccess, formId]);

  return (
    <main className="flex min-h-[65vh] items-center justify-center px-5 text-center text-white">
      <div className="max-w-md rounded-2xl border border-slate-700 bg-slate-900/80 p-8 shadow-xl">
        <p className="text-sm text-slate-300">{message}</p>
        {message !== 'Checking form availability...' && (
          <a href="/forms" className="mt-5 inline-flex rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-200 transition hover:border-teal-400 hover:text-white">Back to forms</a>
        )}
      </div>
    </main>
  );
}
