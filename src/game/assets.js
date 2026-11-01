import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// Kenney Furniture Kit / Food Kit (CC0). The furniture kit is ~half real scale, so it is scaled x2.
const loader = new GLTFLoader();
const cache = new Map();
// Kenney kits use one colormap per kit: share one material (and one texture) per kit + material name,
// so separate models can be batched and the GPU holds a single copy of each texture.
const mats = new Map();
function shared(kit, m) {
  const key = kit + '/' + m.name + '/' + m.color.getHexString();
  if (!mats.has(key)) { // Lambert: same flat Kenney look, much cheaper per pixel than PBR on laptop GPUs
    if (m.map) m.map.anisotropy = 8;
    mats.set(key, new THREE.MeshLambertMaterial({ name: m.name, color: m.color, map: m.map, emissive: m.emissive, emissiveMap: m.emissiveMap, transparent: m.transparent, opacity: m.opacity, side: m.side, vertexColors: m.vertexColors, alphaTest: m.alphaTest }));
  }
  return mats.get(key);
}
const KITS = { furniture: ['/assets/kenney/furniture-kit/', 2], food: ['/assets/kenney/food-kit/', 1], pirate: ['/assets/kenney/pirate-kit/', 1] };

export function preload(list) {
  return Promise.all(list.map(([kit, name]) => load(kit, name)));
}

function load(kit, name) {
  const key = kit + '/' + name;
  if (!cache.has(key)) {
    const [dir] = KITS[kit];
    cache.set(key, loader.loadAsync(dir + name + '.glb').then(g => {
      g.scene.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; if (!Array.isArray(o.material)) o.material = shared(kit, o.material); } });
      return g.scene;
    }).catch(() => null));
  }
  return cache.get(key);
}

// Synchronous clone after preload. Returns a group whose origin is bottom-centre of the model.
export async function model(kit, name, { scale = 1 } = {}) {
  const src = await load(kit, name);
  const holder = new THREE.Group();
  if (!src) { // visible fallback so a missing file never breaks the course
    const box = new THREE.Mesh(new THREE.BoxGeometry(.6, .6, .6), new THREE.MeshStandardMaterial({ color: '#ff3df2' }));
    box.position.y = .3; holder.add(box); return holder;
  }
  const m = src.clone(true);
  m.scale.setScalar(KITS[kit][1] * scale);
  const box = new THREE.Box3().setFromObject(m);
  const c = box.getCenter(new THREE.Vector3());
  m.position.set(-c.x, -box.min.y, -c.z);
  holder.add(m);
  return holder;
}

// Simple canvas textures so floors/walls look intentional without extra downloads.
export function checker(a, b, repeat = 4, size = 64) {
  const c = document.createElement('canvas'); c.width = c.height = size * 2;
  const x = c.getContext('2d');
  x.fillStyle = a; x.fillRect(0, 0, c.width, c.height);
  x.fillStyle = b; x.fillRect(0, 0, size, size); x.fillRect(size, size, size, size);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat, repeat);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}

export function planks(base, line, repeat = 4) {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const x = c.getContext('2d'); x.fillStyle = base; x.fillRect(0, 0, 128, 128);
  x.strokeStyle = line; x.lineWidth = 2;
  for (let i = 0; i < 4; i++) { x.beginPath(); x.moveTo(0, i * 32); x.lineTo(128, i * 32); x.stroke(); x.beginPath(); x.moveTo((i * 53) % 128, i * 32); x.lineTo((i * 53) % 128, i * 32 + 32); x.stroke(); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat, repeat);
  t.colorSpace = THREE.SRGBColorSpace; return t;
}

export function textTexture(lines, { w = 512, h = 256, bg = '#1b1530', fg = '#fff', font = 'bold 44px system-ui' } = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d'); x.fillStyle = bg; x.fillRect(0, 0, w, h);
  x.fillStyle = fg; x.font = font; x.textAlign = 'center'; x.textBaseline = 'middle';
  const arr = [].concat(lines); arr.forEach((l, i) => x.fillText(l, w / 2, h / 2 + (i - (arr.length - 1) / 2) * parseInt(font.match(/\d+/)[0]) * 1.2));
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
