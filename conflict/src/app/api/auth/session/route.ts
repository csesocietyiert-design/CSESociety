import { NextResponse } from "next/server";
import { getCurrentMember, getCurrentRole } from "@/controllers/auth";

// GET /api/auth/session — returns the current user session and role

export async function GET() {
  const member = await getCurrentMember();
  const role = await getCurrentRole();

  if (!member) {
    return NextResponse.json({ error: "not authenticated" }, { status: 401 });
  }

  return NextResponse.json({ member, role }, { status: 200 });
}

