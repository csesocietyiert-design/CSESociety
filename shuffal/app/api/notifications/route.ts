import { createClient } from '@supabase/supabase-js';
import { logActivity } from '@/lib/activity-logger';

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

const localDemoCseIds: Record<string, string> = {
  '11111111-1111-4111-8111-111111111111': '23F2601',
  '22222222-2222-4222-8222-222222222222': '23F2602',
  '33333333-3333-4333-8333-333333333333': '23F2603',
};

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

    const userId = new URL(request.url).searchParams.get('user_id');
    if (userId && !isValidUuid(userId)) {
      return Response.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    let resolvedUserId = userId;
    if (userId && localDemoCseIds[userId]) {
      const { data: mappedUser, error: mappingError } = await supabase
        .from('users')
        .select('id')
        .eq('cse_id', localDemoCseIds[userId])
        .maybeSingle();
      if (mappingError) throw mappingError;
      resolvedUserId = mappedUser?.id || userId;
    }

    let query = supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false });

    if (resolvedUserId) {
      query = query.or(`user_id.eq.${resolvedUserId},sender_id.eq.${resolvedUserId}`);
    }

    const { data, error } = await query;

    if (error) throw error;
    return Response.json({ notifications: userId ? summarizeSentNotifications(data || [], resolvedUserId || userId) : data || [] });
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

    const { user_id: userId } = await request.json();
    if (!userId || !isValidUuid(userId)) {
      return Response.json({ error: 'Valid user ID is required' }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    let resolvedUserId = userId;
    if (localDemoCseIds[userId]) {
      const { data: mappedUser, error: mappingError } = await supabase
        .from('users')
        .select('id')
        .eq('cse_id', localDemoCseIds[userId])
        .maybeSingle();
      if (mappingError) throw mappingError;
      resolvedUserId = mappedUser?.id || userId;
    }

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

    const { user_id: userId } = await request.json();
    if (!userId || !isValidUuid(userId)) {
      return Response.json({ error: 'Valid user ID is required' }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    let resolvedUserId = userId;
    if (localDemoCseIds[userId]) {
      const { data: mappedUser, error: mappingError } = await supabase
        .from('users')
        .select('id')
        .eq('cse_id', localDemoCseIds[userId])
        .maybeSingle();
      if (mappingError) throw mappingError;
      resolvedUserId = mappedUser?.id || userId;
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
      senderId,
      recipientType,
      recipientIds = [],
      targetRole,
      targetYear,
    } = body ?? {};

    if (!title || !message) {
      return Response.json(
        { error: 'Title and message are required' },
        { status: 400 }
      );
    }

    if (!Array.isArray(recipientIds) || recipientIds.length === 0) {
      return Response.json(
        { error: 'At least one recipient is required' },
        { status: 400 }
      );
    }

    const invalidRecipientIds = recipientIds.filter(
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

    const { data: recipientUsers, error: recipientCheckError } = await supabase
      .from('users')
      .select('id')
      .in('id', recipientIds);

    if (recipientCheckError) {
      throw recipientCheckError;
    }

    const existingRecipientIds = new Set(
      (recipientUsers || []).map((recipientUser) => recipientUser.id)
    );
    const missingRecipientIds = recipientIds.filter(
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
    if (senderId) {
      const { data: senderUser, error: senderCheckError } = await supabase
        .from('users')
        .select('id')
        .eq('id', senderId)
        .maybeSingle();

      if (!senderCheckError && senderUser?.id) {
        validSenderId = senderUser.id;
      }
    }

    const notificationsToCreate = recipientIds.map((recipientId: string) => ({
      user_id: recipientId,
      title: String(title).trim(),
      message: String(message).trim(),
      sender_id: validSenderId,
      recipient_type: recipientType || 'specific',
      target_role: targetRole || null,
      target_year: targetYear ?? null,
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
