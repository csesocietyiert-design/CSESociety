import { createClient } from '@supabase/supabase-js';
import { getSessionUserId } from '@/lib/session';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const viewerRoles = new Set([
  'admin',
  'faculty',
  'executive',
  'vice_president',
  'general_secretary',
  'technical_secretary',
  'cultural_secretary',
  'secretary',
  'treasurer',
  'year_representative',
  'yearRep',
]);

function getClient() {
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function getRequester(request: Request) {
  const userId = getSessionUserId(request);
  if (!userId) return { error: Response.json({ error: 'Authentication required' }, { status: 401 }) };
  const supabase = getClient();
  const { data: user, error } = await supabase.from('users').select('id, role, is_verified').eq('id', userId).maybeSingle();
  if (error) throw error;
  const role = String(user?.role || '').trim();
  if (!user || user.is_verified === false || !viewerRoles.has(role)) {
    return { error: Response.json({ error: 'You do not have access to society funds' }, { status: 403 }) };
  }
  return { supabase, user: { ...user, role } };
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Finance request failed';
}

export async function GET(request: Request) {
  try {
    if (!supabaseUrl || !serviceRoleKey) return Response.json({ error: 'Supabase not configured' }, { status: 500 });
    const requester = await getRequester(request);
    if ('error' in requester) return requester.error;
    const { data, error } = await requester.supabase
      .from('finance_entries')
      .select('id, entry_type, title, amount, event_name, entry_date, description, created_by, approval_status, approved_by, approved_at, created_at')
      .order('entry_date', { ascending: false })
      .order('created_at', { ascending: false });
    if (error) throw error;
    const { data: settings, error: settingsError } = await requester.supabase
      .from('finance_settings')
      .select('total_amount')
      .eq('id', 1)
      .maybeSingle();
    if (settingsError) throw settingsError;
    return Response.json({ entries: data || [], totalAmount: Number(settings?.total_amount || 0), canManage: requester.user.role === 'treasurer' });
  } catch (error) {
    console.error('Finance read error:', error);
    const message = errorMessage(error);
    return Response.json({ error: message.includes('finance_entries') ? 'Finance database table is missing. Run migration 023_add_finance_entries.sql in Supabase.' : message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    if (!supabaseUrl || !serviceRoleKey) return Response.json({ error: 'Supabase not configured' }, { status: 500 });
    const requester = await getRequester(request);
    if ('error' in requester) return requester.error;
    if (requester.user.role !== 'treasurer') return Response.json({ error: 'Only the treasurer can update society funds' }, { status: 403 });

    const body = await request.json();
    const entryType = body?.entryType === 'income' || body?.entryType === 'expense' ? body.entryType : null;
    const title = typeof body?.title === 'string' ? body.title.trim() : '';
    const amount = Number(body?.amount);
    const eventName = typeof body?.eventName === 'string' ? body.eventName.trim() : '';
    const entryDate = typeof body?.entryDate === 'string' ? body.entryDate : '';
    const description = typeof body?.description === 'string' ? body.description.trim() : '';

    if (!entryType || !title || !Number.isFinite(amount) || amount <= 0 || !entryDate) {
      return Response.json({ error: 'Type, title, positive amount, and date are required' }, { status: 400 });
    }

    const { data, error } = await requester.supabase.from('finance_entries').insert({
      entry_type: entryType,
      title,
      amount: Math.round(amount * 100) / 100,
      event_name: eventName || null,
      entry_date: entryDate,
      description: description || null,
      created_by: requester.user.id,
    }).select('*').single();
    if (error) throw error;
    return Response.json({ entry: data }, { status: 201 });
  } catch (error) {
    console.error('Finance create error:', error);
    const message = errorMessage(error);
    return Response.json({ error: message.includes('finance_entries') ? 'Finance database table is missing. Run migration 023_add_finance_entries.sql in Supabase.' : message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    if (!supabaseUrl || !serviceRoleKey) return Response.json({ error: 'Supabase not configured' }, { status: 500 });
    const requester = await getRequester(request);
    if ('error' in requester) return requester.error;
    if (requester.user.role !== 'treasurer') return Response.json({ error: 'Only the treasurer can remove fund entries' }, { status: 403 });
    const { id } = await request.json();
    if (typeof id !== 'string' || !id) return Response.json({ error: 'Entry ID is required' }, { status: 400 });
    const { data: entry, error: entryError } = await requester.supabase.from('finance_entries').select('approval_status').eq('id', id).maybeSingle();
    if (entryError) throw entryError;
    if (!entry) return Response.json({ error: 'Fund entry not found' }, { status: 404 });
    if (entry.approval_status === 'approved') return Response.json({ error: 'Approved fund entries cannot be deleted' }, { status: 409 });
    const { error } = await requester.supabase.from('finance_entries').delete().eq('id', id).eq('approval_status', 'pending');
    if (error) throw error;
    return Response.json({ ok: true });
  } catch (error) {
    console.error('Finance delete error:', error);
    return Response.json({ error: errorMessage(error) }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    if (!supabaseUrl || !serviceRoleKey) return Response.json({ error: 'Supabase not configured' }, { status: 500 });
    const requester = await getRequester(request);
    if ('error' in requester) return requester.error;
    if (requester.user.role !== 'admin') return Response.json({ error: 'Only an admin can approve fund entries or set the total amount' }, { status: 403 });
    const { id, amount, action } = await request.json();
    if (action === 'set_total_amount') {
      const totalAmount = Number(amount);
      if (!Number.isFinite(totalAmount) || totalAmount < 0) return Response.json({ error: 'The total amount cannot be negative' }, { status: 400 });
      const { data, error } = await requester.supabase
        .from('finance_settings')
        .upsert({ id: 1, total_amount: Math.round(totalAmount * 100) / 100, updated_by: requester.user.id, updated_at: new Date().toISOString() })
        .select('total_amount')
        .single();
      if (error) throw error;
      return Response.json({ totalAmount: Number(data.total_amount) });
    }
    if (typeof id !== 'string' || !id) return Response.json({ error: 'Entry ID is required' }, { status: 400 });
    if (action === 'edit_amount') {
      const adjustedAmount = Number(amount);
      if (!Number.isFinite(adjustedAmount) || adjustedAmount <= 0) return Response.json({ error: 'A positive amount is required' }, { status: 400 });
      const { data, error } = await requester.supabase
        .from('finance_entries')
        .update({ amount: Math.round(adjustedAmount * 100) / 100 })
        .eq('id', id)
        .eq('approval_status', 'pending')
        .select('*')
        .maybeSingle();
      if (error) throw error;
      if (!data) return Response.json({ error: 'Approved entries cannot be edited' }, { status: 409 });
      return Response.json({ entry: data });
    }
    const { data, error } = await requester.supabase
      .from('finance_entries')
      .update({ approval_status: 'approved', approved_by: requester.user.id, approved_at: new Date().toISOString() })
      .eq('id', id)
      .eq('approval_status', 'pending')
      .select('*')
      .maybeSingle();
    if (error) throw error;
    if (!data) return Response.json({ error: 'Entry is already approved or does not exist' }, { status: 409 });
    return Response.json({ entry: data });
  } catch (error) {
    console.error('Finance approval error:', error);
    return Response.json({ error: errorMessage(error) }, { status: 500 });
  }
}
