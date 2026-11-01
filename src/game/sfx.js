// Procedural sound (WebAudio, no files): every cue is synthesized, so it's instant and tiny.
// Call sfx.unlock() from a click. All functions are safe to call before unlock (they no-op).
let ac, out, noise, hum, humGain, beat = 0;
const now = () => ac.currentTime;

function env(node, t, a, peak, d) { const g = ac.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(.0001, t + a + d); node.connect(g); g.connect(out); return g; }
function tone(f, d, { type = 'sine', vol = .2, at = 0, slide = 0, a = .005 } = {}) {
  if (!ac) return; const t = now() + at, o = ac.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, f * slide), t + d); env(o, t, a, vol, d); o.start(t); o.stop(t + d + a + .05);
}
function hiss(d, { vol = .2, f = 1200, q = 1, type = 'bandpass', at = 0, sweep = 0 } = {}) {
  if (!ac) return; const t = now() + at, s = ac.createBufferSource(); s.buffer = noise;
  const bq = ac.createBiquadFilter(); bq.type = type; bq.frequency.setValueAtTime(f, t); bq.Q.value = q;
  if (sweep) bq.frequency.exponentialRampToValueAtTime(f * sweep, t + d); s.connect(bq); env(bq, t, .004, vol, d); s.start(t, Math.random()); s.stop(t + d + .1);
}

export const sfx = {
  unlock() {
    if (ac) return ac.resume();
    ac = new AudioContext(); const comp = ac.createDynamicsCompressor(); out = ac.createGain(); out.gain.value = .7; out.connect(comp); comp.connect(ac.destination);
    noise = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate); const d = noise.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    // the vacuum: a detuned saw drone through a lowpass, volume follows distance
    hum = ac.createOscillator(); hum.type = 'sawtooth'; hum.frequency.value = 92; const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 600;
    humGain = ac.createGain(); humGain.gain.value = 0; hum.connect(lp); lp.connect(humGain); humGain.connect(out); hum.start();
  },
  step: (soft) => hiss(.06, { vol: soft ? .05 : .11, f: 380 + Math.random() * 200, q: 2 }),
  slosh: k => hiss(.25 + k * .2, { vol: Math.min(.25, .05 + k * .2), f: 500, q: 3, sweep: 2.2 }),
  spill: k => { hiss(.18, { vol: Math.min(.3, .08 + k * 3), f: 2400, q: .8, type: 'highpass' }); tone(900 + Math.random() * 500, .08, { vol: .05, slide: .5 }); },
  thud: (k = 1) => { tone(110, .25, { type: 'sine', vol: .35 * k, slide: .4 }); hiss(.12, { vol: .15 * k, f: 300 }); },
  slam: () => { tone(70, .35, { vol: .5, slide: .5 }); hiss(.2, { vol: .35, f: 900, q: .7 }); },
  creak: () => tone(240, .5, { type: 'sawtooth', vol: .04, slide: 1.35, a: .1 }),
  boing: () => tone(180, .4, { type: 'triangle', vol: .25, slide: 3 }),
  pop: (combo = 1) => { const f = 520 * Math.pow(1.12, Math.min(8, combo)); tone(f, .09, { type: 'square', vol: .07 }); tone(f * 1.5, .12, { vol: .1, at: .06 }); },
  tick: () => tone(1500, .02, { type: 'square', vol: .04 }),
  reveal: r => { const notes = r === 'l' ? [523, 659, 784, 1046, 1318] : r === 'r' ? [523, 659, 784] : [523, 659]; notes.forEach((f, i) => tone(f, .18, { type: 'triangle', vol: .14, at: i * .07 })); },
  help: () => [784, 988, 1175].forEach((f, i) => tone(f, .25, { vol: .1, at: i * .05 })),
  ding: () => { tone(1318, .5, { vol: .18 }); tone(1975, .4, { vol: .08, at: .02 }); },
  unlock2: () => [392, 523, 659, 784].forEach((f, i) => tone(f, .3, { type: 'triangle', vol: .16, at: i * .08 })),
  scare: () => { tone(300, .5, { type: 'sawtooth', vol: .12, slide: .2 }); hiss(.4, { vol: .1, f: 3000, sweep: .3 }); },
  zzz: () => tone(160, .6, { type: 'sine', vol: .03, slide: 1.2, a: .2 }),
  wake: () => { tone(330, .15, { type: 'square', vol: .1 }); tone(440, .25, { type: 'square', vol: .1, at: .12 }); },
  boom: () => { tone(55, .9, { vol: .6, slide: .4 }); hiss(.8, { vol: .4, f: 600, q: .5, sweep: .2 }); },
  beep: (hi) => tone(hi ? 1046 : 523, hi ? .4 : .15, { type: 'square', vol: .08 }),
  win: () => [523, 659, 784, 1046, 784, 1046, 1318].forEach((f, i) => tone(f, .28, { type: 'triangle', vol: .15, at: i * .11 })),
  fail: () => { tone(330, .5, { type: 'sawtooth', vol: .1, slide: .5 }); tone(247, .7, { type: 'sawtooth', vol: .1, at: .35, slide: .5 }); },
  // per-frame: vacuum hum by distance, heartbeat when the glass is nearly empty
  frame(dt, { vacuum = 99, low = false, stunned = false } = {}) {
    if (!ac) return; const v = vacuum < 10 ? Math.min(.09, (10 - vacuum) / 10 * .09) : 0;
    humGain.gain.setTargetAtTime(stunned ? v * .3 : v, now(), .1); hum.frequency.setTargetAtTime(stunned ? 60 : 92 + Math.max(0, 6 - vacuum) * 8, now(), .2);
    if (low && (beat -= dt) <= 0) { beat = .75; tone(60, .12, { vol: .4, slide: .6 }); tone(55, .12, { vol: .3, at: .16, slide: .6 }); }
  },
  silence() { if (humGain) humGain.gain.setTargetAtTime(0, now(), .05); },
};
