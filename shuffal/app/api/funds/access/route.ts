import { NextResponse } from 'next/server';
import { createFundsAccessCookie, isBillsRequesterMember, secureBillsPasswordEquals } from '@/lib/bills-access';
import { getSessionUserId } from '@/lib/session';

export async function POST(request: Request) {
  const configuredPassword = process.env.BILLS_PAGE_PASSWORD;
  if (!configuredPassword) {
    return NextResponse.json({ error: 'Funds access is not configured.' }, { status: 503 });
  }
  if (!getSessionUserId(request)) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  try {
    if (await isBillsRequesterMember(request)) {
      return NextResponse.json({ error: 'Society members cannot view funds.' }, { status: 403 });
    }

    let payload: unknown;
    try {
      payload = await request.json();
    } catch {
      return NextResponse.json({ error: 'Enter the access password.' }, { status: 400 });
    }
    const password = payload && typeof payload === 'object' && !Array.isArray(payload)
      ? (payload as { password?: unknown }).password
      : null;
    if (typeof password !== 'string' || !secureBillsPasswordEquals(password, configuredPassword)) {
      return NextResponse.json({ error: 'Incorrect password.' }, { status: 401 });
    }

    return NextResponse.json(
      { ok: true },
      { headers: { 'Set-Cookie': createFundsAccessCookie() } },
    );
  } catch (error) {
    console.error('Funds access verification failed:', error);
    return NextResponse.json({ error: 'Could not verify funds access.' }, { status: 500 });
  }
}
