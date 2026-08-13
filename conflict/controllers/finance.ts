import { createClient } from "@/lib/supabase/server";
import type {
  CreateIncomeInput,
  CreateExpenseInput,
  BudgetSummary,
} from "../models/finance";

// income

export async function getAllIncome() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("income")
    .select("*")
    .order("date", { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

export async function addIncome(input: CreateIncomeInput) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("income")
    .insert(input)
    .select()
    .single();
  if (error) throw new Error(error.message);

  // record in transactions
  await supabase.from("transactions").insert({
    type: "income",
    reference_id: data.id,
    amount: input.amount,
    date: input.date,
  });

  return data;
}

export async function deleteIncome(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("income").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// expenses

export async function getAllExpenses() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("expenses")
    .select("*")
    .order("date", { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

export async function addExpense(input: CreateExpenseInput) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("expenses")
    .insert(input)
    .select()
    .single();
  if (error) throw new Error(error.message);

  // record in transactions
  await supabase.from("transactions").insert({
    type: "expense",
    reference_id: data.id,
    amount: input.amount,
    date: input.date,
  });

  return data;
}

export async function deleteExpense(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("expenses").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// transactions

export async function getAllTransactions() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .order("date", { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

// budget summary — total income minus total expenses

export async function getBudgetSummary(): Promise<BudgetSummary> {
  const supabase = await createClient();

  const { data: incomeData } = await supabase.from("income").select("amount");
  const { data: expenseData } = await supabase.from("expenses").select("amount");

  const totalIncome = (incomeData ?? []).reduce(
    (sum: number, row: { amount: number }) => sum + row.amount,
    0
  );
  const totalExpenses = (expenseData ?? []).reduce(
    (sum: number, row: { amount: number }) => sum + row.amount,
    0
  );

  return {
    total_income: totalIncome,
    total_expenses: totalExpenses,
    balance: totalIncome - totalExpenses,
  };
}
