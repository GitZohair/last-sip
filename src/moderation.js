// Picture-frame safety pipeline. Layers, cheapest first:
// 1. Twitch emotes are already moderated by Twitch -> trusted.
// 2. Arbitrary image URLs: https only, allowlisted hosts, image extension.
// 3. In-browser ML classifier (nsfwjs, lazy-loaded on first use) rejects Porn/Hentai/Sexy.
// 4. Streamer/mod can always `!unframe` (handled by the game) and blocklist a user.
// Nothing is ever shown on stream until it passes. Failure = reject (fail closed).

export const ALLOWED_HOSTS = ['i.imgur.com', 'i.redd.it', 'media.giphy.com', 'static-cdn.jtvnw.net', 'cdn.7tv.app', 'cdn.betterttv.net'];
export const BLOCKED_CLASSES = { Porn: 0.25, Hentai: 0.25, Sexy: 0.5 };

export function checkUrl(url) {
  let u;
  try { u = new URL(url); } catch { return { ok: false, reason: 'not a url' }; }
  if (u.protocol !== 'https:') return { ok: false, reason: 'https only' };
  if (!ALLOWED_HOSTS.includes(u.hostname)) return { ok: false, reason: 'host not allowed' };
  if (u.hostname !== 'static-cdn.jtvnw.net' && !/\.(png|jpe?g|gif|webp)$/i.test(u.pathname)) return { ok: false, reason: 'not an image' };
  return { ok: true };
}

export function verdict(predictions) {
  for (const p of predictions) {
    const limit = BLOCKED_CLASSES[p.className];
    if (limit !== undefined && p.probability >= limit) return { ok: false, reason: `${p.className} ${(p.probability * 100).toFixed(0)}%` };
  }
  return { ok: true };
}

let modelPromise = null;
async function model() {
  // Loaded only when the first untrusted image arrives, so normal play never pays the download.
  modelPromise ??= (async () => {
    await import('@tensorflow/tfjs');
    const nsfw = await import('nsfwjs');
    return nsfw.load('MobileNetV2');
  })();
  return modelPromise;
}

export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous'; // required so the classifier can read pixels and WebGL can texture it
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('image failed to load'));
    img.src = src;
  });
}

// Returns {ok, img?, reason?}. `trusted` skips ML (Twitch emotes).
export async function screenImage(src, { trusted = false, classify = true } = {}) {
  if (!trusted) {
    const urlCheck = checkUrl(src);
    if (!urlCheck.ok) return urlCheck;
  }
  let img;
  try { img = await loadImage(src); } catch (e) { return { ok: false, reason: e.message }; }
  if (trusted || !classify) return { ok: true, img };
  try {
    const result = verdict(await (await model()).classify(img));
    return result.ok ? { ok: true, img } : result;
  } catch {
    return { ok: false, reason: 'classifier unavailable' };
  }
}
