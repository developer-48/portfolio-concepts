# ATLAS asset tools

Node 20.9+. Run `npm ci` in this directory, then `npm run build` after changing `atlas/vehicle-renderer.js`. The ES module is committed for buildless GitHub Pages deployment. Runtime libraries are local; model transport stays separate to start downloading before the renderer is parsed.

## Geometry

Porsche's approved v13 assets are preserved byte for byte. The v14 tools rebuild only sedan, crossover and SUV from the original source GLBs listed in `../../ASSETS-V12.md`.

1. `node prepare.mjs ORIGINAL.glb BASELINE/sedan.glb sedan` (repeat for `crossover`, `suv`). This bakes source transforms, normalizes the vehicle to 4.65 units, identifies front door hinges and classifies materials. Use original source models, never an already simplified asset.
2. `node optimize.mjs BASELINE OUTPUT`. OUTPUT must contain the prior licensed assets so their embedded attribution metadata is retained. This repairs paint normals, simplifies small details at ratio 0.35 / error 0.001, preserves body positions and triangle count, and compresses textures to WebP up to 768 px. A 30° crease and bounded smoothing retain panel edges without the damaged-looking reflections from source normals.

Meshopt uses 14-bit positions. Its `high` mode stores normals using its built-in 8-bit octahedral filter (the `quantizeNormal` option does not override that filter). A higher-precision comparison was checked during v14 development; the substantive shading defect was the source normals, not that final filter. Each GLB has a gzip transport version and an uncompressed GLB fallback for browsers without DecompressionStream.

The transparent 1280×640 posters are captures of the actual renderer in default `restore` pose with reduced motion and no UI. Rebuild only affected posters when materials change; retain the same vertical field of view. QA screenshots and temporary rendering helpers do not belong in deployment.

Authors and CC BY 4.0 attribution: `../../ASSETS-V12.md` and `../../atlas/model-credits.html`.

## v15 reflection and glazing repair

Rebuild only the affected vehicles with `node optimize.mjs BASELINE OUTPUT sedan crossover`.
The BMW baseline must be regenerated with the current `prepare.mjs`: its window panes, roof panes and front/rear lenses are separate surfaces. Tyres are opaque in the asset itself. The two roof panes share a continuous curvature normal field to remove the source bevel's bright zigzag seam; their positions are retained.

For S65 and X6, `reflection-normals.mjs` applies a bounded spatial bilateral filter offline after the angle-weighted reconstruction. World-space distance and a normal-angle gate prevent smoothing across perpendicular panels. Body positions and silhouette are unchanged. Glazing, BMW wheels and exterior seals bypass simplification. The runtime fixes tyre depth writes and distinguishes roof glazing/lenses from cabin windows. Porsche and GLS binary assets/posters remain unchanged.

Regression tests: `node --test reflection-normals.test.mjs` here, plus the three `atlas/*.test.cjs` suites from the repository root. Visual acceptance includes front, both sides, rear and elevated roof views, with tyres visible throughout rotation.

## v16 deployment format

The deployed renderer now expects Draco models and a local worker decoder. `prepare.mjs` / `optimize.mjs` produce the Meshopt intermediate; do not deploy that intermediate directly. Run `node pack-models.mjs MESHOPT_BASELINE OUTPUT` as the final packaging step for all four models. Use different input/output directories to avoid repeatedly quantizing an already packed asset. The approved v16 baseline is the four GLBs from Git commit `40f457f6746f77d3ac7e4e8291cef2487d1f22a6`; packing them reproduces the committed outputs exactly.

`npm ci` includes pinned `draco3dgltf@1.5.7`. DRACOLoader and decoder files come from Three.js r180; they remain local and include the Draco license. The renderer uses two decoder workers. Poster revision stays 15 because the actual appearance/camera has not changed; model revision is separately defined in `atlas/model-data.js`. UI-only updates must not invalidate unchanged model/poster URLs.

Cache and asset regression checks: `node --test atlas/model-cache.test.mjs atlas/vehicle-assets.test.cjs` from the repository root. Clear only the test origin's cache, or use a fresh local origin, when measuring cold transfers; an ordinary reload intentionally uses persistent model data.

## v17 web assets (current)

Use `node compact-models.mjs INPUT OUTPUT` with the four licensed v15 GLBs from commit `40f457f6746f77d3ac7e4e8291cef2487d1f22a6`. This supersedes the transport-only v16 packing step for the deployed assets. Do not use already simplified v17 files as input. Paint, glass, lenses and tyres bypass simplification; other surfaces use attribute-aware meshoptimizer reduction, with a tighter wheel threshold. `repair-topology.mjs` removes duplicate/degenerate triangles and fixes unambiguously reversed faces without moving vertices. Attribution survives the conversion.

Rebuild the four transparent posters from the current renderer at 1280×640 / reduced motion / restore pose, then encode WebP; keep temporary capture pages outside the commit. Runtime model/poster revision: 17. Model downloads now follow explicit selection; no hover or other-car warmup. See `ASSETS-V17.md` for sizes and loading semantics.

Additional regressions: `node --test atlas/model-download.test.mjs tools/atlas-3d/repair-topology.test.mjs` from the repository root.

## v18 BMW cabin repair

`node repair-bmw-cabin.mjs V17_CROSSOVER.glb OUTPUT.glb` adds missing door returns/backing, a closed floor beneath the cabin and two seat plinths. Use the deployed v17 BMW from commit `e300c685c20652990a3cb25cb681d3d2e7e4c6f6` as input. The tool rejects double application. Other vehicles do not pass through this tool.

The two door liners follow the actual painted-skin perimeter, stop below the glazing and belong to their respective hinges. The floor stops before the wheel wells; floor/seat bases have both bottom and side faces. Newly added geometry has creased normals. Existing exterior/interior geometry and textures are retained, with the same Draco settings and attribution. No extra runtime repair or texture download is needed. BMW gzip grows from 556,243 to 560,194 bytes (+0.71%). Its URL revision is 18; the other three model URLs and persistent v17 cache remain unchanged.

`node --test repair-bmw-cabin.test.mjs` verifies closed shells, rim-to-skin alignment, hinge ownership, glazing/wheel-well clearance and under-seat ray coverage on the decoded deployed asset.
