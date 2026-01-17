
import React, { useState, useMemo } from 'react';
import { DebtRecord, User, ThemeClasses } from '../types';
import { Plus, ArrowUpRight, ArrowDownLeft, Trash2, Calendar, X } from 'lucide-react';

interface DebtBookProps {
  debts: DebtRecord[];
  onAddDebt: (debt: DebtRecord) => void;
  onUpdateDebt: (debt: DebtRecord) => void;
  onDeleteDebt: (id: string) => void;
  currentUser: User;
  currencyFormatter: (val: number) => string;
  theme: ThemeClasses;
}

export const DebtBook: React.FC<DebtBookProps> = ({
  debts,
  onAddDebt,
  onUpdateDebt,
  onDeleteDebt,
  currentUser,
  currencyFormatter,
  theme
}) => {
  const [activeTab, setActiveTab] = useState<'borrow' | 'lend'>('borrow');
  const [showModal, setShowModal] = useState(false);
  const [editingDebt, setEditingDebt] = useState<DebtRecord | null>(null);

  // Form State
  const [personName, setPersonName] = useState('');
  const [amount, setAmount] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [note, setNote] = useState('');
  const [paidAmount, setPaidAmount] = useState('');

  // Filter Data
  const filteredDebts = useMemo(() => {
    return debts
      .filter(d => d.userId === currentUser.id && d.type === activeTab)
      .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  }, [debts, currentUser, activeTab]);

  const totalAmount = filteredDebts.reduce((sum, d) => sum + d.amount, 0);
  const totalPaid = filteredDebts.reduce((sum, d) => sum + d.paidAmount, 0);
  const remaining = totalAmount - totalPaid;

  const resetForm = () => {
    setPersonName('');
    setAmount('');
    setStartDate(new Date().toISOString().split('T')[0]);
    setDueDate('');
    setNote('');
    setPaidAmount('');
    setEditingDebt(null);
  };

  const handleEdit = (debt: DebtRecord) => {
    setEditingDebt(debt);
    setPersonName(debt.personName);
    setAmount(debt.amount.toString());
    setStartDate(debt.startDate);
    setDueDate(debt.dueDate || '');
    setNote(debt.note || '');
    setPaidAmount(debt.paidAmount.toString());
    setShowModal(true);
  };

  const handleSave = () => {
    if (!personName || !amount) return;

    const numAmount = Number(amount);
    const numPaid = Number(paidAmount) || 0;
    const isFinished = numPaid >= numAmount;

    if (editingDebt) {
      onUpdateDebt({
        ...editingDebt,
        personName,
        amount: numAmount,
        paidAmount: numPaid,
        startDate,
        dueDate: dueDate || undefined,
        note,
        isFinished
      });
    } else {
      onAddDebt({
        id: Date.now().toString(),
        userId: currentUser.id,
        type: activeTab,
        personName,
        amount: numAmount,
        paidAmount: numPaid,
        startDate,
        dueDate: dueDate || undefined,
        note,
        isFinished
      });
    }
    setShowModal(false);
    resetForm();
  };

  return (
    <div className="flex flex-col h-full bg-gray-50/50">
      {/* Tab Switcher */}
      <div className="p-4 pb-2">
        <div className="flex bg-white rounded-xl p-1 shadow-sm border border-gray-100">
          <button
            onClick={() => setActiveTab('borrow')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'borrow' 
                ? 'bg-red-50 text-red-600 shadow-sm' 
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <ArrowDownLeft size={18} /> Đi vay
          </button>
          <button
            onClick={() => setActiveTab('lend')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'lend' 
                ? 'bg-green-50 text-green-600 shadow-sm' 
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <ArrowUpRight size={18} /> Cho vay
          </button>
        </div>
      </div>

      {/* Summary Card */}
      <div className="px-4 mb-4">
        <div className={`rounded-2xl p-5 text-white shadow-lg bg-gradient-to-r ${activeTab === 'borrow' ? 'from-red-500 to-orange-500' : 'from-green-500 to-teal-500'}`}>
          <div className="text-xs font-bold uppercase opacity-80 mb-1">
             {activeTab === 'borrow' ? 'Tổng nợ phải trả' : 'Tổng tiền cần thu'}
          </div>
          <div className="text-3xl font-bold">{currencyFormatter(remaining)}</div>
          <div className="mt-3 flex items-center justify-between text-xs opacity-90 border-t border-white/20 pt-2">
             <span>Tổng gốc: {currencyFormatter(totalAmount)}</span>
             <span>Đã {activeTab === 'borrow' ? 'trả' : 'thu'}: {currencyFormatter(totalPaid)}</span>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-4 space-y-3 pb-24">
        {filteredDebts.length === 0 && (
          <div className="text-center py-10 text-gray-400">
            <div className={`bg-white p-4 rounded-full inline-block mb-3 shadow-sm`}>
               {activeTab === 'borrow' ? <ArrowDownLeft size={32} className="text-red-200" /> : <ArrowUpRight size={32} className="text-green-200" />}
            </div>
            <p>Sổ nợ trống. Thật tuyệt vời!</p>
          </div>
        )}

        {filteredDebts.map(debt => {
          const progress = Math.min((debt.paidAmount / debt.amount) * 100, 100);
          const isOverdue = debt.dueDate && new Date(debt.dueDate) < new Date() && !debt.isFinished;

          return (
            <div 
              key={debt.id} 
              onClick={() => handleEdit(debt)}
              className={`bg-white rounded-xl p-4 border shadow-sm relative overflow-hidden transition-transform active:scale-[0.99] ${debt.isFinished ? 'border-gray-100 opacity-70' : 'border-gray-200'}`}
            >
              {isOverdue && (
                 <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-bl-lg font-bold">
                   Quá hạn
                 </div>
              )}
              
              <div className="flex justify-between items-start mb-2">
                <div>
                   <h4 className="font-bold text-gray-800 text-lg">{debt.personName}</h4>
                   <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                      <Calendar size={12} />
                      {new Date(debt.startDate).toLocaleDateString('vi-VN')}
                      {debt.dueDate && ` → ${new Date(debt.dueDate).toLocaleDateString('vi-VN')}`}
                   </div>
                </div>
                <div className={`text-right font-bold ${activeTab === 'borrow' ? 'text-red-600' : 'text-green-600'}`}>
                  {currencyFormatter(debt.amount)}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-3">
                 <div className="flex justify-between text-xs mb-1 font-medium text-gray-600">
                    <span>{debt.isFinished ? 'Hoàn thành' : (activeTab === 'borrow' ? 'Đã trả' : 'Đã thu')}</span>
                    <span>{Math.round(progress)}%</span>
                 </div>
                 <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${debt.isFinished ? 'bg-gray-400' : (activeTab === 'borrow' ? 'bg-red-500' : 'bg-green-500')}`} 
                      style={{ width: `${progress}%` }}
                    />
                 </div>
                 <div className="mt-1 text-right text-xs text-gray-500">
                   {currencyFormatter(debt.paidAmount)} / {currencyFormatter(debt.amount)}
                 </div>
              </div>

              {debt.note && (
                <p className="text-xs text-gray-400 mt-2 italic bg-gray-50 p-2 rounded border border-gray-100">
                  "{debt.note}"
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-24 right-4">
        <button
          onClick={() => { resetForm(); setShowModal(true); }}
          className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-white transition-transform hover:scale-105 active:scale-95 ${activeTab === 'borrow' ? 'bg-red-500 shadow-red-200' : 'bg-green-500 shadow-green-200'}`}
        >
          <Plus size={28} />
        </button>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-end sm:items-center justify-center animate-fade-in">
          <div className="bg-white w-full sm:max-w-md h-[85vh] sm:h-auto sm:rounded-2xl rounded-t-3xl shadow-2xl flex flex-col">
            <div className={`p-4 border-b border-gray-100 flex justify-between items-center rounded-t-3xl sm:rounded-t-2xl ${activeTab === 'borrow' ? 'bg-red-50' : 'bg-green-50'}`}>
              <h3 className={`text-lg font-bold flex items-center gap-2 ${activeTab === 'borrow' ? 'text-red-800' : 'text-green-800'}`}>
                {editingDebt ? 'Cập nhật khoản nợ' : (activeTab === 'borrow' ? 'Thêm khoản vay' : 'Thêm khoản cho vay')}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-2 text-gray-500 hover:bg-white/50 rounded-full">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
               <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Người {activeTab === 'borrow' ? 'cho vay' : 'vay'}</label>
                  <input 
                    type="text" 
                    value={personName}
                    onChange={e => setPersonName(e.target.value)}
                    placeholder="Nhập tên..."
                    className={`w-full p-3 rounded-xl border border-gray-200 focus:ring-2 outline-none font-medium ${theme.ring} ${theme.borderDark}`}
                  />
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Số tiền gốc</label>
                    <input 
                      type="number" 
                      value={amount}
                      onChange={e => setAmount(e.target.value)}
                      placeholder="0"
                      className={`w-full p-3 rounded-xl border border-gray-200 focus:ring-2 outline-none font-bold text-lg ${theme.ring} ${theme.borderDark}`}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Đã {activeTab === 'borrow' ? 'trả' : 'thu'}</label>
                    <input 
                      type="number" 
                      value={paidAmount}
                      onChange={e => setPaidAmount(e.target.value)}
                      placeholder="0"
                      className={`w-full p-3 rounded-xl border border-gray-200 focus:ring-2 outline-none font-bold text-lg text-gray-600 ${theme.ring} ${theme.borderDark}`}
                    />
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Ngày vay</label>
                    <input 
                      type="date" 
                      value={startDate}
                      onChange={e => setStartDate(e.target.value)}
                      className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 outline-none text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Hạn trả (Tuỳ chọn)</label>
                    <input 
                      type="date" 
                      value={dueDate}
                      onChange={e => setDueDate(e.target.value)}
                      className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 outline-none text-sm"
                    />
                  </div>
               </div>

               <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Ghi chú</label>
                  <textarea 
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    placeholder="Lãi suất, điều kiện, v.v..."
                    rows={3}
                    className={`w-full p-3 rounded-xl border border-gray-200 focus:ring-2 outline-none text-sm ${theme.ring} ${theme.borderDark}`}
                  />
               </div>
            </div>

            <div className="p-4 border-t border-gray-100 flex gap-3">
               {editingDebt && (
                 <button 
                   onClick={() => {
                     if (window.confirm('Bạn có chắc muốn xóa khoản này?')) {
                       onDeleteDebt(editingDebt.id);
                       setShowModal(false);
                     }
                   }}
                   className="p-3 rounded-xl bg-red-50 text-red-600 hover:bg-red-100"
                 >
                   <Trash2 size={20} />
                 </button>
               )}
               <button 
                 onClick={handleSave}
                 disabled={!personName || !amount}
                 className={`flex-1 py-3 rounded-xl font-bold text-white shadow-lg transition-transform active:scale-95 disabled:opacity-50 ${activeTab === 'borrow' ? 'bg-red-500 shadow-red-200' : 'bg-green-500 shadow-green-200'}`}
               >
                 {editingDebt ? 'Lưu thay đổi' : 'Tạo mới'}
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
