import { NextRequest, NextResponse } from "next/server";
import { getMemberById, updateMember, deactivateMember } from "@/controllers/members";

// GET /api/members/[id]

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const member = await getMemberById(id);
    return NextResponse.json({ member }, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "member not found";
    return NextResponse.json({ error: message }, { status: 404 });
  }
}

// PATCH /api/members/[id]

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  try {
    const member = await updateMember(id, body);
    return NextResponse.json({ member }, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "update failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE /api/members/[id] — soft deactivate

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await deactivateMember(id);
    return NextResponse.json({ message: "member deactivated" }, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "deactivation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
