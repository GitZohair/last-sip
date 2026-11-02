// Small, sampled slapstick cues. A filtered, compressed mix leaves room for the streamer.
// Call sfx.unlock() from a click. All functions are safe to call before unlock (they no-op).
let ac, out, noise, hum, humGain, beat = 0;
// Kenney CC0 samples (public/assets/sfx). Synth stays as the fallback and for drones/tones.
const BUF = {};
const lastCue = new Map(), voices = new Set();
let muted = localStorage.getItem('lastsip:muted') === '1';
const NAMES_UNUSED = ['wood0', 'wood1', 'wood2', 'wood3', 'wood4', 'sand0', 'sand1', 'sand2', 'sand3', 'sand4', 'clink0', 'clink1', 'clink2', 'soft0', 'soft1', 'soft2', 'punch0', 'punch1', 'punch2',
  'glassheavy', 'woodheavy', 'plank', 'metal', 'bell', 'punchheavy', 'softheavy', 'confirmation001', 'confirmation002', 'confirmation003', 'error004', 'error006', 'glass001', 'glass002',
  'drop002', 'drop003', 'pluck001', 'pluck002', 'tick001', 'tick002', 'maximize006', 'select002', 'question001', 'switch002', 'bong001', 'glitch002'];
function sample(name, { vol = .5, rate = 1, at = 0 } = {}) {
  const b = BUF[name]; if (!ac || !b || muted || voices.size >= 24) return false;
  const src = ac.createBufferSource(), g = ac.createGain(); src.buffer = b; src.playbackRate.value = rate; g.gain.value = vol;
  src.connect(g); g.connect(out); voices.add(src);
  src.onended = () => { voices.delete(src); src.disconnect(); g.disconnect(); };
  src.start(now() + at); return true;
}
function cue(key, gap, play) {
  if (!ac || muted) return;
  const t = now(); if (t - (lastCue.get(key) ?? -Infinity) < gap) return;
  lastCue.set(key, t); play();
}
const pick = (base, n) => base + Math.floor(Math.random() * n);
const now = () => ac.currentTime;

function env(node, t, a, peak, d) { const g = ac.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(.0001, t + a + d); node.connect(g); g.connect(out); return g; }
function tone(f, d, { type = 'sine', vol = .2, at = 0, slide = 0, a = .005 } = {}) {
  if (!ac || muted) return; const t = now() + at, o = ac.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, f * slide), t + d); env(o, t, a, vol, d); o.start(t); o.stop(t + d + a + .05);
}
function hiss(d, { vol = .2, f = 1200, q = 1, type = 'bandpass', at = 0, sweep = 0 } = {}) {
  if (!ac || muted) return; const t = now() + at, s = ac.createBufferSource(); s.buffer = noise;
  const bq = ac.createBiquadFilter(); bq.type = type; bq.frequency.setValueAtTime(f, t); bq.Q.value = q;
  if (sweep) bq.frequency.exponentialRampToValueAtTime(f * sweep, t + d); s.connect(bq); env(bq, t, .004, vol, d); s.start(t, Math.random()); s.stop(t + d + .1);
}

