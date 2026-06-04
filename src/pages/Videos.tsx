import { useState, useEffect } from 'react';
import { getMyChannel, getChannelVideos } from '../lib/youtube';
import { Play, MessageCircle, ThumbsUp, Calendar } from 'lucide-react';
import { format } from 'date-fns';

export default function Videos() {
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const channel = await getMyChannel();
        if (channel && channel.contentDetails?.relatedPlaylists?.uploads) {
          const uploadsId = channel.contentDetails.relatedPlaylists.uploads;
          const items = await getChannelVideos(uploadsId);
          setVideos(items);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <div>Loading Videos...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white">Video Manager</h1>
        <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-xl font-medium transition-colors">
          Upload New Video
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {videos.length === 0 ? (
          <div className="text-center py-20 bg-slate-900 border border-slate-800 rounded-3xl">
            <p className="text-slate-400">No videos found on this channel.</p>
          </div>
        ) : (
          videos.map((item) => {
            const snippet = item.snippet;
            const publishedAt = new Date(snippet.publishedAt);
            return (
              <div key={item.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row gap-6 hover:bg-slate-800/50 transition-colors cursor-pointer">
                <img 
                  src={snippet.thumbnails?.medium?.url || snippet.thumbnails?.default?.url} 
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
    </div>
  );
}
