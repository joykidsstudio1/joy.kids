import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export const LiveStats = ({ stats }: { stats: any }) => {
  const data = [
    { name: 'CPU', value: stats.cpu || 0 },
    { name: 'Memory', value: stats.mem || 0 },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
        <p className="text-slate-500 text-xs">الصور المولدة</p>
        <p className="text-xl font-bold text-white">{stats.images || 0}</p>
      </div>
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
        <p className="text-slate-500 text-xs">الملفات الصوتية</p>
        <p className="text-xl font-bold text-white">{stats.audio || 0}</p>
      </div>
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
        <p className="text-slate-500 text-xs">استهلاك الذاكرة</p>
        <p className="text-xl font-bold text-white">{stats.mem}%</p>
      </div>
       <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
        <p className="text-slate-500 text-xs">سرعة المعالجة</p>
        <p className="text-xl font-bold text-white">{stats.speed || 0}x</p>
      </div>
    </div>
  );
};
