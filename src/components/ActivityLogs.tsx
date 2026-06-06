import React from 'react';
import { PipelineProgress } from '../types';

export const ActivityLogs = ({ logs }: { logs: PipelineProgress[] }) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 h-64 overflow-y-auto">
      <h3 className="text-sm font-bold text-slate-400 mb-4 sticky top-0 bg-slate-900 pb-2 border-b border-slate-800">نشاط النظام (Logs)</h3>
      <div className="space-y-2">
        {logs.map((log, i) => (
          <div key={i} className="text-xs font-mono text-slate-300">
            <span className="text-indigo-400">[{new Date(log.timestamp).toLocaleTimeString()}]</span> {log.message}
          </div>
        ))}
        {logs.length === 0 && <div className="text-slate-600 text-sm py-4 text-center">لا توجد سجلات حالياً</div>}
      </div>
    </div>
  );
};
