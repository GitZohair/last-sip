import { sfx } from './sfx.js';

// PLOT TWISTS: every ~18 s the bar changes the rules for EVERYONE, no warning. A big tilted sticker says what
// happened, the donation-TTS voice reads it out. Each twist either ruins your run or hands you a comeback.
// Plus THE BLAME GAME: whoever drops their tower blames somebody else, and the blamed one pays for it.
const pick = a => a[Math.floor(Math.random() * a.length)];
export const TWIST_LABEL = { airstrike: 'AIRSTRIKE', care: 'CARE PACKAGE', swap: 'TOWER SWAP', drunk: 'OPEN BAR', quake: 'BASS DROP', mop: 'WET FLOOR', happy: 'HAPPY HOUR', gull: 'SEAGULL', moon: 'LOW GRAVITY', chairs: 'MUSICAL CHAIRS', big: 'BIG GLASS' };
export const LINES = {
  topple: ['skill issue', 'chat, clip that', 'it was lag, I swear', 'not like this', 'he is so cooked', 'who put the floor there', 'that is going in the highlights', 'my hands are shaking chat'],
  excuse: ['my cat jumped on the keyboard', 'the glasses were wet', 'they breathed on it', 'chat distracted me', 'I was lagging', 'the sun was in my eyes', 'I was holding it ironically', 'my mouse ran out of battery'],
  slam: ['get out of my bar', 'sit down', 'no tip for you', 'that was personal', 'ratio', 'bye bye'],
  hit: ['reported', 'that is a ban', 'chat, you saw that', 'I am calling the manager'],
  ringout: ['went swimming', 'rage quit into the sea', 'is sleeping with the fishes', 'took the scenic route'],
};

export function createTwists({ hud, run, player, bots, me, speak, say = sfx.say }) {
  void hud; const el = { className: '', querySelector: () => ({}), style: { setProperty() {} } }; // (no on-screen labels: events just happen)
  let next = 11, last = '', hideT = 0, label = 'PLOT TWIST';
  const T = { happy: 0, drunk: 0 };
  const rivals = () => bots ? bots.bots.filter(b => b.fall <= 0) : [];
  function show(title, sub, color = '#ff4f6d', key = 'twist', spoken = `${title}. ${sub}`) {
    el.querySelector('small').textContent = label; label = 'PLOT TWIST';
    el.querySelector('b').textContent = title; el.querySelector('span').textContent = sub; el.style.setProperty('--c', color);
    void hideT; void spoken; void sub; void color; if (key === 'twist') speak?.(me.name, `${title}?!`, { bg: '#c77dff', fg: '#fff' }); say(key, '', { force: true });
  }
  const TWISTS = {
    swap: () => { // your tower and the tallest rival tower trade places
      const b = rivals().sort((a, c) => c.tray.count - a.tray.count)[0]; if (!b || b.tray.count === run.glass.count) return false;
      const mine = run.glass.count, theirs = b.tray.count;
      run.glass.takeTop(mine); b.tray.takeTop(theirs);
      for (let i = 0; i < theirs; i++) run.glass.add(null, ['#ffb020', '#ff4f6d', '#5dd39e', '#ffd166'][i % 4]);
      for (let i = 0; i < mine; i++) b.tray.add(null, ['#ffb020', '#ff4f6d', '#5dd39e', '#ffd166'][i % 4]);
      show('TOWER SWAP', theirs > mine ? `you got ${b.name}'s tower. say thank you.` : `${b.name} just took your tower. legally.`, '#c77dff');
    },
    quake: () => { run.chaos.fire('quake'); for (const b of rivals()) b.tray.kick((Math.random() - .5) * 3, (Math.random() - .5) * 3); run.glass.kick((Math.random() - .5) * 2, (Math.random() - .5) * 2); show('BASS DROP', 'the DJ found the subwoofer', '#4fc3ff'); },
    mop: () => { for (let i = 0; i < 9; i++) { const a = i / 9 * 6.28, r = 2.4 + Math.random() * 1.6; run.chaos.puddle(Math.cos(a) * r, Math.sin(a) * r * .8, 1.2, 12); } show('WET FLOOR', 'someone threw up by the bar. good luck.', '#5dd39e'); },
    chairs: () => { // MUSICAL CHAIRS: you swap places with a random rival (towers and all)
      const b = pick(rivals()); if (!b) return false;
      const x = player.pos.x, z = player.pos.z; player.pos.x = b.p.pos.x; player.pos.z = b.p.pos.z; b.p.pos.x = x; b.p.pos.z = z;
      show('MUSICAL CHAIRS', `you and ${b.name} swapped places`, '#4fc3ff');
    },
  };
  const api = {
    T,
    update(dt) {
      T.happy = Math.max(0, T.happy - dt); T.drunk = Math.max(0, T.drunk - dt);
      if (run.state !== 'play' || api.chatPicks || (next -= dt) > 0) return;
      next = 15 + Math.random() * 7;
      const keys = Object.keys(TWISTS).filter(k => k !== last && (k !== 'swap' || bots));
      for (let tries = 0; tries < 6; tries++) { const k = pick(keys); if (TWISTS[k]() !== false) { last = k; return; } }
    },
    fire(k, by) { if (by) label = `${by.slice(0, 18)} PICKED THIS`; const r = TWISTS[k]?.(); if (r === false) { label = 'PLOT TWIST'; return TWISTS.quake(); } last = k; return r; },
    chatPicks: false, // when chat is connected, chat votes the twists instead of the timer
    ballot: () => ['airstrike', 'care', ...Object.keys(TWISTS)].filter(k => k !== last && (k !== 'swap' && k !== 'chairs' || bots)).sort(() => Math.random() - .5).slice(0, 3),
    // BLAME: the person who just dropped their tower names somebody. The blamed one pays a $10 blame tax to them.
    blame(loser, target, tax = true) { // speech bubbles over both heads, no banners
      const excuse = pick(LINES.excuse);
      if (!target) { speak?.(loser, pick(LINES.topple)); return { excuse }; }
      speak?.(loser, `IT WAS ${target}`, { bg: '#ffd166' });
      setTimeout(() => speak?.(target, tax ? 'WHAT?! -$10' : 'WHAT?!', { bg: '#ff4f6d', fg: '#fff' }), 650);
      say('blame', '', { force: true });
      return { excuse };
    },
  };
  return api;
}
