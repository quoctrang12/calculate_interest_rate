import React from 'react';
import { SystemLog } from '../types';
import { History, Clock, Activity } from 'lucide-react';

interface LogViewerProps {
  logs: SystemLog[];
}

export const LogViewer: React.FC<LogViewerProps> = ({ logs }) => {
  // Sort logs by newest first
  const sortedLogs = [...logs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleString('vi-VN');
  };

  return (
    <div className="p-4 pb-24 h-full flex flex-col space-y-4">
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
            <div className="bg-gray-100 p-2 rounded-lg">
                <History className="text-gray-600" size={24} />
            </div>
            <div>
                <h2 className="text-lg font-bold text-gray-800">Nhật ký hệ thống</h2>
                <p className="text-xs text-gray-500">{logs.length} hoạt động được ghi lại</p>
            </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3">
        {sortedLogs.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <Activity className="mx-auto mb-2 opacity-50" size={40} />
            <p>Chưa có hoạt động nào được ghi lại.</p>
          </div>
        ) : (
          sortedLogs.map((log) => (
            <div key={log.id} className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex flex-col gap-1">
              <div className="flex justify-between items-start">
                <span className="font-bold text-gray-800 text-sm">{log.action}</span>
                <span className="text-[10px] text-gray-400 flex items-center gap-1 bg-gray-50 px-2 py-0.5 rounded-full">
                  <Clock size={10} />
                  {formatDate(log.timestamp)}
                </span>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed border-t border-gray-50 pt-2 mt-1">
                {log.details}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
