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
