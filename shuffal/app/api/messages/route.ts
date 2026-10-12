import { createClient } from '@supabase/supabase-js';
import { getSessionUserId } from '@/lib/session';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const rateWindow = new Map<string, { startedAt: number; count: number }>();

type UserRecord = { id: string; name: string; email?: string; cse_id: string; role: string; is_verified?: boolean; year?: number | null };
type LatestMessage = { conversation_id: string; sender_id: string; body: string; created_at: string; read_at: string | null };
type ConversationRecord = {
  id: string;
  member_id: string;
  admin_id: string;
  created_at: string;
  updated_at: string;
  member_deleted_at: string | null;
  admin_deleted_at: string | null;
};

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
  const url = new URL(request.url);
  const search = url.searchParams.get('search')?.trim();
  if (search !== undefined) {
    if (search.length < 2 || search.length > 64) return Response.json({ error: 'Search must be between 2 and 64 characters.' }, { status: 400 });
    const escapedSearch = search.replace(/[\\%_]/g, '\\$&');
    const [byId, byName] = await Promise.all([
      supabase.from('users').select('id, name, cse_id, role').eq('is_verified', true).neq('id', viewer.id).ilike('cse_id', `${escapedSearch}%`).limit(15),
      supabase.from('users').select('id, name, cse_id, role').eq('is_verified', true).neq('id', viewer.id).ilike('name', `%${escapedSearch}%`).order('name').limit(15),
    ]);
    if (byId.error || byName.error) return Response.json({ error: byId.error?.message || byName.error?.message || 'Could not search members.' }, { status: 500 });
    const users = new Map<string, UserRecord>();
    [...(byId.data || []), ...(byName.data || [])].forEach((matchedUser) => users.set(matchedUser.id, matchedUser));
    return Response.json({ users: [...users.values()].slice(0, 20) });
  }

  const conversationId = url.searchParams.get('conversationId');
  if (conversationId) {
    const { data: conversation, error: conversationError } = await supabase.from('conversations').select('id, member_id, admin_id, member_deleted_at, admin_deleted_at').eq('id', conversationId).maybeSingle();
    if (conversationError) return Response.json({ error: conversationError.message }, { status: 500 });
    if (!conversation || ![conversation.member_id, conversation.admin_id].includes(viewer.id)) return Response.json({ error: 'Conversation not found' }, { status: 404 });
    const deletedAt = conversation.member_id === viewer.id ? conversation.member_deleted_at : conversation.admin_deleted_at;
    let messageQuery = supabase.from('messages').select('id, conversation_id, sender_id, body, created_at, read_at').eq('conversation_id', conversationId).order('created_at', { ascending: true });
    if (deletedAt) messageQuery = messageQuery.gt('created_at', deletedAt);
    const { data: messages, error } = await messageQuery;
    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ conversation, messages: messages || [] });
  }

  const conversationColumns = 'id, member_id, admin_id, created_at, updated_at, member_deleted_at, admin_deleted_at';
  const [memberConversations, adminConversations] = await Promise.all([
    supabase.from('conversations').select(conversationColumns).eq('member_id', viewer.id),
    supabase.from('conversations').select(conversationColumns).eq('admin_id', viewer.id),
  ]);
  if (memberConversations.error || adminConversations.error) return Response.json({ error: memberConversations.error?.message || adminConversations.error?.message }, { status: 500 });
  const conversations = [...(memberConversations.data || []), ...(adminConversations.data || [])] as ConversationRecord[];
  conversations.sort((first, second) => new Date(second.updated_at).getTime() - new Date(first.updated_at).getTime());
  const visibleConversations = conversations.filter((conversation) => {
    const deletedAt = conversation.member_id === viewer.id ? conversation.member_deleted_at : conversation.admin_deleted_at;
    return !deletedAt || new Date(conversation.updated_at) > new Date(deletedAt);
  });
  const participantIds = visibleConversations.map((conversation) => conversation.member_id === viewer.id ? conversation.admin_id : conversation.member_id);
  const { data: participants, error: participantsError } = participantIds.length
    ? await supabase.from('users').select('id, name, email, cse_id, role').in('id', participantIds)
    : { data: [] as UserRecord[], error: null };
  if (participantsError) return Response.json({ error: participantsError.message }, { status: 500 });
  const participantById = new Map((participants || []).map((participant) => [participant.id, participant]));
  const { data: latestMessages, error: latestMessagesError } = visibleConversations.length
    ? await supabase.from('messages').select('conversation_id, sender_id, body, created_at, read_at').in('conversation_id', visibleConversations.map((conversation) => conversation.id)).order('created_at', { ascending: false })
    : { data: [] as LatestMessage[], error: null };
  if (latestMessagesError) return Response.json({ error: latestMessagesError.message }, { status: 500 });
  const deletedAtByConversation = new Map(visibleConversations.map((conversation) => [
    conversation.id,
    conversation.member_id === viewer.id ? conversation.member_deleted_at : conversation.admin_deleted_at,
  ]));
  const latestByConversation = new Map<string, LatestMessage>();
  (latestMessages || []).forEach((message) => {
    const deletedAt = deletedAtByConversation.get(message.conversation_id);
    if (!latestByConversation.has(message.conversation_id) && (!deletedAt || new Date(message.created_at) > new Date(deletedAt))) {
      latestByConversation.set(message.conversation_id, message);
    }
  });
  return Response.json({
    conversations: visibleConversations.map((conversation) => {
      const deletedAt = conversation.member_id === viewer.id ? conversation.member_deleted_at : conversation.admin_deleted_at;
      const latestMessage = latestByConversation.get(conversation.id);
      return {
        ...conversation,
        participant: participantById.get(conversation.member_id === viewer.id ? conversation.admin_id : conversation.member_id) || null,
        latestMessage: latestMessage && (!deletedAt || new Date(latestMessage.created_at) > new Date(deletedAt)) ? latestMessage : null,
      };
    }),
  });
}

