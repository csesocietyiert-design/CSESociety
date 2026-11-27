import { randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { canManageFinanceEntries, canViewPendingFinanceEntries } from '@/lib/finance-access';
import { getSessionUserId } from '@/lib/session';
import { hasFundsAccess } from '@/lib/bills-access';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
function getClient() {
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

const maxBillSize = 5 * 1024 * 1024;
const billBucket = 'society-bills';

async function signEntryBillLinks(supabase: ReturnType<typeof getClient>, entries: Array<Record<string, unknown>>) {
  return Promise.all(entries.map(async (entry) => {
    const billLink = typeof entry.bill_link === 'string' ? entry.bill_link : '';
    if (!billLink.startsWith('bills/')) return entry;
    const { data, error } = await supabase.storage.from(billBucket).createSignedUrl(billLink, 60 * 60);
    if (error) console.error('Could not sign finance bill:', error);
    return { ...entry, bill_link: data?.signedUrl || null };
  }));
}

async function getRequester(request: Request) {
  const userId = getSessionUserId(request);
  if (!userId) return { error: Response.json({ error: 'Authentication required' }, { status: 401 }) };
  const supabase = getClient();
  const { data: user, error } = await supabase.from('users').select('id, role, is_verified').eq('id', userId).maybeSingle();
  if (error) throw error;
  const role = String(user?.role || '').trim().toLowerCase();
  if (!user || user.is_verified === false) {
    return { error: Response.json({ error: 'You do not have access to society funds' }, { status: 403 }) };
  }
  return { supabase, user: { ...user, role } };
}

function errorMessage(error: unknown) {
  const message = error instanceof Error
    ? error.message
    : typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string'
      ? error.message
      : 'Finance request failed';

  if (/finance_entries/i.test(message) && /(does not exist|could not find the table)/i.test(message)) {
    return 'Finance ledger table is missing. Run migration 023_add_finance_entries.sql in Supabase.';
  }
  if (/finance_settings/i.test(message) && /(does not exist|could not find the table)/i.test(message)) {
    return 'Finance settings table is missing. Run migration 024_add_finance_total_amount.sql in Supabase.';
  }
  if (/(details|bill_link)/i.test(message) && /(column|schema cache)/i.test(message) && /(does not exist|could not find)/i.test(message)) {
    return 'Finance entry details are missing. Run migration 025_add_finance_bill_details.sql in Supabase.';
  }
  return message;
}

export async function GET(request: Request) {
  try {
    if (!hasFundsAccess(request)) return Response.json({ error: 'Password verification is required.' }, { status: 401 });
    if (!supabaseUrl || !serviceRoleKey) return Response.json({ error: 'Supabase not configured' }, { status: 500 });
    const requester = await getRequester(request);
    if ('error' in requester) return requester.error;
    let entriesQuery = requester.supabase
      .from('finance_entries')
      .select(`id, entry_type, title, amount, event_name, entry_date, description, details, ${requester.user.role === 'member' ? '' : 'bill_link, '}created_by, approval_status, approved_by, approved_at, created_at`)
      .order('entry_date', { ascending: false })
      .order('created_at', { ascending: false });
    if (!canViewPendingFinanceEntries(requester.user.role)) {
      entriesQuery = entriesQuery.eq('approval_status', 'approved');
    }
    const { data, error } = await entriesQuery;
    if (error) throw error;
    const { data: settings, error: settingsError } = await requester.supabase
      .from('finance_settings')
      .select('total_amount')
      .eq('id', 1)
      .maybeSingle();
    if (settingsError) throw settingsError;
    const totalAmount = Number(settings?.total_amount ?? 58200);
    const canManage = canManageFinanceEntries(requester.user.role);
    const entries = await signEntryBillLinks(requester.supabase, (data || []) as unknown as Array<Record<string, unknown>>);
    return Response.json({ entries, totalAmount, canManage });
  } catch (error) {
    console.error('Finance read error:', error);
    const message = errorMessage(error);
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  let uploadedPath: string | undefined;
  let supabase: ReturnType<typeof getClient> | undefined;
  try {
    if (!hasFundsAccess(request)) return Response.json({ error: 'Password verification is required.' }, { status: 401 });
    if (!supabaseUrl || !serviceRoleKey) return Response.json({ error: 'Supabase not configured' }, { status: 500 });
    const requester = await getRequester(request);
    if ('error' in requester) return requester.error;
    supabase = requester.supabase;
    const canManage = canManageFinanceEntries(requester.user.role);
    if (!canManage) return Response.json({ error: 'Only the treasurer, secretaries, or admin can submit fund entries' }, { status: 403 });

    let entryType: string | null;
    let title: string;
    let amount: number;
    let eventName: string;
    let entryDate: string;
    let description: string;
    let details: string;
    let billLink: string;
    let billFile: File | null = null;

    if (request.headers.get('content-type')?.includes('multipart/form-data')) {
      const formData = await request.formData();
      const typeValue = formData.get('entryType');
      entryType = typeValue === 'income' || typeValue === 'expense' ? typeValue : null;
      title = String(formData.get('title') || '').trim();
      amount = Number(formData.get('amount'));
      eventName = String(formData.get('eventName') || '').trim();
      entryDate = String(formData.get('entryDate') || '');
      description = String(formData.get('description') || '').trim();
      details = String(formData.get('details') || '').trim();
      billLink = String(formData.get('billLink') || '').trim();
      const fileValue = formData.get('file');
      billFile = fileValue instanceof File ? fileValue : null;
    } else {
      const body = await request.json();
      entryType = body?.entryType === 'income' || body?.entryType === 'expense' ? body.entryType : null;
      title = typeof body?.title === 'string' ? body.title.trim() : '';
      amount = Number(body?.amount);
      eventName = typeof body?.eventName === 'string' ? body.eventName.trim() : '';
      entryDate = typeof body?.entryDate === 'string' ? body.entryDate : '';
      description = typeof body?.description === 'string' ? body.description.trim() : '';
      details = typeof body?.details === 'string' ? body.details.trim() : '';
      billLink = typeof body?.billLink === 'string' ? body.billLink.trim() : '';
    }

    if (!entryType || !title || !Number.isFinite(amount) || amount <= 0 || !entryDate) {
      return Response.json({ error: 'Type, title, positive amount, and date are required' }, { status: 400 });
    }

    if (billFile) {
      if (billFile.size === 0 || billFile.size > maxBillSize) {
        return Response.json({ error: 'Choose a bill smaller than 5 MB' }, { status: 400 });
      }
      const allowedTypes = new Set(['application/pdf', 'image/jpeg', 'image/png']);
      if (billFile.type && !allowedTypes.has(billFile.type)) {
        return Response.json({ error: 'The bill must be a PDF, JPG, or PNG file' }, { status: 400 });
      }
      const extension = billFile.type === 'application/pdf' ? 'pdf'
        : billFile.type === 'image/png' ? 'png'
          : 'jpg';
      uploadedPath = `bills/${randomUUID()}.${extension}`;
      const fileBytes = new Uint8Array(await billFile.arrayBuffer());
      const { error: uploadError } = await supabase.storage
        .from(billBucket)
        .upload(uploadedPath, fileBytes, { contentType: billFile.type || (extension === 'pdf' ? 'application/pdf' : `image/${extension}`), upsert: false });
      if (uploadError) throw uploadError;
      billLink = uploadedPath;
    }

    const directApproval = requester.user.role === 'admin';
    const { data, error } = await requester.supabase.from('finance_entries').insert({
      entry_type: entryType,
      title,
      amount: Math.round(amount * 100) / 100,
      event_name: eventName || null,
      entry_date: entryDate,
      description: description || null,
      details: details || null,
      bill_link: billLink || null,
      created_by: requester.user.id,
      approval_status: directApproval ? 'approved' : 'pending',
      approved_by: directApproval ? requester.user.id : null,
      approved_at: directApproval ? new Date().toISOString() : null,
    }).select('*').single();
    if (error) {
      if (uploadedPath) await supabase.storage.from(billBucket).remove([uploadedPath]);
      throw error;
    }
    uploadedPath = undefined;
    const signedEntries = await signEntryBillLinks(requester.supabase, [data as unknown as Record<string, unknown>]);
    return Response.json({ entry: signedEntries[0] }, { status: 201 });
  } catch (error) {
    if (supabase && uploadedPath) {
      await supabase.storage.from(billBucket).remove([uploadedPath]).catch(() => undefined);
    }
    console.error('Finance create error:', error);
    return Response.json({ error: errorMessage(error) }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    if (!hasFundsAccess(request)) return Response.json({ error: 'Password verification is required.' }, { status: 401 });
    if (!supabaseUrl || !serviceRoleKey) return Response.json({ error: 'Supabase not configured' }, { status: 500 });
    const requester = await getRequester(request);
    if ('error' in requester) return requester.error;
    const canManage = canManageFinanceEntries(requester.user.role);
    if (!canManage) return Response.json({ error: 'Only the treasurer, secretaries, or admin can remove fund entries' }, { status: 403 });
    const { id } = await request.json();
    if (typeof id !== 'string' || !id) return Response.json({ error: 'Entry ID is required' }, { status: 400 });
    const { data: entry, error: entryError } = await requester.supabase
      .from('finance_entries')
      .select('approval_status, bill_link')
      .eq('id', id)
      .maybeSingle();
    if (entryError) throw entryError;
    if (!entry) return Response.json({ error: 'Fund entry not found' }, { status: 404 });
    if (entry.approval_status === 'approved' && requester.user.role !== 'admin') {
      return Response.json({ error: 'Only an admin can delete an approved fund entry' }, { status: 403 });
    }
    const deletableStatuses = requester.user.role === 'admin' ? ['pending', 'approved'] : ['pending'];
    const { data: deletedEntry, error } = await requester.supabase
      .from('finance_entries')
      .delete()
      .eq('id', id)
      .in('approval_status', deletableStatuses)
      .select('id')
      .maybeSingle();
    if (error) throw error;
    if (!deletedEntry) return Response.json({ error: 'Fund entry changed and could not be deleted' }, { status: 409 });
    if (typeof entry.bill_link === 'string' && entry.bill_link.startsWith('bills/')) {
      const { error: cleanupError } = await requester.supabase.storage
        .from(billBucket)
        .remove([entry.bill_link]);
      if (cleanupError) console.error('Could not remove the deleted bill file:', cleanupError);
    }
    return Response.json({ ok: true });
  } catch (error) {
    console.error('Finance delete error:', error);
    return Response.json({ error: errorMessage(error) }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    if (!hasFundsAccess(request)) return Response.json({ error: 'Password verification is required.' }, { status: 401 });
    if (!supabaseUrl || !serviceRoleKey) return Response.json({ error: 'Supabase not configured' }, { status: 500 });
    const requester = await getRequester(request);
    if ('error' in requester) return requester.error;
    const canManage = canManageFinanceEntries(requester.user.role);
    if (!canManage) return Response.json({ error: 'Only the treasurer or admin can manage fund entries' }, { status: 403 });
    const { id, amount, action } = await request.json();
    if (action === 'set_total_amount') {
      if (!['admin', 'treasurer'].includes(requester.user.role)) {
        return Response.json({ error: 'Only the treasurer or admin can change the total fund amount' }, { status: 403 });
      }
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
    if (requester.user.role !== 'admin') return Response.json({ error: 'Only an admin can approve fund entries' }, { status: 403 });
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

