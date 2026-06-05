import { useState } from 'react';
import { Wand2, Copy, Check } from 'lucide-react';
import Markdown from 'react-markdown';

export default function ContentGen() {
  const [topic, setTopic] = useState('');
  const [type, setType] = useState('script');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setResult('');
    setCopied(false);

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Generate a YouTube ${type} for the following topic: ${topic}`,
          systemInstruction: `أنت الآن الذكاء الاصطناعي المسؤول عن إدارة قناة 'Joy Kids'. دورك ليس مجرد مساعد، بل أنت مدير المحتوى المسؤول عن القناة المخصصة للأطفال والعائلات.

النبرة: يجب أن يكون أسلوب الكتابة مناسباً للأطفال والعائلات، مشوقاً، ومفيداً.

استخدم تنسيق Markdown وتحدث باللغة العربية.`
        })
      });
      
      const data = await res.json();
      if (res.ok) {
        setResult(data.text);
      } else {
        setResult(`خطأ: ${data.error}`);
      }
    } catch (e) {
      setResult("حدث خطأ في الشبكة.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">صناعة المحتوى</h1>
          <p className="text-slate-400">قم بتوليد نصوص المحتوى، العناوين، الوصف، والكلمات المفتاحية في ثوانٍ.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1 overflow-hidden">
        <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col">
          <h2 className="text-xl font-bold text-white mb-6">الإعدادات</h2>
          
          <div className="space-y-6 flex-1">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">نوع المحتوى</label>
              <select 
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500"
              >
                <option value="script">نص فيديو كامل (Script)</option>
                <option value="ideas">10 أفكار لمقاطع فيديو</option>
                <option value="title">عناوين جذابة</option>
                <option value="description">وصف الفيديو وكلمات مفتاحية</option>
                <option value="plan">خطة محتوى أسبوعية</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">الموضوع أو الكلمة المفتاحية</label>
              <textarea 
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="مثال: كيف تبدأ قناة يوتيوب في 2024..."
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 h-32 resize-none focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <button 
            onClick={handleGenerate}
            disabled={loading || !topic.trim()}
            className="w-full bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                جاري التوليد...
              </span>
            ) : (
              <>
                <Wand2 size={20} />
                توليد بمساعدة الذكاء الاصطناعي
              </>
            )}
          </button>
        </div>

        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col relative overflow-hidden">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white">النتيجة</h2>
            {result && (
              <button 
                onClick={handleCopy}
                className="flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white bg-slate-800 px-4 py-2 rounded-lg transition-colors"
              >
                {copied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
                {copied ? 'تم النسخ!' : 'نسخ النص'}
              </button>
            )}
          </div>
          
          <div className="flex-1 bg-slate-950 rounded-2xl border border-slate-800 p-6 overflow-y-auto">
            {result ? (
              <div className="markdown-body prose prose-invert max-w-none text-slate-300">
                <Markdown>{result}</Markdown>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-4">
                <Wand2 size={48} className="opacity-20 text-indigo-500" />
                <p>قم بملء الإعدادات واضغط على توليد.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
