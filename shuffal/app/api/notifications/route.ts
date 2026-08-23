import { createClient } from '@supabase/supabase-js';
import { logActivity } from '@/lib/activity-logger';
import { getSessionUserId } from '@/lib/session';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

function isValidUuid(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(value.trim());
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }
  return 'Failed to send notification';
}

function getErrorDetails(error: unknown) {
  if (!error || typeof error !== 'object') return undefined;

  const databaseError = error as Record<string, unknown>;
  return {
    code: databaseError.code,
    hint: databaseError.hint,
    details: databaseError.details,
  };
}

function summarizeSentNotifications(notifications: Array<Record<string, any>>, senderId: string) {
  const summaries = new Map<string, Record<string, any>>();

  for (const notification of notifications) {
    if (notification.sender_id !== senderId) {
      summaries.set(notification.id, notification);
      continue;
    }

    const groupKey = [
      notification.title,
      notification.message,
      notification.recipient_type,
      notification.target_role,
      notification.target_year,
      Math.floor(new Date(notification.created_at).getTime() / 5000),
    ].join('|');
    const existing = summaries.get(groupKey);
    if (existing) {
      existing.recipient_count = (existing.recipient_count || 1) + 1;
    } else {
      summaries.set(groupKey, { ...notification, recipient_count: 1 });
    }
  }

  return [...summaries.values()].sort((first, second) => new Date(second.created_at).getTime() - new Date(first.created_at).getTime());
}

const notificationTeamRoles = new Set([
  'admin',
  'faculty',
  'vice_president',
  'general_secretary',
  'treasurer',
  'technical_secretary',
  'cultural_secretary',
  'year_representative',
  'yearRep',
]);

