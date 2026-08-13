// income

export interface Income {
  id: string;
  title: string;
  amount: number;
  category: string;
  date: string;
  description: string | null;
  added_by: string;
  created_at: string;
}

export interface CreateIncomeInput {
  title: string;
  amount: number;
  category: string;
  date: string;
  description?: string;
  added_by: string;
}

// expense

export interface Expense {
  id: string;
  title: string;
  amount: number;
  category: string;
  date: string;
  description: string | null;
  added_by: string;
  receipt_url: string | null;
  created_at: string;
}

export interface CreateExpenseInput {
  title: string;
  amount: number;
  category: string;
  date: string;
  description?: string;
  added_by: string;
  receipt_url?: string;
}

// transaction log

export type TransactionType = "income" | "expense";

export interface Transaction {
  id: string;
  type: TransactionType;
  reference_id: string;
  amount: number;
  date: string;
  created_at: string;
}

// budget summary — computed, not stored

export interface BudgetSummary {
  total_income: number;
  total_expenses: number;
  balance: number;
}
