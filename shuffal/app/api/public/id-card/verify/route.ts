const turnstileSecret = process.env.TURNSTILE_SECRET_KEY || '';

export async function POST(request: Request) {
  if (!turnstileSecret) return Response.json({ error: 'CAPTCHA is not configured' }, { status: 503 });

  const body = await request.json().catch(() => ({}));
  const token = typeof body?.token === 'string' ? body.token.trim() : '';
  if (!token) return Response.json({ error: 'CAPTCHA verification is required' }, { status: 400 });

  const formData = new URLSearchParams();
  formData.set('secret', turnstileSecret);
  formData.set('response', token);
  const forwardedFor = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  if (forwardedFor) formData.set('remoteip', forwardedFor);

  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData,
      cache: 'no-store',
    });
    const result = await response.json() as { success?: boolean };
    if (!response.ok || result.success !== true) return Response.json({ error: 'CAPTCHA verification failed' }, { status: 403 });
    return Response.json({ verified: true });
  } catch {
    return Response.json({ error: 'CAPTCHA service is unavailable' }, { status: 502 });
  }
}
