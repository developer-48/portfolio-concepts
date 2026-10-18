# ATLAS v19 — original-source S65, X6 and GLS rebuild

The three non-Porsche vehicles are rebuilt directly from the original licensed downloads listed in [ASSETS-V12.md](ASSETS-V12.md). Authors, source links and CC BY 4.0 attribution remain embedded in the GLBs and on the credits page. No new third-party models or runtime libraries are introduced.

| Original input | SHA-256 |
|---|---|
| mercedes-benz-mersedes-s65.glb | 8504134c55eacbdaee7eef34929c8861d1674516076c483817116eb4929114c6 |
| bmw-x6m-competition.glb | 4f12388398bcaf0b47f9e8da07aca756ca6d7572af363a4b70932be519ee28af |
| mercedes-benz-mersedes-gls.glb | d6ec59e2a22cad21b6836ebdeb5fa4d36c3457a83c898add8b254945a25e10b6 |

## Geometry and materials

`tools/atlas-3d/rebuild-source.mjs INPUT OUTPUT VEHICLE` normalizes and rigs the original source, preserves separate source paint panels during normal reconstruction, separates connected transparent panes for sorting and performs one conservative attribute-aware reduction of interior/details. Body panels, windows, lamp lenses, tyres and seals bypass simplification. No already simplified derivative is used as input. The BMW closed door returns, floor and seat foundations are added before compression. Normal filtering changes reflection directions, not vertex positions or panel seams.

The original GLS batches its rear, quarter and roof panes into `gls_sunroof_gls_carbonn.005_0`; this verified object is assigned glass before batching. Adjacent chrome frames remain opaque. Tailgate lamp lenses retain their red optical material instead of becoming dark windows. All three vehicles use separate transparent glazing, clear headlight lenses, red rear lenses/reflectors, matte rubber/leather and clear-coated paint. Source textures remain embedded WebP, up to 1024 px at quality 86. Draco uses 15-bit positions and 12-bit normals/UVs.

The source geometry still determines the cars' available detail; this is a repaired web derivative, not a newly authored photorealistic CAD asset.

| Vehicle | GLB bytes | gzip transfer bytes | Final triangles | WebP preview bytes |
|---|---:|---:|---:|---:|
| Porsche, unchanged | 818020 | 699113 | 104577 | 35900 |
| S65 | 1103100 | 950333 | 222953 | 36116 |
| X6 M | 1402700 | 1317576 | 177061 | 36208 |
| GLS | 1305400 | 1182215 | 239592 | 37470 |

The restored interiors and details make these assets larger than v17/v18. Transfer remains bounded at about 0.95–1.32 MB per selected vehicle. Immediate previews, selected-only downloads, cancellation/resume, two decoder workers, persistent caching, on-demand rendering and mobile pixel budgets are retained. No concurrent warm-up of other cars is added.

Only S65, X6 and GLS model/preview URLs change to revision 19. Porsche remains revision 17; `atlas-models-v17` is retained so its cached data stays usable. All three previews are captured from the final renderer at 1280×640 with transparent backgrounds and restore poses.

## Porsche protection

Porsche GLB, gzip and poster hashes are unchanged and asserted in `atlas/vehicle-assets.test.cjs`. The previous Porsche material branch, scene lighting, effects and camera path are retained. A same-browser 1280×640 comparison against the previous compiled renderer produced zero changed pixel channels.
