type ActivityClient = {
  from: (table: string) => {
    insert: (values: Record<string, unknown>) => PromiseLike<{ error: { message?: string } | null }>;
  };
};

export async function logActivity(
  supabase: ActivityClient,
  activity: {
    userId?: string | null;
    action: string;
    description: string;
    entityType?: string;
    entityId?: string | null;
  }
) {
  try {
    const { error } = await supabase.from('activity_logs').insert({
      user_id: activity.userId || null,
      action: activity.action,
      description: activity.description,
      entity_type: activity.entityType || null,
      entity_id: activity.entityId || null,
    });
    if (error) console.error('Activity log error:', error.message || error);
  } catch (error) {
    console.error('Activity log error:', error);
  }
}
