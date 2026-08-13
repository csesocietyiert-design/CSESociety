import { NextRequest, NextResponse } from "next/server";
import { getMemberRoles, assignRole, removeRole } from "@/controllers/roles";
import type { RoleName } from "@/models/role";

// GET /api/members/[id]/role

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const roles = await getMemberRoles(id);
    return NextResponse.json({ roles }, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "failed to fetch roles";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/members/[id]/role — assign a role

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { role_name, assigned_by } = body;

  if (!role_name || !assigned_by) {
    return NextResponse.json(
      { error: "role_name and assigned_by are required" },
      { status: 400 }
    );
  }

  try {
    const memberRole = await assignRole(id, role_name as RoleName, assigned_by);
    return NextResponse.json({ member_role: memberRole }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "role assignment failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE /api/members/[id]/role — remove a role

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { role_name } = body;

  if (!role_name) {
    return NextResponse.json({ error: "role_name is required" }, { status: 400 });
  }

  try {
    await removeRole(id, role_name as RoleName);
    return NextResponse.json({ message: "role removed" }, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "role removal failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
