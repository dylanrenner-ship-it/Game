# Band Hero – 3D Avatar Renderer (StackBlitz/Firebase-ready)

This is a minimal, classroom-safe 3D avatar system using **Three.js** + **GLTF/GLB** assets.

## Why this approach
Your target look is **faceted low‑poly**. Procedural SVG can’t convincingly match that.
This renderer loads real low‑poly models and renders them to transparent canvases for:
- a small UI avatar (256×256)
- a large hero avatar (420×420)

## Legal / licensing (important)
Use **CC0 (public domain)** sources:
- Kenney assets are CC0 (public domain). See Kenney support page.  
- Quaternius packs are CC0 (public domain). Many packs specify CC0 directly.

If you use any **CC‑BY** model, you must add attribution.

## Where to get CC0 low‑poly models
- Kenney: https://kenney.nl/assets
- Quaternius: https://quaternius.itch.io/  or https://quaternius.com/

## Required folder structure
Place models under:

public/assets/models/
  human/
    v1.glb
    v2.glb
  animal/
    dog/
      v1.glb
      v2.glb
    cat/
      v1.glb
    bear/
      v1.glb
    bunny/
      v1.glb
    bird/
      v1.glb
    fox/
      v1.glb

## Tips for preparing models
- Prefer GLB (single file).
- Keep polycount low (mobile-friendly).
- Center the model at origin, face forward (+Z), standing on Y=0 if possible.
- If a model is too big/small, adjust in Blender OR tweak scale in avatar3d.js.

## Firebase Hosting
This project can be deployed as static hosting. If you keep student data local, you can avoid accounts and privacy concerns.

