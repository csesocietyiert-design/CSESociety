'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  EVENT_REGISTRATION,
  getEventFee,
  getGamesForSession,
  isEventRegistrationOpen,
  type EventGame,
  type EventParticipantType,
  type EventSession,
} from '@/lib/event-registration';

type MemberDetails = {
  societyId: string;
  name: string;
  email: string;
  maskedEmail: string;
  phone: string;
  department: string;
  year: number;
};

type NonMemberDetails = {
  name: string;
  collegeRollNumber: string;
  department: string;
  year: string;
  phone: string;
  email: string;
};

type GameIdentity = {
  bgmiIgn: string;
  bgmiUid: string;
  freeFireIgn: string;
  freeFireUid: string;
  chessUsername: string;
};

type PublicMessage = { type: 'error' | 'success' | 'info'; text: string };

const initialNonMember: NonMemberDetails = {
  name: '',
  collegeRollNumber: '',
  department: '',
  year: '',
  phone: '',
  email: '',
};
const initialIdentity: GameIdentity = {
  bgmiIgn: '',
  bgmiUid: '',
  freeFireIgn: '',
  freeFireUid: '',
  chessUsername: '',
};
const firstHalfGames: EventGame[] = ['BGMI', 'Free Fire', 'Table Tennis'];

function hasValidWhatsappNumber(phone: string): boolean {
  return /^\+?[0-9 ()-]{8,25}$/.test(phone.trim());
}

