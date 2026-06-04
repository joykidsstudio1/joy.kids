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
          systemInstruction: "You are an expert YouTube content creator. Your goal is to write high-retention, engaging YouTube content. Provide outputs in markdown format. Do not use filler text. Focus on an engaging hook, high value delivery, and a strong call to action."
        })
      });
      
      const data = await res.json();
      if (res.ok) {
        setResult(data.text);
      } else {
        setResult(`Error: ${data.error}`);
      }
    } catch (e) {
      setResult("Network error occurred.");
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
          <h1 className="text-3xl font-bold text-white">Content Generator</h1>
          <p className="text-slate-400">Generate scripts, titles, descriptions, and tags in seconds.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1 overflow-hidden">
        <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col">
          <h2 className="text-xl font-bold text-white mb-6">Configuration</h2>
          
          <div className="space-y-6 flex-1">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Content Type</label>
              <select 
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500"
              >
                <option value="script">Full Video Script</option>
                <option value="ideas">10 Video Ideas</option>
                <option value="title">Catchy Titles</option>
                <option value="description">Video Description & Tags</option>
                <option value="plan">Weekly Content Plan</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Topic or Keyword</label>
              <textarea 
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., How to start a YouTube channel in 2024..."
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
                Generating...
              </span>
            ) : (
              <>
                <Wand2 size={20} />
                Generate Magic
              </>
            )}
          </button>
        </div>

        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col relative overflow-hidden">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white">Result</h2>
            {result && (
              <button 
                onClick={handleCopy}
                className="flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white bg-slate-800 px-4 py-2 rounded-lg transition-colors"
              >
                {copied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
                {copied ? 'Copied!' : 'Copy to Clipboard'}
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
                <p>Fill out the configuration and click generate.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
