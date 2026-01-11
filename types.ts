
export interface Employee {
  id: string;
  name: string;
  balance: number; // Positive means they overpaid (credit), negative means they owe (debt)
}

export interface LunchItem {
  employeeId: string;
  price: number;
  note?: string;
}

export interface LunchRecord {
  date: string; // YYYY-MM-DD
  items: LunchItem[];
}

export interface ExpenseRecord {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  amount: number;
  note?: string;
}

export interface AppSettings {
  costPerMeal: number;
  expenseThemeColor: string; // 'orange', 'blue', 'green', 'purple', 'pink', 'teal'
}

export interface PaymentExtractionResult {
  matchedEmployeeId: string | null;
  amount: number;
  confidence: string;
}

export enum Tab {
  CALENDAR = 'calendar',
  STATS = 'stats',
  EXPENSES = 'expenses', // New Tab
  EMPLOYEES = 'employees',
  SCANNER = 'scanner',
  SETTINGS = 'settings'
}
