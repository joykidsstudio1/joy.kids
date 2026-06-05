import { useState, useEffect, useRef } from 'react';
import { getMyChannel, getChannelVideos, uploadVideo } from '../lib/youtube';
import { Play, MessageCircle, ThumbsUp, Calendar, AlertTriangle, Upload, X } from 'lucide-react';
import { format } from 'date-fns';
import { useLocation } from 'react-router-dom';

export default function Videos() {
  const location = useLocation();
  const prefillUpload = location.state?.prefillUpload;

  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Upload state
  const [isUploading, setIsUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(!!prefillUpload);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [metadata, setMetadata] = useState(prefillUpload || {
    title: '',
    description: '',
    tags: '',
    privacyStatus: 'private'
  });

  async function loadVideos() {
    try {
      setLoading(true);
      const channel = await getMyChannel();
      if (channel && channel.contentDetails?.relatedPlaylists?.uploads) {
        const uploadsId = channel.contentDetails.relatedPlaylists.uploads;
        const items = await getChannelVideos(uploadsId);
        setVideos(items);
      }
    } catch (e: any) {
      console.error(e);
      if (e.message?.includes('YouTube Data API v3 has not been used')) {
        setError('يجب تفعيل YouTube Data API v3 في مشروع Google Cloud الخاص بك. قم بزيارة الرابط الظاهر في الخطأ أو تواصل مع المطور لتمكين الخدمة.');
      } else {
        setError(e.message || 'حدث خطأ أثناء تحميل مقاطع الفيديو');
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadVideos();
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setMetadata(prev => ({
        ...prev,
        title: file.name.replace(/\.[^/.]+$/, "") // default title
      }));
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    setUploadProgress(0);
    setError(null);
    try {
      const tagsArray = Array.isArray(metadata.tags) 
        ? metadata.tags 
        : metadata.tags.split(',').map((t: string) => t.trim()).filter(Boolean);
      
      await uploadVideo(
        selectedFile,
        {
          title: metadata.title,
          description: metadata.description,
          tags: tagsArray,
          privacyStatus: metadata.privacyStatus
        },
        (progress) => {
          setUploadProgress(progress);
        }
      );
      // Success!
      setShowUploadModal(false);
      setSelectedFile(null);
      setMetadata({ title: '', description: '', tags: '', privacyStatus: 'private' });
      await loadVideos(); // Refresh videos list
    } catch (e: any) {
      setError(e.message || 'فشل تحميل الفيديو. يرجى التأكد من الصلاحيات.');
    } finally {
      setIsUploading(false);
    }
  };

  if (loading && videos.length === 0) return <div>جاري تحميل الفيديو...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white">مدير مقاطع الفيديو</h1>
        <button 
          onClick={() => setShowUploadModal(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-xl font-medium transition-colors flex items-center gap-2"
        >
          <Upload size={20} />
          رفع فيديو جديد
        </button>
      </div>

      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">رفع فيديو جديد</h2>
              <button 
                onClick={() => !isUploading && setShowUploadModal(false)}
                className="text-slate-400 hover:text-white transition-colors"
                disabled={isUploading}
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              {!selectedFile ? (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-700 rounded-2xl p-12 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 hover:bg-slate-800/50 transition-all text-center"
                >
                  <Upload size={48} className="text-slate-400 mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">اختر ملف فيديو للرفع</h3>
                  <p className="text-slate-400 text-sm">أو قم بسحب وإسقاط الملف هنا</p>
                  <input 
                    type="file" 
                    accept="video/*" 
                    className="hidden" 
                    ref={fileInputRef} 
                    onChange={handleFileSelect}
                  />
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="bg-slate-800 rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-12 h-12 bg-indigo-500/20 text-indigo-400 rounded-lg flex items-center justify-center shrink-0">
                        <Play size={24} />
                      </div>
                      <div className="truncate">
                        <p className="text-white font-medium truncate">{selectedFile.name}</p>
                        <p className="text-slate-400 text-sm">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                      </div>
                    </div>
                    {!isUploading && (
                      <button onClick={() => setSelectedFile(null)} className="text-red-400 hover:text-red-300 text-sm font-medium">
                        تغيير
                      </button>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-1">العنوان</label>
                      <input 
                        type="text" 
                        value={metadata.title}
                        onChange={e => setMetadata({...metadata, title: e.target.value})}
                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2 focus:border-indigo-500 outline-none"
                        disabled={isUploading}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-1">الوصف</label>
                      <textarea 
                        value={metadata.description}
                        onChange={e => setMetadata({...metadata, description: e.target.value})}
                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2 focus:border-indigo-500 outline-none h-32 resize-none"
                        disabled={isUploading}
                        placeholder="يمكنك استخدام المساعد الذكي لتوليد الوصف المناسب..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-1">الكلمات المفتاحية (مفصول بفاصلة)</label>
                      <input 
                        type="text" 
                        value={Array.isArray(metadata.tags) ? metadata.tags.join(', ') : metadata.tags}
                        onChange={e => setMetadata({...metadata, tags: e.target.value})}
                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2 focus:border-indigo-500 outline-none"
                        placeholder="أطفال, مرح, ألعاب..."
                        disabled={isUploading}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-1">حالة النشر</label>
                      <select 
                        value={metadata.privacyStatus}
                        onChange={e => setMetadata({...metadata, privacyStatus: e.target.value})}
                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2 focus:border-indigo-500 outline-none"
                        disabled={isUploading}
                      >
                        <option value="private">خاص</option>
                        <option value="unlisted">غير مدرج</option>
                        <option value="public">عام</option>
                      </select>
                    </div>
                  </div>

                  {isUploading && (
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-1 text-slate-400">
                        <span>جاري الرفع...</span>
                        <span>{Math.round(uploadProgress)}%</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-2">
                        <div className="bg-indigo-500 h-2 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end gap-3 mt-6">
                    <button 
                      onClick={() => setShowUploadModal(false)}
                      className="px-4 py-2 rounded-xl text-slate-300 hover:text-white transition-colors"
                      disabled={isUploading}
                    >
                      إلغاء
                    </button>
                    <button 
                      onClick={handleUpload}
                      disabled={isUploading || !metadata.title}
                      className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-600/50 text-white px-6 py-2 rounded-xl font-medium transition-colors"
                    >
                      {isUploading ? 'جاري الرفع...' : 'رفع الفيديو'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {error ? (
        <div className="mb-8 bg-red-500/10 border border-red-500/20 rounded-2xl p-6 flex items-start gap-4">
          <AlertTriangle className="text-red-400 shrink-0 mt-1" size={24} />
          <div>
            <h3 className="text-lg font-bold text-red-100 mb-1">تنبيه</h3>
            <p className="text-red-200">{error}</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {videos.length === 0 ? (
            <div className="text-center py-20 bg-slate-900 border border-slate-800 rounded-3xl">
              <p className="text-slate-400">لم يتم العثور على أية مقاطع فيديو في هذه القناة.</p>
            </div>
          ) : (
            videos.map((item) => {
              const snippet = item.snippet;
              const publishedAt = snippet.publishedAt ? new Date(snippet.publishedAt) : new Date();
              return (
                <div key={item.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row gap-6 hover:bg-slate-800/50 transition-colors cursor-pointer">
                  <img 
                    src={snippet.thumbnails?.medium?.url || snippet.thumbnails?.default?.url || 'https://via.placeholder.com/320x180.png?text=Processing'} 
                    alt={snippet.title} 
                    className="w-full md:w-64 h-36 object-cover rounded-xl bg-slate-800"
                  />
                  <div className="flex-1 flex flex-col justify-between py-2">
                    <div>
                      <h3 className="text-lg font-bold text-white leading-tight mb-2 line-clamp-2">{snippet.title}</h3>
                      <p className="text-slate-400 text-sm line-clamp-2">{snippet.description}</p>
                    </div>
                    <div className="flex gap-6 mt-4 text-slate-400 text-sm font-medium">
                      <span className="flex items-center gap-2"><Calendar size={16} /> {format(publishedAt, 'MMM dd, yyyy')}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
