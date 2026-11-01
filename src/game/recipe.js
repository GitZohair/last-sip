import * as THREE from 'three';
import { model } from './assets.js';
import { PADS } from './island.js';
import { rng } from './rng.js';

// TODAY'S ORDER: 3 of the 6 island ingredients, the same for every streamer today (seeded).
// Hold E at an ingredient islet to pour it in. Each pour fills a third of the glass and tints the drink.
// The stream hut only accepts the drink once all three are in.
export const INGREDIENTS = {
  coconut: { label: 'COCONUT', color: '#f4efe4' }, lemon: { label: 'LEMON', color: '#ffe45c' }, pineapple: { label: 'PINEAPPLE', color: '#ffc23d' },
  strawberry: { label: 'STRAWBERRY', color: '#ff4f6d' }, honey: { label: 'HONEY', color: '#e8a23a' }, watermelon: { label: 'WATERMELON', color: '#ff7a8a' },
};

export const todaysOrder = seed => rng(seed + ':order').shuffle(Object.keys(INGREDIENTS)).slice(0, 3);

export async function createRecipe(scene, seed) {
  const order = todaysOrder(seed);
  const ringGeo = new THREE.TorusGeometry(1.5, .07, 10, 48);
  const stations = await Promise.all(Object.keys(INGREDIENTS).map(async id => {
    const [px, pz] = PADS[id], x = px + (px < 0 ? 2 : -2), z = pz;
    const crate = await model('pirate', 'crate'); crate.position.set(x, 0, z); scene.add(crate);
    const fruit = await model('food', id, { scale: 3 }); fruit.position.set(x, 1.2, z); scene.add(fruit);
    const want = order.includes(id);
    const ring = new THREE.Mesh(ringGeo, new THREE.MeshStandardMaterial({ color: want ? '#5dff9b' : '#ffffff', emissive: want ? '#2dff7a' : '#000', emissiveIntensity: want ? 1.2 : 0, transparent: true, opacity: want ? 1 : .25 }));
    ring.rotation.x = Math.PI / 2; ring.position.set(x, .06, z); scene.add(ring);
    return { id, x, z, want, fruit, ring, got: false, hold: 0 };
  }));
  const r = { order, stations, got: [], done: false, near: null, color: new THREE.Color('#bfe9ff') };
  r.update = (t, dt, player, glass, onCollect) => {
    r.near = null;
    for (const s of stations) {
      s.fruit.rotation.y = t * 1.5; s.fruit.position.y = 1.2 + Math.sin(t * 2 + s.x) * .12;
      if (s.got || !s.want) continue;
      s.ring.scale.setScalar(1 + Math.sin(t * 4) * .05);
      if (Math.hypot(player.pos.x - s.x, player.pos.z - s.z) > 2.2) { s.hold = 0; continue; }
      r.near = s;
      if (player.keys.has('KeyE')) s.hold += dt; else s.hold = Math.max(0, s.hold - dt * 2);
      if (s.hold >= .9) {
        s.got = true; s.fruit.visible = false; s.ring.visible = false; r.got.push(s.id);
        glass.state.water = Math.min(1, glass.state.water + 1 / 3 + .001);
        r.color.lerp(new THREE.Color(INGREDIENTS[s.id].color), r.got.length === 1 ? 1 : .5);
        r.done = r.got.length === order.length; onCollect?.(s, r.got.length);
      }
    }
  };
  return r;
}
