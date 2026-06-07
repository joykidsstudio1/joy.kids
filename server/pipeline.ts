import { GoogleGenAI } from "@google/genai";
import path from "path";
import fs from "fs/promises";
import ffmpeg from "fluent-ffmpeg";
import ffmpegStatic from "ffmpeg-static";
import * as googleTTS from "google-tts-api";

// Initialize FFmpeg
if (ffmpegStatic) {
  ffmpeg.setFfmpegPath(ffmpegStatic);
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// For local storage of generated assets
const OUTPUT_DIR = path.join(process.cwd(), "dist", "pipeline-output");

export interface PipelineResult {
  videoPath: string;
  metadata: {
    title: string;
    description: string;
    tags: string[];
    thumbnailUrl: string;
  };
}

export async function generateWithRetry(params: any, maxRetries = 5) {
  const fallbackModels = ['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.5-pro'];
  let currentModelIndex = fallbackModels.indexOf(params.model) !== -1 ? fallbackModels.indexOf(params.model) : 0;

  let attempt = 0;
  let lastError;
  while (attempt < maxRetries) {
    try {
      params.model = fallbackModels[currentModelIndex];
      return await ai.models.generateContent(params);
    } catch (err: any) {
      lastError = err;
      const msg = err.message || "";
      // Match common overload/unavailability indicators
      if (err.status === 503 || err.status === 429 || msg.includes('503') || msg.includes('429') || msg.includes('high demand') || msg.includes('UNAVAILABLE') || msg.includes('RESOURCE_EXHAUSTED')) {
        attempt++;
        if (attempt < maxRetries) {
          // Switch model on failure
          if (currentModelIndex < fallbackModels.length - 1) {
            currentModelIndex++;
            console.log(`[Pipeline] Gemini API errored (${err.status || 'rate limit/unavailability'}), switching to fallback model: ${fallbackModels[currentModelIndex]} (attempt ${attempt})...`);
          } else {
            console.log(`[Pipeline] Gemini API errored, retrying same model: ${fallbackModels[currentModelIndex]} (attempt ${attempt})...`);
            await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
          }
          continue;
        }
      }
      throw err;
    }
  }
  throw lastError;
}

export async function runStoryPipeline(topic: string, io: any, accessToken?: string): Promise<PipelineResult> {
  const jobStartTime = Date.now();
  const timestamp = jobStartTime;
  const jobDir = path.join(OUTPUT_DIR, `job-${timestamp}`);
  
  await fs.mkdir(jobDir, { recursive: true });

  const emit = (stage: string, status: string, message: string, extra: any = {}) => {
    io.emit('pipeline-progress', { stage, status, message, timestamp, ...extra });
  };

  const withTimeout = async <T>(promise: Promise<T>, timeoutMs: number, operationName: string): Promise<T> => {
    let timeoutHandle: any;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutHandle = setTimeout(() => {
        reject(new Error(`Timeout of ${timeoutMs}ms exceeded for operation: ${operationName}`));
      }, timeoutMs);
    });
    return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timeoutHandle));
  };

  const measureTime = async <T>(name: string, fn: () => Promise<T>): Promise<{ result: T; durationMs: number }> => {
    const start = Date.now();
    const result = await fn();
    const durationMs = Date.now() - start;
    return { result, durationMs };
  };

  let failingStage = '';
  
  try {
    failingStage = 'توليد القصة (Story Generation)';
    emit('generate-story', 'running', 'بدأت كتابة القصة...', { percent: 5 });
    console.log(`[Pipeline] Starting story generation for topic: ${topic}`);

    const { result: storyResponse, durationMs: tStory } = await measureTime('story', () => 
      withTimeout(generateWithRetry({
        model: 'gemini-2.5-flash',
        contents: `Write a beautiful 5-minute children's story about: ${topic}. It should be separated into 5 clear scenes. Do not use markdown format, just plain text with [SCENE] as a delimiter between parts. Include descriptive visual prompts for each scene. Ensure the story is completely in Arabic, but keep the [SCENE] delimiter in English.`,
      }), 45000, 'Story Generation via Gemini')
    );
    
    const fullText = storyResponse.text || '';
    const scenesRaw = fullText.split('[SCENE]').map(s => s.trim()).filter(Boolean);
    const scenes = scenesRaw.slice(0, 5);
    
    if (scenes.length === 0) throw new Error("لم يتم توليد أي مشاهد.");
    emit('generate-story', 'completed', `تم توليد القصة (${scenes.length} مشاهد) بنجاح. (${(tStory/1000).toFixed(1)} ثانية)`, { percent: 15, durationMs: tStory });

    failingStage = 'تحميل الأصول (Asset Generation)';
    emit('generate-assets', 'running', 'جاري تحميل الأصول (الصور والصوت)...', { percent: 20 });
    const audioFiles: string[] = [];
    const imageFiles: string[] = [];
    
    let tAssetsTotal = 0;
    // Download Sequentially to prevent rate limiting / overload
    for (let i = 0; i < scenes.length; i++) {
        const { durationMs: tScene } = await measureTime(`asset-${i}`, async () => {
            const audioPath = path.join(jobDir, `scene-${i}.mp3`);
            const audioUrl = googleTTS.getAudioUrl(scenes[i].substring(0, 199), {
              lang: 'ar',
              slow: false,
              host: 'https://translate.google.com',
            });
            await withTimeout(fetch(audioUrl).then(res => res.arrayBuffer()).then(buf => fs.writeFile(audioPath, Buffer.from(buf))), 20000, `Audio Download Scene ${i}`);
            audioFiles.push(audioPath);

            const imagePath = path.join(jobDir, `scene-${i}.jpg`);
            const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent("childrens storybook illustration, simple colors, " + topic)}?width=1280&height=720&nologo=true`;
            await withTimeout(fetch(imageUrl).then(res => res.arrayBuffer()).then(buf => fs.writeFile(imagePath, Buffer.from(buf))), 25000, `Image Download Scene ${i}`);
            imageFiles.push(imagePath);
        });
        tAssetsTotal += tScene;
        emit('generate-assets', 'running', `تم تحميل أصول المشهد ${i + 1} (${(tScene/1000).toFixed(1)}ث)`, { percent: 20 + Math.floor((i+1)/scenes.length * 20) });
    }
    emit('generate-assets', 'completed', `اكتمل تحميل الأصول. (${(tAssetsTotal/1000).toFixed(1)} ثانية)`, { percent: 40, durationMs: tAssetsTotal });

    failingStage = 'تجميع مشاهد الفيديو (Video Assembly)';
    emit('assemble-video', 'running', 'جاري تجميع مشاهد الفيديو...', { percent: 45 });
    
    const finalVideoPath = path.join(jobDir, 'final_video.mp4');
    const sceneVideos: string[] = [];
    
    let tAssembleTotal = 0;
    // Sequential fallback for low RAM
    for (let i = 0; i < scenes.length; i++) {
        const { durationMs: tMP4 } = await measureTime(`assemble-${i}`, async () => {
            const sceneMp4Path = path.join(jobDir, `scene-${i}.mp4`);
            await withTimeout(new Promise<void>((resolve, reject) => {
              ffmpeg()
                .input(imageFiles[i])
                .inputOptions(['-loop 1'])
                .input(audioFiles[i])
                .outputOptions([
                  '-c:v libx264',
                  '-preset ultrafast',
                  '-c:a aac',
                  '-b:a 128k',
                  '-pix_fmt yuv420p',
                  '-shortest',
                  '-vf scale=1280:720,setsar=1'
                ])
                .save(sceneMp4Path)
                .on('end', () => resolve())
                .on('error', (err) => reject(err));
            }), 60000, `Video Assembly FFmpeg Scene ${i}`);
            sceneVideos.push(sceneMp4Path);
        });
        tAssembleTotal += tMP4;
        emit('assemble-video', 'running', `تم تجميع المشهد ${i + 1} (${(tMP4/1000).toFixed(1)}ث)`, { percent: 45 + Math.floor((i+1)/scenes.length * 35) });
    }

    failingStage = 'دمج الفيديو النهائي (Concat Final Video)';
    const concatListPath = path.join(jobDir, 'concat_list.txt');
    await fs.writeFile(concatListPath, sceneVideos.map(vid => `file '${path.basename(vid)}'`).join('\n'));

    const { durationMs: tConcat } = await measureTime('concat', async () => {
        await withTimeout(new Promise<void>((resolve, reject) => {
          ffmpeg()
            .input(concatListPath)
            .inputOptions(['-f concat', '-safe 0'])
            .outputOptions(['-c copy'])
            .save(finalVideoPath)
            .on('end', () => resolve())
            .on('error', (err) => reject(err));
        }), 30000, `Concat Final Video`);
    });
    
    tAssembleTotal += tConcat;
    emit('assemble-video', 'completed', `تم تجميع الفيديو بنجاح. (${(tAssembleTotal/1000).toFixed(1)} ثانية)`, { percent: 85, durationMs: tAssembleTotal });

    failingStage = 'إنشاء البيانات الوصفية (Metadata Generation)';
    emit('generate-metadata', 'running', 'جاري إنشاء البيانات الوصفية (العنوان والوصف)...', { percent: 90 });
    const { result: metadataResponse, durationMs: tMeta } = await measureTime('metadata', () => 
      withTimeout(generateWithRetry({
        model: 'gemini-2.5-flash',
        contents: `Based on a story about ${topic}, provide a YouTube video title, description, and tags formatted strictly as JSON. Example: {"title": "...", "description": "...", "tags": ["tag1", "tag2"]}. Respond in Arabic.`,
      }), 30000, 'Metadata Generation')
    );
    
    let metadata = { title: topic, description: "قصة أطفال جميلة", tags: ["أطفال", "قصص"] };
    try {
      const jsonMatch = (metadataResponse.text || '').match(/\{[\s\S]*?\}/);
      if (jsonMatch) metadata = JSON.parse(jsonMatch[0]);
    } catch (e) {
      console.warn("Could not parse metadata JSON", e);
    }
    emit('generate-metadata', 'completed', `تم إنشاء البيانات الوصفية بنجاح. (${(tMeta/1000).toFixed(1)} ثانية)`, { percent: 95, durationMs: tMeta });

    failingStage = 'التحقق من المخرجات النهائية (Final Validation)';
    let stats;
    try {
        stats = await fs.stat(finalVideoPath);
        if (stats.size < 1024 * 10) throw new Error("ملف الفيديو صغير جداً. ربما كان هناك خطأ في التجميع.");
    } catch (err: any) {
        throw new Error(`مشكلة في التحقق من ملف الفيديو: ${err.message}`);
    }

    const { result: totalDurationInfo } = await measureTime('video-duration', () => 
       new Promise<number>((resolve, reject) => {
         ffmpeg.ffprobe(finalVideoPath, (err, metadata) => {
           if (err || !metadata.format.duration) resolve(0);
           else resolve(metadata.format.duration);
         });
       })
    );

    failingStage = 'تنظيف الملفات المؤقتة (Cleanup)';
    emit('upload-video', 'running', 'جاري تجهيز الملفات النهائية...', { percent: 98 });
    try {
      for (const f of [...audioFiles, ...imageFiles.slice(1), ...sceneVideos, concatListPath]) {
          await fs.unlink(f).catch(()=>null);
      }
    } catch {}

    const totalPipelineTime = Date.now() - jobStartTime;
    const finalResultInfo = { 
        videoPath: `/pipeline-output/job-${timestamp}/final_video.mp4`, 
        metadata: {
            ...metadata,
            thumbnailUrl: `/pipeline-output/job-${timestamp}/scene-0.jpg`
        },
        stats: {
            fileSizeBytes: stats.size,
            generationTimeMs: totalPipelineTime,
            videoDurationSec: totalDurationInfo
        }
    };

    emit('completed', 'completed', `اكتملت جميع المهام بنجاح. (${(totalPipelineTime/1000).toFixed(1)} ثانية الإجمالي)`, { percent: 100, ...finalResultInfo, result: finalResultInfo });

    return finalResultInfo;

  } catch (error: any) {
    const elapsed = Date.now() - jobStartTime;
    emit('failed', 'failed', `فشل في مرحلة [${failingStage}]: ${error.message} (الوقت: ${(elapsed/1000).toFixed(1)}ث)`, { error: error.message, stage: failingStage, elapsedMs: elapsed });
    console.error(`[Pipeline Error] failed at ${failingStage}:`, error);
    
    // Attempt cleanup if failed
    try {
        await fs.rm(jobDir, { recursive: true, force: true }).catch(()=>null);
    } catch {}
    
    throw error;
  }
}
