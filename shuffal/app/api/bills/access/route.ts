import { NextResponse } from 'next/server';
import {
  createBillsAccessCookie,
  isBillsRequesterMember,
  secureBillsPasswordEquals,
} from '@/lib/bills-access';

export async function POST(request: Request) {
  const configuredPassword = process.env.BILLS_PAGE_PASSWORD;
  if (!configuredPassword) {
    return NextResponse.json({ error: 'Bills page access is not configured.' }, { status: 503 });
  }

  try {
    if (await isBillsRequesterMember(request)) {
      return NextResponse.json({ error: 'Society members cannot view bills.' }, { status: 403 });
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
      { headers: { 'Set-Cookie': createBillsAccessCookie() } },
    );
  } catch (error) {
    console.error('Bills access verification failed:', error);
    return NextResponse.json({ error: 'Could not verify bills access.' }, { status: 500 });
  }
}
