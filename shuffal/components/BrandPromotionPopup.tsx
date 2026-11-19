'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { WORKSHOP_REGISTRATION } from '@/lib/workshop-registration';
import styles from './BrandPromotionPopup.module.css';

export default function BrandPromotionPopup() {
  const [isOpen, setIsOpen] = useState(true);
  const timer = useRef<number | null>(null);
  const formHref = `/forms/${WORKSHOP_REGISTRATION.publicFormId}`;
  const formUrl = `${(process.env.NEXT_PUBLIC_APP_URL || 'https://csesociety.iert.ac.in').replace(/\/$/, '')}${formHref}`;

  useEffect(() => {
    timer.current = window.setTimeout(() => setIsOpen(false), 7000);
    return () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    };
  }, []);

  const keepOpen = () => {
    if (timer.current !== null) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
  };

  const dismiss = () => {
    keepOpen();
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <aside
      aria-label="Workshop collaboration and sponsor promotion"
      className={`${styles.popup} fixed bottom-20 left-1/2 z-[60] w-[calc(100vw-2rem)] max-w-sm -translate-x-1/2 overflow-hidden rounded-2xl border border-sky-300/25 bg-slate-950/95 text-white shadow-2xl shadow-black/50 backdrop-blur-xl sm:bottom-6 sm:left-auto sm:right-6 sm:translate-x-0`}
      onPointerEnter={keepOpen}
      onPointerDown={keepOpen}
      onFocusCapture={keepOpen}
    >
      <div className="flex items-start justify-between gap-3 border-b border-white/10 bg-gradient-to-r from-sky-400/10 via-teal-400/5 to-amber-300/10 px-4 py-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-sky-200">In collaboration with</p>
          <h2 className="mt-1 text-sm font-bold">IERT CSE Society × IIT Madras Kanha House</h2>
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Close promotion"
          className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-white/15 text-slate-300 transition hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-300"
        >
          <span aria-hidden="true" className="text-xl leading-none">×</span>
        </button>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <div className="flex h-20 min-w-0 items-center justify-center rounded-xl border border-white/10 bg-slate-900/80 p-2">
            <Image
              src="/workshop-partners/collaboration-logo.png"
              alt="IERT CSE Society and IIT Madras Kanha House collaboration"
              width={640}
              height={640}
              className="h-full w-full object-contain"
            />
          </div>
          <span aria-hidden="true" className="text-lg font-light text-slate-500">+</span>
          <div className="flex h-20 min-w-0 items-center justify-center rounded-xl border border-amber-200/20 bg-slate-900/80 p-2">
            <Image
              src="/workshop-partners/anjaan-musafir.png"
              alt="Anjaan Musafir logo"
              width={797}
              height={749}
              className="h-full w-full object-contain"
            />
          </div>
        </div>
        <p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-amber-200">Sponsored by Anjaan Musafir</p>
        <h3 className="mt-1 text-lg font-bold">Technical Workshop &amp; Meetup</h3>
        <p className="mt-1 text-xs leading-5 text-slate-400">24 November 2026 · Register through the CSE Society form.</p>
        <p className="mt-3 text-[11px] font-semibold text-slate-400">Form link</p>
        <Link href={formHref} onClick={dismiss} className="mt-1 block break-all text-xs text-teal-200 underline decoration-teal-400/50 underline-offset-2 hover:text-teal-100">
          {formUrl}
        </Link>
        <Link
          href={formHref}
          onClick={dismiss}
          className="mt-4 inline-flex min-h-10 w-full items-center justify-center rounded-lg bg-teal-300 px-4 py-2 text-sm font-bold text-slate-950 transition hover:bg-teal-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-300"
        >
          Open registration form
        </Link>
      </div>
    </aside>
  );
}