export async function GET(request: Request) {
  try {
    if (!supabaseUrl || !serviceRoleKey) {
      return Response.json(
        { error: 'Supabase not configured' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const resolvedUserId = getSessionUserId(request);
    if (!resolvedUserId || !isValidUuid(resolvedUserId)) return Response.json({ error: 'Authentication required' }, { status: 401 });

    let query = supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false });

    query = query.or(`user_id.eq.${resolvedUserId},sender_id.eq.${resolvedUserId}`);

    const { data, error } = await query;

    if (error) throw error;
    let requestedUserIsAdmin = false;
    if (resolvedUserId) {
      const { data: requestedUser, error: requestedUserError } = await supabase
        .from('users')
        .select('role')
        .eq('id', resolvedUserId)
        .maybeSingle();
      if (requestedUserError) throw requestedUserError;
      requestedUserIsAdmin = requestedUser?.role === 'admin';
    }
    const visibleNotifications = (data || []).filter((notification) =>
      !notification.is_anonymous || notification.sender_id === resolvedUserId || (requestedUserIsAdmin && notification.user_id === resolvedUserId)
    );
    const summarizedNotifications = summarizeSentNotifications(visibleNotifications, resolvedUserId).map((notification) => ({
      ...notification,
      sent_by_me: notification.sender_id === resolvedUserId,
      sender_id: notification.is_anonymous ? null : notification.sender_id,
    }));
    return Response.json({ notifications: summarizedNotifications });
  } catch (error) {
    console.error('Notification history error:', error);
    return Response.json(
      { error: getErrorMessage(error), details: getErrorDetails(error) },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    if (!supabaseUrl || !serviceRoleKey) {
      return Response.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    const resolvedUserId = getSessionUserId(request);
    if (!resolvedUserId || !isValidUuid(resolvedUserId)) return Response.json({ error: 'Authentication required' }, { status: 401 });

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', resolvedUserId)
      .eq('is_read', false);
    if (error) throw error;
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    if (!supabaseUrl || !serviceRoleKey) {
      return Response.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    const { notification_id: notificationId } = await request.json();
    const resolvedUserId = getSessionUserId(request);
    if (!resolvedUserId || !isValidUuid(resolvedUserId)) return Response.json({ error: 'Authentication required' }, { status: 401 });

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    if (notificationId) {
      const { data: notification, error: notificationError } = await supabase
        .from('notifications')
        .select('id, user_id, sender_id, title, message, recipient_type, target_role, target_year, created_at')
        .eq('id', notificationId)
        .maybeSingle();
      if (notificationError) throw notificationError;
      if (!notification || (notification.user_id !== resolvedUserId && notification.sender_id !== resolvedUserId)) {
        return Response.json({ error: 'Notification not found' }, { status: 404 });
      }

      const sentByUser = notification.sender_id === resolvedUserId;
      let deleteQuery = supabase.from('notifications').delete().eq('id', notificationId);
      if (sentByUser) {
        const start = new Date(new Date(notification.created_at).getTime() - 5000).toISOString();
        const end = new Date(new Date(notification.created_at).getTime() + 5000).toISOString();
        deleteQuery = supabase
          .from('notifications')
          .delete()
          .eq('sender_id', resolvedUserId)
          .eq('title', notification.title)
          .eq('message', notification.message)
          .eq('recipient_type', notification.recipient_type)
          .gte('created_at', start)
          .lte('created_at', end);
      }
      const { error: deleteNotificationError } = await deleteQuery;
      if (deleteNotificationError) throw deleteNotificationError;
      return Response.json({ ok: true });
    }

    const { error } = await supabase
      .from('notifications')
      .delete()
      .or(`user_id.eq.${resolvedUserId},sender_id.eq.${resolvedUserId}`);
    if (error) throw error;

    return Response.json({ ok: true });
  } catch (error) {
    console.error('Notification history clear error:', error);
    return Response.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    if (!supabaseUrl || !serviceRoleKey) {
      return Response.json(
        { error: 'Supabase not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const {
      title,
      message,
      recipientType,
      recipientIds = [],
      targetRole,
      targetYear,
      isAnonymous = false,
    } = body ?? {};
    const senderId = getSessionUserId(request);
    if (!senderId || !isValidUuid(senderId)) return Response.json({ error: 'Authentication required' }, { status: 401 });

    if (!title || !message) {
      return Response.json(
        { error: 'Title and message are required' },
        { status: 400 }
      );
    }

    if (!Array.isArray(recipientIds) || (recipientIds.length === 0 && !isAnonymous && recipientType !== 'own_year')) {
      return Response.json(
        { error: 'At least one recipient is required' },
        { status: 400 }
      );
    }

    let resolvedRecipientIds = recipientIds as string[];
    const invalidRecipientIds = resolvedRecipientIds.filter(
      (id) => typeof id !== 'string' || !isValidUuid(id)
    );

    if (invalidRecipientIds.length > 0) {
      return Response.json(
        {
          error:
            'Invalid recipient user IDs were supplied. Use UUID values from the authenticated user records.',
          invalidRecipientIds,
        },
        { status: 400 }
      );
    }

    if (senderId && !isValidUuid(senderId)) {
      return Response.json(
        {
          error:
            'Invalid sender user ID. The authenticated user must be a valid UUID.',
          senderId,
        },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    if (isAnonymous) {
      const { data: admins, error: adminsError } = await supabase
        .from('users')
        .select('id')
        .eq('role', 'admin')
        .neq('is_verified', false);
      if (adminsError) throw adminsError;
      resolvedRecipientIds = (admins || []).map((admin) => admin.id);
      if (resolvedRecipientIds.length === 0) return Response.json({ error: 'No verified admin is available to receive anonymous mail.' }, { status: 503 });
    }

    if (recipientType === 'own_year') {
      const { data: senderProfile, error: senderProfileError } = await supabase
        .from('users')
        .select('role, year, is_verified')
        .eq('id', senderId)
        .maybeSingle();
      if (senderProfileError) throw senderProfileError;
      if (!senderProfile || !['year_representative', 'yearRep'].includes(senderProfile.role) || senderProfile.is_verified === false || !senderProfile.year) {
        return Response.json({ error: 'Only verified year representatives can message their own year.' }, { status: 403 });
      }
      const { data: yearMembers, error: yearMembersError } = await supabase
        .from('users')
        .select('id')
        .eq('year', senderProfile.year)
        .eq('role', 'member')
        .neq('is_verified', false);
      if (yearMembersError) throw yearMembersError;
      resolvedRecipientIds = (yearMembers || []).map((member) => member.id);
    }

    const { data: recipientUsers, error: recipientCheckError } = await supabase
      .from('users')
      .select('id')
      .in('id', resolvedRecipientIds);

    if (recipientCheckError) {
      throw recipientCheckError;
    }

    const existingRecipientIds = new Set(
      (recipientUsers || []).map((recipientUser) => recipientUser.id)
    );
    const missingRecipientIds = resolvedRecipientIds.filter(
      (recipientId: string) => !existingRecipientIds.has(recipientId)
    );

    if (missingRecipientIds.length > 0) {
      return Response.json(
        {
          error: 'One or more notification recipients do not exist in the users table.',
          missingRecipientIds,
        },
        { status: 400 }
      );
    }

    let validSenderId: string | null = null;
    let senderRole = '';
    if (senderId) {
      const { data: senderUser, error: senderCheckError } = await supabase
        .from('users')
        .select('id, role, is_verified')
        .eq('id', senderId)
        .maybeSingle();

      if (!senderCheckError && senderUser?.id && senderUser.is_verified !== false && (notificationTeamRoles.has(senderUser.role) || senderUser.role === 'member' || (isAnonymous && senderUser.role !== 'admin'))) {
        validSenderId = senderUser.id;
        senderRole = senderUser.role;
      }
    }

    if (!validSenderId) {
      return Response.json({ error: 'Only verified society team members can send notifications.' }, { status: 403 });
    }
    if (isAnonymous && senderRole === 'admin') {
      return Response.json({ error: 'Admins cannot send anonymous mail.' }, { status: 403 });
    }
    if (senderRole === 'member' && !isAnonymous) {
      return Response.json({ error: 'Members can only send anonymous messages.' }, { status: 403 });
    }
    if (isAnonymous) {
      const { data: recipientUsersForAnonymous, error: recipientRoleError } = await supabase
        .from('users')
        .select('id, role, is_verified')
        .in('id', resolvedRecipientIds);
      if (recipientRoleError) throw recipientRoleError;
      const allRecipientsAreAdmins = (recipientUsersForAnonymous || []).length === resolvedRecipientIds.length && (recipientUsersForAnonymous || []).every((recipientUser) => recipientUser.role === 'admin' && recipientUser.is_verified !== false);
      if (!allRecipientsAreAdmins) return Response.json({ error: 'Anonymous Mails can only be sent to verified admins.' }, { status: 403 });
    }
    if (recipientType === 'all' && senderRole !== 'admin') {
      return Response.json({ error: 'Only the admin can send notifications to all society members.' }, { status: 403 });
    }

    const notificationsToCreate = resolvedRecipientIds.map((recipientId: string) => ({
      user_id: recipientId,
      title: String(title).trim(),
      message: String(message).trim(),
      sender_id: validSenderId,
      recipient_type: recipientType || 'specific',
      target_role: targetRole || null,
      target_year: targetYear ?? null,
      is_anonymous: Boolean(isAnonymous),
      type: 'info',
      is_read: false,
    }));

    const { error } = await supabase
      .from('notifications')
      .insert(notificationsToCreate);

    if (error) {
      if (
        error.message?.includes("Could not find the 'message' column") ||
        error.message?.includes("Could not find the 'title' column") ||
        error.message?.includes("column of 'notifications'")
      ) {
        throw new Error(
          'The notifications table in Supabase is missing required columns. Run the notifications schema fix migration in the Supabase SQL editor.'
        );
      }
      throw error;
    }

    await logActivity(supabase, {
      userId: validSenderId,
      action: 'Notification Sent',
      description: `${String(title).trim()} sent to ${notificationsToCreate.length} recipient${notificationsToCreate.length === 1 ? '' : 's'}`,
      entityType: 'notification',
    });

    return Response.json({ ok: true, created: notificationsToCreate.length });
  } catch (error) {
    console.error('Notification send error:', error);
    return Response.json(
      {
        error: getErrorMessage(error),
        details: getErrorDetails(error),
      },
      { status: 400 }
    );
  }
}