// No looping music, alarm beeps or constant tower creaks. Collection and serving have
// short tactile cues; large impacts are rate-limited so a bombing run cannot stack the mix.
// VOICE CLIPS: sfx.say(key) plays /vo/<key>.mp3 (or <key>-2.mp3 ...) ONLY if listed in /vo/index.json.
// No text-to-speech, no generated voices: drop real clips in public/vo/ and list them, or it stays quiet.
const QUIET = () => {};
let vo = new Set(), sayT = 0;
export const sfx = {
  get muted() { return muted; },
  setMuted(value) {
    muted = !!value; localStorage.setItem('lastsip:muted', muted ? '1' : '0');
    if (out) out.gain.setTargetAtTime(muted ? 0 : .65, now(), .025);
  },
  unlock() {
    if (ac) return ac.resume();
    ac = new AudioContext(); const comp = ac.createDynamicsCompressor(); out = ac.createGain(); out.gain.value = muted ? 0 : .65;
    const low = ac.createBiquadFilter(), high = ac.createBiquadFilter();
    high.type = 'highpass'; high.frequency.value = 50;
    low.type = 'lowpass'; low.frequency.value = 6500; low.Q.value = .5;
    comp.threshold.value = -18; comp.knee.value = 12; comp.ratio.value = 4; comp.attack.value = .003; comp.release.value = .16;
    out.connect(high); high.connect(low); low.connect(comp); comp.connect(ac.destination);
    noise = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate); const d = noise.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    for (const n of ['woodheavy', 'punchheavy', 'glassheavy', 'clink0', 'clink1', 'clink2', 'drop002', 'drop003', 'soft0', 'soft1', 'soft2', 'wood0', 'wood1', 'wood2', 'pluck001', 'confirmation001', 'confirmation002']) fetch(`/assets/sfx/${n}.ogg`).then(r => r.arrayBuffer()).then(a => ac.decodeAudioData(a)).then(b => BUF[n] = b).catch(() => {});
    fetch('/vo/index.json').then(r => r.ok ? r.json() : []).then(l => { vo = new Set(l); }).catch(() => {});
  },
  // VOICE: key = event slot for a recorded clip (slam, topple, blame, ringout, twist, hit, win), text = what TTS reads otherwise
  say(key, _text, { force = false } = {}) {
    if (muted) return;
    const clips = [...vo].filter(n => n === key || n.startsWith(key + '-')); if (!clips.length) return;
    const t = performance.now(); if (!force && t - sayT < 2600) return; sayT = t;
    const a = new Audio(`/vo/${clips[Math.floor(Math.random() * clips.length)]}.mp3`); a.volume = .45; a.play().catch(() => {});
  },
  // the four impacts that stay (quiet, sampled, no synth tones)
  slam: () => cue('slam', .16, () => { sample('woodheavy', { vol: .28, rate: .85 }); sample('soft1', { vol: .18, rate: .8, at: .025 }); }),
  hit: () => cue('hit', .16, () => sample('punchheavy', { vol: .3, rate: .92 + Math.random() * .12 })),
  shatter(n) { cue('shatter', .3, () => { sample('glassheavy', { vol: .23, rate: .85 }); for (let i = 0; i < Math.min(3, n); i++) sample(pick('clink', 3), { vol: .09, rate: .92 + Math.random() * .12, at: .07 + i * .08 }); }); },
  splash: () => cue('splash', .25, () => { sample('drop003', { vol: .35, rate: .65 }); sample('drop002', { vol: .16, rate: .8, at: .08 }); }),
  boom: () => cue('boom', .18, () => { sample('punchheavy', { vol: .4, rate: .5 }); sample('woodheavy', { vol: .22, rate: .65, at: .025 }); }),
  thud: (k = 1) => cue('thud', .12, () => sample(pick('soft', 3), { vol: .18 * Math.min(1, k), rate: .95 + Math.random() * .1 })),
  // everything else is deliberately silent (kept as no-ops so old call sites stay valid)
  step: steady => cue('step', .2, () => sample(pick('wood', 3), { vol: steady ? .025 : .045, rate: .95 + Math.random() * .1 })),
  shot: () => cue('shot', .12, () => hiss(.14, { vol: .18, f: 1800, sweep: .35, q: .5 })),
  pop: () => cue('pop', .2, () => { sample('soft2', { vol: .3, rate: 1.5 }); hiss(.1, { vol: .07, f: 800, sweep: 2 }); }),
  reveal: () => cue('reveal', 1, () => hiss(.35, { vol: .09, f: 550, sweep: 3, q: .5 })),
  ding: () => cue('order', 1.5, () => sample('pluck001', { vol: .12, rate: 1.05 })),
  win: () => cue('result', 1, () => sample('confirmation002', { vol: .22 })),
  fail: () => cue('result', 1, () => sample('soft0', { vol: .16, rate: .65 })),
  stack: n => cue('stack', .24, () => sample(pick('clink', 3), { vol: .075, rate: .9 + Math.min(12, n) * .015 })),
  cash: () => cue('cash', .3, () => { sample('confirmation001', { vol: .16, rate: 1.1 }); sample('clink1', { vol: .07, rate: 1.2, at: .08 }); }),
  slosh: QUIET, spill: QUIET, creak: QUIET, collect: QUIET, fill: QUIET, boing: QUIET, tick: QUIET,
  help: QUIET, unlock2: QUIET, scare: QUIET, zzz: QUIET, wake: QUIET, beep: QUIET, frame: QUIET, silence: QUIET, lean: QUIET,
};