export async function POST(request: Request) {
  const viewer = await getViewer(request);
  if (!viewer || !viewer.is_verified) return Response.json({ error: 'Authentication required' }, { status: 401 });
  if (isRateLimited(viewer.id)) return Response.json({ error: 'Please wait before sending more messages.' }, { status: 429 });

  const body = await request.json().catch(() => ({}));
  const message = typeof body?.message === 'string' ? body.message.trim() : '';
  if (message.length > 2000) return Response.json({ error: 'Messages cannot exceed 2000 characters.' }, { status: 400 });

  const supabase = getClient();
  let conversationId = typeof body?.conversationId === 'string' ? body.conversationId : '';
  if (conversationId) {
    if (!message) return Response.json({ error: 'Message is required.' }, { status: 400 });
    const { data: conversation, error: conversationError } = await supabase.from('conversations').select('id, member_id, admin_id').eq('id', conversationId).maybeSingle();
    if (conversationError) return Response.json({ error: conversationError.message }, { status: 500 });
    if (!conversation || ![conversation.member_id, conversation.admin_id].includes(viewer.id)) return Response.json({ error: 'Conversation not found' }, { status: 404 });
  } else {
    const counterpartId = typeof body?.counterpartId === 'string' ? body.counterpartId : '';
    if (!counterpartId || counterpartId === viewer.id) return Response.json({ error: 'Choose a valid recipient.' }, { status: 400 });
    const { data: counterpart, error: counterpartError } = await supabase.from('users').select('id, is_verified').eq('id', counterpartId).maybeSingle();
    if (counterpartError) return Response.json({ error: counterpartError.message }, { status: 500 });
    if (!counterpart?.is_verified) return Response.json({ error: 'You can only message verified users.' }, { status: 403 });
    if (!message) return Response.json({ error: 'Message is required.' }, { status: 400 });
    const [memberId, adminId] = [viewer.id, counterpartId].sort();
    const { data: existing, error: existingError } = await supabase.from('conversations').select('id').eq('member_id', memberId).eq('admin_id', adminId).maybeSingle();
    if (existingError) return Response.json({ error: existingError.message }, { status: 500 });
    if (existing) conversationId = existing.id;
    else {
      const { data: created, error } = await supabase.from('conversations').insert({ member_id: memberId, admin_id: adminId }).select('id').single();
      if (error || !created) {
        const { data: racedConversation, error: racedConversationError } = await supabase.from('conversations').select('id').eq('member_id', memberId).eq('admin_id', adminId).maybeSingle();
        if (racedConversationError || !racedConversation) return Response.json({ error: error?.message || racedConversationError?.message || 'Could not create conversation' }, { status: 500 });
        conversationId = racedConversation.id;
      } else conversationId = created.id;
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
  const { data: conversation, error: conversationError } = await supabase.from('conversations').select('id, member_id, admin_id').eq('id', conversationId).maybeSingle();
  if (conversationError) return Response.json({ error: conversationError.message }, { status: 500 });
  if (!conversation || ![conversation.member_id, conversation.admin_id].includes(viewer.id)) return Response.json({ error: 'Conversation not found' }, { status: 404 });
  const { error } = await supabase.from('messages').update({ read_at: new Date().toISOString() }).eq('conversation_id', conversationId).neq('sender_id', viewer.id).is('read_at', null);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}

export async function DELETE(request: Request) {
  const viewer = await getViewer(request);
  if (!viewer || !viewer.is_verified) return Response.json({ error: 'Authentication required' }, { status: 401 });
  const conversationId = new URL(request.url).searchParams.get('conversationId');
  if (!conversationId) return Response.json({ error: 'Conversation is required.' }, { status: 400 });

  const supabase = getClient();
  const { data: conversation, error: conversationError } = await supabase.from('conversations').select('id, member_id, admin_id').eq('id', conversationId).maybeSingle();
  if (conversationError) return Response.json({ error: conversationError.message }, { status: 500 });
  if (!conversation || ![conversation.member_id, conversation.admin_id].includes(viewer.id)) return Response.json({ error: 'Conversation not found' }, { status: 404 });

  const deletedColumn = conversation.member_id === viewer.id ? 'member_deleted_at' : 'admin_deleted_at';
  const { error } = await supabase.from('conversations').update({ [deletedColumn]: new Date().toISOString() }).eq('id', conversationId);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}