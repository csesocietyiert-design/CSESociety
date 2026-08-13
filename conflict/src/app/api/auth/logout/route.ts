import { NextResponse } from "next/server";
import { signOut } from "@/controllers/auth";

// POST /api/auth/logout

export async function POST() {
  try {
    await signOut();
    return NextResponse.json({ message: "logged out" }, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "logout failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

