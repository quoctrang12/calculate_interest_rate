import React, { useState, useEffect, useRef } from 'react';
import { Employee, LunchRecord, LunchItem, AppSettings, Tab, ExpenseRecord, SystemLog, User, AuthSession, DebtRecord } from './types';
import { CalendarView } from './components/CalendarView';
import { EmployeeList } from './components/EmployeeList';
import { PaymentScanner } from './components/PaymentScanner';
import { StatsView } from './components/StatsView';
import { ExpenseManager } from './components/ExpenseManager';
import { LogViewer } from './components/LogViewer';
import { AuthModal } from './components/AuthModal';
import { saveToCloud, loadFromCloud } from './services/cloudService';
import { getTheme } from './utils/theme';
import { Calendar, Users, ScanLine, Settings, PieChart, Wallet, Layers, Check, Download, Upload, Trash2, Database, AlertTriangle, Smartphone, Cloud, RefreshCw, Lock, UserCircle2, History } from 'lucide-react';

export default function App() {
  // --- State ---
  const [activeTab, setActiveTab] = useState<Tab>(Tab.CALENDAR);
  const [isLoadingCloud, setIsLoadingCloud] = useState(false);
  
  // Auth State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  
  // Users List (Stored in Cloud/Local)
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('users');
    const defaultAdmin: User = { id: 'admin', username: 'admin', password: '123456', role: 'admin', createdAt: new Date().toISOString() };
    return saved ? JSON.parse(saved) : [defaultAdmin];
  });

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

  const [debtRecords, setDebtRecords] = useState<DebtRecord[]>(() => {
    const saved = localStorage.getItem('debtRecords');
    return saved ? JSON.parse(saved) : [];
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('settings');
    const defaultSettings = { costPerMeal: 35000, themeColor: 'orange' };
    return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
  });

  const [logs, setLogs] = useState<SystemLog[]>(() => {
    const saved = localStorage.getItem('logs');
    return saved ? JSON.parse(saved) : [];
  });

  // Theme Object
  const theme = getTheme(settings.themeColor);

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

  const isAdmin = currentUser?.role === 'admin';

  // --- Session Management ---
  useEffect(() => {
    // Check local session
    const sessionStr = localStorage.getItem('auth_session');
    if (sessionStr) {
      try {
        const session: AuthSession = JSON.parse(sessionStr);
        if (session.expiresAt > Date.now()) {
          setCurrentUser(session.user);
        } else {
          localStorage.removeItem('auth_session'); // Expired
        }
      } catch (e) {
        localStorage.removeItem('auth_session');
      }
    }
  }, []);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    // Persist session for 7 days
    const session: AuthSession = {
      user,
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000
    };
    localStorage.setItem('auth_session', JSON.stringify(session));
    addLog('Đăng nhập', `Người dùng ${user.username} đã đăng nhập`);
  };

  const handleLogout = () => {
    if (window.confirm("Bạn có chắc chắn muốn đăng xuất?")) {
      setCurrentUser(null);
      localStorage.removeItem('auth_session');
      setActiveTab(Tab.CALENDAR);
    }
  };

  const handleRegister = (newUser: User) => {
    setUsers(prev => {
        const updated = [...prev, newUser];
        localStorage.setItem('users', JSON.stringify(updated)); // Immediate local save
        saveToCloud('users', updated);
        return updated;
    });
    addLog('Đăng ký', `Người dùng mới: ${newUser.username}`);
  };

  // --- Cloud Sync Effects ---
  useEffect(() => {
    const syncFromCloud = async () => {
      // If we have API keys configured, try to fetch
      if (process.env.VITE_SUPABASE_URL) {
        setIsLoadingCloud(true);
        try {
          const [cloudEmps, cloudLunch, cloudExp, cloudDebts, cloudSettings, cloudLogs, cloudUsers] = await Promise.all([
            loadFromCloud('employees'),
            loadFromCloud('lunchRecords'),
            loadFromCloud('expenseRecords'),
            loadFromCloud('debtRecords'),
            loadFromCloud('settings'),
            loadFromCloud('logs'),
            loadFromCloud('users')
          ]);

          if (cloudEmps) setEmployees(cloudEmps);
          if (cloudLunch) setLunchRecords(cloudLunch);
          if (cloudExp) setExpenseRecords(cloudExp);
          if (cloudDebts) setDebtRecords(cloudDebts);
          if (cloudSettings) setSettings(cloudSettings);
          if (cloudLogs) setLogs(cloudLogs);
          if (cloudUsers) setUsers(cloudUsers);
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

  // Save Effects
  useEffect(() => { if (isInitialized) { localStorage.setItem('employees', JSON.stringify(employees)); saveToCloud('employees', employees); } }, [employees, isInitialized]);
  useEffect(() => { if (isInitialized) { localStorage.setItem('lunchRecords', JSON.stringify(lunchRecords)); saveToCloud('lunchRecords', lunchRecords); } }, [lunchRecords, isInitialized]);
  useEffect(() => { if (isInitialized) { localStorage.setItem('expenseRecords', JSON.stringify(expenseRecords)); saveToCloud('expenseRecords', expenseRecords); } }, [expenseRecords, isInitialized]);
  useEffect(() => { if (isInitialized) { localStorage.setItem('debtRecords', JSON.stringify(debtRecords)); saveToCloud('debtRecords', debtRecords); } }, [debtRecords, isInitialized]);
  useEffect(() => { if (isInitialized) { localStorage.setItem('settings', JSON.stringify(settings)); saveToCloud('settings', settings); } }, [settings, isInitialized]);
  useEffect(() => { if (isInitialized) { localStorage.setItem('logs', JSON.stringify(logs)); saveToCloud('logs', logs); } }, [logs, isInitialized]);
  useEffect(() => { if (isInitialized) { localStorage.setItem('users', JSON.stringify(users)); saveToCloud('users', users); } }, [users, isInitialized]);

  useEffect(() => {
    const handler = (e: any) => { e.preventDefault(); setDeferredPrompt(e); };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);


  // --- Actions ---

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    setDeferredPrompt(null);
  };

  const addEmployee = (name: string) => {
    if (!isAdmin) return;
    const newEmp: Employee = { id: Date.now().toString(), name, balance: 0 };
    setEmployees([...employees, newEmp]);
    addLog('Thêm nhân viên', `Thêm nhân viên mới: ${name}`);
  };

  const removeEmployee = (id: string) => {
    if (!isAdmin) return;
    const emp = employees.find(e => e.id === id);
    setEmployees(employees.filter(e => e.id !== id));
    addLog('Xóa nhân viên', `Đã xóa nhân viên: ${emp?.name || id}`);
  };

  const updateLunchRecord = (date: string, newItems: LunchItem[]) => {
    if (!isAdmin) return;
    setEmployees(currentEmps => currentEmps.map(emp => {
      // Re-calculate balance logic skipped for brevity, assumed correct from previous versions
      // Simple re-calc not shown but preserves logic
      return emp; 
    }));
    // Re-implementing update logic briefly for correctness
    const prevRecord = lunchRecords.find(r => r.date === date);
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
    if (newItems.length > 0) setLunchRecords([...otherRecords, { date, items: newItems }]);
    else setLunchRecords(otherRecords);
    addLog('Cập nhật lịch ăn', `Ngày ${date}: ${newItems.length} người`);
  };

  const processPayment = (employeeId: string, amount: number) => {
    if (!isAdmin) return;
    setEmployees(emps => emps.map(e => e.id === employeeId ? { ...e, balance: e.balance + amount } : e));
    addLog('AI Scanner', `Cập nhật số dư: +${formatCurrency(amount)}`);
  };

  const adjustBalance = (employeeId: string, amount: number) => {
    if (!isAdmin) return;
    setEmployees(emps => emps.map(e => e.id === employeeId ? { ...e, balance: e.balance + amount } : e));
    addLog('Điều chỉnh số dư', `${amount > 0 ? 'Nạp' : 'Trừ'} tiền: ${formatCurrency(Math.abs(amount))}`);
  };

  const addExpense = (expense: ExpenseRecord) => {
    if (!currentUser) return;
    setExpenseRecords([...expenseRecords, expense]);
    addLog('Thêm chi tiêu', `Chi (${currentUser.username}): ${expense.title}`);
  };

  const removeExpense = (id: string) => {
    if (!currentUser) return;
    setExpenseRecords(expenseRecords.filter(e => e.id !== id));
  };

  // Debt Actions
  const addDebt = (debt: DebtRecord) => {
    if (!currentUser) return;
    setDebtRecords([...debtRecords, debt]);
    addLog('Sổ nợ', `Thêm khoản ${debt.type === 'borrow' ? 'vay' : 'cho vay'}: ${debt.personName}`);
  };

  const updateDebt = (debt: DebtRecord) => {
    if (!currentUser) return;
    setDebtRecords(debtRecords.map(d => d.id === debt.id ? debt : d));
    addLog('Sổ nợ', `Cập nhật khoản nợ: ${debt.personName}`);
  };

  const deleteDebt = (id: string) => {
    if (!currentUser) return;
    setDebtRecords(debtRecords.filter(d => d.id !== id));
    addLog('Sổ nợ', 'Đã xóa khoản nợ');
  };

  const handleExportData = () => {
    const data = { version: '1.0', timestamp: new Date().toISOString(), employees, lunchRecords, expenseRecords, debtRecords, settings, logs, users };
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
    if (!isAdmin) { alert("Chỉ Admin mới có quyền khôi phục dữ liệu."); return; }
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (window.confirm("Ghi đè dữ liệu hiện tại?")) {
          if (data.employees) setEmployees(data.employees);
          if (data.lunchRecords) setLunchRecords(data.lunchRecords);
          if (data.expenseRecords) setExpenseRecords(data.expenseRecords);
          if (data.debtRecords) setDebtRecords(data.debtRecords);
          if (data.settings) setSettings(data.settings);
          if (data.logs) setLogs(data.logs);
          if (data.users) setUsers(data.users);
          alert("Khôi phục thành công!");
        }
      } catch (error) { alert("Lỗi file backup."); }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const handleResetData = () => {
    if (!isAdmin) return;
    if (window.confirm("CẢNH BÁO: Xóa toàn bộ dữ liệu?")) {
       setEmployees([]); setLunchRecords([]); setExpenseRecords([]); setDebtRecords([]); setLogs([]);
       setSettings({ costPerMeal: 35000, themeColor: 'orange' });
    }
  };

  const navItems = [
    { id: Tab.CALENDAR, label: 'Ăn trưa', icon: Calendar },
    { id: Tab.EXPENSES, label: 'Tài chính', icon: Wallet },
    { id: Tab.STATS, label: 'Thống kê', icon: PieChart },
    { id: Tab.SCANNER, label: 'AI Scan', icon: ScanLine },
    { id: Tab.EMPLOYEES, label: 'Nhân sự', icon: Users },
  ];

  if (isAdmin) {
      navItems.push({ id: Tab.LOGS, label: 'Logs', icon: History });
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
    <div className="bg-gray-50 h-[100dvh] w-full overflow-hidden flex flex-col font-sans text-gray-900 relative">
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)}
        onLogin={handleLogin}
        onRegister={handleRegister}
        users={users}
      />

      {/* Header with Global Theme */}
      <header className={`backdrop-blur-xl border-b px-4 py-3 flex justify-between items-center z-40 sticky top-0 shadow-sm transition-all bg-white/85 ${theme.border}`}>
        <div className="flex items-center gap-3">
           <div className={`bg-gradient-to-br ${theme.gradient} p-2 rounded-xl shadow-lg`}>
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
                onClick={currentUser ? handleLogout : () => setIsAuthModalOpen(true)}
                className={`p-2 rounded-full transition-all duration-300 flex items-center gap-2 pr-3 ${currentUser ? `${theme.bg} ${theme.text} pl-2` : 'bg-gray-100 text-gray-500 pl-3'}`}
            >
                {currentUser ? (
                    <>
                      <UserCircle2 size={22} />
                      <span className="text-xs font-bold max-w-[60px] truncate">{currentUser.username}</span>
                    </>
                ) : <Lock size={22} strokeWidth={2} />}
            </button>
            <button 
                onClick={() => setActiveTab(Tab.SETTINGS)}
                className={`p-2.5 rounded-full transition-all duration-300 ${activeTab === Tab.SETTINGS ? `bg-gray-100 ${theme.text} rotate-90` : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'}`}
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
                readOnly={!isAdmin} 
                theme={theme}
              />
            </div>
          )}

          {activeTab === Tab.EXPENSES && (
            <div className="animate-fade-in h-full">
              <ExpenseManager
                expenses={expenseRecords}
                onAddExpense={addExpense}
                onRemoveExpense={removeExpense}
                debts={debtRecords}
                onAddDebt={addDebt}
                onUpdateDebt={updateDebt}
                onDeleteDebt={deleteDebt}
                currencyFormatter={formatCurrency}
                theme={theme}
                currentUser={currentUser}
                onOpenLogin={() => setIsAuthModalOpen(true)}
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
                readOnly={!isAdmin}
                theme={theme}
              />
            </div>
          )}

          {activeTab === Tab.SCANNER && (
             <div className="animate-fade-in">
              <PaymentScanner 
                employees={employees}
                onConfirmPayment={processPayment}
                currencyFormatter={formatCurrency}
                readOnly={!isAdmin}
              />
            </div>
          )}

          {activeTab === Tab.LOGS && isAdmin && (
              <div className="animate-fade-in h-full">
                  <LogViewer logs={logs} />
              </div>
          )}

          {activeTab === Tab.SETTINGS && (
            <div className="p-4 space-y-6 animate-fade-in pb-24">
              {deferredPrompt && (
                <div className={`bg-gradient-to-r ${theme.gradient} rounded-2xl shadow-lg p-5 text-white`}>
                  <h2 className="text-lg font-bold mb-2 flex items-center gap-2">
                    <Smartphone size={20} /> Cài đặt ứng dụng
                  </h2>
                  <p className="text-sm opacity-90 mb-4">Cài đặt ứng dụng vào màn hình chính để truy cập nhanh hơn.</p>
                  <button onClick={handleInstallClick} className={`w-full bg-white ${theme.text} py-3 rounded-xl font-bold transition-colors shadow-md`}>
                    Cài đặt ngay
                  </button>
                </div>
              )}

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
                          disabled={!isAdmin}
                          onChange={(e) => setSettings({ ...settings, costPerMeal: Number(e.target.value) })}
                          className={`w-full p-4 pl-12 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white transition-all outline-none font-bold text-gray-800 disabled:opacity-50 ${theme.ring} ${theme.borderDark}`}
                       />
                       <span className="absolute left-4 top-4 text-gray-400 font-bold">₫</span>
                     </div>
                   </div>
                   <div>
                     <label className="block text-sm font-semibold text-gray-700 mb-3">Màu chủ đạo Ứng dụng</label>
                     <div className="flex flex-wrap gap-3">
                        {themeColors.map((t) => (
                          <button
                            key={t.id}
                            disabled={!currentUser}
                            onClick={() => setSettings({ ...settings, themeColor: t.id })}
                            className={`w-10 h-10 rounded-full ${t.class} flex items-center justify-center transition-transform hover:scale-110 shadow-sm ${settings.themeColor === t.id ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : 'opacity-80 hover:opacity-100'} disabled:opacity-30`}
                          >
                             {settings.themeColor === t.id && <Check size={16} className="text-white font-bold" />}
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
                          {process.env.VITE_SUPABASE_URL ? 'Đã kết nối Supabase.' : 'Chưa cấu hình Supabase.'}
                        </p>
                      </div>
                   </div>

                   <div className="grid grid-cols-1 gap-3">
                     <button onClick={handleExportData} className={`flex items-center justify-center gap-2 w-full p-4 ${theme.bg} ${theme.text} font-bold rounded-xl border ${theme.border} hover:opacity-80 transition-colors`}>
                       <Download size={18} /> Sao lưu dữ liệu
                     </button>
                     <div className="relative">
                       <input type="file" accept=".json" ref={fileInputRef} onChange={handleImportData} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" disabled={!isAdmin} />
                       <button className={`flex items-center justify-center gap-2 w-full p-4 bg-gray-50 text-gray-700 font-bold rounded-xl border border-gray-200 hover:bg-gray-100 transition-colors pointer-events-none ${!isAdmin ? 'opacity-50' : ''}`}>
                         <Upload size={18} /> Khôi phục dữ liệu
                       </button>
                     </div>
                     <div className="pt-4 border-t border-gray-100 mt-2">
                       <button onClick={handleResetData} disabled={!isAdmin} className="flex items-center justify-center gap-2 w-full p-4 bg-red-50 text-red-600 font-bold rounded-xl border border-red-100 hover:bg-red-100 transition-colors disabled:opacity-50">
                         <Trash2 size={18} /> <span className="flex items-center gap-1">Xóa toàn bộ <AlertTriangle size={14} /></span>
                       </button>
                     </div>
                   </div>
                 </div>
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
                  <span className={`absolute top-0 w-8 h-0.5 rounded-b-full ${theme.bgDark}`} />
                )}
                <div className={`p-1.5 rounded-xl transition-all duration-300 ${isActive ? '' : 'bg-transparent'} ${isActive ? 'translate-y-[-2px]' : 'group-hover:bg-gray-50'}`}>
                  <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} className={`transition-colors duration-200 ${isActive ? theme.text : 'text-gray-400 group-hover:text-gray-500'}`} />
                </div>
                <span className={`text-[10px] font-bold mt-0.5 transition-colors duration-200 ${isActive ? theme.text : 'text-gray-400'}`}>
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