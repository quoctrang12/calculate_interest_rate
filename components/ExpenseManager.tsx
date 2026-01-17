import React, { useState, useMemo } from 'react';
import { ExpenseRecord } from '../types';
import { ChevronLeft, ChevronRight, Plus, Trash2, Calendar as CalIcon, BarChart3, X, Zap, Lock } from 'lucide-react';

interface ExpenseManagerProps {
  expenses: ExpenseRecord[];
  onAddExpense: (expense: ExpenseRecord) => void;
  onRemoveExpense: (id: string) => void;
  currencyFormatter: (val: number) => string;
  themeColor: string;
  readOnly?: boolean;
}

type ViewMode = 'calendar' | 'stats';

export const ExpenseManager: React.FC<ExpenseManagerProps> = ({
  expenses,
  onAddExpense,
  onRemoveExpense,
  currencyFormatter,
  themeColor,
  readOnly = false
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);

  // --- Form State for Modal ---
  const [newTitle, setNewTitle] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newNote, setNewNote] = useState('');

  // --- Quick Entry State ---
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  
  // Initialize date with Local Date string
  const getTodayString = () => {
     const d = new Date();
     return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  };

  const [quickDate, setQuickDate] = useState(getTodayString);
  const [quickTitle, setQuickTitle] = useState('');
  const [quickAmount, setQuickAmount] = useState('');
  const [quickNote, setQuickNote] = useState('');

  // --- ACCESS DENIED VIEW ---
  if (readOnly) {
      return (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center text-gray-500">
             <div className="bg-gray-100 p-4 rounded-full mb-4">
                <Lock size={48} className="text-gray-400" />
             </div>
             <h2 className="text-xl font-bold text-gray-800 mb-2">Quyền truy cập bị hạn chế</h2>
             <p className="max-w-xs">Mục "Quản lý quỹ" chứa thông tin riêng tư. Vui lòng đăng nhập để xem và quản lý chi tiêu.</p>
          </div>
      );
  }

  // --- Helpers ---
  // Fix: Sử dụng Local Time
  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  // --- Theme Style Logic ---
  const getThemeStyles = () => {
    const map: Record<string, any> = {
      orange: { text: 'text-orange-600', textLight: 'text-orange-100', bg: 'bg-orange-50', bgDark: 'bg-orange-500', bgDarkHover: 'hover:bg-orange-600', border: 'border-orange-200', borderDark: 'border-orange-500', gradient: 'from-orange-500 to-red-500', focusRing: 'focus:ring-orange-500', borderFocus: 'focus:border-orange-500' },
      blue: { text: 'text-blue-600', textLight: 'text-blue-100', bg: 'bg-blue-50', bgDark: 'bg-blue-500', bgDarkHover: 'hover:bg-blue-600', border: 'border-blue-200', borderDark: 'border-blue-500', gradient: 'from-blue-500 to-indigo-500', focusRing: 'focus:ring-blue-500', borderFocus: 'focus:border-blue-500' },
      green: { text: 'text-green-600', textLight: 'text-green-100', bg: 'bg-green-50', bgDark: 'bg-green-500', bgDarkHover: 'hover:bg-green-600', border: 'border-green-200', borderDark: 'border-green-500', gradient: 'from-green-500 to-teal-500', focusRing: 'focus:ring-green-500', borderFocus: 'focus:border-green-500' },
      purple: { text: 'text-purple-600', textLight: 'text-purple-100', bg: 'bg-purple-50', bgDark: 'bg-purple-500', bgDarkHover: 'hover:bg-purple-600', border: 'border-purple-200', borderDark: 'border-purple-500', gradient: 'from-purple-500 to-fuchsia-500', focusRing: 'focus:ring-purple-500', borderFocus: 'focus:border-purple-500' },
      pink: { text: 'text-pink-600', textLight: 'text-pink-100', bg: 'bg-pink-50', bgDark: 'bg-pink-500', bgDarkHover: 'hover:bg-pink-600', border: 'border-pink-200', borderDark: 'border-pink-500', gradient: 'from-pink-500 to-rose-500', focusRing: 'focus:ring-pink-500', borderFocus: 'focus:border-pink-500' },
      teal: { text: 'text-teal-600', textLight: 'text-teal-100', bg: 'bg-teal-50', bgDark: 'bg-teal-500', bgDarkHover: 'hover:bg-teal-600', border: 'border-teal-200', borderDark: 'border-teal-500', gradient: 'from-teal-500 to-emerald-500', focusRing: 'focus:ring-teal-500', borderFocus: 'focus:border-teal-500' },
    };
    return map[themeColor] || map.orange;
  };
  const theme = getThemeStyles();

  // --- Data Logic ---
  const monthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
  const monthlyExpenses = expenses.filter(e => e.date.startsWith(monthKey));
  
  // Group expenses by date for Calendar view
  const expensesByDate = useMemo(() => {
    const map = new Map<string, number>();
    monthlyExpenses.forEach(e => {
      map.set(e.date, (map.get(e.date) || 0) + e.amount);
    });
    return map;
  }, [monthlyExpenses]);

  // Statistics Logic
  const stats = useMemo(() => {
    const totalMonth = monthlyExpenses.reduce((sum, e) => sum + e.amount, 0);
    
    // Group by Week
    const weeklyData: { week: number; total: number; items: ExpenseRecord[] }[] = [];
    
    monthlyExpenses.forEach(e => {
      // Parse manual date string (YYYY-MM-DD) to integer day to avoid UTC shift
      const dayOfMonth = parseInt(e.date.split('-')[2]);
      
      // Simple week calculation: Week of month (1-5)
      const weekNum = Math.ceil(dayOfMonth / 7);
      
      let weekGroup = weeklyData.find(w => w.week === weekNum);
      if (!weekGroup) {
        weekGroup = { week: weekNum, total: 0, items: [] };
        weeklyData.push(weekGroup);
      }
      weekGroup.total += e.amount;
      weekGroup.items.push(e);
    });

    weeklyData.sort((a, b) => a.week - b.week);
    
    return { totalMonth, weeklyData };
  }, [monthlyExpenses]);

  // --- Handlers ---
  const handleAdd = () => {
    if (selectedDateStr && newTitle && newAmount) {
      onAddExpense({
        id: Date.now().toString(),
        date: selectedDateStr,
        title: newTitle,
        amount: Number(newAmount),
        note: newNote
      });
      setNewTitle('');
      setNewAmount('');
      setNewNote('');
    }
  };

  const handleQuickAdd = () => {
    if (quickDate && quickTitle && quickAmount) {
      onAddExpense({
        id: Date.now().toString(),
        date: quickDate,
        title: quickTitle,
        amount: Number(quickAmount),
        note: quickNote
      });
      setQuickTitle('');
      setQuickAmount('');
      setQuickNote('');
      setShowQuickAdd(false);
    }
  };

  const openDay = (day: number) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDateStr(formatDate(date));
  };

  // --- Render Calendar Grid ---
  const renderCalendar = () => {
    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    
    // Calculate first day index (Mon=0, ... Sun=6)
    const getFirstDayIndex = () => {
       const day = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
       return day === 0 ? 6 : day - 1;
    };
    const firstDay = getFirstDayIndex();

    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header T2 -> CN */}
        <div className="grid grid-cols-7 gap-1 text-center mb-2">
          {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(d => (
            <div key={d} className={`text-xs font-bold uppercase py-2 ${d === 'CN' ? 'text-red-400' : 'text-gray-400'}`}>{d}</div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-2 flex-1 auto-rows-fr overflow-y-auto p-1">
          {/* Empty Cells */}
          {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
          
          {/* Days */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
            const dateStr = formatDate(date);
            const total = expensesByDate.get(dateStr) || 0;
            const isToday = formatDate(new Date()) === dateStr;
            const isSunday = (firstDay + i) % 7 === 6;

            return (
              <button
                key={day}
                onClick={() => openDay(day)}
                className={`
                  aspect-square rounded-xl flex flex-col items-center justify-center relative shadow-sm border
                  ${isToday ? `${theme.borderDark} ${theme.bg}` : 'border-gray-100 bg-white'}
                  ${total > 0 && !isToday ? `${theme.border} ${theme.bg}/50` : ''}
                  ${isSunday && !isToday && total === 0 ? 'bg-gray-50' : ''}
                  active:scale-95 transition-transform
                `}
              >
                <span className={`text-sm font-semibold ${isToday ? theme.text : (isSunday ? 'text-red-400' : 'text-gray-700')}`}>
                    {day}
                </span>
                {total > 0 && (
                  <span className={`mt-1 text-[10px] ${theme.text} font-bold truncate w-full px-1`}>
                    {currencyFormatter(total).replace(/\D00$/, '')}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  // --- Render Stats ---
  const renderStats = () => (
    <div className="flex-1 overflow-y-auto p-1 space-y-4">
      {/* Summary */}
      <div className={`bg-gradient-to-r ${theme.gradient} p-5 rounded-2xl text-white shadow-lg`}>
        <h3 className={`text-xs font-bold uppercase opacity-80`}>Tổng chi tháng {currentDate.getMonth() + 1}</h3>
        <div className="text-3xl font-bold mt-1">{currencyFormatter(stats.totalMonth)}</div>
      </div>

      <div className="space-y-4">
        {stats.weeklyData.length === 0 ? (
           <div className="text-center text-gray-400 py-8 italic">Chưa có chi tiêu nào trong tháng này.</div>
        ) : (
          stats.weeklyData.map(week => (
            <div key={week.week} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="bg-gray-50 px-4 py-2 border-b border-gray-100 flex justify-between items-center">
                <span className="font-bold text-gray-700">Tuần {week.week}</span>
                <span className={`font-bold ${theme.text}`}>{currencyFormatter(week.total)}</span>
              </div>
              <div className="divide-y divide-gray-100">
                {week.items.map(item => (
                  <div key={item.id} className="p-3 flex justify-between items-center hover:bg-gray-50">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                         <span className="text-xs font-mono text-gray-400 bg-gray-100 px-1 rounded">{item.date.slice(8)}</span>
                         <span className="font-medium text-gray-800">{item.title}</span>
                      </div>
                      {item.note && <p className="text-xs text-gray-500 ml-8">{item.note}</p>}
                    </div>
                    <span className="font-medium text-gray-900 ml-2">{currencyFormatter(item.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <div className="p-4 pb-24 h-full flex flex-col">
      {/* Header & Controls */}
      <div className="flex flex-col gap-4 mb-4">
        <div className="flex justify-between items-center">
          <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-full"><ChevronLeft /></button>
          <div className="flex flex-col items-center">
             <span className="text-xs text-gray-400 font-bold uppercase">Quản lý quỹ</span>
             <h2 className="text-xl font-bold text-gray-800">
               Tháng {currentDate.getMonth() + 1} / {currentDate.getFullYear()}
             </h2>
          </div>
          <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-full"><ChevronRight /></button>
        </div>

        {/* View Toggle and Quick Add */}
        <div className="flex gap-2">
          <div className="flex bg-gray-100 p-1 rounded-xl flex-1">
            <button 
              onClick={() => setViewMode('calendar')}
              className={`flex-1 py-2 text-sm font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${
                viewMode === 'calendar' ? `bg-white shadow ${theme.text}` : 'text-gray-500'
              }`}
            >
              <CalIcon size={16} /> Lịch
            </button>
            <button 
              onClick={() => setViewMode('stats')}
              className={`flex-1 py-2 text-sm font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${
                viewMode === 'stats' ? `bg-white shadow ${theme.text}` : 'text-gray-500'
              }`}
            >
              <BarChart3 size={16} /> Thống kê
            </button>
          </div>
          
          <button 
             onClick={() => setShowQuickAdd(!showQuickAdd)}
             className={`px-4 rounded-xl font-bold transition-all flex items-center justify-center shadow-sm border ${
               showQuickAdd 
                 ? `${theme.bgDark} text-white ${theme.borderDark}` 
                 : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
             }`}
          >
            <Zap size={20} fill={showQuickAdd ? "currentColor" : "none"} />
          </button>
        </div>
      </div>

      {/* Quick Entry Section */}
      {showQuickAdd && (
        <div className="mb-4 animate-fade-in bg-white p-4 rounded-xl border border-gray-200 shadow-lg relative z-10">
          <div className="flex justify-between items-center mb-3">
             <h3 className={`text-sm font-bold uppercase tracking-wider ${theme.text}`}>Thêm nhanh</h3>
             <button onClick={() => setShowQuickAdd(false)} className="text-gray-400 hover:text-gray-600"><X size={16}/></button>
          </div>
          
          <div className="space-y-3">
             <div className="grid grid-cols-2 gap-3">
                <div>
                   <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Ngày</label>
                   <input 
                      type="date" 
                      value={quickDate}
                      onChange={e => setQuickDate(e.target.value)}
                      className={`w-full p-2 text-sm rounded-lg border border-gray-300 focus:ring-1 outline-none ${theme.focusRing} ${theme.borderFocus}`}
                   />
                </div>
                <div>
                   <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Số tiền</label>
                   <input 
                      type="number" 
                      placeholder="0"
                      value={quickAmount}
                      onChange={e => setQuickAmount(e.target.value)}
                      className={`w-full p-2 text-sm rounded-lg border border-gray-300 focus:ring-1 outline-none font-bold ${theme.focusRing} ${theme.borderFocus}`}
                   />
                </div>
             </div>
             
             <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Nội dung</label>
                <input 
                   type="text" 
                   placeholder="Vd: Ăn sáng, Xăng xe..."
                   value={quickTitle}
                   onChange={e => setQuickTitle(e.target.value)}
                   className={`w-full p-2 text-sm rounded-lg border border-gray-300 focus:ring-1 outline-none ${theme.focusRing} ${theme.borderFocus}`}
                />
             </div>
             
             <div>
                <input 
                   type="text" 
                   placeholder="Ghi chú (tùy chọn)..."
                   value={quickNote}
                   onChange={e => setQuickNote(e.target.value)}
                   className={`w-full p-2 text-xs rounded-lg border border-gray-200 focus:ring-1 outline-none text-gray-600 ${theme.focusRing} ${theme.borderFocus}`}
                />
             </div>

             <button 
               onClick={handleQuickAdd}
               disabled={!quickTitle || !quickAmount || !quickDate}
               className={`w-full text-white py-2.5 rounded-xl font-bold disabled:opacity-50 flex items-center justify-center gap-2 mt-2 shadow-md ${theme.bgDark} ${theme.bgDarkHover}`}
             >
               <Plus size={18} /> Lưu chi tiêu
             </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      {viewMode === 'calendar' ? renderCalendar() : renderStats()}

      {/* Add Expense Modal */}
      {selectedDateStr && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center animate-fade-in">
          <div className="bg-white w-full sm:max-w-md h-[90vh] sm:h-auto sm:rounded-2xl rounded-t-3xl shadow-2xl flex flex-col">
            <div className={`p-4 border-b border-gray-100 flex justify-between items-center ${theme.bg} rounded-t-3xl sm:rounded-t-2xl`}>
              <div>
                <h3 className={`text-lg font-bold ${theme.text.replace('600', '800')}`}>Chi tiêu ngày {selectedDateStr.split('-').reverse().join('/')}</h3>
              </div>
              <button onClick={() => setSelectedDateStr(null)} className="p-2 text-gray-400 hover:text-gray-600">
                <X />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Add Form */}
              <div className="bg-gray-50 p-4 rounded-xl space-y-3 border border-gray-100">
                <input 
                  type="text" 
                  placeholder="Tên khoản chi (vd: Nước uống)" 
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  className={`w-full p-2 rounded-lg border border-gray-300 focus:ring-1 outline-none ${theme.focusRing} ${theme.borderFocus}`}
                />
                 <input 
                  type="number" 
                  placeholder="Số tiền" 
                  value={newAmount}
                  onChange={e => setNewAmount(e.target.value)}
                  className={`w-full p-2 rounded-lg border border-gray-300 focus:ring-1 outline-none ${theme.focusRing} ${theme.borderFocus}`}
                />
                 <input 
                  type="text" 
                  placeholder="Ghi chú (tùy chọn)" 
                  value={newNote}
                  onChange={e => setNewNote(e.target.value)}
                  className={`w-full p-2 rounded-lg border border-gray-300 focus:ring-1 outline-none text-sm ${theme.focusRing} ${theme.borderFocus}`}
                />
                <button 
                  onClick={handleAdd}
                  disabled={!newTitle || !newAmount}
                  className={`w-full text-white py-2 rounded-lg font-bold disabled:opacity-50 flex items-center justify-center gap-2 ${theme.bgDark} ${theme.bgDarkHover}`}
                >
                  <Plus size={18} /> Thêm khoản chi
                </button>
              </div>

              {/* List */}
              <div className="space-y-2">
                <h4 className="font-bold text-gray-700 text-sm uppercase">Danh sách đã chi</h4>
                {expenses.filter(e => e.date === selectedDateStr).length === 0 && (
                  <p className="text-gray-400 text-sm text-center py-2">Chưa có khoản chi nào.</p>
                )}
                {expenses.filter(e => e.date === selectedDateStr).map(item => (
                   <div key={item.id} className="flex justify-between items-center bg-white border border-gray-200 p-3 rounded-xl shadow-sm">
                      <div>
                        <div className="font-bold text-gray-800">{item.title}</div>
                        <div className={`text-sm font-semibold ${theme.text}`}>{currencyFormatter(item.amount)}</div>
                        {item.note && <div className="text-xs text-gray-500">{item.note}</div>}
                      </div>
                      <button onClick={() => onRemoveExpense(item.id)} className="text-gray-400 hover:text-red-500 p-2">
                        <Trash2 size={16} />
                      </button>
                   </div>
                ))}
              </div>
            </div>
            
            <div className="p-4 border-t border-gray-100">
               <button onClick={() => setSelectedDateStr(null)} className="w-full py-3 text-gray-600 font-bold hover:bg-gray-100 rounded-xl">
                 Đóng
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
