
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

export interface DebtRecord {
  id: string;
  userId: string; // Thuộc về user nào
  type: 'borrow' | 'lend'; // borrow: Mình đi vay, lend: Mình cho vay
  personName: string; // Người liên quan
  amount: number; // Tổng tiền
  paidAmount: number; // Đã trả/Đã thu
  startDate: string;
  dueDate?: string;
  note?: string;
  isFinished: boolean;
}

export interface AppSettings {
  costPerMeal: number;
  themeColor: string; // 'orange', 'blue', 'green', 'purple', 'pink', 'teal'
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

// Helper Interface for Theme
export interface ThemeClasses {
  name: string;
  text: string;           // text-color-600
  textLight: string;      // text-color-100
  textDark: string;       // text-color-800
  bg: string;             // bg-color-50
  bgSoft: string;         // bg-color-100
  bgDark: string;         // bg-color-600
  bgDarkHover: string;    // hover:bg-color-700
  border: string;         // border-color-200
  borderDark: string;     // border-color-500
  ring: string;           // focus:ring-color-500
  gradient: string;       // from-color-500 to-color-600
  shadow: string;         // shadow-color-200
  icon: string;           // text-color-500
}
