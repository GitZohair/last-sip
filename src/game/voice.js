// VOICE: the streamer's voice is a controller. Mic RMS in-browser (audio never leaves the device);
// holding V is the no-mic fallback so the game is always playable.
//   level  0..1 smoothed loudness      loud  level above the shout line
//   shout  true on the rising edge of a shout (cooldown) -> scares the vacuum or dashes
//   noise  level + footstep noise from running (used by the sleeping roommate)
export const SHOUT = .55;

export function createVoice() {
  const v = { level: 0, mic: false, loud: false, shout: false, cooldown: 0, noise: 0 };
  let analyser, buf, wasLoud = false;
  v.enable = async () => {
    if (v.mic) return true;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
      const ctx = new AudioContext(); analyser = ctx.createAnalyser(); analyser.fftSize = 512; buf = new Float32Array(analyser.fftSize);
      ctx.createMediaStreamSource(stream).connect(analyser); v.mic = true; return true;
    } catch { return false; }
  };
  v.update = (dt, keys, speed = 0) => {
    let raw = 0;
    if (analyser) { analyser.getFloatTimeDomainData(buf); let s = 0; for (const x of buf) s += x * x; raw = Math.min(1, Math.sqrt(s / buf.length) * 6); }
    if (keys.has('KeyV')) raw = Math.max(raw, .9);
    v.level += (raw - v.level) * Math.min(1, dt * (raw > v.level ? 18 : 6));
    v.cooldown = Math.max(0, v.cooldown - dt);
    v.loud = v.level > SHOUT;
    v.shout = v.loud && !wasLoud && v.cooldown <= 0; if (v.shout) v.cooldown = 1.4;
    wasLoud = v.loud;
    v.noise = Math.max(v.level, speed > 2.6 ? Math.min(1, (speed - 2.6) / 2.2) : 0);
    return v;
  };
  return v;
}
