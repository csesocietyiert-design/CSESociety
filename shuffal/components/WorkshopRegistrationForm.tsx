'use client';

import Link from 'next/link';
import Image from 'next/image';
import { FormEvent, useEffect, useState } from 'react';
import {
  isWorkshopRegistrationOpen,
  WORKSHOP_REGISTRATION,
  type WorkshopCategory,
  type WorkshopJoinChance,
} from '@/lib/workshop-registration';

const TERMS = [
 'College Property: Participants must not damage, break, or misuse college property, furniture, equipment, computers, or infrastructure.',
 'Damage Responsibility: Any damage caused intentionally or through negligence will be the participant’s responsibility.',
 'Discipline: Participants must maintain discipline and respectful behaviour throughout the event.',
 'College Rules: External participants must follow all IERT and CSE Society rules and instructions.',
 'Restricted Areas: Participants may not enter restricted areas, laboratories, or classrooms without permission.',
 'Identification: Participants must carry a valid college ID card or government-approved identity document.',
 'Security: Participants must not engage in arguments, harassment, misbehaviour, or disruptive activity.',
 'Equipment Usage: Computers and other resources may only be used with permission.',
 'Personal Belongings: Participants are responsible for their belongings. The organising team is not responsible for loss or theft.',
 'Photography & Recording: Photography and recording must follow event instructions and college policies.',
 'Removal from Event: Serious misconduct may be reported to college authorities and the participant may be removed.',
 'Final Authority: Discipline and participation decisions are subject to concerned college authority approval.',
] as const;

