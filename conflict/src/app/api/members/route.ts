import { NextRequest, NextResponse } from "next/server";
import { getAllMembers, createMember } from "@/controllers/members";

// GET /api/members — get all active members

export async function GET() {
  try {
    const members = await getAllMembers();
    return NextResponse.json({ members }, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "failed to fetch members";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/members — create a new member

export async function POST(request: NextRequest) {
  const body = await request.json();
  const {
    email,
    password,
    full_name,
    roll_number,
    year,
    department,
    phone,
    society_id_code,
  } = body;

  if (!email || !password || !full_name || !roll_number || !year || !department || !society_id_code) {
    return NextResponse.json({ error: "missing required fields" }, { status: 400 });
  }

  try {
    const member = await createMember(
      { user_id: "", full_name, roll_number, year, department, phone },
      email,
      password,
      society_id_code
    );
    return NextResponse.json({ member }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "failed to create member";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

