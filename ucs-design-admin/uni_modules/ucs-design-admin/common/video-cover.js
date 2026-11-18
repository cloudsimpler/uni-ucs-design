// Decode a local file only during upload. Lists never load the original video.
export async function createVideoCover(file) {
 const video = document.createElement('video');
 const source = URL.createObjectURL(file);
 video.muted = true;
 video.playsInline = true;
 video.preload = 'auto';
 const wait = (event, action) => new Promise((resolve, reject) => {
  const cleanup = () => { clearTimeout(timer); video.removeEventListener(event, done); video.removeEventListener('error', failed); };
  const done = () => { cleanup(); resolve(); };
  const failed = () => { cleanup(); reject(new Error('浏览器无法解码此视频，未能自动生成封面')); };
  const timer = setTimeout(failed, 12000);
  video.addEventListener(event, done, { once: true });
  video.addEventListener('error', failed, { once: true });
  try { action(); } catch (error) { cleanup(); reject(error); }
 });
 try {
  await wait('loadeddata', () => { video.src = source; video.load(); });
  if (!video.videoWidth || !video.videoHeight) throw new Error('视频没有可用画面，未能自动生成封面');
  const canvas = document.createElement('canvas');
  const scale = Math.min(1, 640 / Math.max(video.videoWidth, video.videoHeight));
  canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
  canvas.height = Math.max(1, Math.round(video.videoHeight * scale));
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) throw new Error('浏览器不支持自动生成封面');
  // Skip black opening frames where possible; retain the first frame as fallback.
  const end = Number.isFinite(video.duration) ? Math.max(0, video.duration - 0.05) : 2;
  let firstFrame;
  for (const time of [...new Set([0, Math.min(0.5, end), Math.min(1.5, end)])]) {
   if (Math.abs(video.currentTime - time) > 0.01) await wait('seeked', () => { video.currentTime = time; });
   context.drawImage(video, 0, 0, canvas.width, canvas.height);
   const frame = context.getImageData(0, 0, canvas.width, canvas.height);
   firstFrame ||= frame;
   let light = 0, samples = 0;
   for (let i = 0; i < frame.data.length; i += 64) { light += (frame.data[i] + frame.data[i + 1] + frame.data[i + 2]) / 3; samples++; }
   if (light / samples > 12) { firstFrame = null; break; }
  }
  if (firstFrame) context.putImageData(firstFrame, 0, 0);
  return await new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('封面生成失败')), 'image/jpeg', 0.82));
 } finally {
  video.pause(); video.removeAttribute('src'); video.load(); URL.revokeObjectURL(source);
 }
}
