import { useEffect, useState } from 'react';
import { getMyChannel, getChannelVideos } from '../lib/youtube';
import { Users, Eye, Video as VideoIcon, ThumbsUp, Activity } from 'lucide-react';
import { User } from 'firebase/auth';

function StatCard({ title, value, icon: Icon, trend }: any) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col items-start">
      <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-indigo-400 mb-4">
        <Icon size={24} />
      </div>
      <h3 className="text-slate-400 font-medium mb-1">{title}</h3>
      <div className="flex items-end gap-3">
        <p className="text-3xl font-bold text-white">{value}</p>
        {trend && (
          <span className={`text-sm font-medium mb-1 ${trend > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {trend > 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
    </div>
  );
}

export default function Dashboard({ user }: { user: User | null }) {
  const [channel, setChannel] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const chan = await getMyChannel();
        setChannel(chan);
      } catch (e) {
        console.error("Failed to load channel", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return <div className="animate-pulse flex space-x-4">Loading stats...</div>;
  }

  if (!channel) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-semibold mb-2">No YouTube Channel Found</h2>
        <p className="text-slate-400 text-lg">Please ensure you have a YouTube channel created on this Google account.</p>
      </div>
    );
  }

  const { snippet, statistics } = channel;

  return (
    <div>
      <div className="flex items-center gap-6 mb-8 bg-slate-900 p-8 rounded-3xl border border-slate-800">
        <img src={snippet.thumbnails.default.url} alt={snippet.title} className="w-24 h-24 rounded-full border-4 border-slate-800 shadow-xl" />
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">{snippet.title}</h1>
          <p className="text-slate-400 text-lg">{snippet.description || 'Welcome to your AI-powered YouTube studio.'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Total Subscribers" value={parseInt(statistics.subscriberCount).toLocaleString()} icon={Users} trend={2.4} />
        <StatCard title="Total Views" value={parseInt(statistics.viewCount).toLocaleString()} icon={Eye} trend={12.5} />
        <StatCard title="Total Videos" value={parseInt(statistics.videoCount).toLocaleString()} icon={VideoIcon} />
        <StatCard title="Engagement Rate" value={"4.2%"} icon={Activity} />
      </div>

      <h2 className="text-2xl font-bold mb-6">Recent Activity</h2>
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8">
        <p className="text-slate-400">View detailed analytics in the Analytics tab, or interact with the AI assistant for insights.</p>
      </div>
    </div>
  );
}
