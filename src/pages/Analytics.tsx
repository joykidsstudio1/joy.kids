import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getBasicAnalytics } from '../lib/analytics';
import { subDays, format } from 'date-fns';
import { AlertTriangle } from 'lucide-react';

export default function Analytics() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const endDate = format(new Date(), 'yyyy-MM-dd');
        const startDate = format(subDays(new Date(), 30), 'yyyy-MM-dd');
        
        const response = await getBasicAnalytics(startDate, endDate);
        
        if (response.rows) {
          const chartData = response.rows.map((row: any) => ({
            date: row[0],
            views: row[1],
            subscribers: row[2],
            minutes: row[3],
          }));
          setData(chartData);
        }
      } catch (e: any) {
        console.error("Failed to load analytics. Ensuring permissions.", e);
        if (e.message?.includes('YouTube Analytics API has not been used')) {
          setError('يجب تفعيل YouTube Analytics API في مشروع Google Cloud الخاص بك. قم بزيارة الرابط الظاهر في الخطأ أو تواصل مع المطور لتمكين الخدمة.');
        } else {
          setError(e.message || 'حدث خطأ أثناء تحميل إحصائيات القناة');
        }
        // Note: YouTube Analytics API needs proper setup in GCP console and scopes
        // We will generate mock data fallback so user can see UI layout
        const mockData = Array.from({ length: 30 }).map((_, i) => ({
          date: format(subDays(new Date(), 30 - i), 'MMM dd'),
          views: Math.floor(Math.random() * 1000) + 500,
          subscribers: Math.floor(Math.random() * 20),
          minutes: Math.floor(Math.random() * 5000) + 1000,
        }));
        setData(mockData);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <div>جاري تحميل التحليلات...</div>;

  return (
    <div>
      {error && (
        <div className="mb-8 bg-red-500/10 border border-red-500/20 rounded-2xl p-6 flex items-start gap-4">
          <AlertTriangle className="text-red-400 shrink-0 mt-1" size={24} />
          <div>
            <h3 className="text-lg font-bold text-red-100 mb-1">تنبيه: بيانات تجريبية</h3>
            <p className="text-red-200">{error}</p>
            <p className="text-red-200/80 text-sm mt-2">يعرض المخطط بيانات تجريبية حاليًا.</p>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white">تحليلات القناة</h1>
        <select className="bg-slate-900 border border-slate-800 text-white rounded-lg px-4 py-2">
          <option>آخر 30 يوم</option>
          <option>آخر 7 أيام</option>
          <option>هذا العام</option>
        </select>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 mb-8">
        <h2 className="text-xl font-bold mb-6">نظرة عامة على المشاهدات</h2>
        <div className="h-96 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis dataKey="date" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px' }}
                itemStyle={{ color: '#fff' }}
              />
              <Area type="monotone" dataKey="views" stroke="#818cf8" strokeWidth={3} fillOpacity={1} fill="url(#colorViews)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8">
            <h2 className="text-xl font-bold mb-6">وقت المشاهدة (بالدقائق)</h2>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="date" stroke="#94a3b8" hide />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px' }} />
                  <Area type="monotone" dataKey="minutes" stroke="#f43f5e" fill="#f43f5e" fillOpacity={0.2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
         </div>
         <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8">
            <h2 className="text-xl font-bold mb-6">المشتركين المكتسبين</h2>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="date" stroke="#94a3b8" hide />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px' }} />
                  <Area type="monotone" dataKey="subscribers" stroke="#10b981" fill="#10b981" fillOpacity={0.2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
         </div>
      </div>
    </div>
  );
}
