import { NextRequest, NextResponse } from "next/server";
import { getAllExpenses, addExpense, deleteExpense } from "@/controllers/finance";

// GET /api/finance/expenses

export async function GET() {
  try {
    const expenses = await getAllExpenses();
    return NextResponse.json({ expenses }, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "failed to fetch expenses";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/finance/expenses

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { title, amount, category, date, description, added_by, receipt_url } = body;

  if (!title || !amount || !category || !date || !added_by) {
    return NextResponse.json({ error: "missing required fields" }, { status: 400 });
  }

  try {
    const record = await addExpense({ title, amount, category, date, description, added_by, receipt_url });
    return NextResponse.json({ expense: record }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "failed to add expense";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE /api/finance/expenses?id=xxx

export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  try {
    await deleteExpense(id);
    return NextResponse.json({ message: "expense deleted" }, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "failed to delete expense";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

