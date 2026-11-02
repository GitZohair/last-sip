# Prototype asset provenance

The original Last Sip scene at `/` uses procedural geometry created for this project.

The mechanic lab at `/lab/` uses selected original Kenney models from these packs, downloaded on 1 November 2026 (Pakistan time):

- [Kenney Furniture Kit](https://kenney.nl/assets/furniture-kit): `kitchenFridge.glb`, `chair.glb`, `pottedPlant.glb`, `cardboardBoxClosed.glb`. Additional downloaded candidates: `bear.glb`, `lampRoundFloor.glb`.
- [Kenney Food Kit](https://kenney.nl/assets/food-kit): downloaded candidates `mug.glb`, `glass.glb`, `fish.glb`, `burger.glb`; these are available for further experiments and are not yet used by the scene.

Both packs are CC0. Their exact included license files are preserved beside the models under `public/assets/kenney/`. [Kenney licensing information](https://kenney.nl/support).

The models are rendered with approximate box colliders for quick mechanic testing. Archive sources live in ignored `.asset-sources/` and are not shipped as public assets.

Three.js and cannon-es are installed through npm; dependency licenses remain in their packages. Fonts are Barlow Condensed and DM Sans through Google Fonts, with system fallbacks. All named audience inputs in the lab are local simulations, not actual viewer contributions or payments.

- Kenney Furniture Kit & Food Kit — CC0 (kenney.nl)
- nsfwjs — MIT; TensorFlow.js — Apache-2.0
- Twitch emotes are loaded at runtime from Twitch CDN and remain property of their owners.

- **Kenney Pirate Kit** (CC0) — island patches, palms, rocks, platforms, watchtowers, shipwreck, boats, crates, barrels, cannon. https://kenney.nl/assets/pirate-kit
- **Kenney Impact Sounds** and **Interface Sounds** (CC0) — footsteps, impacts, UI cues in `public/assets/sfx`. https://kenney.nl/assets/impact-sounds · https://kenney.nl/assets/interface-sounds
- **Kenney Mini Characters** (CC0) — the streamer character and its animations (idle, walk, sprint, jump, fall, die, emotes, holding-right). https://kenney.nl/assets/mini-characters
- **Kenney Car Kit** (CC0), downloaded 2 November 2026: `taxi.glb`, `police.glb`, `kart-oobi.glb` (+ `kart-oodi`, `kart-oopi`, `Textures/colormap.png`, licence). https://kenney.nl/assets/car-kit
- **Kenney Mini Characters** (CC0): the old streamer rig, still available with `?char=`.
- Bean streamers, banner planes, the flyable plane, bombs, CO2 canisters, seagull and confetti are procedural geometry made for this project.
- Fonts: Bricolage Grotesque and Inter (Google Fonts, OFL).
