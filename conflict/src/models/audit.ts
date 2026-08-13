// audit log — every significant action is recorded here

export interface AuditLog {
  id: string;
  action: string;
  performed_by: string;
  target_table: string;
  target_id: string;
  details: Record<string, unknown> | null;
  created_at: string;
}

export interface CreateAuditLogInput {
  action: string;
  performed_by: string;
  target_table: string;
  target_id: string;
  details?: Record<string, unknown>;
}
