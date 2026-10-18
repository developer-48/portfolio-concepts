# ATLAS v16 — immediate previews and compact 3D transport

Vehicle sources, authors and CC BY 4.0 attribution are unchanged; see [ASSETS-V12](ASSETS-V12.md). Geometry is repacked from the approved v15 models (commit `40f457f6746f77d3ac7e4e8291cef2487d1f22a6`). This step does not run simplification, change materials, resize textures or alter the door rigs. Draco can omit degenerate triangles during encoding.

All four transparent posters remain the actual v15 renderer captures and retain `?v=15`. They are eagerly loaded/decoded and switched synchronously. The canvas and interaction controls stay unavailable until the selected model has been decoded, compiled and rendered once. No previous car is displayed while the next one loads.

## Transfer sizes

| Model | v15 gzip bytes | v16 gzip bytes | Reduction |
|---|---:|---:|---:|
| Porsche | 1,306,400 | 1,115,066 | 14.6% |
| S65 | 725,079 | 590,540 | 18.6% |
| BMW | 1,362,828 | 1,028,539 | 24.5% |
| GLS | 1,041,605 | 798,076 | 23.4% |

Model transport totals: 4,435,912 → 3,532,221 bytes (20.4% smaller). This excludes the reusable decoder and renderer. The uncompressed WASM decoder is 192,420 bytes, plus a 58,456-byte wrapper; GitHub Pages also applies HTTP compression. A JS fallback ships for browsers without WASM. Decoder files are downloaded once and reused; native browser HTTP caching still applies.

Draco decoding runs through two Web Workers. Format: `KHR_draco_mesh_compression`, edgebreaker, 14-bit positions / 10-bit normals, no geometric simplification. Tool: `tools/atlas-3d/pack-models.mjs`. All eight model output files reproduce byte-for-byte from the v15 baseline.

Completed compressed downloads persist in Cache Storage (`atlas-models-v16`); denied/quota-limited storage falls back to normal fetching. In-page requests share a four-model byte cache and in-flight promises. A → B → A does not restart A. Remaining models warm sequentially after the selected model is ready, with low fetch priority; Save-Data, 2G and hidden pages suppress speculative work. Explicit selection remains available.

Dependencies: Three.js 0.180.0 [DRACOLoader](https://github.com/mrdoob/three.js/blob/r180/examples/jsm/loaders/DRACOLoader.js), Google Draco 1.5.7 (Apache 2.0, local `shared/three/draco/LICENSE`), [glTF Transform Draco packing](https://gltf-transform.dev/modules/functions/functions/draco). No external runtime CDN is used.
