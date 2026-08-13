import { NextRequest, NextResponse } from "next/server";
import { signIn } from "@/controllers/auth";

// POST /api/auth/login

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { email, password } = body;

  if (!email || !password) {
    return NextResponse.json(
      { error: "email and password are required" },
      { status: 400 }
    );
  }

  try {
    const data = await signIn(email, password);
    return NextResponse.json({ user: data.user }, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "login failed";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}

