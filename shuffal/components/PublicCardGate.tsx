'use client';

import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';

declare global {
  interface Window {
    turnstile?: {
      render: (element: HTMLElement, options: { sitekey: string; callback: (token: string) => void; 'expired-callback': () => void; 'error-callback': () => void }) => string;
      reset: (widgetId?: string) => void;
    };
  }
}

interface PublicCardGateProps {
  cardUrl: string;
  societyId: string;
}

export default function PublicCardGate({ cardUrl, societyId }: PublicCardGateProps) {
  const [confirmed, setConfirmed] = useState(false);
  const [visible, setVisible] = useState(false);
  const [captchaToken, setCaptchaToken] = useState('');
  const [captchaError, setCaptchaError] = useState('');
  const [captchaReady, setCaptchaReady] = useState(false);
  const captchaElement = useRef<HTMLDivElement>(null);
  const captchaWidget = useRef<string | undefined>(undefined);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '';

  useEffect(() => {
    if (!siteKey || !captchaReady || !captchaElement.current || !window.turnstile || captchaWidget.current) return;
    captchaWidget.current = window.turnstile.render(captchaElement.current, {
      sitekey: siteKey,
      callback: setCaptchaToken,
      'expired-callback': () => setCaptchaToken(''),
      'error-callback': () => setCaptchaError('CAPTCHA could not be loaded. Please refresh and try again.'),
    });
  }, [captchaReady, siteKey]);

  const verifyAndShow = async () => {
    if (!confirmed || !captchaToken) return;
    setCaptchaError('');
    const response = await fetch('/api/public/id-card/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: captchaToken }),
    });
    const result = await response.json();
    if (!response.ok) {
      setCaptchaError(result.error || 'CAPTCHA verification failed. Please try again.');
      setCaptchaToken('');
      return;
    }
    setVisible(true);
  };

  return (
    <div className="w-full p-2 sm:p-5">
      {!visible ? (
        <div className="mx-auto max-w-lg rounded-2xl border border-slate-700/80 bg-slate-950/60 p-6 text-center shadow-inner sm:p-8">
          {siteKey && <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="afterInteractive" onLoad={() => setCaptchaReady(true)} />}
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-teal-300/30 bg-teal-300/10 text-2xl text-teal-200">✓</div>
          <h2 className="mt-5 text-xl font-bold text-white">Verify before viewing</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">Please confirm this is a genuine request to view the ID card for Society ID <span className="font-mono text-teal-300">{societyId}</span>.</p>
          <label className="mx-auto mt-6 flex max-w-sm cursor-pointer items-start gap-3 rounded-xl border border-slate-700 bg-slate-900/70 p-4 text-left transition hover:border-teal-400/60">
            <input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} className="mt-1 h-4 w-4 accent-teal-400" />
            <span className="text-sm leading-5 text-slate-300">I confirm that I am a human and I am requesting this card for a legitimate verification purpose.</span>
          </label>
          {siteKey ? <div ref={captchaElement} className="mt-5 flex min-h-[65px] justify-center" /> : <p className="mt-4 text-xs text-amber-300">CAPTCHA is not configured yet.</p>}
          {captchaError && <p className="mt-3 text-sm text-rose-300">{captchaError}</p>}
          <button type="button" onClick={() => void verifyAndShow()} disabled={!confirmed || !captchaToken} className="mt-6 w-full rounded-xl bg-gradient-to-r from-blue-600 to-teal-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-950/40 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40">
            View ID Card
          </button>
          <p className="mt-4 text-[11px] text-slate-500">Protected by Cloudflare Turnstile. Your confirmation only controls this viewing session.</p>
        </div>
      ) : (
        <>
          <div className="mx-auto aspect-[1.59/1] w-full max-w-4xl overflow-hidden rounded-xl border border-slate-700/80 bg-black/30 shadow-inner">
            <iframe src={toCardPreviewUrl(cardUrl)} title={`${societyId} CSE Society ID card`} className="h-full w-full border-0" loading="eager" allow="autoplay" />
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 px-1 text-[11px] text-slate-500">
            <span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />Verified Society ID</span>
            <a href={cardUrl} target="_blank" rel="noreferrer" className="rounded-lg border border-slate-700 bg-slate-800/70 px-3 py-1.5 font-medium text-slate-300 transition hover:border-teal-400/60 hover:text-white">Open full card</a>
          </div>
        </>
      )}
    </div>
  );
}

function toCardPreviewUrl(url: string) {
  const match = url.match(/\/file\/d\/([^/]+)/);
  return match ? `https://drive.google.com/file/d/${match[1]}/preview` : url;
}
