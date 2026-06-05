import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User as UserIcon, Upload } from 'lucide-react';
import Markdown from 'react-markdown';
import { useNavigate } from 'react-router-dom';

export default function Assistant() {
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([
    { role: 'assistant', content: "مرحباً! أنا الذكاء الاصطناعي المسؤول عن إدارة قناة 'Joy Kids'. أنا هنا لمساعدتك في كتابة العناوين، الأوصاف، والكلمات المفتاحية المخصصة للأطفال والعائلات. قم بتزويدي بنص الفيديو أو فكرته للبدء!" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const extractJsonFromMessage = (text: string) => {
    try {
      const match = text.match(/\{[\s\S]*?\}/);
      if (match) {
        return JSON.parse(match[0]);
      }
    } catch (e) {
      return null;
    }
    return null;
  };

  const handlePublishClick = (metadata: any) => {
    navigate('/videos', { state: { prefillUpload: metadata } });
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: userMessage,
          systemInstruction: `أنت الآن الذكاء الاصطناعي المسؤول عن إدارة قناة 'Joy Kids'. دورك ليس مجرد مساعد، بل أنت مدير المحتوى المسؤول عن:

تحليل المحتوى: سأقوم بتزويدك بملفات الفيديو أو نصوصها، ومهمتك هي كتابة عنوان جذاب، وصف (Description) مُحسّن لمحركات البحث (SEO)، واختيار كلمات مفتاحية (Tags).

الأتمتة: يجب أن تكون صيغة مخرجاتك جاهزة للإرسال عبر API الخاص بيوتيوب (JSON format) عند طلب "تجهيز للنشر".

النبرة: يجب أن يكون أسلوب الكتابة مناسباً للأطفال والعائلات، مشوقاً، ومفيداً.

القيود: لا تقم بنشر أي شيء إلا بعد التأكد من جودة المحتوى ومطابقته لسياسات يوتيوب. عند استلام أمر 'تجهيز للنشر'، قم بإنشاء هيكل البيانات التالي فقط بدون أي نصوص إضافية قبله أو بعده:
{
"title": "...",
"description": "...",
"tags": [...],
"privacyStatus": "draft"
}

المسؤولية: أنت مدير القناة، لذا أي تقصير في جودة الوصف أو اختيار الكلمات سيعتبر خطأ في أداء وظيفتك. استخدم تنسيق Markdown وتحدث باللغة العربية.`
        })
      });
      
      const data = await res.json();
      if (res.ok) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.text }]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: `خطأ: ${data.error}` }]);
      }
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: "حدث خطأ في الشبكة." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white">المساعد الذكي</h1>
        <p className="text-slate-400">اطلب أفكاراً لمقاطع الفيديو، أو مساعدة في تحسين العناوين، أو كتابة النصوص.</p>
      </div>

      <div className="flex-1 bg-slate-900 border border-slate-800 rounded-3xl flex flex-col overflow-hidden">
        <div className="flex-1 p-6 overflow-y-auto space-y-6" ref={scrollRef}>
          {messages.map((msg, i) => {
            const parsedJson = msg.role === 'assistant' ? extractJsonFromMessage(msg.content) : null;
            const hasUploadData = parsedJson && parsedJson.title && parsedJson.description;
            return (
            <div key={i} className={`flex gap-4 max-w-3xl ${msg.role === 'user' ? 'mr-auto flex-row-reverse' : ''}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                msg.role === 'user' ? 'bg-indigo-600' : 'bg-gradient-to-tr from-orange-500 to-red-500'
              }`}>
                {msg.role === 'user' ? <UserIcon size={20} /> : <Bot size={20} />}
              </div>
              <div className={`p-4 rounded-2xl ${
                msg.role === 'user' 
                  ? 'bg-indigo-600 text-white rounded-tl-none' 
                  : 'bg-slate-800 text-slate-200 rounded-tr-none'
              }`}>
                {msg.role === 'user' ? (
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                ) : (
                  <div className="flex flex-col">
                    <div className="markdown-body text-sm leading-relaxed prose prose-invert max-w-none">
                      <Markdown>{msg.content}</Markdown>
                    </div>
                    {hasUploadData && (
                      <div className="mt-4 pt-4 border-t border-slate-700">
                        <button 
                          onClick={() => handlePublishClick(parsedJson)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-medium transition-colors"
                        >
                          <Upload size={16} /> المقترح جاهز! اذهب لرفع الفيديو
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )})}
          {loading && (
            <div className="flex gap-4 max-w-3xl">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-orange-500 to-red-500 flex items-center justify-center shrink-0">
                <Bot size={20} />
              </div>
              <div className="p-4 rounded-2xl bg-slate-800 rounded-tr-none flex items-center gap-2">
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          )}
        </div>
        
        <form onSubmit={handleSend} className="p-4 bg-slate-900 border-t border-slate-800">
          <div className="relative flex items-center">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="اكتب رسالتك هنا..."
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-2xl pr-6 pl-14 py-4 focus:outline-none focus:border-indigo-500 transition-colors"
            />
            <button 
              type="submit" 
              disabled={loading || !input.trim()}
              className="absolute left-3 bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-xl transition-colors disabled:opacity-50 disabled:hover:bg-indigo-600"
            >
              <Send size={20} className="rotate-180" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
