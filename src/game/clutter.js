import * as THREE from 'three';
import { model, textTexture } from './assets.js';
import { screenImage } from '../moderation.js';

// Seeded mess: every house is dressed differently. Wall decor hugs side walls (no doors there),
// loose physics props litter the floor, and one GOLDEN DUCK hides somewhere (find it: +5% water).
const WALL_DECOR = ['bookcaseOpen', 'bookcaseOpenLow', 'lampRoundFloor', 'lampSquareFloor', 'pottedPlant', 'plantSmall1', 'plantSmall2', 'plantSmall3', 'sideTable', 'sideTableDrawers', 'speaker', 'speakerSmall', 'coatRackStanding', 'trashcan', 'radio', 'loungeChair', 'chairRounded', 'cardboardBoxOpen', 'books'];
const LOOSE = ['banana', 'ball', 'duck', 'can', 'donut', 'box', 'pizza', 'pillow'];

export async function dress(scene, level, props, r) {
  const jobs = [];
  for (const room of level.rooms) {
    if (room.key === 'stream') continue;
    const n = Math.floor(room.len / 2.2) + Math.floor(r() * 3);
    for (let i = 0; i < n; i++) {
      const side = r() > .5 ? 1 : -1, z = room.z0 - 1 - r() * (room.len - 2), name = r.pick(WALL_DECOR);
      jobs.push(model('furniture', name).then(m => {
        m.position.set(side * (room.w / 2 - .4), 0, z); m.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2; scene.add(m);
        const b = new THREE.Box3().setFromObject(m);
        if (b.max.y > .4) level.colliders.push({ minX: b.min.x, maxX: b.max.x, minZ: b.min.z, maxZ: b.max.z, top: b.max.y });
      }));
    }
    const loose = Math.floor(room.len / 3) + Math.floor(r() * 4);
    for (let i = 0; i < loose; i++) jobs.push(props.spawn(r.pick(LOOSE), r.range(-room.w / 2 + .6, room.w / 2 - .6), .5, room.z0 - 1 - r() * (room.len - 2)));
  }
  await Promise.all(jobs);
  // golden duck: in a random room corner-ish spot
  const room = r.pick(level.rooms.slice(1, -1));
  const duck = new THREE.Mesh(new THREE.SphereGeometry(.16, 20, 14), new THREE.MeshStandardMaterial({ color: '#ffcc33', metalness: .9, roughness: .2, emissive: '#7a5200', emissiveIntensity: .5 }));
  duck.position.set((r() > .5 ? 1 : -1) * (room.w / 2 - .5), .16, room.z1 + .8 + r() * 1.5); scene.add(duck);
  return { goldenDuck: duck };
}

// The streamer's own stuff, pulled from Twitch after sign-in (or channel name only when anonymous):
// a "WELCOME HOME <name>" sign, their avatar as a framed portrait, clip thumbnails as family photos,
// their current game's box art as a poster.
export async function personalize(scene, level, profile) {
  if (!profile) return;
  const stream = level.rooms.at(-1), kitchen = level.rooms[0];
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(3, .6), new THREE.MeshBasicMaterial({ map: textTexture(`WELCOME HOME, ${profile.name.toUpperCase()}`, { w: 1024, h: 200, bg: '#a970ff', font: 'bold 80px system-ui' }) }));
  sign.position.set(0, 2.3, kitchen.z0 - .12); sign.rotation.y = Math.PI; scene.add(sign);
  const pics = [profile.avatar, profile.boxArt, ...(profile.clips || [])].filter(Boolean).slice(0, 6);
  let i = 0;
  for (const url of pics) {
    const res = await screenImage(url, { trusted: true }); if (!res.ok) continue;
    const tex = new THREE.Texture(res.img); tex.colorSpace = THREE.SRGBColorSpace; tex.needsUpdate = true;
    const aspect = res.img.width / res.img.height || 1, h = .9, w = Math.min(1.6, h * aspect);
    const g = new THREE.Group();
    g.add(new THREE.Mesh(new THREE.BoxGeometry(w + .12, h + .12, .05), new THREE.MeshStandardMaterial({ color: '#1d1a24' })));
    const pic = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex })); pic.position.z = .03; g.add(pic);
    const side = i % 2 ? 1 : -1, room = i < 2 ? stream : level.rooms[1 + (i % (level.rooms.length - 2))];
    g.position.set(side * (room.w / 2 - .02), 1.7, room.z0 - 1.5 - Math.floor(i / 2) * 1.8); g.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2;
    scene.add(g); i++;
  }
}
