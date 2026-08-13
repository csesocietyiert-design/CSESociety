import { NextResponse } from "next/server";
import { getAuditLogs } from "@/controllers/audit";

// GET /api/admin/audit-logs

export async function GET() {
  try {
    const logs = await getAuditLogs();
    return NextResponse.json({ logs }, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "failed to fetch audit logs";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

