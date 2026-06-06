import React from 'react';
import { CheckCircle2, Loader2, AlertTriangle, Circle } from 'lucide-react';
import { PipelineProgress } from '../types';

const stages = [
  { id: 'generate-story', label: 'Generate Story' },
  { id: 'generate-assets', label: 'Generate Assets' },
  { id: 'assemble-video', label: 'Assemble Video' },
  { id: 'generate-metadata', label: 'Generate Metadata' },
  { id: 'upload-video', label: 'Upload Video' },
];

export const PipelineTimeline = ({ currentProgress }: { currentProgress: PipelineProgress[] }) => {
  return (
    <div className="flex justify-between items-center w-full py-4 px-2">
      {stages.map((stage, index) => {
        const progress = currentProgress.find(p => p.stage === stage.id);
        const isCompleted = progress?.status === 'completed';
        const isRunning = progress?.status === 'running';
        const isFailed = progress?.status === 'failed';

        return (
          <div key={stage.id} className="flex flex-col items-center flex-1">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
              isCompleted ? 'bg-emerald-500 text-white' : 
              isRunning ? 'bg-indigo-500 text-white animate-pulse' : 
              isFailed ? 'bg-red-500 text-white' : 'bg-slate-700 text-slate-400'
            }`}>
              {isCompleted ? <CheckCircle2 size={20} /> : isRunning ? <Loader2 size={20} className="animate-spin" /> : isFailed ? <AlertTriangle size={20} /> : <Circle size={20} />}
            </div>
            <span className={`text-xs font-medium text-center ${isCompleted || isRunning ? 'text-white' : 'text-slate-500'}`}>
              {stage.label}
            </span>
          </div>
        );
      })}
    </div>
  );
};
