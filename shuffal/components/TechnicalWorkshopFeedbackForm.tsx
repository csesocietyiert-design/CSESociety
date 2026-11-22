'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, type FormEvent } from 'react';

interface VerifiedMember {
  societyId: string;
  name: string;
  maskedEmail: string;
}

interface FeedbackMessage {
  type: 'error' | 'success' | 'info';
  text: string;
}

const ratingQuestions = [
  ['overallRating', 'Overall workshop experience'],
  ['contentRating', 'Relevance and quality of the content'],
  ['speakerRating', 'Speaker and presentation'],
  ['organizationRating', 'Event organization'],
] as const;

type RatingField = (typeof ratingQuestions)[number][0];
type Ratings = Record<RatingField, number>;

const initialRatings: Ratings = {
  overallRating: 0,
  contentRating: 0,
  speakerRating: 0,
  organizationRating: 0,
};

export default function TechnicalWorkshopFeedbackForm() {
  const [societyId, setSocietyId] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [verificationToken, setVerificationToken] = useState('');
  const [member, setMember] = useState<VerifiedMember | null>(null);
  const [ratings, setRatings] = useState<Ratings>(initialRatings);
  const [highlight, setHighlight] = useState('');
  const [suggestions, setSuggestions] = useState('');
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [message, setMessage] = useState<FeedbackMessage | null>(null);

  const updateSocietyId = (value: string) => {
    setSocietyId(value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 7));
    setOtp('');
    setOtpSent(false);
    setVerificationToken('');
    setMember(null);
    setMessage(null);
  };

  const sendOtp = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch('/api/technical-workshop-feedback/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ societyId }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Could not send verification code.');
      setOtpSent(true);
      setMessage({ type: 'info', text: payload.message });
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Could not send verification code.' });
    } finally {
      setBusy(false);
    }
  };

  const verifyOtp = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch('/api/technical-workshop-feedback/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ societyId, code: otp }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Could not verify the code.');
      setVerificationToken(payload.verificationToken);
      setMember(payload.member);
      setMessage({ type: 'success', text: `Verified through ${payload.member.maskedEmail}.` });
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Could not verify the code.' });
    } finally {
      setBusy(false);
    }
  };

  const submitFeedback = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!member || !verificationToken) {
      setMessage({ type: 'error', text: 'Verify your CSE Society ID before submitting feedback.' });
      return;
    }
    if (Object.values(ratings).some((rating) => rating === 0)) {
      setMessage({ type: 'error', text: 'Please answer all rating questions.' });
      return;
    }

    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch('/api/technical-workshop-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          societyId: member.societyId,
          verificationToken,
          ...ratings,
          highlight,
          suggestions,
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Could not submit feedback.');
      setSubmitted(true);
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Could not submit feedback.' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="auth-page min-h-screen px-4 py-8 text-slate-100 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-3xl">
        <header className="auth-card rounded-2xl border p-6 text-center shadow-2xl shadow-black/20 sm:p-8">
          <Link href="/" aria-label="CSE Society home" className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-white/15 bg-slate-950/40 p-2 shadow-lg shadow-black/20">
            <Image src="/logo-compact.png" alt="CSE Society logo" width={302} height={317} className="h-full w-full object-contain" priority />
          </Link>
          <p className="mt-4 text-xs font-bold uppercase tracking-[0.2em] text-sky-300">CSE Society · IERT</p>
          <h1 className="mt-2 text-2xl font-extrabold sm:text-4xl">Technical Workshop Feedback</h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-300">
            Help CSE Society make future workshops better. This form is for verified CSE Society members.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2 text-xs font-medium text-slate-300">
            <span className="rounded-full border border-sky-300/20 bg-sky-300/5 px-3 py-1.5">24 November 2026</span>
            <span className="rounded-full border border-sky-300/20 bg-sky-300/5 px-3 py-1.5">CSE Society member verification required</span>
          </div>
        </header>

        {submitted ? (
          <section className="auth-card mt-6 rounded-2xl border p-7 text-center sm:p-10">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-400/10 text-2xl text-emerald-300" aria-hidden="true">✓</div>
            <p className="mt-4 text-xs font-bold uppercase tracking-[0.18em] text-emerald-300">Feedback received</p>
            <h2 className="mt-2 text-2xl font-bold text-white">Thank you, {member?.name}.</h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">Your feedback has been securely shared with CSE Society.</p>
            <Link href="/forms" className="mt-6 inline-flex min-h-11 items-center justify-center rounded-lg bg-sky-300 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-sky-200">Back to forms</Link>
          </section>
        ) : (
          <form onSubmit={submitFeedback} className="auth-card mt-6 space-y-6 rounded-2xl border p-5 shadow-2xl shadow-black/20 sm:p-8">
            <section className="rounded-xl border border-sky-300/15 bg-slate-950/20 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-sky-300">01 · Member verification</p>
                  <h2 className="mt-1 text-lg font-bold text-white">Verify your CSE Society ID</h2>
                </div>
                <span className="rounded-full border border-slate-600 px-3 py-1 text-xs text-slate-400">Email OTP</span>
              </div>

              {!verificationToken ? (
                <div className="mt-4 space-y-4">
                  <label className="block text-sm text-slate-300" htmlFor="society-id">7-character CSE Society ID
                    <input
                      id="society-id"
                      autoComplete="off"
                      value={societyId}
                      onChange={(event) => updateSocietyId(event.target.value)}
                      maxLength={7}
                      className="mt-2 min-h-12 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 font-mono uppercase tracking-wider text-white outline-none transition focus:border-sky-300"
                      placeholder="Example: CSE1234"
                      required
                    />
                  </label>
                  <button type="button" onClick={() => void sendOtp()} disabled={busy || societyId.length !== 7} className="min-h-11 rounded-lg border border-sky-300/40 bg-sky-300/10 px-4 py-2.5 text-sm font-bold text-sky-100 transition hover:bg-sky-300/20 disabled:cursor-not-allowed disabled:opacity-50">
                    {busy ? 'Please wait…' : otpSent ? 'Resend code' : 'Send email code'}
                  </button>
                  {otpSent && (
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                      <label className="flex-1 text-sm text-slate-300" htmlFor="verification-code">Six-digit email code
                        <input
                          id="verification-code"
                          type="text"
                          inputMode="numeric"
                          autoComplete="one-time-code"
                          pattern="[0-9]{6}"
                          maxLength={6}
                          value={otp}
                          onChange={(event) => setOtp(event.target.value.replace(/\D/g, ''))}
                          className="mt-2 min-h-12 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 font-mono tracking-[0.25em] text-white outline-none transition focus:border-sky-300"
                          placeholder="000000"
                          required
                        />
                      </label>
                      <button type="button" onClick={() => void verifyOtp()} disabled={busy || otp.length !== 6} className="min-h-12 rounded-lg bg-sky-300 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-sky-200 disabled:cursor-not-allowed disabled:opacity-50">
                        {busy ? 'Verifying…' : 'Verify ID'}
                      </button>
                    </div>
                  )}
                  <p className="text-xs leading-5 text-slate-400">A one-time code is sent only to the email address on your verified CSE Society account.</p>
                </div>
              ) : (
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-emerald-400/20 bg-emerald-400/5 p-4">
                  <div>
                    <p className="text-sm font-semibold text-emerald-200">Verified: {member?.name}</p>
                    <p className="mt-1 text-xs text-slate-400">{member?.societyId} · {member?.maskedEmail}</p>
                  </div>
                  <button type="button" onClick={() => updateSocietyId('')} className="text-sm text-slate-400 underline underline-offset-4 hover:text-white">Change ID</button>
                </div>
              )}
            </section>

            {verificationToken && (
              <>
                <section className="space-y-5">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-sky-300">02 · Rate the workshop</p>
                    <h2 className="mt-1 text-lg font-bold text-white">How was your experience?</h2>
                    <p className="mt-1 text-xs text-slate-400">Select one rating for each item. 1 = Needs improvement · 5 = Excellent</p>
                  </div>
                  {ratingQuestions.map(([field, label]) => (
                    <fieldset key={field} className="rounded-xl border border-white/10 bg-slate-950/20 p-4">
                      <legend className="px-1 text-sm font-medium text-slate-200">{label}</legend>
                      <div className="mt-2 grid grid-cols-5 gap-2">
                        {[1, 2, 3, 4, 5].map((value) => (
                          <label key={value} className={`flex min-h-12 cursor-pointer items-center justify-center rounded-lg border text-sm font-semibold transition ${ratings[field] === value ? 'border-sky-300 bg-sky-300/15 text-sky-100' : 'border-slate-700 bg-slate-950/50 text-slate-400 hover:border-slate-500'}`}>
                            <input
                              className="sr-only"
                              type="radio"
                              name={field}
                              value={value}
                              checked={ratings[field] === value}
                              onChange={() => setRatings((current) => ({ ...current, [field]: value }))}
                              required
                            />
                            <span>{value}</span>
                          </label>
                        ))}
                      </div>
                    </fieldset>
                  ))}
                </section>

                <section className="space-y-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-sky-300">03 · Your thoughts</p>
                    <h2 className="mt-1 text-lg font-bold text-white">Share what stood out</h2>
                  </div>
                  <label className="block text-sm text-slate-300" htmlFor="highlight">What was the most useful part of the workshop?
                    <textarea
                      id="highlight"
                      value={highlight}
                      onChange={(event) => setHighlight(event.target.value)}
                      maxLength={600}
                      rows={3}
                      required
                      className="mt-2 w-full resize-y rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-sky-300"
                      placeholder="Tell us what you learned or enjoyed…"
                    />
                    <span className="mt-1 block text-right text-xs text-slate-500">{highlight.length}/600</span>
                  </label>
                  <label className="block text-sm text-slate-300" htmlFor="suggestions">What could we improve next time? <span className="text-slate-500">(optional)</span>
                    <textarea
                      id="suggestions"
                      value={suggestions}
                      onChange={(event) => setSuggestions(event.target.value)}
                      maxLength={1500}
                      rows={3}
                      className="mt-2 w-full resize-y rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-sky-300"
                      placeholder="Your suggestions help CSE Society plan better workshops…"
                    />
                    <span className="mt-1 block text-right text-xs text-slate-500">{suggestions.length}/1500</span>
                  </label>
                </section>

                <button type="submit" disabled={busy} className="min-h-12 w-full rounded-lg bg-sky-300 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-sky-200 disabled:cursor-not-allowed disabled:opacity-50">
                  {busy ? 'Submitting feedback…' : 'Submit feedback to CSE Society'}
                </button>
              </>
            )}

            {message && (
              <p role={message.type === 'error' ? 'alert' : 'status'} className={`rounded-lg border px-4 py-3 text-sm ${message.type === 'error' ? 'border-rose-400/30 bg-rose-950/30 text-rose-200' : message.type === 'success' ? 'border-emerald-400/30 bg-emerald-950/20 text-emerald-200' : 'border-sky-300/20 bg-sky-300/5 text-sky-100'}`}>
                {message.text}
              </p>
            )}
          </form>
        )}

        <div className="mt-5 text-center">
          <Link href="/forms" className="text-sm text-slate-400 underline decoration-slate-600 underline-offset-4 transition hover:text-white">Back to Forms</Link>
        </div>
      </div>
    </main>
  );
}
