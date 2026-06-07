import React, { useState, useEffect, useRef } from 'react';
import { Settings, Play, Loader2, Video, FileText, CheckCircle, Clock, UploadCloud, MonitorPlay, Save, PenTool, Trash2, ListVideo, Layers, Type, History, MessageCircle } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { PipelineProgress } from '../types';

interface DraftVideo {
  id: string;
  thumbnail: string;
  title: string;
  duration: string;
  creationDate: string;
}

interface PublishedVideo {
  id: string;
  thumbnail: string;
  title: string;
  views: number;
  publishDate: string;
}

export default function AutoPilot() {
  const [activeTab, setActiveTab] = useState<'production' | 'drafts' | 'published'>('production');
  const [debugMode, setDebugMode] = useState(false);

  // Setup State
  const [videoTitle, setVideoTitle] = useState('');
  const [storyTopic, setStoryTopic] = useState('');
  const [storyCategory, setStoryCategory] = useState('تعليمي');
  const [storyDuration, setStoryDuration] = useState('3 دقائق');
  const [narrationLanguage, setNarrationLanguage] = useState('اللغة العربية');
  const [targetAge, setTargetAge] = useState('ما قبل المدرسة (3-5)');

  // Production State
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<PipelineProgress[]>([]);
  const [currentStage, setCurrentStage] = useState<string>('');
  const [percentCounter, setPercentCounter] = useState(0);
  const [logs, setLogs] = useState<{ id: number; message: string; type: 'info' | 'success' | 'error'; raw?: any }[]>([]);
  const [result, setResult] = useState<any>(null);
  
  // Results form state
  const [finalTitle, setFinalTitle] = useState('');
  const [finalDescription, setFinalDescription] = useState('');
  const [finalTags, setFinalTags] = useState('');

  const socketRef = useRef<Socket | null>(null);

  // Mock initial data
  const [drafts] = useState<DraftVideo[]>([
    { id: '1', thumbnail: 'https://images.unsplash.com/photo-1545048702-79362596cf9b?w=400&q=80', title: 'الثعلب الصغير الودود', duration: '3:15', creationDate: '2023-11-01' },
    { id: '2', thumbnail: 'https://images.unsplash.com/photo-1534067783941-51c9c23ecefd?w=400&q=80', title: 'لماذا يضيء القمر', duration: '5:00', creationDate: '2023-10-28' },
  ]);

  const [published] = useState<PublishedVideo[]>([
    { id: '3', thumbnail: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&q=80', title: 'العد مع التفاح', views: 12450, publishDate: '2023-09-15' },
  ]);

  useEffect(() => {
    socketRef.current = io();
    socketRef.current.on('pipeline-progress', (data: PipelineProgress) => {
      setProgress(prev => {
        const existing = prev.findIndex(p => p.stage === data.stage);
        if (existing !== -1) {
          const next = [...prev];
          next[existing] = data;
          return next;
        }
        return [...prev, data];
      });
      
      const stageNameAr = data.stage === 'generate-story' ? 'توليد القصة' :
                          data.stage === 'generate-assets' ? 'توليد الأصول' :
                          data.stage === 'assemble-video' ? 'تجميع الفيديو' :
                          data.stage === 'generate-metadata' ? 'البيانات الوصفية' :
                          data.stage === 'upload-video' ? 'الرفع ليوتيوب' : 'مكتمل';
      
      setCurrentStage(stageNameAr);
      
      setLogs(prev => [...prev, { 
        id: Date.now() + Math.random(), 
        message: data.message, 
        type: data.status === 'failed' ? 'error' : 'info',
        raw: data
      }]);
      
      if (data.stage === 'completed' || data.status === 'completed') {
        const isFinal = data.stage === 'completed' || data.stage === 'upload-video';
        if (isFinal) {
          setRunning(false);
          setPercentCounter(100);
          setLogs(prev => [...prev, { id: Date.now() + Math.random(), message: 'أكتمل إعداد الفيديو النهائي بنجاح.', type: 'success' }]);
          if (data.extra?.result) {
             const finalData = data.extra.result;
             setResult(finalData);
             setFinalTitle(finalData.metadata?.title || videoTitle || 'عنوان افتراضي');
             setFinalDescription(finalData.metadata?.description || 'وصف رائع لهذه القصة الجميلة.');
             setFinalTags(finalData.metadata?.tags ? finalData.metadata.tags.join('، ') : 'أطفال، تعليمي، قصة');
          } else if (data.extra) {
             setResult(data.extra);
             setFinalTitle(data.extra.metadata?.title || videoTitle || 'عنوان افتراضي');
             setFinalDescription(data.extra.metadata?.description || 'وصف رائع لهذه القصة الجميلة.');
             setFinalTags(data.extra.metadata?.tags ? data.extra.metadata.tags.join('، ') : 'أطفال، تعليمي، قصة');
          } else {
             // Mock result if extra is empty
             setResult({
               videoPath: 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
               thumbnail: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80',
               stats: { fileSizeBytes: 1024*1024*5, generationTimeMs: 120000, videoDurationSec: 60 }
             });
             setFinalTitle(videoTitle || 'مغامرة رائعة');
             setFinalDescription('تم إنتاج قصة رائعة بشكل جميل.');
             setFinalTags('أطفال، تعليمي، مرح');
          }
        }
      }
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [videoTitle]);

  // Mock progress bar
  useEffect(() => {
    let interval: any;
    if (running && percentCounter < 98) {
      interval = setInterval(() => {
        setPercentCounter(p => p + (Math.random() * 2));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [running, percentCounter]);

  const handleGenerate = async () => {
    setRunning(true);
    setProgress([]);
    setLogs([{ id: Date.now() + Math.random(), message: 'بدأ الإنتاج...', type: 'info' }]);
    setResult(null);
    setCurrentStage('توليد القصة');
    setPercentCounter(5);
    
    // In a real app we'd pass all the options
    await fetch('/api/autopilot/trigger', { method: 'POST', body: JSON.stringify({topic: storyTopic}), headers: {'Content-Type': 'application/json'} });
  };

  const categories = ['تعليمي', 'صداقة', 'حيوانات', 'مغامرة', 'قصص أخلاقية', 'قصص إسلامية', 'قصص ما قبل النوم'];
  const durations = ['دقيقة واحدة', '3 دقائق', '5 دقائق', '10 دقائق'];
  const ages = ['الأطفال الصغار (1-3)', 'ما قبل المدرسة (3-5)', 'أطفال (6-8)', 'أطفال أكبر (9-12)'];
  const languages = ['اللغة العربية', 'English', 'Français', 'Español'];

  return (
    <div className="h-full bg-slate-50 min-h-screen text-slate-800 flex flex-col font-sans" dir="rtl">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-lg">
            <MonitorPlay className="text-white" size={24} />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">استوديو الإنتاج الآلي</h1>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-lg">
          <button 
            onClick={() => setActiveTab('production')}
            className={`px-6 py-2 rounded-md font-medium transition-colors ${activeTab === 'production' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-600 hover:text-slate-900'}`}
          >
            الإنتاج
          </button>
          <button 
            onClick={() => setActiveTab('drafts')}
            className={`px-6 py-2 rounded-md font-medium transition-colors ${activeTab === 'drafts' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-600 hover:text-slate-900'}`}
          >
            المسودات
          </button>
          <button 
            onClick={() => setActiveTab('published')}
            className={`px-6 py-2 rounded-md font-medium transition-colors ${activeTab === 'published' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-600 hover:text-slate-900'}`}
          >
            المنشورة
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-8 overflow-y-auto">
        
        {activeTab === 'production' && (
          <div className="space-y-8 animate-in fade-in zoom-in-95 duration-200">
            {/* Section 1 & 2: Setup & Status Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* SECTION 1: Story Setup */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 overflow-hidden relative">
                {running && (
                  <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
                    <Loader2 size={40} className="text-indigo-600 animate-spin mb-4" />
                    <p className="font-semibold text-slate-700">جاري الإنتاج...</p>
                  </div>
                )}
                
                <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                  <PenTool size={20} className="text-indigo-500" />
                  القسم الأول: إعداد القصة
                </h2>
                
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">عنوان الفيديو</label>
                    <input 
                      type="text" 
                      placeholder="مثال: الأسد الصغير الشجاع"
                      value={videoTitle}
                      onChange={e => setVideoTitle(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">موضوع القصة</label>
                    <textarea 
                      placeholder="صف باختصار ما يحدث في القصة..."
                      value={storyTopic}
                      onChange={e => setStoryTopic(e.target.value)}
                      rows={3}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">التصنيف</label>
                      <select 
                        value={storyCategory} 
                        onChange={e => setStoryCategory(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                      >
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">المدة</label>
                      <select 
                        value={storyDuration} 
                        onChange={e => setStoryDuration(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                      >
                        {durations.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">الفئة العمرية</label>
                      <select 
                        value={targetAge} 
                        onChange={e => setTargetAge(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                      >
                        {ages.map(a => <option key={a} value={a}>{a}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">اللغة</label>
                      <select 
                        value={narrationLanguage} 
                        onChange={e => setNarrationLanguage(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                      >
                        {languages.map(l => <option key={l} value={l}>{l}</option>)}
                      </select>
                    </div>
                  </div>

                  <button
                    onClick={handleGenerate}
                    disabled={!videoTitle || running}
                    className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-xl font-bold text-lg transition-all disabled:opacity-50 flex justify-center items-center gap-2 shadow-md hover:shadow-lg"
                  >
                    <MonitorPlay size={24} />
                    إنتاج الفيديو
                  </button>
                </div>
              </div>

              {/* SECTION 2 & 3: Status & Logs */}
              <div className="space-y-6">
                {/* SECTION 2: Live Production Status */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                  <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <History size={20} className="text-indigo-500" />
                    القسم الثاني: حالة الإنتاج المباشر
                  </h2>
                  
                  {running || percentCounter > 0 ? (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                          {running && <Loader2 size={14} className="animate-spin" />}
                          {currentStage || 'جاري التهيئة...'}
                        </span>
                        <span className="font-bold text-slate-700" dir="ltr">{Math.min(100, Math.round(percentCounter))}%</span>
                      </div>
                      
                      <div className="w-full bg-slate-100 rounded-full h-3">
                        <div 
                          className="bg-indigo-600 h-3 rounded-full transition-all duration-300 ease-out" 
                          style={{ width: `${Math.min(100, percentCounter)}%` }}
                        ></div>
                      </div>

                      <div className="flex justify-between text-xs font-medium text-slate-500 bg-slate-50 p-3 rounded-lg">
                        <div className="flex items-center gap-1"><Clock size={14}/> الوقت المتبقي تقريباً: 02:45</div>
                        <div className="flex items-center gap-1"><Layers size={14}/> وقت الخطوة: 00:32</div>
                      </div>
                    </div>
                  ) : (
                    <div className="h-32 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-100 rounded-xl">
                      <Play size={32} className="mb-2 opacity-50" />
                      <p>جاهز لبدء الإنتاج</p>
                    </div>
                  )}
                </div>

                {/* SECTION 3: Live Logs */}
                <div className="bg-slate-900 rounded-2xl shadow-sm p-6 h-[256px] flex flex-col">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      <FileText size={20} className="text-emerald-400" />
                      القسم الثالث: السجلات المباشرة
                    </h2>
                    <label className="flex items-center gap-2 text-xs font-medium text-slate-400 cursor-pointer">
                      وضع التصحيح
                      <input type="checkbox" checked={debugMode} onChange={e => setDebugMode(e.target.checked)} className="rounded bg-slate-800 border-slate-700 text-indigo-500 focus:ring-offset-slate-900" />
                    </label>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto space-y-2 font-mono text-xs p-2 bg-black/40 rounded-lg border border-slate-800 scrollbar-thin scrollbar-thumb-slate-700" dir="ltr">
                    {logs.length === 0 && (
                      <div className="text-slate-600 text-center mt-10" dir="rtl">في انتظار السجلات...</div>
                    )}
                    {logs.map(log => (
                      <div key={log.id} className={`${log.type === 'error' ? 'text-rose-400' : log.type === 'success' ? 'text-emerald-400' : 'text-slate-300'} flex`} dir="rtl">
                        <span className="opacity-50 ml-2">[{new Date(log.id).toLocaleTimeString()}]</span>
                        <span>{log.message}</span>
                        {debugMode && log.raw && (
                          <pre className="mt-1 pr-4 border-r border-slate-700 text-slate-500 overflow-x-auto whitespace-pre-wrap block w-full text-left" dir="ltr">
                            {JSON.stringify(log.raw, null, 2)}
                          </pre>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 4 & 5: Final Result & Actions */}
            {result && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-500">
                <div className="bg-emerald-50 px-6 py-4 border-b border-emerald-100 flex items-center gap-3">
                  <CheckCircle size={24} className="text-emerald-600" />
                  <h2 className="text-xl font-bold text-emerald-800">اكتمل الإنتاج</h2>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6">
                  {/* Media Previews */}
                  <div className="space-y-6">
                    <div className="space-y-2">
                       <label className="block text-sm font-semibold text-slate-700 flex items-center gap-2">
                         <Play size={16} /> معاينة الفيديو
                       </label>
                       <div className="bg-slate-900 rounded-xl aspect-video overflow-hidden border border-slate-200 relative group">
                         <video controls className="w-full h-full object-cover" poster={result.thumbnail} src={result.videoPath} />
                       </div>
                    </div>
                    
                    <div className="space-y-2">
                       <label className="block text-sm font-semibold text-slate-700 flex items-center gap-2">
                         <Type size={16} /> معاينة الصورة المصغرة
                       </label>
                       <img src={result.thumbnail} alt="Generated Thumbnail" className="w-full md:w-1/2 md:mx-auto aspect-video object-cover rounded-xl border border-slate-200 shadow-sm" />
                    </div>
                  </div>

                  {/* SECTION 4: Metadata Form */}
                  <div className="space-y-5">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">القسم الرابع: البيانات الوصفية</h3>
                    
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">العنوان المولد</label>
                      <input 
                        type="text" 
                        value={finalTitle}
                        onChange={e => setFinalTitle(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">الوصف المولد</label>
                      <textarea 
                        value={finalDescription}
                        onChange={e => setFinalDescription(e.target.value)}
                        rows={5}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">الكلمات الدلالية المولدة</label>
                      <input 
                        type="text" 
                        value={finalTags}
                        onChange={e => setFinalTags(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>

                    {/* SECTION 5: Actions */}
                    <div className="pt-6 border-t border-slate-100 space-y-3">
                      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">القسم الخامس: الإجراءات</h3>
                      
                      {result.stats && (
                        <div className="grid grid-cols-3 gap-2 mb-4 bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                           <div>
                             <div className="text-[10px] text-slate-500 uppercase">حجم الملف</div>
                             <div className="text-sm font-bold text-slate-700 dir-ltr">{(result.stats.fileSizeBytes / (1024*1024)).toFixed(1)} MB</div>
                           </div>
                           <div className="border-x border-slate-200">
                             <div className="text-[10px] text-slate-500 uppercase">المدة</div>
                             <div className="text-sm font-bold text-slate-700 dir-ltr">{Math.round(result.stats.videoDurationSec || 0)}s</div>
                           </div>
                           <div>
                             <div className="text-[10px] text-slate-500 uppercase">وقت الإنشاء</div>
                             <div className="text-sm font-bold text-slate-700 dir-ltr">{(result.stats.generationTimeMs / 1000).toFixed(1)}s</div>
                           </div>
                        </div>
                      )}

                      <a 
                        href={result.videoPath} 
                        download={`video-${Date.now()}.mp4`}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-bold transition-all shadow-md flex justify-center items-center gap-2"
                      >
                        <Video size={20} />
                        تنزيل الفيديو (Download)
                      </a>

                      <button className="w-full bg-rose-600 hover:bg-rose-700 text-white py-3 rounded-xl font-bold transition-all flex justify-center items-center gap-2">
                        <UploadCloud size={20} />
                        النشر على يوتيوب
                      </button>
                      
                      <button className="w-full bg-white border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 py-3 rounded-xl font-bold transition-all flex justify-center items-center gap-2">
                        <Save size={20} />
                        حفظ كمسودة
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* SECTION 6: Draft Videos */}
        {activeTab === 'drafts' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex justify-between items-end mb-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                  <Save className="text-slate-500" />
                  القسم السادس: مكتبة المسودات
                </h2>
                <p className="text-slate-500 mt-1">إدارة الفيديوهات غير المكتملة والمجدولة.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {drafts.map(draft => (
                <div key={draft.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden group hover:shadow-md transition-all">
                  <div className="aspect-video relative overflow-hidden bg-slate-100">
                    <img src={draft.thumbnail} alt={draft.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute bottom-2 left-2 bg-black/80 text-white text-xs font-bold px-2 py-1 rounded" dir="ltr">
                      {draft.duration}
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-slate-800 line-clamp-1 mb-1">{draft.title}</h3>
                    <p className="text-xs text-slate-500 mb-4">تم إنشاؤه في: {new Date(draft.creationDate).toLocaleDateString()}</p>
                    
                    <div className="flex flex-wrap items-center gap-2">
                      <button className="flex-1 bg-rose-50 hover:bg-rose-100 text-rose-700 py-2 rounded-lg font-semibold text-sm transition-colors border border-rose-200">
                        نشر
                      </button>
                      <button className="flex-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 py-2 rounded-lg font-semibold text-sm transition-colors">
                        تعديل
                      </button>
                      <button className="flex-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 py-2 rounded-lg font-semibold text-sm transition-colors">
                        معاينة
                      </button>
                      <button className="px-3 py-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors border border-transparent hover:border-emerald-100" title="تنزيل (Download)">
                        <Video size={18} />
                      </button>
                      <button className="px-3 py-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-100" title="حذف (Delete)">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECTION 7: Published Videos */}
        {activeTab === 'published' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex justify-between items-end mb-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                  <ListVideo className="text-rose-500" />
                  القسم السابع: الفيديوهات المنشورة
                </h2>
                <p className="text-slate-500 mt-1">مراقبة أداء القنوات والفيديوهات على يوتيوب.</p>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-right">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 font-semibold text-slate-600 text-sm w-1/2">الفيديو</th>
                    <th className="px-6 py-4 font-semibold text-slate-600 text-sm">مستوى العرض</th>
                    <th className="px-6 py-4 font-semibold text-slate-600 text-sm">التاريخ</th>
                    <th className="px-6 py-4 font-semibold text-slate-600 text-sm">المشاهدات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {published.map(pub => (
                    <tr key={pub.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <img src={pub.thumbnail} className="w-24 aspect-video object-cover rounded-md border border-slate-200" alt="thumbnail" />
                          <div>
                            <h3 className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">{pub.title}</h3>
                            <a href="#" className="text-xs text-indigo-500 hover:underline">مشاهدة على يوتيوب</a>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                          عام
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600" dir="ltr" style={{textAlign: 'right'}}>
                        {new Date(pub.publishDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-slate-800">
                        {pub.views.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
