import { NextResponse } from "next/server";
import { getAllTransactions, getBudgetSummary } from "@/controllers/finance";

// GET /api/finance/transactions

export async function GET() {
  try {
    const transactions = await getAllTransactions();
    const budget = await getBudgetSummary();
    return NextResponse.json({ transactions, budget }, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "failed to fetch transactions";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

