import { createClient } from '@supabase/supabase-js';
import { getSessionUserId } from '@/lib/session';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const adminRoles = new Set(['admin']);
const rateWindow = new Map<string, { startedAt: number; count: number }>();

type UserRecord = { id: string; name: string; email: string; cse_id: string; role: string; is_verified?: boolean; year?: number | null };
type LatestMessage = { conversation_id: string; sender_id: string; body: string; created_at: string; read_at: string | null };

function getClient() {
  return createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
}

function isRateLimited(userId: string) {
  const now = Date.now();
  const current = rateWindow.get(userId);
  if (!current || now - current.startedAt >= 60_000) {
    rateWindow.set(userId, { startedAt: now, count: 1 });
    return false;
  }
  current.count += 1;
  return current.count > 30;
}

async function getViewer(request: Request) {
  const viewerId = getSessionUserId(request);
  if (!viewerId || !supabaseUrl || !serviceRoleKey) return null;
  const supabase = getClient();
  const { data } = await supabase.from('users').select('id, name, email, cse_id, role, is_verified, year').eq('id', viewerId).maybeSingle();
  return data as UserRecord | null;
}

export async function GET(request: Request) {
  const viewer = await getViewer(request);
  if (!viewer || !viewer.is_verified) return Response.json({ error: 'Authentication required' }, { status: 401 });

  const supabase = getClient();
  const conversationId = new URL(request.url).searchParams.get('conversationId');
  if (conversationId) {
    const { data: conversation } = await supabase.from('conversations').select('id, member_id, admin_id').eq('id', conversationId).maybeSingle();
    if (!conversation || ![conversation.member_id, conversation.admin_id].includes(viewer.id)) return Response.json({ error: 'Conversation not found' }, { status: 404 });
    const { data: messages, error } = await supabase.from('messages').select('id, conversation_id, sender_id, body, created_at, read_at').eq('conversation_id', conversationId).order('created_at', { ascending: true });
    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ conversation, messages: messages || [] });
  }

  const participantColumn = adminRoles.has(viewer.role) ? 'admin_id' : 'member_id';
  const { data: conversations, error } = await supabase.from('conversations').select('id, member_id, admin_id, created_at, updated_at').eq(participantColumn, viewer.id).order('updated_at', { ascending: false });
  if (error) return Response.json({ error: error.message }, { status: 500 });

  const participantIds = (conversations || []).map((conversation) => adminRoles.has(viewer.role) ? conversation.member_id : conversation.admin_id);
  const { data: participants } = participantIds.length
    ? await supabase.from('users').select('id, name, email, cse_id, role').in('id', participantIds)
    : { data: [] as UserRecord[] };
  const participantById = new Map((participants || []).map((participant) => [participant.id, participant]));
  const { data: latestMessages } = conversations?.length
    ? await supabase.from('messages').select('conversation_id, sender_id, body, created_at, read_at').in('conversation_id', conversations.map((conversation) => conversation.id)).order('created_at', { ascending: false })
    : { data: [] };
  const latestByConversation = new Map<string, LatestMessage>();
  (latestMessages || []).forEach((message) => { if (!latestByConversation.has(message.conversation_id)) latestByConversation.set(message.conversation_id, message); });

  let admins: UserRecord[] = [];
  if (!adminRoles.has(viewer.role)) {
    const { data } = await supabase.from('users').select('id, name, email, cse_id, role').eq('role', 'admin').eq('is_verified', true).order('name');
    admins = data || [];
  }
  return Response.json({ conversations: (conversations || []).map((conversation) => ({ ...conversation, participant: participantById.get(adminRoles.has(viewer.role) ? conversation.member_id : conversation.admin_id) || null, latestMessage: latestByConversation.get(conversation.id) || null })), admins });
}

export async function POST(request: Request) {
  const viewer = await getViewer(request);
  if (!viewer || !viewer.is_verified) return Response.json({ error: 'Authentication required' }, { status: 401 });
  if (isRateLimited(viewer.id)) return Response.json({ error: 'Please wait before sending more messages.' }, { status: 429 });

  const body = await request.json().catch(() => ({}));
  const message = typeof body?.message === 'string' ? body.message.trim() : '';
  if (!message || message.length > 2000) return Response.json({ error: 'Message must contain 1 to 2000 characters.' }, { status: 400 });

  const supabase = getClient();
  let conversationId = typeof body?.conversationId === 'string' ? body.conversationId : '';
  if (conversationId) {
    const { data: conversation } = await supabase.from('conversations').select('id, member_id, admin_id').eq('id', conversationId).maybeSingle();
    if (!conversation || ![conversation.member_id, conversation.admin_id].includes(viewer.id)) return Response.json({ error: 'Conversation not found' }, { status: 404 });
  } else {
    const counterpartId = typeof body?.counterpartId === 'string' ? body.counterpartId : '';
    if (!counterpartId || counterpartId === viewer.id) return Response.json({ error: 'Choose a valid recipient.' }, { status: 400 });
    const memberId = adminRoles.has(viewer.role) ? counterpartId : viewer.id;
    const adminId = adminRoles.has(viewer.role) ? viewer.id : counterpartId;
    const { data: counterpart } = await supabase.from('users').select('id, role, is_verified').eq('id', counterpartId).maybeSingle();
    if (!counterpart?.is_verified || (adminRoles.has(viewer.role) ? !['member', 'year_representative', 'yearRep'].includes(counterpart.role) : counterpart.role !== 'admin')) return Response.json({ error: 'You can only message a verified admin or member.' }, { status: 403 });
    const { data: existing } = await supabase.from('conversations').select('id').eq('member_id', memberId).eq('admin_id', adminId).maybeSingle();
    if (existing) conversationId = existing.id;
    else {
      const { data: created, error } = await supabase.from('conversations').insert({ member_id: memberId, admin_id: adminId }).select('id').single();
      if (error || !created) return Response.json({ error: error?.message || 'Could not create conversation' }, { status: 500 });
      conversationId = created.id;
    }
  }

  const { data: createdMessage, error } = await supabase.from('messages').insert({ conversation_id: conversationId, sender_id: viewer.id, body: message }).select('id, conversation_id, sender_id, body, created_at, read_at').single();
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ message: createdMessage }, { status: 201 });
}

export async function PATCH(request: Request) {
  const viewer = await getViewer(request);
  if (!viewer || !viewer.is_verified) return Response.json({ error: 'Authentication required' }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const conversationId = typeof body?.conversationId === 'string' ? body.conversationId : '';
  if (!conversationId) return Response.json({ error: 'Conversation is required.' }, { status: 400 });
  const supabase = getClient();
  const { data: conversation } = await supabase.from('conversations').select('id, member_id, admin_id').eq('id', conversationId).maybeSingle();
  if (!conversation || ![conversation.member_id, conversation.admin_id].includes(viewer.id)) return Response.json({ error: 'Conversation not found' }, { status: 404 });
  const { error } = await supabase.from('messages').update({ read_at: new Date().toISOString() }).eq('conversation_id', conversationId).neq('sender_id', viewer.id).is('read_at', null);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}