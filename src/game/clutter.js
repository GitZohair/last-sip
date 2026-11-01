import * as THREE from 'three';
import { textTexture } from './assets.js';
import { screenImage } from '../moderation.js';

// Beach junk on the boards (goofy physics props) and one GOLDEN DUCK hidden on the far east islet.
const SPOTS = [[2, -2], [-2, -10], [1, -24], [-3, -33], [3, -30], [0, -44], [-1, -60], [1, -70], [-12, -16], [12, -48]];

export async function dress(scene, level, props, r) {
  void SPOTS; void props; void r; // the boards stay clear: loose junk only arrives from chat cards
  const duck = new THREE.Mesh(new THREE.SphereGeometry(.16, 20, 14), new THREE.MeshStandardMaterial({ color: '#ffcc33', metalness: .9, roughness: .2, emissive: '#7a5200', emissiveIntensity: .5 }));
  duck.position.set(17, .16, -62); scene.add(duck);
  return { goldenDuck: duck };
}

// The streamer's own stuff on their hut: a WELCOME sign and (when signed in) their avatar, box art and
// clip thumbnails as framed photos. Images go through the moderation screen like chat frames.
export async function personalize(scene, profile) {
  if (!profile) return;
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(3.4, .62), new THREE.MeshBasicMaterial({ map: textTexture(`${profile.name.toUpperCase()} IS LIVE`, { w: 1024, h: 190, bg: '#a970ff', font: 'bold 82px system-ui' }) }));
  sign.position.set(0, 3.25, -81.9); scene.add(sign);
  const pics = [profile.avatar, profile.boxArt, ...(profile.clips || [])].filter(Boolean).slice(0, 4);
  let i = 0;
  for (const url of pics) {
    const res = await screenImage(url, { trusted: true }); if (!res.ok) continue;
    const tex = new THREE.Texture(res.img); tex.colorSpace = THREE.SRGBColorSpace; tex.needsUpdate = true;
    const g = new THREE.Group();
    g.add(new THREE.Mesh(new THREE.BoxGeometry(.9, .7, .05), new THREE.MeshStandardMaterial({ color: '#1d1a24' })));
    const pic = new THREE.Mesh(new THREE.PlaneGeometry(.8, .6), new THREE.MeshBasicMaterial({ map: tex })); pic.position.z = .03; g.add(pic);
    g.position.set(-1.6 + i * 1.05, 1.9, -85.5); scene.add(g); i++;
  }
}
