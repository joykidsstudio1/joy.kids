import React, { useState } from 'react';
import { Zap, Send, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';

export default function Automation() {
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleAutomate = async () => {
    if (!topic.trim()) return;

    setLoading(true);
    setStatus('idle');
    setErrorMessage('');

    try {
      const response = await fetch('https://hook.eu1.make.com/o3bndu1fihr4n859tw7h5bfnzpbxuhdh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ topic }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      setStatus('success');
      setTopic(''); // Clear input on success
    } catch (error: any) {
      console.error('Automation error:', error);
      setStatus('error');
      setErrorMessage(error.message || 'حدث خطأ أثناء الاتصال بالخادم. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <Zap className="text-yellow-400" size={32} />
          الأتمتة الكاملة
        </h1>
        <p className="text-slate-400 mt-2">
          أدخل موضوع الفيديو أو المحتوى ليتم إرساله تلقائياً إلى نظام الأتمتة الخاص بك (Make.com) وبدء دورة العمل.
        </p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-xl">
        <div className="flex flex-col gap-6">
          <div>
            <label htmlFor="topic" className="block text-sm font-medium text-slate-300 mb-2">
              موضوع المحتوى المراد أتمتته
            </label>
            <textarea
              id="topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="مثال: فيديو عن أهمية شرب الماء للأطفال..."
              className="w-full h-40 bg-slate-800 border border-slate-700 text-white rounded-2xl p-4 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none transition-all"
              disabled={loading}
            />
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="w-full sm:w-auto">
              {status === 'success' && (
                <div className="flex items-center gap-2 text-emerald-400 bg-emerald-500/10 px-4 py-2 rounded-xl">
                  <CheckCircle2 size={20} />
                  <span>تم إرسال الطلب بنجاح! يتم الآن معالجة الأتمتة.</span>
                </div>
              )}
              {status === 'error' && (
                <div className="flex items-center gap-2 text-red-400 bg-red-500/10 px-4 py-2 rounded-xl">
                  <AlertTriangle size={20} />
                  <span>{errorMessage}</span>
                </div>
              )}
            </div>

            <button
              onClick={handleAutomate}
              disabled={loading || !topic.trim()}
              className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white px-8 py-3 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  جاري الإرسال...
                </>
              ) : (
                <>
                  <Send size={20} className="rotate-180" />
                  بدء الأتمتة
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
