import { NextRequest, NextResponse } from "next/server";
import { getAllResources, uploadResource, deleteResource } from "@/controllers/resources";

// GET /api/resources

export async function GET() {
  try {
    const resources = await getAllResources();
    return NextResponse.json({ resources }, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "failed to fetch resources";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/resources

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { title, file_url, uploaded_by, category } = body;

  if (!title || !file_url || !uploaded_by || !category) {
    return NextResponse.json({ error: "missing required fields" }, { status: 400 });
  }

  try {
    const resource = await uploadResource({ title, file_url, uploaded_by, category });
    return NextResponse.json({ resource }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "failed to upload resource";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE /api/resources?id=xxx

export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  try {
    await deleteResource(id);
    return NextResponse.json({ message: "resource deleted" }, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "failed to delete resource";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

