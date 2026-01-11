import React, { useMemo, useState } from 'react';
import { Employee, LunchRecord } from '../types';
import { TrendingDown, TrendingUp, CalendarDays, ChevronLeft, ChevronRight, Receipt, LayoutList } from 'lucide-react';

interface StatsViewProps {
  employees: Employee[];
  lunchRecords: LunchRecord[];
  currencyFormatter: (val: number) => string;
}

export const StatsView: React.FC<StatsViewProps> = ({
  employees,
  lunchRecords,
  currencyFormatter
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  
  // Calculate stats
  const stats = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth(); // 0-indexed
    
    // Format: YYYY-MM
    const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
    
    // Filter records for selected month
    const monthlyRecords = lunchRecords.filter(r => r.date.startsWith(monthKey));

    let totalSpentMonth = 0;
    
    // -- Employee Overview Stats --
    const empStats = employees.map(emp => {
      // Find all lunch items for this employee in selected month
      const meals = monthlyRecords.flatMap(record => {
        const item = record.items.find(i => i.employeeId === emp.id);
        return item ? [{ date: record.date, ...item }] : [];
      });

      const totalMealCost = meals.reduce((sum, m) => sum + m.price, 0);
      totalSpentMonth += totalMealCost;

      return {
        ...emp,
        mealCount: meals.length,
        totalMealCost,
        history: meals.sort((a, b) => b.date.localeCompare(a.date))
      };
    });
    empStats.sort((a, b) => b.totalMealCost - a.totalMealCost);


    // -- Weekly Breakdown Stats (T2 -> CN) --
    
    // 1. Tạo danh sách các tuần trong tháng dựa trên lịch thực tế (T2 - CN)
    const weeksInMonth: { id: number; start: number; end: number; label: string }[] = [];
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    let currentWeekStart = 1;
    let weekIndex = 1;
    
    for (let d = 1; d <= daysInMonth; d++) {
        const dateObj = new Date(year, month, d);
        const dayOfWeek = dateObj.getDay(); // 0 = CN, 1 = T2...
        
        // Kết thúc tuần nếu là Chủ Nhật hoặc ngày cuối cùng của tháng
        if (dayOfWeek === 0 || d === daysInMonth) {
            weeksInMonth.push({
                id: weekIndex,
                start: currentWeekStart,
                end: d,
                // Sử dụng month + 1 để hiển thị đúng tháng hiện tại, tránh dùng dateObj của record có thể bị sai
                label: `${currentWeekStart}/${month + 1} - ${d}/${month + 1}`
            });
            currentWeekStart = d + 1;
            weekIndex++;
        }
    }

    // 2. Map dữ liệu chi tiêu vào các tuần đã tạo
    const weeklyData = weeksInMonth.map(week => {
         const employeeSpending: Record<string, number> = {};
         let hasData = false;
         
         monthlyRecords.forEach(r => {
             // Parse ngày trực tiếp từ chuỗi YYYY-MM-DD để tránh lỗi múi giờ
             const day = parseInt(r.date.split('-')[2]);
             
             if (day >= week.start && day <= week.end) {
                 r.items.forEach(item => {
                     employeeSpending[item.employeeId] = (employeeSpending[item.employeeId] || 0) + item.price;
                     hasData = true;
                 });
             }
         });

         return {
             week: week.id,
             label: week.label,
             employeeSpending,
             hasData
         };
    }).filter(w => w.hasData); // Chỉ hiện tuần nào có dữ liệu chi tiêu

    return { totalSpentMonth, empStats, weeklyData };
  }, [employees, lunchRecords, currentDate]);

  return (
    <div className="p-4 pb-24 space-y-6">
      {/* Month Navigation */}
      <div className="flex justify-between items-center bg-white p-2 rounded-xl shadow-sm border border-gray-100">
        <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600">
          <ChevronLeft />
        </button>
        <div className="flex flex-col items-center">
          <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Thống kê tháng</span>
          <h2 className="text-lg font-bold text-gray-800">
            {currentDate.getMonth() + 1} / {currentDate.getFullYear()}
          </h2>
        </div>
        <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600">
          <ChevronRight />
        </button>
      </div>

      {/* Summary Card */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-5 rounded-2xl shadow-lg text-white">
        <h2 className="text-blue-100 text-xs font-bold uppercase tracking-wider mb-1">Tổng chi tiêu tháng {currentDate.getMonth() + 1}</h2>
        <div className="text-3xl font-bold">{currencyFormatter(stats.totalSpentMonth)}</div>
      </div>

      {/* Weekly Breakdown Section */}
      <div className="space-y-3">
        <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
           <LayoutList size={20} className="text-blue-600"/> 
           Chi tiêu theo tuần
        </h3>
        {stats.weeklyData.length === 0 && <p className="text-gray-400 italic text-sm">Chưa có dữ liệu tuần.</p>}
        
        {stats.weeklyData.map(week => (
           <div key={week.week} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              <div className="bg-gray-50 px-4 py-2 border-b border-gray-100 flex justify-between items-center">
                 <span className="font-bold text-gray-700">Tuần {week.week} ({week.label})</span>
              </div>
              <div className="p-2 divide-y divide-gray-100">
                 {Object.entries(week.employeeSpending)
                    .sort(([, a], [, b]) => b - a) // Sort by spending desc
                    .map(([empId, amount]) => {
                      const emp = employees.find(e => e.id === empId);
                      if (!emp) return null;
                      return (
                        <div key={empId} className="flex justify-between py-2 px-2 text-sm">
                           <span className="text-gray-700">{emp.name}</span>
                           <span className="font-medium text-red-500">-{currencyFormatter(amount)}</span>
                        </div>
                      );
                    })}
              </div>
           </div>
        ))}
      </div>

      {/* Employee Details Section */}
      <div className="space-y-4 pt-4 border-t border-gray-200">
        <div className="flex justify-between items-end px-1">
          <h3 className="font-bold text-gray-800 text-lg">Tổng quan nhân viên</h3>
          <span className="text-xs text-gray-500 italic">{stats.empStats.length} người</span>
        </div>
        
        {stats.empStats.map(emp => (
          <div key={emp.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
             {/* Header */}
             <div className="p-4 border-b border-gray-50 flex justify-between items-start">
               <div>
                 <div className="font-bold text-lg text-gray-900">{emp.name}</div>
                 <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                   {emp.balance < 0 ? <TrendingDown size={12} className="text-red-500"/> : <TrendingUp size={12} className="text-green-500"/>}
                   <span>Số dư hiện tại</span>
                 </div>
               </div>
               <div className={`text-right ${emp.balance >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                 <div className="font-bold text-lg">{currencyFormatter(emp.balance)}</div>
               </div>
             </div>
             
             {/* Mini Dashboard for Selected Month */}
             <div className="grid grid-cols-2 text-center divide-x divide-gray-50 bg-gray-50/50">
               <div className="p-3">
                 <div className="text-[10px] text-gray-400 uppercase font-bold mb-0.5">Số bữa ăn</div>
                 <div className="text-sm font-semibold text-gray-700 flex items-center justify-center gap-1">
                    <CalendarDays size={14} className="text-blue-500" />
                    {emp.mealCount}
                 </div>
               </div>
               <div className="p-3">
                 <div className="text-[10px] text-gray-400 uppercase font-bold mb-0.5">Tiền ăn tháng này</div>
                 <div className="text-sm font-semibold text-orange-600 flex items-center justify-center gap-1">
                    <Receipt size={14} />
                    {currencyFormatter(emp.totalMealCost)}
                 </div>
               </div>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
};