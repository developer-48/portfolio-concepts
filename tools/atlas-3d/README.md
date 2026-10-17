# ATLAS asset tools

Node 20.9+. Run `npm ci` in this directory, then `npm run build` after changing `atlas/vehicle-renderer.js`. The ES module is committed for buildless GitHub Pages deployment. Runtime libraries are local; model transport stays separate to start downloading before the renderer is parsed.

## Geometry

Porsche's approved v13 assets are preserved byte for byte. The v14 tools rebuild only sedan, crossover and SUV from the original source GLBs listed in `../../ASSETS-V12.md`.

1. `node prepare.mjs ORIGINAL.glb BASELINE/sedan.glb sedan` (repeat for `crossover`, `suv`). This bakes source transforms, normalizes the vehicle to 4.65 units, identifies front door hinges and classifies materials. Use original source models, never an already simplified asset.
2. `node optimize.mjs BASELINE OUTPUT`. OUTPUT must contain the prior licensed assets so their embedded attribution metadata is retained. This repairs paint normals, simplifies small details at ratio 0.35 / error 0.001, preserves body positions and triangle count, and compresses textures to WebP up to 768 px. A 30° crease and bounded smoothing retain panel edges without the damaged-looking reflections from source normals.

Meshopt uses 14-bit positions. Its `high` mode stores normals using its built-in 8-bit octahedral filter (the `quantizeNormal` option does not override that filter). A higher-precision comparison was checked during v14 development; the substantive shading defect was the source normals, not that final filter. Each GLB has a gzip transport version and an uncompressed GLB fallback for browsers without DecompressionStream.

The transparent 1280×640 posters are captures of the actual renderer in default `restore` pose with reduced motion and no UI. Rebuild only affected posters when materials change; retain the same vertical field of view. QA screenshots and temporary rendering helpers do not belong in deployment.

Authors and CC BY 4.0 attribution: `../../ASSETS-V12.md` and `../../atlas/model-credits.html`.
