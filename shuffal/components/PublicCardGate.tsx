'use client';

import { useState } from 'react';

interface PublicCardGateProps {
  cardUrl: string;
  societyId: string;
}

export default function PublicCardGate({ cardUrl, societyId }: PublicCardGateProps) {
  const [confirmed, setConfirmed] = useState(false);
  const [visible, setVisible] = useState(false);

  const showCard = () => {
    if (confirmed) setVisible(true);
  };

  return (
    <div className="w-full p-2 sm:p-5">
      {!visible ? (
        <div className="mx-auto max-w-lg rounded-2xl border border-slate-700/80 bg-slate-950/60 p-6 text-center shadow-inner sm:p-8">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-teal-300/30 bg-teal-300/10 text-2xl text-teal-200">✓</div>
          <h2 className="mt-5 text-xl font-bold text-white">Confirm before viewing</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">Please confirm this is a genuine request to view the ID card for Society ID <span className="font-mono text-teal-300">{societyId}</span>.</p>
          <label className="mx-auto mt-6 flex max-w-sm cursor-pointer items-start gap-3 rounded-xl border border-slate-700 bg-slate-900/70 p-4 text-left transition hover:border-teal-400/60">
            <input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} className="mt-1 h-4 w-4 accent-teal-400" />
            <span className="text-sm leading-5 text-slate-300">I confirm that I am requesting this card for a legitimate verification purpose.</span>
          </label>
          <button type="button" onClick={showCard} disabled={!confirmed} className="mt-6 w-full rounded-xl bg-gradient-to-r from-blue-600 to-teal-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-950/40 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40">
            View ID Card
          </button>
          <p className="mt-4 text-[11px] text-slate-500">Your confirmation only controls this viewing session.</p>
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
