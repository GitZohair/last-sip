// The chaos deck. `!chaos` draws a weighted card; chat never knows exactly what it is doing to you.
// rarity: c(ommon) 70%, r(are) 25%, l(egendary) 5%. help:true = good for the streamer.
// apply(x) receives the game API: { fire(type), spawnAhead(kind,n,opts), mod(name,seconds), refill(f), clearPuddles(), blastAt(d,power) }.
export const CARDS = [
  // ---- common chaos
  { id: 'bomb', icon: '💣', label: 'CHAT BOMB', r: 'c', apply: x => x.fire('bomb') },
  { id: 'banana', icon: '🍌', label: 'BANANA BARRAGE', r: 'c', apply: x => x.spawnAhead('banana', 6, { spread: 2.2, drop: true }) },
  { id: 'balls', icon: '🔴', label: 'BALL PIT DELIVERY', r: 'c', apply: x => x.spawnAhead('ball', 8, { spread: 2.5, drop: true, life: 25 }) },
  { id: 'ducks', icon: '🦆', label: 'DUCK STAMPEDE', r: 'c', apply: x => x.spawnAhead('duck', 14, { spread: 1.5, toward: 6, life: 18 }) },
  { id: 'gust', icon: '🌬️', label: 'DRAFT', r: 'c', apply: x => x.fire('storm') },
  { id: 'mop', icon: '🧽', label: 'FRESHLY MOPPED', r: 'c', apply: x => x.fire('ice') },
  { id: 'lights', icon: '🌑', label: 'LIGHTS OUT', r: 'c', apply: x => x.fire('lights') },
  { id: 'bass', icon: '🔊', label: 'BASS DROP', r: 'c', apply: x => x.fire('quake') },
  { id: 'cans', icon: '🥤', label: 'SODA AVALANCHE', r: 'c', apply: x => x.spawnAhead('can', 10, { spread: 1.8, drop: true }) },
  { id: 'drunk', icon: '🥴', label: 'WOBBLY LEGS', r: 'c', apply: x => x.mod('drunk', 6) },
  { id: 'hyper', icon: '☕', label: 'FOURTH ESPRESSO', r: 'c', apply: x => x.mod('hyper', 6) },
  { id: 'fog', icon: '🌫️', label: 'SOMEONE BURNT TOAST', r: 'c', apply: x => x.mod('fog', 8) },
  // ---- common help
  { id: 'steady', icon: '🫶', label: 'STEADY HANDS', r: 'c', help: true, apply: x => x.fire('calm') },
  { id: 'mopup', icon: '🧹', label: 'CHAT CLEANED UP', r: 'c', help: true, apply: x => x.clearPuddles() },
  { id: 'pillows', icon: '🛏️', label: 'PILLOW CUSHION', r: 'c', help: true, apply: x => x.mod('soft', 10) },
  // ---- rare chaos
  { id: 'fridge', icon: '🧊', label: 'FRIDGE DELIVERY', r: 'r', apply: x => x.fire('crate') },
  { id: 'fridges', icon: '🧊🧊', label: 'IT IS RAINING FRIDGES', r: 'r', apply: x => { x.fire('crate'); setTimeout(() => x.fire('crate'), 500); setTimeout(() => x.fire('crate'), 1000); } },
  { id: 'moon', icon: '🌙', label: 'MOON GRAVITY', r: 'r', apply: x => x.mod('moon', 8) },
  { id: 'tilt', icon: '📐', label: 'THE HOUSE IS TILTED', r: 'r', apply: x => x.mod('tilt', 7) },
  { id: 'tiny', icon: '🐜', label: 'HONEY I SHRUNK THE STREAMER', r: 'r', apply: x => x.mod('tiny', 8) },
  { id: 'bigglass', icon: '🍺', label: 'COMICALLY LARGE GLASS', r: 'r', apply: x => x.mod('bigglass', 8) },
  { id: 'disco', icon: '🪩', label: 'DISCO INFERNO', r: 'r', apply: x => { x.mod('disco', 8); x.fire('quake'); } },
  { id: 'carpet', icon: '💥', label: 'CARPET BOMBING', r: 'r', apply: x => { x.fire('bomb'); setTimeout(() => x.fire('bomb'), 400); } },
  // ---- rare help
  { id: 'lid', icon: '🥤', label: 'CHAT GAVE YOU A LID', r: 'r', help: true, apply: x => x.mod('lid', 5) },
  { id: 'refill', icon: '🚰', label: 'TOP-UP (+10%)', r: 'r', help: true, apply: x => x.refill(.1) },
  { id: 'slowmo', icon: '⏳', label: 'BULLET TIME', r: 'r', help: true, apply: x => x.mod('slowmo', 4) },
  // ---- legendary
  { id: 'lava', icon: '🌋', label: 'THE FLOOR IS LAVA', r: 'l', apply: x => x.mod('lava', 8) },
  { id: 'mirror', icon: '🪞', label: 'MIRROR WORLD', r: 'l', apply: x => x.mod('mirror', 7) },
  { id: 'nuke', icon: '☢️', label: 'TACTICAL BANANA', r: 'l', apply: x => { x.spawnAhead('banana', 25, { spread: 3.5, drop: true }); x.fire('bomb'); } },
  { id: 'fullrefill', icon: '🌊', label: 'CHAT PAID YOUR WATER BILL (FULL)', r: 'l', help: true, apply: x => x.refill(1) },
];
const WEIGHT = { c: 70, r: 25, l: 5 };

export function draw(rand = Math.random, { bias = 0 } = {}) {
  // bias > 0 (e.g. big Bits) shifts odds toward rare/legendary
  const w = { c: Math.max(5, WEIGHT.c - bias * 30), r: WEIGHT.r + bias * 20, l: WEIGHT.l + bias * 10 };
  let roll = rand() * (w.c + w.r + w.l);
  const tier = (roll -= w.c) < 0 ? 'c' : (roll -= w.r) < 0 ? 'r' : 'l';
  const pool = CARDS.filter(c => c.r === tier);
  return pool[Math.floor(rand() * pool.length)];
}
export const byId = id => CARDS.find(c => c.id === id);