export default function WorkshopRegistrationForm() {
  const [isOpen, setIsOpen] = useState<boolean | null>(null);
  const [category, setCategory] = useState<WorkshopCategory | null>(null);
  const [societyId, setSocietyId] = useState('');
  const [iertEmail, setIertEmail] = useState('');
  const [iitRollNumber, setIitRollNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [verificationToken, setVerificationToken] = useState('');
  const [verifiedName, setVerifiedName] = useState('');
  const [fullName, setFullName] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [branch, setBranch] = useState('');
  const [year, setYear] = useState('');
  const [aktuRollNumber, setAktuRollNumber] = useState('');
  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [joinChance, setJoinChance] = useState<WorkshopJoinChance | ''>('');
  const [suggestion, setSuggestion] = useState('');
  const [rulesAccepted, setRulesAccepted] = useState(false);
  const [declarationAccepted, setDeclarationAccepted] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success' | 'info'; text: string } | null>(null);
  const [registeredId, setRegisteredId] = useState('');

  useEffect(() => {
    const update = () => setIsOpen(isWorkshopRegistrationOpen());
    update();
    const timer = window.setInterval(update, 15_000);
    return () => window.clearInterval(timer);
  }, []);

  const resetVerification = () => {
    setOtp('');
    setOtpSent(false);
    setVerificationToken('');
    setVerifiedName('');
    setFullName('');
    setMaskedEmail('');
    setBranch('');
    setYear('');
    setWhatsappPhone('');
    setMessage(null);
  };

  const sendOtp = async () => {
    if (!category) return;
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch('/api/workshop-registration/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          societyId: societyId.trim().toUpperCase(),
          iertEmail: iertEmail.trim().toLowerCase(),
          iitRollNumber: iitRollNumber.trim().toUpperCase(),
        }),
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
    if (!category) return;
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch('/api/workshop-registration/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          societyId: societyId.trim().toUpperCase(),
          iertEmail: iertEmail.trim().toLowerCase(),
          iitRollNumber: iitRollNumber.trim().toUpperCase(),
          code: otp,
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Could not verify the code.');
      setVerificationToken(payload.verificationToken);
      setVerifiedName(payload.identity.name || '');
      setFullName(payload.identity.name || '');
      setMaskedEmail(payload.identity.maskedEmail);
      setBranch(payload.identity.department || '');
      setYear(payload.identity.year ? String(payload.identity.year) : '');
      setWhatsappPhone(payload.identity.phone || '');
      setMessage({ type: 'success', text: `Verified through ${payload.identity.maskedEmail}.` });
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Could not verify the code.' });
    } finally {
      setBusy(false);
    }
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!category || !verificationToken) {
      setMessage({ type: 'error', text: 'Verify your email before submitting.' });
      return;
    }
    if (!rulesAccepted || (category === 'iit_madras' && !declarationAccepted)) {
      setMessage({ type: 'error', text: 'Accept the declaration and/or terms before submitting.' });
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch('/api/workshop-registration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          societyId,
          iertEmail,
          iitRollNumber,
          verificationToken,
          fullName,
          branch,
          year: year ? Number(year) : null,
          aktuRollNumber,
          whatsappPhone,
          transactionId,
          joinChance,
          suggestion,
          rulesAccepted,
          declarationAccepted,
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Could not submit registration.');
      setRegisteredId(payload.registrationId);
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Could not submit registration.' });
    } finally {
      setBusy(false);
    }
  };

  if (registeredId) {
    return (
      <main className="auth-page min-h-screen px-5 py-12 text-white">
        <section className="auth-card mx-auto max-w-xl rounded-2xl border p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15 text-2xl text-emerald-300">✓</div>
          <p className="mt-4 text-xs font-bold uppercase tracking-[0.2em] text-teal-300">Thank you</p>
          <h1 className="mt-3 text-2xl font-bold">Thank you from CSE Society</h1>
          <p className="mt-4 text-sm text-slate-300">Reference: <strong className="text-white">{registeredId}</strong></p>
          <p className="mt-4 text-sm leading-6 text-slate-300">Please bring your ID card and report at 8:30 AM on 24 November.</p>
          <p className="mt-3 text-sm leading-6 text-slate-300">For any doubt, connect with the core team CSE at <a href="mailto:csesociety.iert@gmail.com" className="text-teal-300 underline">csesociety.iert@gmail.com</a> or <a href="tel:+918273993303" className="text-teal-300 underline">+91 8273993303</a>.</p>
          <Link href="/forms" className="mt-6 inline-flex rounded-lg bg-teal-400 px-5 py-3 text-sm font-bold text-slate-950">Back to forms</Link>
        </section>
      </main>
    );
  }

  return (
    <main className="auth-page relative min-h-screen overflow-hidden px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="auth-card relative z-10 rounded-2xl border p-6 text-center sm:p-8">
          <div className="mx-auto grid max-w-xl grid-cols-3 items-center gap-3 sm:gap-5">
            <div className="flex h-20 items-center justify-center sm:h-24">
              <Image src="/logo.png" alt="CSE Society IERT logo" width={96} height={96} className="h-16 w-16 object-contain sm:h-20 sm:w-20" priority />
            </div>
            <div className="flex h-20 items-center justify-center rounded-xl border border-white/10 bg-white p-1.5 sm:h-24">
              <Image src="/workshop-partners/collaboration-logo.jpg" alt="Collaboration between IERT CSE Society and IIT Madras Kanha House" width={200} height={128} className="h-full w-full object-contain" priority />
            </div>
            <div className="flex h-20 items-center justify-center rounded-xl border border-white/10 bg-white p-1.5 sm:h-24">
              <Image src="/workshop-partners/anjaan-musafir.jpg" alt="Anjaan Musafir, sponsored company" width={200} height={128} className="h-full w-full object-contain" priority />
            </div>
          </div>
          <p className="mt-3 text-xs font-bold uppercase tracking-[0.18em] text-sky-300">CSE Society · IERT</p>
          <h1 className="mt-2 text-2xl font-extrabold sm:text-4xl">{WORKSHOP_REGISTRATION.title}</h1>
          <p className="mt-2 text-sm text-slate-300">{WORKSHOP_REGISTRATION.organisers}</p>
          <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-sky-200">Collaboration · IERT CSE Society × IIT Madras Kanha House</p>
          <p className="mt-1 text-sm text-amber-200">Sponsored by {WORKSHOP_REGISTRATION.sponsor}</p>
          <div className="mt-5 grid gap-3 text-sm sm:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-slate-950/30 p-4"><strong className="text-white">Level</strong><br />{WORKSHOP_REGISTRATION.level}</div>
            <div className="rounded-xl border border-white/10 bg-slate-950/30 p-4"><strong className="text-white">24 November 2026</strong><br />Reporting 8:30 AM · Start 9:00 AM</div>
            <div className="rounded-xl border border-white/10 bg-slate-950/30 p-4"><strong className="text-white">Venue</strong><br />{WORKSHOP_REGISTRATION.venue}</div>
          </div>
          <p className="mt-4 text-xs text-slate-400">Web 2 and Web 3 · No prerequisites required</p>
        </header>

        {isOpen === null ? (
          <section className="auth-card rounded-2xl border p-8 text-center text-slate-400">Checking registration availability…</section>
        ) : !isOpen ? (
          <section className="auth-card rounded-2xl border p-8 text-center">
            <h2 className="text-xl font-bold">Registration is closed</h2>
            <p className="mt-2 text-slate-400">Registration closed at 8:30 AM IST on 24 November 2026.</p>
          </section>
        ) : (
          <form onSubmit={submit} className="auth-card relative z-10 space-y-6 rounded-2xl border p-5 sm:p-7">
            <section>
              <h2 className="text-lg font-bold">01 · Participant category</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {([
                  ['society', 'CSE Society Member', 'Verify Society ID'],
                  ['iert', 'IERT Participant', 'Verify IERT email'],
                  ['iit_madras', 'IIT Madras Participant', 'Verify IIT Madras roll'],
                ] as const).map(([value, title, detail]) => (
                  <button key={value} type="button" onClick={() => { setCategory(value); resetVerification(); }} className={`rounded-xl border p-4 text-left ${category === value ? 'border-teal-300 bg-teal-400/10' : 'border-slate-700 bg-slate-950/20'}`}>
                    <span className="block font-semibold">{title}</span>
                    <span className="mt-1 block text-xs text-slate-400">{detail}</span>
                  </button>
                ))}
              </div>
            </section>

            {category && (
              <section className="rounded-xl border border-teal-500/20 bg-teal-950/10 p-5">
                <h2 className="text-lg font-bold">02 · Verify identity</h2>
                {!verificationToken ? (
                  <div className="mt-4 space-y-4">
                    {category === 'society' && (
                      <label className="block text-sm text-slate-300">7-digit / alphanumeric Society ID
                        <input required autoComplete="off" value={societyId} onChange={(event) => { setSocietyId(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 7)); resetVerification(); }} className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-teal-400" placeholder="Example: CSE1234" />
                      </label>
                    )}
                    {category === 'iert' && (
                      <label className="block text-sm text-slate-300">IERT email address *
                        <input required type="email" value={iertEmail} onChange={(event) => { setIertEmail(event.target.value); resetVerification(); }} className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-teal-400" placeholder="yourname@example.com" />
                      </label>
                    )}
                    {category === 'iit_madras' && (
                      <label className="block text-sm text-slate-300">IIT Madras roll number
                        <input required value={iitRollNumber} onChange={(event) => { setIitRollNumber(event.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 30)); resetVerification(); }} className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-teal-400" placeholder="Roll number" />
                        {iitRollNumber && <span className="mt-2 block text-xs text-slate-400">OTP email: {iitRollNumber.toLowerCase()}@ds.study.iitm.ac.in</span>}
                      </label>
                    )}
                    <button disabled={busy} type="button" onClick={() => void sendOtp()} className="rounded-lg border border-teal-400/50 px-4 py-3 text-sm font-bold text-teal-200 disabled:opacity-50">{busy ? 'Sending…' : 'Send OTP'}</button>
                    <p className="text-xs leading-5 text-slate-400">If you don’t receive the OTP, check your spam or junk folder or contact the core team.</p>
                    {otpSent && (
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                        <label className="flex-1 text-sm text-slate-300">Six-digit OTP *
                          <input required inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, ''))} className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-teal-400" />
                        </label>
                        <button disabled={busy} type="button" onClick={() => void verifyOtp()} className="rounded-lg bg-teal-400 px-5 py-3 text-sm font-bold text-slate-950 disabled:opacity-50">{busy ? 'Verifying…' : 'Verify OTP'}</button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-emerald-200">Verified: {verifiedName || 'Participant'} · {maskedEmail}</p>
                    <button type="button" onClick={resetVerification} className="text-sm text-slate-400 underline">Change identity</button>
                  </div>
                )}
              </section>
            )}

            {category && verificationToken && (
              <section className="space-y-5">
                <h2 className="text-lg font-bold">{category === 'society' ? '03' : '03'} · Registration details</h2>
                {category === 'society' && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-lg border border-slate-700 bg-slate-950/40 px-4 py-3 text-sm"><span className="text-slate-400">Full name</span><p className="mt-1 font-semibold">{fullName}</p></div>
                    <div className="rounded-lg border border-slate-700 bg-slate-950/40 px-4 py-3 text-sm"><span className="text-slate-400">Email</span><p className="mt-1 break-all font-semibold">{maskedEmail}</p></div>
                    {branch ? (
                      <div className="rounded-lg border border-slate-700 bg-slate-950/40 px-4 py-3 text-sm"><span className="text-slate-400">Department</span><p className="mt-1 font-semibold">{branch}</p></div>
                    ) : (
                      <label className="text-sm text-slate-300">Department *
                        <input required value={branch} onChange={(event) => setBranch(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white" />
                      </label>
                    )}
                    {year ? (
                      <div className="rounded-lg border border-slate-700 bg-slate-950/40 px-4 py-3 text-sm"><span className="text-slate-400">Year</span><p className="mt-1 font-semibold">Year {year}</p></div>
                    ) : (
                      <label className="text-sm text-slate-300">Year *
                        <select required value={year} onChange={(event) => setYear(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white">
                          <option value="">Select year</option><option value="1">1st year</option><option value="2">2nd year</option><option value="3">3rd year</option><option value="4">4th year</option>
                        </select>
                      </label>
                    )}
                    {whatsappPhone ? (
                      <div className="rounded-lg border border-slate-700 bg-slate-950/40 px-4 py-3 text-sm"><span className="text-slate-400">WhatsApp number</span><p className="mt-1 font-semibold">{whatsappPhone}</p></div>
                    ) : (
                      <label className="text-sm text-slate-300">WhatsApp number *
                        <input required type="tel" autoComplete="tel" value={whatsappPhone} onChange={(event) => setWhatsappPhone(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white" />
                      </label>
                    )}
                    <div className="rounded-lg border border-slate-700 bg-slate-950/40 px-4 py-3 text-sm"><span className="text-slate-400">Workshop level</span><p className="mt-1 font-semibold">Beginner</p></div>
                  </div>
                )}

                {category === 'iert' && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="text-sm text-slate-300">Full name *
                      <input required value={fullName} onChange={(event) => setFullName(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white" />
                    </label>
                    <label className="text-sm text-slate-300">AKTU roll number{year === '1' ? ' (optional for 1st year)' : ' *'}
                      <input required={year !== '1'} value={aktuRollNumber} onChange={(event) => setAktuRollNumber(event.target.value.toUpperCase())} className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white" />
                    </label>
                    <label className="text-sm text-slate-300">Branch *
                      <select required value={branch} onChange={(event) => setBranch(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white">
                        <option value="">Select branch</option>
                        <option value="CSE">CSE</option><option value="IC">IC</option><option value="IP">IP</option><option value="Electrical">Electrical</option><option value="Mechanical">Mechanical</option><option value="ECE">ECE</option><option value="Civil">Civil</option>
                      </select>
                    </label>
                    <label className="text-sm text-slate-300">Year *
                      <select required value={year} onChange={(event) => setYear(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white">
                        <option value="">Select year</option><option value="1">1st year</option><option value="2">2nd year</option><option value="3">3rd year</option><option value="4">4th year</option>
                      </select>
                    </label>
                    <label className="text-sm text-slate-300">WhatsApp number *
                      <input required type="tel" autoComplete="tel" value={whatsappPhone} onChange={(event) => setWhatsappPhone(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white" />
                    </label>
                    <label className="text-sm text-slate-300">Payment transaction ID *
                      <input required value={transactionId} onChange={(event) => setTransactionId(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white" />
                    </label>
                    <div className="sm:col-span-2 rounded-xl border border-amber-400/30 bg-amber-400/10 p-4 text-center text-sm">
                      <p className="font-bold text-amber-200">Pay ₹149 using this UPI QR</p>
                      <Image
                        src="/workshop-registration/iert-payment-qr.png"
                        alt="UPI payment QR for the IERT workshop registration fee of 149 rupees"
                        width={405}
                        height={516}
                        className="mx-auto mt-3 w-full max-w-[320px] rounded-lg"
                      />
                      <p className="mt-3 text-slate-200">UPI ID: <strong>vbht2006@okicici</strong></p>
                      <p className="mt-1 text-slate-300">Complete payment, then enter the transaction ID above. All IERT participant details are required.</p>
                    </div>
                  </div>
                )}

                {category === 'iit_madras' && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="text-sm text-slate-300">Full name
                      <input required value={fullName} onChange={(event) => setFullName(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white" />
                    </label>
                    <label className="text-sm text-slate-300">WhatsApp number
                      <input required type="tel" value={whatsappPhone} onChange={(event) => setWhatsappPhone(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white" />
                    </label>
                    <fieldset className="sm:col-span-2">
                      <legend className="text-sm text-slate-300">Chance to join the meetup</legend>
                      <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
                        {WORKSHOP_REGISTRATION.joinChoices.map((choice) => (
                          <button key={choice} type="button" onClick={() => setJoinChance(choice)} className={`rounded-lg border px-3 py-3 text-sm ${joinChance === choice ? 'border-teal-300 bg-teal-400/10 text-teal-200' : 'border-slate-700 bg-slate-950/30'}`}>{choice}</button>
                        ))}
                      </div>
                    </fieldset>
                    <label className="sm:col-span-2 text-sm text-slate-300">Suggestions
                      <textarea rows={4} value={suggestion} onChange={(event) => setSuggestion(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white" placeholder="Anything you would like to suggest?" />
                    </label>
                  </div>
                )}

                {category === 'iit_madras' && (
                  <label className="flex items-start gap-3 rounded-xl border border-slate-700 bg-slate-950/30 p-4 text-sm text-slate-200">
                    <input required type="checkbox" checked={declarationAccepted} onChange={(event) => setDeclarationAccepted(event.target.checked)} className="mt-1" />
                    <span>I confirm that I will attend the event properly and will bring my college ID card or a government-approved identity document.</span>
                  </label>
                )}

                {category === 'iit_madras' && (
                  <fieldset className="rounded-xl border border-slate-700 bg-slate-950/30 p-4">
                    <legend className="px-2 text-sm font-bold text-white">Terms & Conditions for External College Participants</legend>
                    <ol className="max-h-64 space-y-2 overflow-y-auto pr-2 text-xs leading-5 text-slate-300">
                      {TERMS.map((term, index) => <li key={term}><strong>{index + 1}.</strong> {term}</li>)}
                    </ol>
                  </fieldset>
                )}

                <label className="flex items-start gap-3 rounded-xl border border-slate-700 bg-slate-950/30 p-4 text-sm text-slate-200">
                  <input required type="checkbox" checked={rulesAccepted} onChange={(event) => setRulesAccepted(event.target.checked)} className="mt-1" />
                  <span>I accept the workshop rules and confirm that the submitted information is accurate. *</span>
                </label>

                {message && <p className={`rounded-lg border px-4 py-3 text-sm ${message.type === 'error' ? 'border-rose-500/30 bg-rose-500/10 text-rose-200' : 'border-teal-500/30 bg-teal-500/10 text-teal-200'}`}>{message.text}</p>}
                <button disabled={busy} type="submit" className="w-full rounded-lg bg-teal-400 px-5 py-3 text-sm font-bold text-slate-950 hover:bg-teal-300 disabled:opacity-50">{busy ? 'Submitting…' : 'Submit registration'}</button>
              </section>
            )}
            {category && !verificationToken && message && <p className={`rounded-lg border px-4 py-3 text-sm ${message.type === 'error' ? 'border-rose-500/30 bg-rose-500/10 text-rose-200' : 'border-teal-500/30 bg-teal-500/10 text-teal-200'}`}>{message.text}</p>}
          </form>
        )}
      </div>
    </main>
  );
}
