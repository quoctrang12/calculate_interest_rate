import React, { useState, useEffect, useRef } from 'react';
import { Employee, LunchRecord, LunchItem, AppSettings, Tab, ExpenseRecord, SystemLog } from './types';
import { CalendarView } from './components/CalendarView';
import { EmployeeList } from './components/EmployeeList';
import { PaymentScanner } from './components/PaymentScanner';
import { StatsView } from './components/StatsView';
import { ExpenseManager } from './components/ExpenseManager';
import { LogViewer } from './components/LogViewer';
import { saveToCloud, loadFromCloud } from './services/cloudService';
import { Calendar, Users, ScanLine, Settings, PieChart, Wallet, Layers, Check, Download, Upload, Trash2, Database, AlertTriangle, Smartphone, Cloud, RefreshCw, Lock, Unlock, History } from 'lucide-react';

export default function App() {
  // --- State ---
  const [activeTab, setActiveTab] = useState<Tab>(Tab.CALENDAR);
  const [isLoadingCloud, setIsLoadingCloud] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  // Initial Load Flag to prevent overwriting cloud data with empty local state on first mount
  const [isInitialized, setIsInitialized] = useState(false);

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

  const [logs, setLogs] = useState<SystemLog[]>(() => {
    const saved = localStorage.getItem('logs');
    return saved ? JSON.parse(saved) : [];
  });

  // PWA Install Prompt State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Helpers ---
  const addLog = (action: string, details: string) => {
    const newLog: SystemLog = {
      id: Date.now().toString() + Math.random().toString().slice(2, 6),
      timestamp: new Date().toISOString(),
      action,
      details
    };
    setLogs(prev => [newLog, ...prev]);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  // --- Cloud Sync Effects ---
  
  // 1. Load from Cloud on Mount (Supabase)
  useEffect(() => {
    const syncFromCloud = async () => {
      // If we have API keys configured, try to fetch
      if (process.env.VITE_SUPABASE_URL) {
        setIsLoadingCloud(true);
        try {
          const [cloudEmps, cloudLunch, cloudExp, cloudSettings, cloudLogs] = await Promise.all([
            loadFromCloud('employees'),
            loadFromCloud('lunchRecords'),
            loadFromCloud('expenseRecords'),
            loadFromCloud('settings'),
            loadFromCloud('logs')
          ]);

          if (cloudEmps) setEmployees(cloudEmps);
          if (cloudLunch) setLunchRecords(cloudLunch);
          if (cloudExp) setExpenseRecords(cloudExp);
          if (cloudSettings) setSettings(cloudSettings);
          if (cloudLogs) setLogs(cloudLogs);
        } catch (e) {
          console.error("Failed to load from cloud", e);
        } finally {
          setIsLoadingCloud(false);
          setIsInitialized(true);
        }
      } else {
        setIsInitialized(true);
      }
    };

    syncFromCloud();
  }, []);

  // 2. Save to LocalStorage & Cloud on Change
  useEffect(() => {
    if (!isInitialized) return;
    localStorage.setItem('employees', JSON.stringify(employees));
    saveToCloud('employees', employees);
  }, [employees, isInitialized]);

  useEffect(() => {
    if (!isInitialized) return;
    localStorage.setItem('lunchRecords', JSON.stringify(lunchRecords));
    saveToCloud('lunchRecords', lunchRecords);
  }, [lunchRecords, isInitialized]);

  useEffect(() => {
    if (!isInitialized) return;
    localStorage.setItem('expenseRecords', JSON.stringify(expenseRecords));
    saveToCloud('expenseRecords', expenseRecords);
  }, [expenseRecords, isInitialized]);

  useEffect(() => {
    if (!isInitialized) return;
    localStorage.setItem('settings', JSON.stringify(settings));
    saveToCloud('settings', settings);
  }, [settings, isInitialized]);

  useEffect(() => {
    if (!isInitialized) return;
    localStorage.setItem('logs', JSON.stringify(logs));
    saveToCloud('logs', logs);
  }, [logs, isInitialized]);

  // Capture PWA install prompt
  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // --- Login Logic ---
  const handleLoginToggle = () => {
      if (isLoggedIn) {
          if (window.confirm("Bạn có chắc chắn muốn đăng xuất?")) {
              setIsLoggedIn(false);
              setActiveTab(Tab.CALENDAR); // Reset to safe tab
          }
      } else {
          const password = prompt("Nhập mật khẩu quản trị:", "");
          if (password === "123456") {
              setIsLoggedIn(true);
              alert("Đăng nhập thành công!");
          } else if (password !== null) {
              alert("Sai mật khẩu!");
          }
      }
  };

  // --- Actions ---

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);
    setDeferredPrompt(null);
  };

  const addEmployee = (name: string) => {
    if (!isLoggedIn) return;
    const newEmp: Employee = {
      id: Date.now().toString(),
      name,
      balance: 0
    };
    setEmployees([...employees, newEmp]);
    addLog('Thêm nhân viên', `Thêm nhân viên mới: ${name}`);
  };

  const removeEmployee = (id: string) => {
    if (!isLoggedIn) return;
    const emp = employees.find(e => e.id === id);
    setEmployees(employees.filter(e => e.id !== id));
    addLog('Xóa nhân viên', `Đã xóa nhân viên: ${emp?.name || id}`);
  };

  const updateLunchRecord = (date: string, newItems: LunchItem[]) => {
    if (!isLoggedIn) return;
    const prevRecord = lunchRecords.find(r => r.date === date);
    
    // Log details
    const count = newItems.length;
    const names = newItems.map(i => employees.find(e => e.id === i.employeeId)?.name).join(', ');

    setEmployees(currentEmps => currentEmps.map(emp => {
      let balanceChange = 0;
      if (prevRecord) {
        const oldItem = prevRecord.items.find(i => i.employeeId === emp.id);
        if (oldItem) balanceChange += oldItem.price;
      }
      const newItem = newItems.find(i => i.employeeId === emp.id);
      if (newItem) balanceChange -= newItem.price;
      return { ...emp, balance: emp.balance + balanceChange };
    }));

    const otherRecords = lunchRecords.filter(r => r.date !== date);
    if (newItems.length > 0) {
      setLunchRecords([...otherRecords, { date, items: newItems }]);
    } else {
      setLunchRecords(otherRecords);
    }
    
    addLog('Cập nhật lịch ăn', `Ngày ${date}: ${count} người (${names})`);
  };

  const processPayment = (employeeId: string, amount: number) => {
    if (!isLoggedIn) return;
    const emp = employees.find(e => e.id === employeeId);
    setEmployees(emps => emps.map(e => 
      e.id === employeeId ? { ...e, balance: e.balance + amount } : e
    ));
    addLog('AI Scanner', `Cập nhật số dư cho ${emp?.name}: +${formatCurrency(amount)}`);
  };

  const adjustBalance = (employeeId: string, amount: number) => {
    if (!isLoggedIn) return;
    const emp = employees.find(e => e.id === employeeId);
    setEmployees(emps => emps.map(e => 
      e.id === employeeId ? { ...e, balance: e.balance + amount } : e
    ));
    addLog('Điều chỉnh số dư', `${amount > 0 ? 'Nạp' : 'Trừ'} tiền ${emp?.name}: ${formatCurrency(Math.abs(amount))}`);
  };

  const addExpense = (expense: ExpenseRecord) => {
    if (!isLoggedIn) return;
    setExpenseRecords([...expenseRecords, expense]);
    addLog('Thêm chi tiêu', `Chi: ${expense.title} - ${formatCurrency(expense.amount)}`);
  };

  const removeExpense = (id: string) => {
    if (!isLoggedIn) return;
    const exp = expenseRecords.find(e => e.id === id);
    setExpenseRecords(expenseRecords.filter(e => e.id !== id));
    addLog('Xóa chi tiêu', `Xóa khoản chi: ${exp?.title}`);
  };

  // --- Data Management Actions ---
  const handleExportData = () => {
    const data = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      employees,
      lunchRecords,
      expenseRecords,
      settings,
      logs
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
    addLog('Sao lưu dữ liệu', 'Đã tải xuống file backup');
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!isLoggedIn) {
        alert("Vui lòng đăng nhập để khôi phục dữ liệu.");
        return;
    }
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);
        if (!data.employees && !data.lunchRecords) {
           alert("File không hợp lệ!");
           return;
        }
        if (window.confirm("Hành động này sẽ ghi đè dữ liệu hiện tại bằng dữ liệu trong file. Bạn có chắc chắn không?")) {
          if (data.employees) setEmployees(data.employees);
          if (data.lunchRecords) setLunchRecords(data.lunchRecords);
          if (data.expenseRecords) setExpenseRecords(data.expenseRecords);
          if (data.settings) setSettings(data.settings);
          if (data.logs) setLogs(data.logs);
          alert("Khôi phục dữ liệu thành công!");
          addLog('Khôi phục dữ liệu', 'Đã khôi phục từ file backup');
        }
      } catch (error) {
        alert("Lỗi khi đọc file backup. Vui lòng thử lại.");
        console.error(error);
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const handleResetData = () => {
    if (!isLoggedIn) return;
    if (window.confirm("CẢNH BÁO: Tất cả dữ liệu sẽ bị xóa. Bạn có chắc chắn không?")) {
       setEmployees([]);
       setLunchRecords([]);
       setExpenseRecords([]);
       setLogs([]);
       setSettings({ costPerMeal: 35000, expenseThemeColor: 'orange' });
       addLog('Reset hệ thống', 'Đã xóa toàn bộ dữ liệu');
    }
  };

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

  const navItems = [
    { id: Tab.CALENDAR, label: 'Ăn trưa', icon: Calendar, color: 'text-blue-600' },
    { id: Tab.EXPENSES, label: 'Quỹ chi', icon: Wallet, color: expenseNavStyle.text },
    { id: Tab.STATS, label: 'Thống kê', icon: PieChart, color: 'text-violet-600' },
    { id: Tab.SCANNER, label: 'AI Scan', icon: ScanLine, color: 'text-indigo-600' },
    { id: Tab.EMPLOYEES, label: 'Nhân sự', icon: Users, color: 'text-teal-600' },
  ];

  if (isLoggedIn) {
      navItems.push({ id: Tab.LOGS, label: 'Logs', icon: History, color: 'text-gray-600' });
  }

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
    // FIX: Sử dụng h-[100dvh] để đảm bảo full chiều cao màn hình thiết bị, loại bỏ fixed inset-0 gây lỗi
    <div className="bg-gray-50 h-[100dvh] w-full overflow-hidden flex flex-col font-sans text-gray-900 relative">
      
      {/* Header */}
      <header className="bg-white/85 backdrop-blur-xl border-b border-gray-100 px-4 py-3 flex justify-between items-center z-40 sticky top-0 shadow-sm transition-all">
        <div className="flex items-center gap-3">
           <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2 rounded-xl shadow-lg shadow-blue-200">
             <Layers size={20} className="text-white" />
           </div>
           <div>
             <h1 className="text-lg font-bold text-gray-800 leading-none tracking-tight flex items-center gap-2">
               TrangNQ Tools
               {isLoadingCloud && <RefreshCw size={12} className="text-green-500 animate-spin" />}
             </h1>
             <p className="text-[10px] font-medium text-gray-400 mt-1">Quản lý hiệu quả</p>
           </div>
        </div>
        <div className="flex gap-2">
            <button 
                onClick={handleLoginToggle}
                className={`p-2.5 rounded-full transition-all duration-300 ${isLoggedIn ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}
            >
                {isLoggedIn ? <Unlock size={22} strokeWidth={2} /> : <Lock size={22} strokeWidth={2} />}
            </button>
            <button 
                onClick={() => setActiveTab(Tab.SETTINGS)}
                className={`p-2.5 rounded-full transition-all duration-300 ${activeTab === Tab.SETTINGS ? 'bg-gray-100 text-indigo-600 rotate-90' : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'}`}
            >
                <Settings size={22} strokeWidth={2} />
            </button>
        </div>
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
                readOnly={!isLoggedIn} 
              />
            </div>
          )}

          {activeTab === Tab.EXPENSES && (
            <div className="animate-fade-in h-full">
              <ExpenseManager
                expenses={expenseRecords}
                onAddExpense={addExpense}
                onRemoveExpense={removeExpense}
                currencyFormatter={formatCurrency}
                themeColor={settings.expenseThemeColor}
                readOnly={!isLoggedIn}
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
                readOnly={!isLoggedIn}
              />
            </div>
          )}

          {activeTab === Tab.SCANNER && (
             <div className="animate-fade-in">
              <PaymentScanner 
                employees={employees}
                onConfirmPayment={processPayment}
                currencyFormatter={formatCurrency}
                readOnly={!isLoggedIn}
              />
            </div>
          )}

          {activeTab === Tab.LOGS && isLoggedIn && (
              <div className="animate-fade-in h-full">
                  <LogViewer logs={logs} />
              </div>
          )}

          {activeTab === Tab.SETTINGS && (
            <div className="p-4 space-y-6 animate-fade-in pb-24">
              {deferredPrompt && (
                <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl shadow-lg p-5 text-white">
                  <h2 className="text-lg font-bold mb-2 flex items-center gap-2">
                    <Smartphone size={20} /> Cài đặt ứng dụng
                  </h2>
                  <p className="text-sm text-indigo-100 mb-4 opacity-90">
                    Cài đặt ứng dụng vào màn hình chính để truy cập nhanh hơn.
                  </p>
                  <button onClick={handleInstallClick} className="w-full bg-white text-indigo-600 py-3 rounded-xl font-bold hover:bg-indigo-50 transition-colors shadow-md">
                    Cài đặt ngay
                  </button>
                </div>
              )}

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
                          disabled={!isLoggedIn}
                          onChange={(e) => setSettings({ ...settings, costPerMeal: Number(e.target.value) })}
                          className="w-full p-4 pl-12 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none font-bold text-gray-800 disabled:opacity-50"
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
                            disabled={!isLoggedIn}
                            onClick={() => setSettings({ ...settings, expenseThemeColor: t.id })}
                            className={`w-10 h-10 rounded-full ${t.class} flex items-center justify-center transition-transform hover:scale-110 shadow-sm ${settings.expenseThemeColor === t.id ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : 'opacity-80 hover:opacity-100'} disabled:opacity-30`}
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
                   <div className="bg-green-50 p-3 rounded-lg flex items-start gap-3">
                      <Cloud size={20} className="text-green-500 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-bold text-green-900">Đồng bộ Cloud (Supabase)</p>
                        <p className="text-xs text-green-700 mt-1">
                          {process.env.VITE_SUPABASE_URL ? 'Đã kết nối Supabase. Dữ liệu sẽ tự động lưu.' : 'Chưa cấu hình Supabase URL/Key. Dữ liệu chỉ lưu cục bộ.'}
                        </p>
                      </div>
                   </div>

                   <div className="grid grid-cols-1 gap-3">
                     <button onClick={handleExportData} className="flex items-center justify-center gap-2 w-full p-4 bg-indigo-50 text-indigo-700 font-bold rounded-xl border border-indigo-100 hover:bg-indigo-100 transition-colors">
                       <Download size={18} /> Sao lưu dữ liệu (.json)
                     </button>
                     <div className="relative">
                       <input type="file" accept=".json" ref={fileInputRef} onChange={handleImportData} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" disabled={!isLoggedIn} />
                       <button className={`flex items-center justify-center gap-2 w-full p-4 bg-gray-50 text-gray-700 font-bold rounded-xl border border-gray-200 hover:bg-gray-100 transition-colors pointer-events-none ${!isLoggedIn ? 'opacity-50' : ''}`}>
                         <Upload size={18} /> Khôi phục dữ liệu
                       </button>
                     </div>
                     <div className="pt-4 border-t border-gray-100 mt-2">
                       <button onClick={handleResetData} disabled={!isLoggedIn} className="flex items-center justify-center gap-2 w-full p-4 bg-red-50 text-red-600 font-bold rounded-xl border border-red-100 hover:bg-red-100 transition-colors disabled:opacity-50">
                         <Trash2 size={18} /> <span className="flex items-center gap-1">Xóa toàn bộ <AlertTriangle size={14} /></span>
                       </button>
                     </div>
                   </div>
                 </div>
              </div>
              
              <div className="text-center pb-8">
                 <p className="text-xs font-semibold text-gray-300 uppercase tracking-widest">TrangNQ Tools v1.4.0</p>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Navigation */}
      <nav className="bg-white/90 backdrop-blur-md border-t border-gray-200 pb-safe-area shadow-[0_-8px_30px_rgba(0,0,0,0.04)] z-40">
        <div className="flex justify-around items-center h-[3.5rem] px-2">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button 
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex-1 flex flex-col items-center justify-center h-full relative group transition-all duration-200`}
              >
                {isActive && (
                  <span className={`absolute top-0 w-8 h-0.5 rounded-b-full ${item.color.replace('text-', 'bg-').replace('600', '500')}`} />
                )}
                <div className={`p-1.5 rounded-xl transition-all duration-300 ${isActive ? '' : 'bg-transparent'} ${isActive ? 'translate-y-[-2px]' : 'group-hover:bg-gray-50'}`}>
                  <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} className={`transition-colors duration-200 ${isActive ? item.color : 'text-gray-400 group-hover:text-gray-500'}`} />
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
