// Timed modifiers from deck cards. The game reads derived values each frame.
export function createMods() {
  const t = {};
  const on = n => (t[n] || 0) > 0;
  return {
    set(name, s) { t[name] = Math.max(t[name] || 0, s); },
    step(dt) { for (const k in t) t[k] = Math.max(0, t[k] - dt); },
    on, left: n => t[n] || 0,
    active: () => Object.keys(t).filter(on),
    get gravity() { return on('moon') ? 4.5 : 14; },
    get speed() { return (on('hyper') ? 1.6 : 1) * (on('tiny') ? .7 : 1); },
    get mirror() { return on('mirror') ? -1 : 1; },
    get timeScale() { return on('slowmo') ? .45 : 1; },
    get eye() { return on('tiny') ? .45 : 1.6; },
    get slosh() { return on('bigglass') ? 1.8 : 1; },
    get noSpill() { return on('lid'); },
    get soft() { return on('soft'); },
    get lava() { return on('lava'); },
    get tilt() { return on('tilt') ? 2.2 : 0; },
    get roll() { return on('drunk') ? Math.sin(performance.now() / 300) * .12 : 0; },
    get fog() { return on('fog'); },
    get disco() { return on('disco'); },
    clear() { for (const k in t) delete t[k]; },
  };
}
