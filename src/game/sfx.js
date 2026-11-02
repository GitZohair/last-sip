// Procedural sound (WebAudio, no files): every cue is synthesized, so it's instant and tiny.
// Call sfx.unlock() from a click. All functions are safe to call before unlock (they no-op).
let ac, out, noise, hum, humGain, beat = 0;
// Kenney CC0 samples (public/assets/sfx). Synth stays as the fallback and for drones/tones.
const BUF = {};
const NAMES_UNUSED = ['wood0', 'wood1', 'wood2', 'wood3', 'wood4', 'sand0', 'sand1', 'sand2', 'sand3', 'sand4', 'clink0', 'clink1', 'clink2', 'soft0', 'soft1', 'soft2', 'punch0', 'punch1', 'punch2',
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

// SOUND POLICY (playtest feedback: the beeps/clinks/creaks were grating): almost everything is SILENT now.
// Only a few soft impacts remain (slam, getting hit, the tower shattering, falling in the sea).
// VOICE CLIPS: sfx.say(key) plays /vo/<key>.mp3 (or <key>-2.mp3 ...) ONLY if listed in /vo/index.json.
// No text-to-speech, no generated voices: drop real clips in public/vo/ and list them, or it stays quiet.
const QUIET = () => {};
let vo = new Set(), sayT = 0;
export const sfx = {
  unlock() {
    if (ac) return ac.resume();
    ac = new AudioContext(); const comp = ac.createDynamicsCompressor(); out = ac.createGain(); out.gain.value = .5; out.connect(comp); comp.connect(ac.destination);
    noise = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate); const d = noise.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    for (const n of ['woodheavy', 'punchheavy', 'glassheavy', 'clink0', 'clink1', 'clink2', 'drop003', 'soft0', 'soft1', 'soft2']) fetch(`/assets/sfx/${n}.ogg`).then(r => r.arrayBuffer()).then(a => ac.decodeAudioData(a)).then(b => BUF[n] = b).catch(() => {});
    fetch('/vo/index.json').then(r => r.ok ? r.json() : []).then(l => { vo = new Set(l); }).catch(() => {});
  },
  // VOICE: key = event slot for a recorded clip (slam, topple, blame, ringout, twist, hit, win), text = what TTS reads otherwise
  say(key, _text, { force = false } = {}) {
    const clips = [...vo].filter(n => n === key || n.startsWith(key + '-')); if (!clips.length) return;
    const t = performance.now(); if (!force && t - sayT < 2600) return; sayT = t;
    const a = new Audio(`/vo/${clips[Math.floor(Math.random() * clips.length)]}.mp3`); a.volume = .9; a.play().catch(() => {});
  },
  // the four impacts that stay (quiet, sampled, no synth tones)
  slam: () => sample('woodheavy', { vol: .45, rate: .9 + Math.random() * .2 }),
  hit: () => sample('punchheavy', { vol: .5, rate: .9 + Math.random() * .2 }),
  shatter(n) { sample('glassheavy', { vol: .55 }); for (let i = 0; i < Math.min(5, n); i++) sample(pick('clink', 3), { vol: .18, rate: .9 + Math.random() * .5, at: .05 + i * .07 }); },
  splash: () => sample('drop003', { vol: .45, rate: .6 }),
  boom: () => { sample('punchheavy', { vol: .55, rate: .45 }); sample('woodheavy', { vol: .35, rate: .5, at: .03 }); },
  thud: (k = 1) => sample(pick('soft', 3), { vol: .25 * k, rate: .9 + Math.random() * .2 }),
  // everything else is deliberately silent (kept as no-ops so old call sites stay valid)
  step: QUIET, slosh: QUIET, spill: QUIET, creak: QUIET, collect: QUIET, shot: QUIET, fill: QUIET, boing: QUIET, pop: QUIET, tick: QUIET, reveal: QUIET,
  help: QUIET, ding: QUIET, unlock2: QUIET, scare: QUIET, zzz: QUIET, wake: QUIET, beep: QUIET, win: QUIET, fail: QUIET, frame: QUIET, silence: QUIET,
  stack: QUIET, lean: QUIET, cash: QUIET,
};
