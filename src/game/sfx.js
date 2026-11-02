// Procedural sound (WebAudio, no files): every cue is synthesized, so it's instant and tiny.
// Call sfx.unlock() from a click. All functions are safe to call before unlock (they no-op).
let ac, out, noise, hum, humGain, beat = 0;
// Kenney CC0 samples (public/assets/sfx). Synth stays as the fallback and for drones/tones.
const BUF = {};
const NAMES = ['wood0', 'wood1', 'wood2', 'wood3', 'wood4', 'sand0', 'sand1', 'sand2', 'sand3', 'sand4', 'clink0', 'clink1', 'clink2', 'soft0', 'soft1', 'soft2', 'punch0', 'punch1', 'punch2',
  'glassheavy', 'woodheavy', 'plank', 'metal', 'bell', 'punchheavy', 'softheavy', 'confirmation001', 'confirmation002', 'confirmation003', 'error004', 'error006', 'glass001', 'glass002',
  'drop002', 'drop003', 'pluck001', 'pluck002', 'tick001', 'tick002', 'maximize006', 'select002', 'question001', 'switch002', 'bong001', 'glitch002'];
function sample(name, { vol = .5, rate = 1, at = 0 } = {}) {
  const b = BUF[name]; if (!ac || !b) return false;
  const src = ac.createBufferSource(), g = ac.createGain(); src.buffer = b; src.playbackRate.value = rate; g.gain.value = vol;
  src.connect(g); g.connect(out); src.start(now() + at); return true;
}
const pick = (base, n) => base + Math.floor(Math.random() * n);
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
    for (const n of NAMES) fetch(`/assets/sfx/${n}.ogg`).then(r => r.arrayBuffer()).then(a => ac.decodeAudioData(a)).then(b => BUF[n] = b).catch(() => {});
  },
  step: (soft, sand) => sample(pick(sand ? 'sand' : 'wood', 5), { vol: soft ? .18 : .35, rate: .9 + Math.random() * .2 }) || hiss(.06, { vol: soft ? .05 : .11, f: 380 + Math.random() * 200, q: 2 }),
  slosh: k => hiss(.25 + k * .2, { vol: Math.min(.25, .05 + k * .2), f: 500, q: 3, sweep: 2.2 }),
  spill: k => { sample(pick('clink', 3), { vol: Math.min(.35, .08 + k * 4), rate: 1.2 + Math.random() * .4 }); hiss(.18, { vol: Math.min(.3, .08 + k * 3), f: 2400, q: .8, type: 'highpass' }); tone(900 + Math.random() * 500, .08, { vol: .05, slide: .5 }); },
  thud: (k = 1) => { if (sample(pick('soft', 3), { vol: .5 * k, rate: .85 + Math.random() * .3 })) return; tone(110, .25, { type: 'sine', vol: .35 * k, slide: .4 }); hiss(.12, { vol: .15 * k, f: 300 }); },
  slam: () => { if (sample('woodheavy', { vol: .8 })) return; tone(70, .35, { vol: .5, slide: .5 }); hiss(.2, { vol: .35, f: 900, q: .7 }); },
  creak: () => {},
  collect: (i = 0) => { sample('confirmation001', { vol: .6, rate: 1 + i * .12 }); sample('glass002', { vol: .5, at: .08 }); },
  hit: () => { sample('punchheavy', { vol: .7 }); sample('glassheavy', { vol: .35, at: .05 }); },
  shot: () => sample('glitch002', { vol: .35, rate: 1.6 }),
  splash: () => { sample('drop003', { vol: .7, rate: .6 }); hiss(.7, { vol: .45, f: 900, q: .6, sweep: .35 }); tone(180, .3, { vol: .25, slide: .5 }); hiss(.3, { vol: .2, f: 3500, type: 'highpass', at: .1 }); },
  fill: k => { tone(220 + k * 520, .12, { type: 'triangle', vol: .06 }); hiss(.1, { vol: .05, f: 1800 + k * 1500, q: 3 }); },
  boing: () => sample('pluck002', { vol: .5, rate: .6 }),
  pop: (combo = 1) => { if (sample(Math.random() > .5 ? 'pluck001' : 'pluck002', { vol: .55, rate: 1 + Math.min(8, combo) * .08 })) return; const f = 520 * Math.pow(1.12, Math.min(8, combo)); tone(f, .09, { type: 'square', vol: .07 }); tone(f * 1.5, .12, { vol: .1, at: .06 }); },
  tick: () => sample('tick001', { vol: .3, rate: 1.2 }) || tone(1500, .02, { type: 'square', vol: .04 }),
  reveal: r => { sample(r === 'l' ? 'maximize006' : 'select002', { vol: .5 }); const notes = r === 'l' ? [523, 659, 784, 1046, 1318] : r === 'r' ? [523, 659, 784] : [523, 659]; notes.forEach((f, i) => tone(f, .18, { type: 'triangle', vol: .14, at: i * .07 })); },
  help: () => sample('confirmation002', { vol: .6 }) || [784, 988, 1175].forEach((f, i) => tone(f, .25, { vol: .1, at: i * .05 })),
  ding: () => { if (sample('bell', { vol: .45, rate: 1.4 })) return; tone(1318, .5, { vol: .18 }); tone(1975, .4, { vol: .08, at: .02 }); },
  unlock2: () => sample('confirmation003', { vol: .6 }) || [392, 523, 659, 784].forEach((f, i) => tone(f, .3, { type: 'triangle', vol: .16, at: i * .08 })),
  scare: () => { tone(300, .5, { type: 'sawtooth', vol: .12, slide: .2 }); hiss(.4, { vol: .1, f: 3000, sweep: .3 }); },
  zzz: () => {},
  wake: () => { tone(330, .15, { type: 'square', vol: .1 }); tone(440, .25, { type: 'square', vol: .1, at: .12 }); },
  boom: () => { tone(55, .9, { vol: .6, slide: .4 }); hiss(.8, { vol: .4, f: 600, q: .5, sweep: .2 }); },
  beep: (hi) => sample(hi ? 'select002' : 'tick002', { vol: .45 }),
  win: () => [523, 659, 784, 1046, 784, 1046, 1318].forEach((f, i) => tone(f, .28, { type: 'triangle', vol: .15, at: i * .11 })),
  fail: () => { if (sample('error006', { vol: .6 })) return; tone(330, .5, { type: 'sawtooth', vol: .1, slide: .5 }); tone(247, .7, { type: 'sawtooth', vol: .1, at: .35, slide: .5 }); },
  frame() {}, // (the old vacuum drone and heartbeat are gone)
  silence() {},
  // THE TOWER: each glass clinks one note higher up a major pentatonic scale, so a tall stack literally sounds tense
  stack(n) { const scale = [0, 2, 4, 7, 9], st = scale[n % 5] + 12 * Math.floor(n / 5); sample(pick('clink', 3), { vol: .45, rate: Math.min(4, .8 * Math.pow(2, st / 12)) }); },
  lean(k) { sample(pick('wood', 5), { vol: .15 + k * .35, rate: .45 + k * .2 }); }, // the tower creaks
  shatter(n) { sample('glassheavy', { vol: .9 }); sample('punchheavy', { vol: .5 }); for (let i = 0; i < Math.min(10, n); i++) sample(pick('clink', 3), { vol: .35, rate: .8 + Math.random() * 1.2, at: .05 + i * .06 + Math.random() * .05 }); sample('woodheavy', { vol: .5, at: .25 }); },
  cash(n = 1) { sample('bell', { vol: .55, rate: 1.5 }); sample('confirmation001', { vol: .45, at: .06 }); for (let i = 1; i < Math.min(6, n); i++) sample('pluck001', { vol: .3, rate: 1 + i * .15, at: .08 + i * .05 }); },
};
