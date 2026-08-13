import { NextRequest, NextResponse } from "next/server";
import { getAllIncome, addIncome, deleteIncome } from "@/controllers/finance";

// GET /api/finance/income

export async function GET() {
  try {
    const income = await getAllIncome();
    return NextResponse.json({ income }, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "failed to fetch income";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/finance/income

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { title, amount, category, date, description, added_by } = body;

  if (!title || !amount || !category || !date || !added_by) {
    return NextResponse.json({ error: "missing required fields" }, { status: 400 });
  }

  try {
    const record = await addIncome({ title, amount, category, date, description, added_by });
    return NextResponse.json({ income: record }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "failed to add income";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE /api/finance/income?id=xxx

export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  try {
    await deleteIncome(id);
    return NextResponse.json({ message: "income deleted" }, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "failed to delete income";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

