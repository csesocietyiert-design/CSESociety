import { NextRequest, NextResponse } from "next/server";
import { getMemberBySocietyId } from "@/controllers/members";

// GET /api/admin/society-id?code=23F2601 — look up member by society id

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  if (!code) {
    return NextResponse.json({ error: "code is required" }, { status: 400 });
  }

  try {
    const member = await getMemberBySocietyId(code);
    if (!member) {
      return NextResponse.json({ error: "no member found with this society id" }, { status: 404 });
    }
    return NextResponse.json({ member }, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "lookup failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

