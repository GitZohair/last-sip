// STYLE: rewards playing fast and close to danger instead of crawling.
// Each trick adds points × the current combo; the combo grows with every trick inside a 3 s window
// and resets when it lapses or when you spill a lot. Final score adds style to water + time.
export const TRICKS = {
  nearmiss: { label: 'NEAR MISS', pts: 60 },
  doorDash: { label: 'DOOR DASH', pts: 80 },
  hop: { label: 'HOP', pts: 25 },
  catch: { label: 'CATCH', pts: 120 },
  cleanSprint: { label: 'CLEAN SPRINT', pts: 40 },
  outrun: { label: 'OUTRAN THE VACUUM', pts: 90 },
  duck: { label: 'GOLDEN DUCK', pts: 150 },
  legend: { label: 'SURVIVED A LEGENDARY', pts: 200 },
  shout: { label: 'BROKE THE SMART LOCK', pts: 100 },
  scare: { label: 'SCARED THE VACUUM', pts: 110 },
  bounce: { label: 'TRAMPOLINE', pts: 50 },
};

export function createStyle() {
  const s = { points: 0, combo: 1, window: 0, best: 1, last: null, counts: {} };
  s.add = (id) => {
    const t = TRICKS[id]; if (!t) return 0;
    const gained = Math.round(t.pts * s.combo);
    s.points += gained; s.combo = Math.min(8, s.combo + 1); s.best = Math.max(s.best, s.combo); s.window = 3;
    s.counts[id] = (s.counts[id] || 0) + 1; s.last = { id, label: t.label, gained, combo: s.combo - 1 };
    return gained;
  };
  s.step = (dt, spilled) => {
    s.window -= dt;
    if (s.window <= 0 || spilled > .02) { s.combo = 1; if (spilled > .02) s.window = 0; }
  };
  return s;
}
