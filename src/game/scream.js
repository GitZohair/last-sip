// SCREAM TO DASH: optional mic input. Loud = forward burst (and extra slosh, so it's a gamble).
// Pure in-browser RMS on an AnalyserNode; audio never leaves the device.
export function createScream() {
  const s = { level: 0, enabled: false, dash: 0, cooldown: 0 };
  let analyser, buf;
  s.enable = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
      const ctx = new AudioContext(); analyser = ctx.createAnalyser(); analyser.fftSize = 512; buf = new Float32Array(analyser.fftSize);
      ctx.createMediaStreamSource(stream).connect(analyser); s.enabled = true; return true;
    } catch { return false; }
  };
  // Returns true on the frame a dash triggers.
  s.update = dt => {
    s.cooldown = Math.max(0, s.cooldown - dt); s.dash = Math.max(0, s.dash - dt);
    if (!analyser) return false;
    analyser.getFloatTimeDomainData(buf); let sum = 0; for (const v of buf) sum += v * v;
    const rms = Math.sqrt(sum / buf.length); s.level += (Math.min(1, rms * 6) - s.level) * Math.min(1, dt * 12);
    if (s.level > .55 && s.cooldown <= 0) { s.dash = .6; s.cooldown = 1.6; return true; }
    return false;
  };
  return s;
}
