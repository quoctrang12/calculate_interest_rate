import React, { useState } from 'react';
import { parsePaymentNotification } from '../services/geminiService';
import { Employee } from '../types';
import { ScanLine, CheckCircle, AlertCircle, Loader2, ShieldCheck, Lock } from 'lucide-react';

interface PaymentScannerProps {
  employees: Employee[];
  onConfirmPayment: (employeeId: string, amount: number) => void;
  currencyFormatter: (val: number) => string;
  readOnly?: boolean;
}

export const PaymentScanner: React.FC<PaymentScannerProps> = ({ 
  employees, 
  onConfirmPayment,
  currencyFormatter,
  readOnly = false
}) => {
  const [inputObj, setInputObj] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    employeeId: string | null;
    amount: number;
    reason: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [autoSuccess, setAutoSuccess] = useState(false);

  const handleScan = async () => {
    if (!inputObj.trim() || readOnly) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setAutoSuccess(false);

    try {
      const data = await parsePaymentNotification(inputObj, employees);
      
      const scanResult = {
        employeeId: data.matchedEmployeeId,
        amount: data.amount,
        reason: data.confidence
      };
      
      setResult(scanResult);

      // Auto-update balance if employee is found
      if (data.matchedEmployeeId) {
        onConfirmPayment(data.matchedEmployeeId, data.amount);
        setAutoSuccess(true);
      }

    } catch (err: any) {
      setError(err.message || "Lỗi không xác định");
    } finally {
      setLoading(false);
    }
  };

  const getEmployeeName = (id: string | null) => {
    if (!id) return "Không tìm thấy";
    return employees.find(e => e.id === id)?.name || "Không rõ";
  };

  return (
    <div className="p-4 space-y-6 pb-24">
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
        <h2 className="text-xl font-bold flex items-center gap-2 mb-2">
          <ScanLine />
          Xử lý giao dịch AI
        </h2>
        <p className="text-indigo-100 text-sm opacity-90">
          Dán tin nhắn SMS hoặc thông báo từ ngân hàng vào đây. AI sẽ tự động tìm nhân viên và cập nhật số dư ngay lập tức.
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 relative overflow-hidden">
        {readOnly && (
           <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center text-center p-6">
              <div className="bg-gray-100 p-3 rounded-full mb-3">
                 <Lock className="text-gray-500" size={32} />
              </div>
              <h3 className="text-lg font-bold text-gray-800">Tính năng bị khóa</h3>
              <p className="text-gray-500 text-sm mt-1">Bạn cần đăng nhập để sử dụng tính năng cập nhật số dư tự động này.</p>
           </div>
        )}

        <label className="block text-sm font-medium text-gray-700 mb-2">Nội dung tin nhắn</label>
        <textarea
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 h-32 resize-none"
          placeholder="Ví dụ: Techcombank TK 1903... thay doi +50,000 VND tu NGUYEN VAN A..."
          value={inputObj}
          onChange={(e) => setInputObj(e.target.value)}
          disabled={readOnly}
        ></textarea>
        
        <button
          onClick={handleScan}
          disabled={loading || !inputObj.trim() || readOnly}
          className="w-full mt-4 bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 disabled:opacity-50 flex justify-center items-center gap-2 transition-all"
        >
          {loading ? <Loader2 className="animate-spin" /> : <ScanLine size={20} />}
          Phân tích & Cập nhật
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-start gap-3 animate-fade-in">
          <AlertCircle className="shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      {result && (
        <div className={`border rounded-xl p-4 animate-fade-in shadow-sm ${autoSuccess ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'}`}>
          <h3 className={`font-bold mb-3 flex items-center gap-2 ${autoSuccess ? 'text-green-800' : 'text-gray-800'}`}>
            {autoSuccess ? <CheckCircle size={20} className="text-green-600" /> : <ScanLine size={20}/>}
            {autoSuccess ? 'Đã cập nhật thành công' : 'Kết quả phân tích'}
          </h3>
          
          <div className="space-y-3 mb-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-2">
              <span className="text-gray-600">Nhân viên:</span>
              <span className={`font-bold ${!result.employeeId ? 'text-red-500' : 'text-gray-800'}`}>
                {getEmployeeName(result.employeeId)}
              </span>
            </div>
            <div className="flex justify-between items-center border-b border-gray-100 pb-2">
              <span className="text-gray-600">Số tiền:</span>
              <span className="font-bold text-indigo-600">{currencyFormatter(result.amount)}</span>
            </div>
            <div className="text-xs text-gray-500 italic bg-white/50 p-2 rounded">
              AI Note: {result.reason}
            </div>
          </div>

          {autoSuccess ? (
             <div className="w-full bg-green-100 text-green-700 py-3 rounded-lg font-bold flex justify-center items-center gap-2">
                <ShieldCheck size={20} />
                Số dư đã được cộng tự động
             </div>
          ) : (
            <div className="text-center text-sm text-red-500 font-medium bg-red-50 p-3 rounded-lg border border-red-100">
              <AlertCircle size={16} className="inline mr-1 mb-0.5"/>
              Không tìm thấy nhân viên phù hợp để cập nhật.
            </div>
          )}
        </div>
      )}
    </div>
  );
};