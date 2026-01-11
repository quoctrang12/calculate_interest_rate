import React, { useState, useEffect, useRef } from 'react';
import { Employee, LunchRecord, LunchItem, AppSettings, Tab, ExpenseRecord } from './types';
import { CalendarView } from './components/CalendarView';
import { EmployeeList } from './components/EmployeeList';
import { PaymentScanner } from './components/PaymentScanner';
import { StatsView } from './components/StatsView';
import { ExpenseManager } from './components/ExpenseManager';
import { Calendar, Users, ScanLine, Settings, Utensils, PieChart, Wallet, Layers, Check, Download, Upload, Trash2, Database, AlertTriangle } from 'lucide-react';

export default function App() {
  // --- State ---
  const [activeTab, setActiveTab] = useState<Tab>(Tab.CALENDAR);
  
  const [employees, setEmployees] = useState<Employee[]>(() => {
    const saved = localStorage.getItem('employees');
    return saved ? JSON.parse(saved) : [];
  });

  const [lunchRecords, setLunchRecords] = useState<LunchRecord[]>(() => {
    const saved = localStorage.getItem('lunchRecords');
    return saved ? JSON.parse(saved) : [];
  });

  const [expenseRecords, setExpenseRecords] = useState<ExpenseRecord[]>(() => {
    const saved = localStorage.getItem('expenseRecords');
    return saved ? JSON.parse(saved) : [];
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('settings');
    const defaultSettings = { costPerMeal: 35000, expenseThemeColor: 'orange' };
    return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Effects ---
  useEffect(() => {
    localStorage.setItem('employees', JSON.stringify(employees));
  }, [employees]);

  useEffect(() => {
    localStorage.setItem('lunchRecords', JSON.stringify(lunchRecords));
  }, [lunchRecords]);

  useEffect(() => {
    localStorage.setItem('expenseRecords', JSON.stringify(expenseRecords));
  }, [expenseRecords]);

  useEffect(() => {
    localStorage.setItem('settings', JSON.stringify(settings));
  }, [settings]);

  // --- Actions ---

  const addEmployee = (name: string) => {
    const newEmp: Employee = {
      id: Date.now().toString(),
      name,
      balance: 0
    };
    setEmployees([...employees, newEmp]);
  };

  const removeEmployee = (id: string) => {
    setEmployees(employees.filter(e => e.id !== id));
  };

  const updateLunchRecord = (date: string, newItems: LunchItem[]) => {
    const prevRecord = lunchRecords.find(r => r.date === date);
    
    setEmployees(currentEmps => currentEmps.map(emp => {
      let balanceChange = 0;
      
      // 1. Revert effect of previous record (Refund the money)
      if (prevRecord) {
        const oldItem = prevRecord.items.find(i => i.employeeId === emp.id);
        if (oldItem) {
          balanceChange += oldItem.price;
        }
      }

      // 2. Apply effect of new record (Charge the money)
      const newItem = newItems.find(i => i.employeeId === emp.id);
      if (newItem) {
        balanceChange -= newItem.price;
      }
      
      return { ...emp, balance: emp.balance + balanceChange };
    }));

    // Update records storage
    const otherRecords = lunchRecords.filter(r => r.date !== date);
    if (newItems.length > 0) {
      setLunchRecords([...otherRecords, { date, items: newItems }]);
    } else {
      setLunchRecords(otherRecords);
    }
  };

  const processPayment = (employeeId: string, amount: number) => {
    setEmployees(emps => emps.map(e => 
      e.id === employeeId ? { ...e, balance: e.balance + amount } : e
    ));
  };

  // Manual adjustment (Manual debt subtraction or credit addition)
  const adjustBalance = (employeeId: string, amount: number) => {
    setEmployees(emps => emps.map(e => 
      e.id === employeeId ? { ...e, balance: e.balance + amount } : e
    ));
  };

  const addExpense = (expense: ExpenseRecord) => {
    setExpenseRecords([...expenseRecords, expense]);
  };

  const removeExpense = (id: string) => {
    setExpenseRecords(expenseRecords.filter(e => e.id !== id));
  };

  // --- Data Management Actions ---
  const handleExportData = () => {
    const data = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      employees,
      lunchRecords,
      expenseRecords,
      settings
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `TrangNQ_Backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);

        // Basic validation
        if (!data.employees && !data.lunchRecords) {
           alert("File không hợp lệ!");
           return;
        }

        if (window.confirm("Hành động này sẽ ghi đè dữ liệu hiện tại bằng dữ liệu trong file. Bạn có chắc chắn không?")) {
          if (data.employees) setEmployees(data.employees);
          if (data.lunchRecords) setLunchRecords(data.lunchRecords);
          if (data.expenseRecords) setExpenseRecords(data.expenseRecords);
          if (data.settings) setSettings(data.settings);
          alert("Khôi phục dữ liệu thành công!");
        }
      } catch (error) {
        alert("Lỗi khi đọc file backup. Vui lòng thử lại.");
        console.error(error);
      }
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const handleResetData = () => {
    if (window.confirm("CẢNH BÁO: Tất cả dữ liệu (nhân viên, lịch sử, chi tiêu) sẽ bị xóa vĩnh viễn. Bạn có chắc chắn muốn xóa không?")) {
       setEmployees([]);
       setLunchRecords([]);
       setExpenseRecords([]);
       setSettings({ costPerMeal: 35000, expenseThemeColor: 'orange' });
       alert("Đã xóa toàn bộ dữ liệu về trạng thái ban đầu.");
    }
  };

  // --- Helpers ---
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  // --- Theme Helper for Nav ---
  const getNavColor = (tabId: Tab) => {
    if (tabId !== Tab.EXPENSES) return null;
    const map: Record<string, {text: string, bg: string}> = {
      orange: { text: 'text-orange-500', bg: 'bg-orange-50' },
      blue: { text: 'text-blue-500', bg: 'bg-blue-50' },
      green: { text: 'text-green-500', bg: 'bg-green-50' },
      purple: { text: 'text-purple-500', bg: 'bg-purple-50' },
      pink: { text: 'text-pink-500', bg: 'bg-pink-50' },
      teal: { text: 'text-teal-500', bg: 'bg-teal-50' },
    };
    return map[settings.expenseThemeColor] || map.orange;
  };

  const expenseNavStyle = getNavColor(Tab.EXPENSES) || { text: 'text-orange-500', bg: 'bg-orange-50' };

  // --- Navigation Config ---
  const navItems = [
    { id: Tab.CALENDAR, label: 'Ăn trưa', icon: Calendar, color: 'text-blue-600', activeColor: 'bg-blue-50' },
    { id: Tab.EXPENSES, label: 'Quỹ chi', icon: Wallet, color: expenseNavStyle.text, activeColor: expenseNavStyle.bg },
    { id: Tab.STATS, label: 'Thống kê', icon: PieChart, color: 'text-violet-600', activeColor: 'bg-violet-50' },
    { id: Tab.SCANNER, label: 'AI Scan', icon: ScanLine, color: 'text-indigo-600', activeColor: 'bg-indigo-50' },
    { id: Tab.EMPLOYEES, label: 'Nhân sự', icon: Users, color: 'text-teal-600', activeColor: 'bg-teal-50' },
  ];

  const themeColors = [
    { id: 'orange', class: 'bg-orange-500' },
    { id: 'blue', class: 'bg-blue-500' },
    { id: 'green', class: 'bg-green-500' },
    { id: 'purple', class: 'bg-purple-500' },
    { id: 'pink', class: 'bg-pink-500' },
    { id: 'teal', class: 'bg-teal-500' },
  ];

  // --- Render ---
  return (
    <div className="bg-gray-50 h-screen w-full overflow-hidden flex flex-col font-sans text-gray-900">
      
      {/* Modern Header */}
      <header className="bg-white/85 backdrop-blur-xl border-b border-gray-100 px-4 py-3 flex justify-between items-center z-50 sticky top-0 shadow-sm transition-all">
        <div className="flex items-center gap-3">
           <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2 rounded-xl shadow-lg shadow-blue-200">
             <Layers size={20} className="text-white" />
           </div>
           <div>
             <h1 className="text-lg font-bold text-gray-800 leading-none tracking-tight">TrangNQ Tools</h1>
             <p className="text-[10px] font-medium text-gray-400 mt-1">Quản lý hiệu quả</p>
           </div>
        </div>
        <button 
          onClick={() => setActiveTab(Tab.SETTINGS)}
          className={`p-2.5 rounded-full transition-all duration-300 ${activeTab === Tab.SETTINGS ? 'bg-gray-100 text-indigo-600 rotate-90' : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'}`}
        >
          <Settings size={22} strokeWidth={2} />
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden relative">
        <div className="h-full overflow-y-auto scroll-smooth">
          {activeTab === Tab.CALENDAR && (
            <div className="animate-fade-in">
              <CalendarView 
                employees={employees} 
                lunchRecords={lunchRecords} 
                defaultCost={settings.costPerMeal}
                onSaveLunch={updateLunchRecord} 
              />
            </div>
          )}

          {activeTab === Tab.EXPENSES && (
            <div className="animate-fade-in">
              <ExpenseManager
                expenses={expenseRecords}
                onAddExpense={addExpense}
                onRemoveExpense={removeExpense}
                currencyFormatter={formatCurrency}
                themeColor={settings.expenseThemeColor}
              />
            </div>
          )}

          {activeTab === Tab.STATS && (
            <div className="animate-fade-in">
              <StatsView
                employees={employees}
                lunchRecords={lunchRecords}
                currencyFormatter={formatCurrency}
              />
            </div>
          )}

          {activeTab === Tab.EMPLOYEES && (
             <div className="animate-fade-in">
              <EmployeeList 
                employees={employees} 
                onAddEmployee={addEmployee} 
                onRemoveEmployee={removeEmployee}
                onAdjustBalance={adjustBalance}
                currencyFormatter={formatCurrency}
              />
            </div>
          )}

          {activeTab === Tab.SCANNER && (
             <div className="animate-fade-in">
              <PaymentScanner 
                employees={employees}
                onConfirmPayment={processPayment}
                currencyFormatter={formatCurrency}
              />
            </div>
          )}

          {activeTab === Tab.SETTINGS && (
            <div className="p-4 space-y-6 animate-fade-in pb-24">
              {/* General Settings */}
              <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100">
                 <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2 border-b border-gray-100 pb-2">
                  <Settings size={20} className="text-gray-500" /> Thiết lập hệ thống
                 </h2>
                 
                 <div className="space-y-6">
                   <div>
                     <label className="block text-sm font-semibold text-gray-700 mb-2">Giá tiền mặc định / bữa</label>
                     <div className="relative group">
                       <input 
                          type="number" 
                          value={settings.costPerMeal}
                          onChange={(e) => setSettings({ ...settings, costPerMeal: Number(e.target.value) })}
                          className="w-full p-4 pl-12 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none font-bold text-gray-800"
                       />
                       <span className="absolute left-4 top-4 text-gray-400 font-bold group-focus-within:text-indigo-500">₫</span>
                     </div>
                   </div>

                   <div>
                     <label className="block text-sm font-semibold text-gray-700 mb-3">Màu chủ đạo Quỹ chi</label>
                     <div className="flex flex-wrap gap-3">
                        {themeColors.map((t) => (
                          <button
                            key={t.id}
                            onClick={() => setSettings({ ...settings, expenseThemeColor: t.id })}
                            className={`w-10 h-10 rounded-full ${t.class} flex items-center justify-center transition-transform hover:scale-110 shadow-sm ${settings.expenseThemeColor === t.id ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : 'opacity-80 hover:opacity-100'}`}
                          >
                             {settings.expenseThemeColor === t.id && <Check size={16} className="text-white font-bold" />}
                          </button>
                        ))}
                     </div>
                   </div>

                 </div>
              </div>

              {/* Data Management */}
              <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100">
                 <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2 border-b border-gray-100 pb-2">
                  <Database size={20} className="text-gray-500" /> Quản lý dữ liệu
                 </h2>
                 
                 <div className="space-y-4">
                   <p className="text-sm text-gray-500 leading-relaxed">
                     Dữ liệu được lưu trên trình duyệt của thiết bị này. Hãy sao lưu thường xuyên để tránh mất dữ liệu khi xóa cache hoặc đổi máy.
                   </p>

                   <div className="grid grid-cols-1 gap-3">
                     <button 
                       onClick={handleExportData}
                       className="flex items-center justify-center gap-2 w-full p-4 bg-indigo-50 text-indigo-700 font-bold rounded-xl border border-indigo-100 hover:bg-indigo-100 transition-colors"
                     >
                       <Download size={18} /> Sao lưu dữ liệu (.json)
                     </button>
                     
                     <div className="relative">
                       <input 
                         type="file" 
                         accept=".json" 
                         ref={fileInputRef}
                         onChange={handleImportData}
                         className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                       />
                       <button className="flex items-center justify-center gap-2 w-full p-4 bg-gray-50 text-gray-700 font-bold rounded-xl border border-gray-200 hover:bg-gray-100 transition-colors pointer-events-none">
                         <Upload size={18} /> Khôi phục dữ liệu
                       </button>
                     </div>

                     <div className="pt-4 border-t border-gray-100 mt-2">
                       <button 
                         onClick={handleResetData}
                         className="flex items-center justify-center gap-2 w-full p-4 bg-red-50 text-red-600 font-bold rounded-xl border border-red-100 hover:bg-red-100 transition-colors"
                       >
                         <Trash2 size={18} /> <span className="flex items-center gap-1">Xóa toàn bộ dữ liệu <AlertTriangle size={14} /></span>
                       </button>
                     </div>
                   </div>
                 </div>
              </div>
              
              <div className="text-center pb-8">
                 <p className="text-xs font-semibold text-gray-300 uppercase tracking-widest">TrangNQ Tools v1.3.1</p>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Modern Bottom Navigation */}
      <nav className="bg-white/90 backdrop-blur-md border-t border-gray-200 pb-safe-area shadow-[0_-8px_30px_rgba(0,0,0,0.04)] z-50">
        <div className="flex justify-around items-center h-[3.5rem] px-2">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            // Handle dynamic styling for expenses
            const activeLineClass = isActive ? `bg-${item.color.split('-')[1]}-500` : ''; 
            // Note: The above specific split is risky if classes change, but since we control navItems color prop (text-blue-600), it maps to bg-blue-500 roughly. 
            // However, item.color is e.g. 'text-orange-500'. Split gives 'orange'. 'bg-orange-500' works.

            return (
              <button 
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex-1 flex flex-col items-center justify-center h-full relative group transition-all duration-200`}
              >
                {/* Active Indicator Line */}
                {isActive && (
                  <span className={`absolute top-0 w-8 h-0.5 rounded-b-full ${item.color.replace('text-', 'bg-').replace('600', '500')}`} />
                )}
                
                <div className={`p-1.5 rounded-xl transition-all duration-300 ${isActive ? '' : 'bg-transparent'} ${isActive ? 'translate-y-[-2px]' : 'group-hover:bg-gray-50'}`}>
                  <item.icon 
                    size={24} 
                    strokeWidth={isActive ? 2.5 : 2} 
                    className={`transition-colors duration-200 ${isActive ? item.color : 'text-gray-400 group-hover:text-gray-500'}`} 
                  />
                </div>
                <span className={`text-[10px] font-bold mt-0.5 transition-colors duration-200 ${isActive ? item.color : 'text-gray-400'}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}