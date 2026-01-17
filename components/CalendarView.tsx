import React, { useState } from 'react';
import { Employee, LunchRecord, LunchItem } from '../types';
import { ChevronLeft, ChevronRight, Check, X, DollarSign, Lock } from 'lucide-react';

interface CalendarViewProps {
  employees: Employee[];
  lunchRecords: LunchRecord[];
  defaultCost: number;
  onSaveLunch: (date: string, items: LunchItem[]) => void;
  readOnly?: boolean;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  employees,
  lunchRecords,
  defaultCost,
  onSaveLunch,
  readOnly = false
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);
  
  // Modal State
  const [tempItems, setTempItems] = useState<Map<string, LunchItem>>(new Map());
  const [batchPrice, setBatchPrice] = useState<number>(defaultCost);

  // Format date helper (Fix: Sử dụng Local Time thay vì UTC để tránh lệch ngày)
  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const daysInMonth = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth());
  
  // Tính toán ngày bắt đầu của tháng (0 = Thứ 2, ..., 6 = Chủ Nhật)
  const getFirstDayIndex = () => {
    const day = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
    // getDay(): 0 là CN, 1 là T2...
    // Muốn: 0 là T2, ... 6 là CN
    return day === 0 ? 6 : day - 1;
  };

  const firstDayOfMonth = getFirstDayIndex();

  // Navigation
  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  // Data helpers
  const getRecordForDate = (dateStr: string) => lunchRecords.find(r => r.date === dateStr);
  
  const openDay = (day: number) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const dateStr = formatDate(date);
    setSelectedDateStr(dateStr);
    
    const record = getRecordForDate(dateStr);
    const newMap = new Map<string, LunchItem>();
    
    let priceToSet = defaultCost;

    if (record) {
      record.items.forEach(item => newMap.set(item.employeeId, { ...item }));
      if (record.items.length > 0) {
        priceToSet = record.items[0].price;
      }
    }
    
    setBatchPrice(priceToSet);
    setTempItems(newMap);
  };

  const toggleEmployee = (id: string) => {
    if (readOnly) return;
    const newMap = new Map(tempItems);
    if (newMap.has(id)) {
      newMap.delete(id);
    } else {
      newMap.set(id, { employeeId: id, price: batchPrice, note: '' });
    }
    setTempItems(newMap);
  };

  const updateItemDetails = (id: string, field: 'price' | 'note', value: string | number) => {
    if (readOnly) return;
    const newMap = new Map<string, LunchItem>(tempItems);
    const item = newMap.get(id);
    if (item) {
      const newItem = { ...item };
      if (field === 'price') newItem.price = Number(value);
      if (field === 'note') newItem.note = String(value);
      newMap.set(id, newItem);
      setTempItems(newMap);
    }
  };

  const handleBatchPriceChange = (val: string) => {
    if (readOnly) return;
    const newPrice = Number(val);
    setBatchPrice(newPrice);
    
    const newMap = new Map(tempItems);
    for (const [key, item] of newMap.entries()) {
        newMap.set(key, { ...item, price: newPrice });
    }
    setTempItems(newMap);
  };

  const saveAndClose = () => {
    if (readOnly) return;
    if (selectedDateStr) {
      onSaveLunch(selectedDateStr, Array.from(tempItems.values()));
      setSelectedDateStr(null);
    }
  };

  const selectAll = () => {
    if (readOnly) return;
    const newMap = new Map();
    employees.forEach(emp => {
      newMap.set(emp.id, { employeeId: emp.id, price: batchPrice, note: '' });
    });
    setTempItems(newMap);
  };

  return (
    <div className="p-4 pb-24 h-full flex flex-col">
      {/* Calendar Header */}
      <div className="flex justify-between items-center mb-6">
        <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-full">
          <ChevronLeft />
        </button>
        <h2 className="text-xl font-bold text-gray-800">
          Tháng {currentDate.getMonth() + 1} / {currentDate.getFullYear()}
        </h2>
        <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-full">
          <ChevronRight />
        </button>
      </div>

      {/* Grid Header (T2 -> CN) */}
      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(d => (
          <div key={d} className={`text-xs font-bold uppercase py-2 ${d === 'CN' ? 'text-red-400' : 'text-gray-400'}`}>{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2 flex-1 auto-rows-fr overflow-y-auto">
        {/* Render Empty Cells */}
        {Array.from({ length: firstDayOfMonth }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        
        {/* Render Days */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
          const dateStr = formatDate(date);
          const record = getRecordForDate(dateStr);
          const isToday = formatDate(new Date()) === dateStr;
          const count = record ? record.items.length : 0;
          
          // Check if Sunday (Last column in grid)
          const isSunday = (firstDayOfMonth + i) % 7 === 6;

          return (
            <button
              key={day}
              onClick={() => openDay(day)}
              className={`
                aspect-square rounded-xl flex flex-col items-center justify-center relative shadow-sm border
                ${isToday ? 'border-blue-500 bg-blue-50' : 'border-gray-100 bg-white'}
                ${count > 0 ? 'bg-green-50 border-green-200' : ''}
                ${isSunday && !isToday && count === 0 ? 'bg-gray-50' : ''}
                active:scale-95 transition-transform
              `}
            >
              <span className={`text-sm font-semibold ${isToday ? 'text-blue-600' : (isSunday ? 'text-red-400' : 'text-gray-700')}`}>
                {day}
              </span>
              {count > 0 && (
                 <span className="mt-1 text-xs px-1.5 py-0.5 bg-green-200 text-green-800 rounded-full font-bold">
                   {count}
                 </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Modal for Employee Selection & Detail */}
      {selectedDateStr && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-end sm:items-center justify-center animate-fade-in">
          <div className="bg-white w-full sm:max-w-lg h-[90dvh] sm:h-[80vh] sm:rounded-2xl rounded-t-3xl shadow-2xl flex flex-col">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-3xl sm:rounded-t-2xl">
              <div>
                <h3 className="text-lg font-bold flex items-center gap-2">
                  Chi tiết ăn trưa 
                  {readOnly && <Lock size={14} className="text-gray-400" />}
                </h3>
                <p className="text-sm text-gray-500">{selectedDateStr.split('-').reverse().join('/')}</p>
              </div>
              <button onClick={() => setSelectedDateStr(null)} className="p-2 text-gray-400 hover:text-gray-600">
                <X />
              </button>
            </div>
            
            {/* Batch Price Control - Disable if ReadOnly */}
            {!readOnly && (
            <div className="bg-blue-50 px-4 py-3 flex items-center justify-between border-b border-blue-100">
               <div className="flex items-center gap-2">
                 <div className="bg-blue-200 p-1.5 rounded-lg text-blue-800">
                    <DollarSign size={16} />
                 </div>
                 <span className="text-sm font-bold text-blue-900">Giá chung hôm nay</span>
               </div>
               <div className="relative w-32">
                  <input 
                    type="number"
                    value={batchPrice}
                    onChange={(e) => handleBatchPriceChange(e.target.value)}
                    className="w-full pl-3 pr-8 py-1.5 text-right font-bold text-blue-800 bg-white border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <span className="absolute right-3 top-1.5 text-xs text-gray-400 font-bold">đ</span>
               </div>
            </div>
            )}

            {!readOnly && (
            <div className="p-2 flex justify-end px-4 border-b border-gray-100 bg-white">
                 <button onClick={selectAll} className="text-xs text-blue-600 font-semibold uppercase py-2 hover:bg-blue-50 px-2 rounded">
                   Chọn tất cả
                 </button>
            </div>
            )}

            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50">
              {employees.map(emp => {
                const item = tempItems.get(emp.id);
                const isSelected = !!item;
                
                return (
                  <div 
                    key={emp.id}
                    className={`rounded-xl border transition-all overflow-hidden ${
                      isSelected 
                        ? 'border-blue-500 bg-blue-50/50 shadow-sm' 
                        : 'border-gray-200 bg-white opacity-80'
                    }`}
                  >
                    {/* Header Row: Checkbox + Name */}
                    <div 
                      onClick={() => toggleEmployee(emp.id)}
                      className={`p-3 flex items-center gap-3 ${readOnly ? 'cursor-default' : 'cursor-pointer'}`}
                    >
                      <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300 bg-white'}`}>
                        {isSelected && <Check size={14} className="text-white" />}
                      </div>
                      <span className={`font-medium flex-1 ${isSelected ? 'text-blue-900' : 'text-gray-700'}`}>{emp.name}</span>
                    </div>

                    {/* Details Row: Price + Note (Only if selected) */}
                    {isSelected && (
                      <div className="px-3 pb-3 pt-0 flex gap-2 animate-fade-in">
                         <div className="flex-1">
                            <label className="text-[10px] text-gray-500 uppercase font-bold">Giá tiền</label>
                            <div className={`flex items-center border rounded-lg px-2 py-1.5 ${readOnly ? 'bg-gray-100 border-gray-200' : 'bg-white border-blue-200'}`}>
                                <span className="text-gray-400 text-xs mr-1">₫</span>
                                <input 
                                  type="number" 
                                  value={item.price}
                                  disabled={readOnly}
                                  onClick={(e) => e.stopPropagation()}
                                  onChange={(e) => updateItemDetails(emp.id, 'price', e.target.value)}
                                  className="w-full text-sm font-semibold text-blue-700 outline-none bg-transparent disabled:text-gray-600"
                                />
                            </div>
                         </div>
                         <div className="flex-[2]">
                            <label className="text-[10px] text-gray-500 uppercase font-bold">Ghi chú</label>
                            <input 
                                type="text"
                                placeholder={readOnly ? "" : "Vd: thêm cơm..."}
                                value={item.note || ''}
                                disabled={readOnly}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => updateItemDetails(emp.id, 'note', e.target.value)}
                                className={`w-full text-sm rounded-lg px-2 py-1.5 outline-none text-gray-700 ${readOnly ? 'bg-gray-100 border border-gray-200' : 'bg-white border border-blue-200 focus:ring-1 focus:ring-blue-500'}`}
                            />
                         </div>
                      </div>
                    )}
                  </div>
                );
              })}
              {employees.length === 0 && <p className="text-center text-gray-400 mt-8">Chưa có nhân viên nào.</p>}
            </div>

            <div className="p-4 border-t border-gray-100 bg-white rounded-b-xl sm:rounded-b-2xl shadow-[0_-5px_10px_rgba(0,0,0,0.05)] pb-safe-area">
              {readOnly ? (
                 <div className="w-full bg-gray-100 text-gray-500 py-3 rounded-xl font-bold flex items-center justify-center gap-2">
                    <Lock size={16} /> Chỉ xem
                 </div>
              ) : (
                <button
                    onClick={saveAndClose}
                    className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
                >
                    Lưu ({tempItems.size} người)
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};