
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
  userId?: string; // ID của người tạo khoản chi này. Nếu undefined/null là quỹ chung (Admin)
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

export interface SystemLog {
  id: string;
  timestamp: string;
  action: string;
  details: string;
}

export interface User {
  id: string;
  username: string;
  password: string; // In real app, this should be hashed. Here we keep simple for demo/local tool.
  role: 'admin' | 'user';
  createdAt: string;
}

export interface AuthSession {
  user: User;
  expiresAt: number; // Timestamp
}

export enum Tab {
  CALENDAR = 'calendar',
  STATS = 'stats',
  EXPENSES = 'expenses',
  EMPLOYEES = 'employees',
  SCANNER = 'scanner',
  LOGS = 'logs',
  SETTINGS = 'settings'
}
