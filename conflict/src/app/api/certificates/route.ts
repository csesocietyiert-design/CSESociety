import { NextRequest, NextResponse } from "next/server";
import { getCertificatesForMember, issueCertificate } from "@/controllers/certificates";

// GET /api/certificates?member_id=xxx

export async function GET(request: NextRequest) {
  const memberId = request.nextUrl.searchParams.get("member_id");
  if (!memberId) {
    return NextResponse.json({ error: "member_id is required" }, { status: 400 });
  }

  try {
    const certificates = await getCertificatesForMember(memberId);
    return NextResponse.json({ certificates }, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "failed to fetch certificates";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/certificates — issue a certificate

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { member_id, event_id, certificate_url, issued_by } = body;

  if (!member_id || !event_id || !certificate_url || !issued_by) {
    return NextResponse.json({ error: "missing required fields" }, { status: 400 });
  }

  try {
    const certificate = await issueCertificate({ member_id, event_id, certificate_url, issued_by });
    return NextResponse.json({ certificate }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "failed to issue certificate";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