export default function EventRegistrationForm() {
  const [isOpen, setIsOpen] = useState<boolean | null>(null);
  const [participantType, setParticipantType] = useState<EventParticipantType | null>(null);
  const [societyId, setSocietyId] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [member, setMember] = useState<MemberDetails | null>(null);
  const [verificationToken, setVerificationToken] = useState('');
  const [memberWhatsapp, setMemberWhatsapp] = useState('');
  const [nonMember, setNonMember] = useState(initialNonMember);
  const [session, setSession] = useState<EventSession | ''>('');
  const [games, setGames] = useState<EventGame[]>([]);
  const [teamFormat, setTeamFormat] = useState<'solo' | 'duo'>('solo');
  const [teamName, setTeamName] = useState('');
  const [identity, setIdentity] = useState(initialIdentity);
  const [deliveryMethod, setDeliveryMethod] = useState<'email' | 'whatsapp'>('email');
  const [transactionId, setTransactionId] = useState('');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState('');
  const screenshotPreviewUrl = useRef<string | null>(null);
  const [rulesAccepted, setRulesAccepted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [busyOtp, setBusyOtp] = useState(false);
  const [message, setMessage] = useState<PublicMessage | null>(null);
  const [registered, setRegistered] = useState<{ id: string; member: boolean } | null>(null);

  useEffect(() => {
    const updateOpen = () => setIsOpen(isEventRegistrationOpen());
    updateOpen();
    const timer = window.setInterval(updateOpen, 15_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => () => {
    if (screenshotPreviewUrl.current) URL.revokeObjectURL(screenshotPreviewUrl.current);
  }, []);

  const isMember = participantType === 'member';
  const hasFirstHalf = session === 'first_half' || session === 'both';
  const fee = useMemo(
    () => (participantType && session ? getEventFee(participantType, session) : 0),
    [participantType, session],
  );
  const selectedGames = session ? getGamesForSession(session, games) : [];
  const registrationEmail = isMember ? member?.email || '' : nonMember.email;
  const registrationPhone = isMember
    ? (hasValidWhatsappNumber(member?.phone || '') ? member?.phone || '' : memberWhatsapp)
    : nonMember.phone;
  const hasWhatsappNumber = hasValidWhatsappNumber(registrationPhone);

  const updateNonMember = (key: keyof NonMemberDetails, value: string) => {
    setNonMember((current) => ({ ...current, [key]: value }));
  };

  const updateIdentity = (key: keyof GameIdentity, value: string) => {
    setIdentity((current) => ({ ...current, [key]: value }));
  };

  const chooseSession = (value: EventSession) => {
    setSession(value);
    if (value === 'second_half') setGames([]);
  };

  const sendOtp = async () => {
    if (!/^[A-Za-z0-9-]{3,20}$/.test(societyId.trim())) {
      setMessage({ type: 'error', text: 'Enter a valid Society ID.' });
      return;
    }
    setBusyOtp(true);
    setMessage(null);
    try {
      const response = await fetch('/api/event-registration/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ societyId }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Could not send verification code.');
      setOtpSent(true);
      setMessage({ type: 'info', text: payload.message || 'If this ID is verified, a code was sent to its registered email.' });
    } catch (sendError) {
      setMessage({ type: 'error', text: sendError instanceof Error ? sendError.message : 'Could not send verification code.' });
    } finally {
      setBusyOtp(false);
    }
  };

  const verifyOtp = async () => {
    if (!/^\d{6}$/.test(otp)) {
      setMessage({ type: 'error', text: 'Enter the six-digit email code.' });
      return;
    }
    setBusyOtp(true);
    setMessage(null);
    try {
      const response = await fetch('/api/event-registration/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ societyId, code: otp }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Could not verify the code.');
      setMember(payload.member);
      setVerificationToken(payload.verificationToken);
      setMemberWhatsapp('');
      setDeliveryMethod(hasValidWhatsappNumber(payload.member.phone) ? 'whatsapp' : 'email');
      setMessage({ type: 'success', text: `Society ID verified. Code sent to ${payload.member.maskedEmail}.` });
    } catch (verifyError) {
      setMessage({ type: 'error', text: verifyError instanceof Error ? verifyError.message : 'Could not verify the code.' });
    } finally {
      setBusyOtp(false);
    }
  };

  const toggleGame = (game: EventGame) => {
    setGames((current) => current.includes(game) ? current.filter((value) => value !== game) : [...current, game]);
  };

  const handleScreenshot = (file: File | undefined) => {
    setMessage(null);
    if (screenshotPreviewUrl.current) URL.revokeObjectURL(screenshotPreviewUrl.current);
    screenshotPreviewUrl.current = null;
    if (!file) {
      setScreenshot(null);
      setScreenshotPreview('');
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) {
      setScreenshot(null);
      setScreenshotPreview('');
      setMessage({ type: 'error', text: 'Payment screenshot must be a JPG, PNG, or WebP image up to 5 MB.' });
      return;
    }
    setScreenshot(file);
    const previewUrl = URL.createObjectURL(file);
    screenshotPreviewUrl.current = previewUrl;
    setScreenshotPreview(previewUrl);
  };

  const submitRegistration = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    if (!participantType || !session) {
      setMessage({ type: 'error', text: 'Choose participant type and session before submitting.' });
      return;
    }
    if (isMember && (!member || !verificationToken)) {
      setMessage({ type: 'error', text: 'Verify your Society ID by email OTP before continuing.' });
      return;
    }
    if (hasFirstHalf && games.length === 0) {
      setMessage({ type: 'error', text: 'Select at least one first-half game.' });
      return;
    }
    if (teamFormat === 'duo' && !teamName.trim()) {
      setMessage({ type: 'error', text: 'Enter the team name used by both Duo players.' });
      return;
    }
    if (games.includes('BGMI') && (!identity.bgmiIgn.trim() || !identity.bgmiUid.trim())) {
      setMessage({ type: 'error', text: 'Enter your BGMI IGN and UID.' });
      return;
    }
    if (games.includes('Free Fire') && (!identity.freeFireIgn.trim() || !identity.freeFireUid.trim())) {
      setMessage({ type: 'error', text: 'Enter your Free Fire IGN and UID.' });
      return;
    }
    if (deliveryMethod === 'whatsapp' && !hasWhatsappNumber) {
      setMessage({ type: 'error', text: 'A WhatsApp number is required for WhatsApp delivery.' });
      return;
    }
    if (!rulesAccepted) {
      setMessage({ type: 'error', text: 'Accept the event rules before submitting.' });
      return;
    }

    const payload = {
      participantType,
      societyId: isMember ? member?.societyId : undefined,
      verificationToken: isMember ? verificationToken : undefined,
      memberPhone: isMember ? memberWhatsapp.trim() : undefined,
      nonMember: isMember ? undefined : nonMember,
      session,
      games,
      teamFormat: hasFirstHalf ? teamFormat : 'solo',
      teamName: hasFirstHalf && teamFormat === 'duo' ? teamName.trim() : '',
      identity,
      deliveryMethod,
      transactionId: isMember ? '' : transactionId,
      rulesAccepted,
    };
    const formData = new FormData();
    formData.set('registration', JSON.stringify(payload));
    if (!isMember && screenshot) formData.set('paymentScreenshot', screenshot);

    setSaving(true);
    try {
      const response = await fetch('/api/event-registration', { method: 'POST', body: formData });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not submit registration.');
      setRegistered({ id: result.registrationId, member: isMember });
      setMessage(result.notificationError
        ? { type: 'info', text: result.notificationError }
        : { type: 'success', text: 'Your registration has been saved.' });
    } catch (submitError) {
      setMessage({ type: 'error', text: submitError instanceof Error ? submitError.message : 'Could not submit registration.' });
    } finally {
      setSaving(false);
    }
  };

  if (registered) {
    return (
      <main className="min-h-screen bg-slate-950 px-4 py-12 text-white sm:px-6">
        <section className="mx-auto max-w-xl rounded-2xl border border-emerald-500/30 bg-slate-900 p-8 text-center shadow-2xl">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15 text-2xl text-emerald-300">✓</div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-300">Registration received</p>
          <h1 className="mt-3 text-2xl font-bold">You are registered</h1>
          <p className="mt-4 text-sm leading-6 text-slate-300">
            Reference: <strong className="text-white">{registered.id}</strong>
          </p>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            {registered.member
              ? 'Please bring your CSE Society ID card. It will be used for attendance during entry.'
              : 'Please keep your UPI transaction ID. Your entry-pass update will be sent through your selected email or WhatsApp contact after verification.'}
          </p>
          {message && <MessageBanner message={message} />}
          <Link href="/forms" className="mt-6 inline-flex rounded-lg bg-teal-400 px-5 py-3 text-sm font-bold text-slate-950 hover:bg-teal-300">Back to forms</Link>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 sm:px-6 lg:py-12">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-teal-950/60 p-6 sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-300">CSE Society · IERT</p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">{EVENT_REGISTRATION.title}</h1>
          <p className="mt-2 text-slate-300">{EVENT_REGISTRATION.subtitle} · {EVENT_REGISTRATION.venue}</p>
          <div className="mt-5 grid gap-3 text-sm text-slate-300 sm:grid-cols-2">
            <p className="rounded-lg border border-slate-700 bg-slate-950/50 p-3"><strong className="text-white">First Half:</strong> 9:00 AM–12:00 PM · BGMI, Free Fire, Table Tennis</p>
            <p className="rounded-lg border border-slate-700 bg-slate-950/50 p-3"><strong className="text-white">Second Half:</strong> 2:00 PM–4:00 PM · Chess blitz</p>
          </div>
          <p className="mt-4 text-xs text-slate-400">Registration closes at 9:00 AM IST on 1 November 2026.</p>
        </header>

        {isOpen === null ? (
          <section aria-live="polite" className="rounded-2xl border border-slate-700 bg-slate-900 p-8 text-center">
            <p className="text-slate-400">Checking registration availability…</p>
          </section>
        ) : !isOpen ? (
          <section className="rounded-2xl border border-slate-700 bg-slate-900 p-8 text-center">
            <h2 className="text-xl font-bold">Registration is closed</h2>
            <p className="mt-2 text-slate-400">Online registration closed when the event started at 9:00 AM IST on 1 November 2026.</p>
          </section>
        ) : (
          <form onSubmit={submitRegistration} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-6">
              <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 sm:p-7">
                <SectionHeading number="01" title="Participant type" />
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <ChoiceCard
                    title="CSE Society member"
                    detail="Free · verify with Society ID and email OTP"
                    selected={participantType === 'member'}
                    onClick={() => {
                      setParticipantType('member');
                      setMember(null);
                      setVerificationToken('');
                      setOtpSent(false);
                    }}
                  />
                  <ChoiceCard
                    title="Non-member"
                    detail="Enter details manually · UPI payment required"
                    selected={participantType === 'non_member'}
                    onClick={() => {
                      setParticipantType('non_member');
                      setMember(null);
                      setVerificationToken('');
                    }}
                  />
                </div>

                {isMember && (
                  <div className="mt-5 space-y-4 rounded-xl border border-teal-500/20 bg-teal-950/20 p-4">
                    {!member ? (
                      <>
                        <div className="flex flex-col gap-3 sm:flex-row">
                          <label className="flex-1 text-sm font-medium text-slate-300">
                            Society ID
                            <input
                              required
                              autoComplete="off"
                              value={societyId}
                              onChange={(event) => setSocietyId(event.target.value)}
                              className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-3 text-white outline-none focus:border-teal-400"
                              aria-label="CSE Society ID"
                            />
                          </label>
                          <button disabled={busyOtp} type="button" onClick={() => void sendOtp()} className="self-end rounded-lg border border-teal-400/40 px-4 py-3 text-sm font-semibold text-teal-200 hover:bg-teal-400/10 disabled:opacity-50">
                            {busyOtp ? 'Sending…' : 'Send email code'}
                          </button>
                        </div>
                        {otpSent && (
                          <div className="flex flex-col gap-3 sm:flex-row">
                            <label className="flex-1 text-sm font-medium text-slate-300">
                              Six-digit email code
                              <input
                                required
                                inputMode="numeric"
                                pattern="[0-9]{6}"
                                maxLength={6}
                                value={otp}
                                onChange={(event) => setOtp(event.target.value.replace(/\D/g, ''))}
                                className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-3 text-white outline-none focus:border-teal-400"
                              />
                            </label>
                            <button disabled={busyOtp} type="button" onClick={() => void verifyOtp()} className="self-end rounded-lg bg-teal-400 px-4 py-3 text-sm font-bold text-slate-950 hover:bg-teal-300 disabled:opacity-50">
                              {busyOtp ? 'Verifying…' : 'Verify ID'}
                            </button>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="font-semibold text-emerald-200">Verified: {member.name}</p>
                          <p className="text-xs text-slate-400">{member.societyId} · {member.department} · {member.year ? `Year ${member.year}` : 'Year not recorded'}</p>
                        </div>
                        <button type="button" onClick={() => {
                          setMember(null);
                          setVerificationToken('');
                          setOtpSent(false);
                          setOtp('');
                        }} className="text-sm text-slate-400 underline hover:text-white">Change ID</button>
                      </div>
                    )}
                    {member && !hasValidWhatsappNumber(member.phone) && (
                      <TextField
                        label="WhatsApp number (optional)"
                        type="tel"
                        value={memberWhatsapp}
                        onChange={setMemberWhatsapp}
                      />
                    )}
                  </div>
                )}

                {participantType === 'non_member' && (
                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <TextField label="Full name" required value={nonMember.name} onChange={(value) => updateNonMember('name', value)} />
                    <TextField label="College roll number / Student ID" required value={nonMember.collegeRollNumber} onChange={(value) => updateNonMember('collegeRollNumber', value)} />
                    <TextField label="Branch / Department" required value={nonMember.department} onChange={(value) => updateNonMember('department', value)} />
                    <label className="text-sm font-medium text-slate-300">
                      Year / Semester
                      <select required value={nonMember.year} onChange={(event) => updateNonMember('year', event.target.value)} className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-3 text-white outline-none focus:border-teal-400">
                        <option value="">Select year</option>
                        <option value="1">Year 1</option><option value="2">Year 2</option><option value="3">Year 3</option><option value="4">Year 4</option>
                      </select>
                    </label>
                    <TextField label="WhatsApp number" required type="tel" value={nonMember.phone} onChange={(value) => updateNonMember('phone', value)} />
                    <TextField label="Email address" required type="email" value={nonMember.email} onChange={(value) => updateNonMember('email', value)} />
                  </div>
                )}

                {message && !registered && <MessageBanner message={message} />}
              </section>

              {participantType && (isMember ? member : true) && (
                <>
                  <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 sm:p-7">
                    <SectionHeading number="02" title="Choose session" />
                    <div className="mt-5 grid gap-3 md:grid-cols-3">
                      <SessionCard selected={session === 'first_half'} onClick={() => chooseSession('first_half')} title="First Half" time="9:00 AM – 12:00 PM" price={isMember ? 0 : 40} detail="BGMI · Free Fire · Table Tennis" />
                      <SessionCard selected={session === 'second_half'} onClick={() => chooseSession('second_half')} title="Second Half" time="2:00 PM – 4:00 PM" price={isMember ? 0 : 30} detail="Chess · Solo blitz" />
                      <SessionCard selected={session === 'both'} onClick={() => chooseSession('both')} title="Both Sessions" time="9:00 AM – 4:00 PM" price={isMember ? 0 : 60} detail="First-half game(s) + Chess" />
                    </div>
                    {hasFirstHalf && (
                      <div className="mt-6 space-y-5">
                        <fieldset>
                          <legend className="text-sm font-semibold text-slate-200">Choose first-half game(s)</legend>
                          <div className="mt-3 grid gap-2 sm:grid-cols-3">
                            {firstHalfGames.map((game) => (
                              <label key={game} className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-700 bg-slate-950/60 p-3 text-sm hover:border-teal-500/60">
                                <input type="checkbox" checked={games.includes(game)} onChange={() => toggleGame(game)} className="h-4 w-4 accent-teal-400" />
                                {game}
                              </label>
                            ))}
                          </div>
                        </fieldset>
                        <fieldset>
                          <legend className="text-sm font-semibold text-slate-200">Player format</legend>
                          <div className="mt-3 grid gap-3 sm:grid-cols-2">
                            <ChoiceCard title="Solo · 1 player" detail="Register as an individual" selected={teamFormat === 'solo'} onClick={() => setTeamFormat('solo')} />
                            <ChoiceCard title="Duo · 2 players" detail="Both players submit separately with the same team name" selected={teamFormat === 'duo'} onClick={() => setTeamFormat('duo')} />
                          </div>
                        </fieldset>
                        {teamFormat === 'duo' && (
                          <TextField label="Duo team name" required value={teamName} onChange={setTeamName} />
                        )}
                        {teamFormat === 'duo' && (
                          <p className="-mt-2 text-xs text-slate-400">Enter exactly the same team name on both players’ individual registrations. Each player’s own form is one entry and has its own fee.</p>
                        )}
                        {games.includes('BGMI') && (
                          <div className="grid gap-4 rounded-xl border border-slate-800 p-4 sm:grid-cols-2">
                            <p className="sm:col-span-2 text-sm font-semibold text-white">BGMI · Your player details</p>
                            <TextField label="BGMI IGN" required value={identity.bgmiIgn} onChange={(value) => updateIdentity('bgmiIgn', value)} />
                            <TextField label="BGMI Character UID" required value={identity.bgmiUid} onChange={(value) => updateIdentity('bgmiUid', value)} />
                          </div>
                        )}
                        {games.includes('Free Fire') && (
                          <div className="grid gap-4 rounded-xl border border-slate-800 p-4 sm:grid-cols-2">
                            <p className="sm:col-span-2 text-sm font-semibold text-white">Free Fire · Your player details</p>
                            <TextField label="Free Fire IGN" required value={identity.freeFireIgn} onChange={(value) => updateIdentity('freeFireIgn', value)} />
                            <TextField label="Free Fire UID" required value={identity.freeFireUid} onChange={(value) => updateIdentity('freeFireUid', value)} />
                          </div>
                        )}
                      </div>
                    )}
                    {(session === 'second_half' || session === 'both') && (
                      <div className="mt-6 rounded-xl border border-amber-500/20 bg-amber-950/20 p-4">
                        <p className="font-semibold text-amber-100">Chess · Solo · 5-minute blitz</p>
                        <div className="mt-4 max-w-md">
                          <TextField label="Chess.com / Lichess username (optional)" value={identity.chessUsername} onChange={(value) => updateIdentity('chessUsername', value)} />
                        </div>
                      </div>
                    )}
                  </section>

                  <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 sm:p-7">
                    <SectionHeading number="03" title="Entry-pass delivery" />
                    <p className="mt-2 text-sm text-slate-400">
                      {isMember ? `Contact details are taken from the verified Society account (${member?.email || ''}).` : 'Choose where the entry-pass update should be sent.'}
                    </p>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <ChoiceCard title="Email" detail={registrationEmail || 'Your registered / entered email'} selected={deliveryMethod === 'email'} onClick={() => setDeliveryMethod('email')} />
                      <ChoiceCard title="WhatsApp" detail={hasWhatsappNumber ? registrationPhone : 'No phone number is saved for this account'} selected={deliveryMethod === 'whatsapp'} disabled={!hasWhatsappNumber} onClick={() => setDeliveryMethod('whatsapp')} />
                    </div>
                  </section>

                  {!isMember && fee > 0 && (
                    <section className="rounded-2xl border border-amber-500/30 bg-slate-900/90 p-5 sm:p-7">
                      <SectionHeading number="04" title="UPI payment" />
                      <div className="mt-4 grid gap-5 md:grid-cols-[210px_1fr]">
                        <div className="rounded-xl bg-white p-2">
                          <Image src={`/event-registration/upi-${fee}.jpeg`} alt={`UPI payment QR for ₹${fee}`} width={500} height={500} className="aspect-square w-full rounded-lg object-contain" />
                        </div>
                        <div className="space-y-4">
                          <p className="text-sm text-slate-300">Pay <strong className="text-amber-200">₹{fee}</strong> to <strong className="text-white">vbht2006@okhdfcbank</strong> using UPI. The QR code amount matches your session selection.</p>
                          <TextField label="UPI transaction ID / UTR" required value={transactionId} onChange={setTransactionId} maxLength={80} />
                          <label className="block text-sm font-medium text-slate-300">
                            Payment screenshot (optional)
                            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => handleScreenshot(event.target.files?.[0])} className="mt-2 block w-full text-sm text-slate-300 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-700 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-slate-600" />
                            <span className="mt-1 block text-xs text-slate-500">JPG, PNG, or WebP · maximum 5 MB</span>
                          </label>
                          {screenshotPreview && (
                            <Image src={screenshotPreview} alt="Payment screenshot preview" width={640} height={480} unoptimized className="max-h-56 rounded-lg border border-slate-700 object-contain" />
                          )}
                        </div>
                      </div>
                    </section>
                  )}

                  <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 sm:p-7">
                    <SectionHeading number={isMember ? '04' : '05'} title="Rules and confirmation" />
                    <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-slate-300">
                      {EVENT_REGISTRATION.rules.map((rule) => <li key={rule}>{rule}</li>)}
                    </ul>
                    <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-lg border border-slate-700 p-4 text-sm text-slate-200">
                      <input type="checkbox" required checked={rulesAccepted} onChange={(event) => setRulesAccepted(event.target.checked)} className="mt-1 h-4 w-4 accent-teal-400" />
                      <span>I have read and agree to the event rules, fair-play policy, and selected session timings.</span>
                    </label>
                    <button disabled={saving || !isOpen} type="submit" className="mt-5 w-full rounded-xl bg-teal-400 px-5 py-4 text-base font-bold text-slate-950 transition hover:bg-teal-300 disabled:cursor-not-allowed disabled:opacity-50">
                      {saving ? 'Submitting registration…' : isMember ? 'Verify and register · Free' : `Submit registration · Pay ₹${fee}`}
                    </button>
                    {message && <MessageBanner message={message} />}
                  </section>
                </>
              )}
            </div>

            <aside className="h-fit rounded-2xl border border-teal-500/30 bg-slate-900 p-5 shadow-xl lg:sticky lg:top-6">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-300">Order summary</p>
              <h2 className="mt-2 text-lg font-bold text-white">{EVENT_REGISTRATION.title}</h2>
              <dl className="mt-5 space-y-3 text-sm">
                <SummaryRow label="Participant" value={participantType ? (isMember ? 'Society member' : 'Non-member') : 'Not selected'} />
                <SummaryRow label="Session" value={session ? sessionLabel(session) : 'Not selected'} />
                {hasFirstHalf && <SummaryRow label="Format" value={teamFormat === 'duo' ? `Duo · ${teamName || 'team name pending'}` : 'Solo · 1 player'} />}
                <SummaryRow label="Game(s)" value={selectedGames.length ? selectedGames.join(', ') : 'Not selected'} />
                <SummaryRow label="Delivery" value={deliveryMethod === 'email' ? 'Email' : 'WhatsApp'} />
              </dl>
              <div className="mt-5 flex items-center justify-between border-t border-slate-700 pt-4">
                <span className="text-sm text-slate-300">Total payable</span>
                <strong className="text-2xl text-amber-200">₹{fee}</strong>
              </div>
              <p className="mt-3 text-xs leading-5 text-slate-400">
                {isMember ? 'Verified Society members register free.' : 'Fee is per participant. Every Duo player completes a separate form.'}
              </p>
            </aside>
          </form>
        )}
      </div>
    </main>
  );
}

function SectionHeading({ number, title }: { number: string; title: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-400/10 text-xs font-bold text-teal-200">{number}</span>
      <h2 className="text-lg font-bold text-white">{title}</h2>
    </div>
  );
}

function ChoiceCard({
  title,
  detail,
  selected,
  disabled = false,
  onClick,
}: {
  title: string;
  detail: string;
  selected: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-pressed={selected}
      className={`rounded-xl border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-40 ${selected ? 'border-teal-400 bg-teal-400/10' : 'border-slate-700 bg-slate-950/40 hover:border-slate-500'}`}
    >
      <span className="block font-semibold text-white">{title}</span>
      <span className="mt-1 block text-xs leading-5 text-slate-400">{detail}</span>
    </button>
  );
}

function SessionCard({
  selected,
  onClick,
  title,
  time,
  price,
  detail,
}: {
  selected: boolean;
  onClick: () => void;
  title: string;
  time: string;
  price: number;
  detail: string;
}) {
  return (
    <button type="button" onClick={onClick} aria-pressed={selected} className={`rounded-xl border p-4 text-left transition ${selected ? 'border-teal-400 bg-teal-400/10' : 'border-slate-700 bg-slate-950/40 hover:border-slate-500'}`}>
      <span className="flex items-start justify-between gap-2">
        <strong className="text-white">{title}</strong>
        <span className="rounded-full bg-amber-400/10 px-2 py-1 text-xs font-bold text-amber-200">₹{price}</span>
      </span>
      <span className="mt-2 block text-xs text-slate-300">{time}</span>
      <span className="mt-1 block text-xs text-slate-500">{detail}</span>
    </button>
  );
}

function TextField({
  label,
  value,
  onChange,
  required = false,
  type = 'text',
  maxLength = 100,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  type?: string;
  maxLength?: number;
}) {
  return (
    <label className="block text-sm font-medium text-slate-300">
      {label}
      <input required={required} type={type} maxLength={maxLength} value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-3 text-white outline-none focus:border-teal-400" />
    </label>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="shrink-0 text-slate-400">{label}</dt>
      <dd className="text-right font-medium text-slate-200">{value}</dd>
    </div>
  );
}

function MessageBanner({ message }: { message: PublicMessage }) {
  const classes = message.type === 'error'
    ? 'border-rose-500/30 bg-rose-500/10 text-rose-200'
    : message.type === 'success'
      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
      : 'border-sky-500/30 bg-sky-500/10 text-sky-200';
  return <p role={message.type === 'error' ? 'alert' : 'status'} className={`mt-4 rounded-lg border px-4 py-3 text-sm ${classes}`}>{message.text}</p>;
}

function sessionLabel(session: EventSession): string {
  if (session === 'first_half') return 'First Half';
  if (session === 'second_half') return 'Second Half';
  return 'Both Sessions';
}
