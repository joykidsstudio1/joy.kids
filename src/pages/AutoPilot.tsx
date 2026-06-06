import React, { useState, useEffect, useRef } from 'react';
import { Settings, Play, Loader2 } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { PipelineTimeline } from '../components/PipelineTimeline';
import { ActivityLogs } from '../components/ActivityLogs';
import { LiveStats } from '../components/LiveStats';
import { PipelineProgress } from '../types';

export default function AutoPilot() {
  const [topic, setTopic] = useState('');
  const [running, setRunning] = useState(false);
  
  const [progress, setProgress] = useState<PipelineProgress[]>([]);
  const [logs, setLogs] = useState<PipelineProgress[]>([]);
  const [result, setResult] = useState<any>(null);
  
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Initialize Socket.io
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
      setLogs(prev => [...prev, data]);
      
      if (data.stage === 'completed') {
        setRunning(false);
        setResult(data.extra);
      }
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  const handleTestRun = async () => {
    setRunning(true);
    setProgress([]);
    setLogs([]);
    setResult(null);
    
    await fetch('/api/autopilot/trigger', { method: 'POST' });
  };

  return (
    <div className="flex flex-col h-full max-w-6xl mx-auto p-6 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <Settings className="text-indigo-400" size={32} />
          لوحة تحكم الطيار الآلي
        </h1>
        <button
          onClick={handleTestRun}
          disabled={running}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold transition-all disabled:opacity-50 flex items-center gap-2"
        >
          {running ? <Loader2 size={20} className="animate-spin" /> : <Play size={20} />}
          {running ? 'جاري التنفيذ...' : 'بدء تشغيل تجريبي'}
        </button>
      </div>

      <LiveStats stats={{ cpu: 25, mem: 40, images: progress.filter(p => p.stage === 'generate-assets').length, audio: progress.filter(p => p.stage === 'generate-assets').length, speed: 1.2 }} />

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <PipelineTimeline currentProgress={progress} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <ActivityLogs logs={logs} />
				{result && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 overflow-y-auto h-64">
					<h3 className="text-sm font-bold text-slate-400 mb-4">النتيجة النهائية</h3>
          <video controls className="w-full rounded-lg" src={result.videoPath} />
        </div>
				)}
      </div>
    </div>

  );
}
