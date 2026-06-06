export interface PipelineProgress {
  stage: 'generate-story' | 'generate-assets' | 'assemble-video' | 'generate-metadata' | 'upload-video' | 'completed' | 'failed';
  status: 'waiting' | 'running' | 'completed' | 'failed';
  message: string;
  timestamp: number;
  extra?: any;
}
