import React, { useState } from 'react';
import { Employee } from '../types';
import { Trash2, UserPlus, Wallet, Edit3, X, ArrowUpRight, ArrowDownLeft, Lock } from 'lucide-react';

interface EmployeeListProps {
  employees: Employee[];
  onAddEmployee: (name: string) => void;
  onRemoveEmployee: (id: string) => void;
  onAdjustBalance: (id: string, amount: number) => void;
  currencyFormatter: (val: number) => string;
  readOnly?: boolean;
}

export const EmployeeList: React.FC<EmployeeListProps> = ({ 
  employees, 
  onAddEmployee, 
  onRemoveEmployee,
  onAdjustBalance,
  currencyFormatter,
  readOnly = false
}) => {
  const [newName, setNewName] = useState('');
  
  // Modal State for Adjustment
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);
  const [adjustAmount, setAdjustAmount] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim()) {
      onAddEmployee(newName.trim());
      setNewName('');
    }
  };

  const handleAdjust = (type: 'add' | 'subtract') => {
    if (selectedEmp && adjustAmount) {
      const val = Number(adjustAmount);
      const finalAmount = type === 'add' ? val : -val;
      onAdjustBalance(selectedEmp.id, finalAmount);
      
      // Close modal
      setSelectedEmp(null);
      setAdjustAmount('');
    }
  };

  return (
    <div className="p-4 space-y-6 pb-24">
      {/* Add Employee Form - Hide if ReadOnly */}
      {!readOnly ? (
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <UserPlus size={20} className="text-blue-600" />
            Thêm nhân viên
          </h2>
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nhập tên nhân viên..."
              className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={!newName.trim()}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              Thêm
            </button>
          </form>
        </div>
      ) : (
        <div className="bg-blue-50 text-blue-800 p-3 rounded-xl flex items-center gap-2 text-sm font-medium">
            <Lock size={16} />
            Đang ở chế độ xem. Đăng nhập để chỉnh sửa.
        </div>
      )}

      {/* List */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold text-gray-800">Danh sách ({employees.length})</h2>
        {employees.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Chưa có nhân viên nào.</p>
        ) : (
          employees.map((emp) => (
            <div key={emp.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
              <div>
                <p className="font-semibold text-gray-900">{emp.name}</p>
                <div className={`flex items-center gap-1 text-sm mt-1 ${emp.balance >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                  <Wallet size={14} />
                  <span className="font-mono font-medium">
                    {emp.balance >= 0 ? '+' : ''}{currencyFormatter(emp.balance)}
                  </span>
                </div>
              </div>
              
              {/* Actions - Show only if NOT ReadOnly */}
              {!readOnly && (
                <div className="flex items-center gap-1">
                   <button
                    onClick={() => setSelectedEmp(emp)}
                    className="p-2 bg-gray-50 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                    title="Điều chỉnh số dư"
                  >
                    <Edit3 size={18} />
                  </button>
                  <button
                    onClick={() => {
                       if(window.confirm(`Xóa nhân viên ${emp.name}?`)) onRemoveEmployee(emp.id);
                    }}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Adjustment Modal */}
      {selectedEmp && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center animate-fade-in p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
               <h3 className="font-bold text-gray-800">Điều chỉnh số dư</h3>
               <button onClick={() => setSelectedEmp(null)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
            </div>
            
            <div className="p-5">
              <div className="text-center mb-4">
                <div className="text-sm text-gray-500 mb-1">Nhân viên</div>
                <div className="text-xl font-bold text-gray-900">{selectedEmp.name}</div>
                <div className={`text-sm mt-1 font-mono ${selectedEmp.balance >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                   Hiện tại: {currencyFormatter(selectedEmp.balance)}
                </div>
              </div>

              <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Số tiền điều chỉnh</label>
              <input 
                type="number" 
                value={adjustAmount}
                onChange={e => setAdjustAmount(e.target.value)}
                placeholder="0"
                autoFocus
                className="w-full text-2xl font-bold text-center p-3 border border-gray-300 rounded-xl mb-6 focus:ring-2 focus:ring-blue-500 outline-none"
              />

              <div className="grid grid-cols-2 gap-3">
                 <button 
                   onClick={() => handleAdjust('add')}
                   disabled={!adjustAmount}
                   className="flex flex-col items-center justify-center p-3 bg-green-50 text-green-700 rounded-xl font-bold hover:bg-green-100 disabled:opacity-50"
                 >
                    <ArrowUpRight size={20} className="mb-1" />
                    Nạp tiền (+)
                    <span className="text-[10px] font-normal opacity-70">Thu tiền mặt/CK</span>
                 </button>
                 <button 
                   onClick={() => handleAdjust('subtract')}
                   disabled={!adjustAmount}
                   className="flex flex-col items-center justify-center p-3 bg-red-50 text-red-700 rounded-xl font-bold hover:bg-red-100 disabled:opacity-50"
                 >
                    <ArrowDownLeft size={20} className="mb-1" />
                    Trừ nợ (-)
                    <span className="text-[10px] font-normal opacity-70">Ghi nợ/Phạt</span>
                 </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};