// The chaos deck. `!chaos` draws a weighted card; chat never knows exactly what it is doing to you.
// rarity: c(ommon) 70%, r(are) 25%, l(egendary) 5%. help:true = good for the streamer.
// Icons come from src/game/icons.js keyed by card id.
// apply(x) receives the game API: { fire(type), spawnAhead(kind,n,opts), mod(name,seconds), refill(f), clearPuddles(), blastAt(d,power) }.
export const CARDS = [
  // ---- common chaos
  { id: 'bomb', label: 'CHAT BOMB', r: 'c', apply: x => x.fire('bomb') },
  { id: 'banana', label: 'BANANA BARRAGE', r: 'c', apply: x => x.spawnAhead('banana', 6, { spread: 2.2, drop: true }) },
  { id: 'balls', label: 'BALL PIT DELIVERY', r: 'c', apply: x => x.spawnAhead('ball', 8, { spread: 2.5, drop: true, life: 25 }) },
  { id: 'ducks', label: 'DUCK STAMPEDE', r: 'c', apply: x => x.spawnAhead('duck', 14, { spread: 1.5, toward: 6, life: 18 }) },
  { id: 'gust', label: 'DRAFT', r: 'c', apply: x => x.fire('storm') },
  { id: 'mop', label: 'FRESHLY MOPPED', r: 'c', apply: x => x.fire('ice') },
  { id: 'lights', label: 'LIGHTS OUT', r: 'c', apply: x => x.fire('lights') },
  { id: 'bass', label: 'BASS DROP', r: 'c', apply: x => x.fire('quake') },
  { id: 'cans', label: 'SODA AVALANCHE', r: 'c', apply: x => x.spawnAhead('can', 10, { spread: 1.8, drop: true }) },
  { id: 'drunk', label: 'WOBBLY LEGS', r: 'c', apply: x => x.mod('drunk', 6) },
  { id: 'hyper', label: 'FOURTH ESPRESSO', r: 'c', apply: x => x.mod('hyper', 6) },
  { id: 'fog', label: 'SOMEONE BURNT TOAST', r: 'c', apply: x => x.mod('fog', 8) },
  // ---- common help
  { id: 'steady', label: 'STEADY HANDS', r: 'c', help: true, apply: x => x.fire('calm') },
  { id: 'mopup', label: 'CHAT CLEANED UP', r: 'c', help: true, apply: x => x.clearPuddles() },
  { id: 'pillows', label: 'PILLOW CUSHION', r: 'c', help: true, apply: x => x.mod('soft', 10) },
  // ---- rare chaos
  { id: 'fridge', label: 'FRIDGE DELIVERY', r: 'r', apply: x => x.fire('crate') },
  { id: 'fridges', label: 'IT IS RAINING FRIDGES', r: 'r', apply: x => { x.fire('crate'); setTimeout(() => x.fire('crate'), 500); setTimeout(() => x.fire('crate'), 1000); } },
  { id: 'moon', label: 'MOON GRAVITY', r: 'r', apply: x => x.mod('moon', 8) },
  { id: 'tilt', label: 'THE HOUSE IS TILTED', r: 'r', apply: x => x.mod('tilt', 7) },
  { id: 'tiny', label: 'HONEY I SHRUNK THE STREAMER', r: 'r', apply: x => x.mod('tiny', 8) },
  { id: 'bigglass', label: 'COMICALLY LARGE GLASS', r: 'r', apply: x => x.mod('bigglass', 8) },
  { id: 'disco', label: 'DISCO INFERNO', r: 'r', apply: x => { x.mod('disco', 8); x.fire('quake'); } },
  { id: 'carpet', label: 'CARPET BOMBING', r: 'r', apply: x => { x.fire('bomb'); setTimeout(() => x.fire('bomb'), 400); } },
  // ---- rare help
  { id: 'lid', label: 'CHAT GAVE YOU A LID', r: 'r', help: true, apply: x => x.mod('lid', 5) },
  { id: 'refill', label: 'TOP-UP (+10%)', r: 'r', help: true, apply: x => x.refill(.1) },
  { id: 'slowmo', label: 'BULLET TIME', r: 'r', help: true, apply: x => x.mod('slowmo', 4) },
  // ---- legendary
  { id: 'lava', label: 'THE FLOOR IS LAVA', r: 'l', apply: x => x.mod('lava', 8) },
  { id: 'mirror', label: 'MIRROR WORLD', r: 'l', apply: x => x.mod('mirror', 7) },
  { id: 'nuke', label: 'TACTICAL BANANA', r: 'l', apply: x => { x.spawnAhead('banana', 25, { spread: 3.5, drop: true }); x.fire('bomb'); } },
  { id: 'fullrefill', label: 'CHAT PAID YOUR WATER BILL (FULL)', r: 'l', help: true, apply: x => x.refill(1) },
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
