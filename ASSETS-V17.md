# ATLAS v17 — selected-car loading and corrected surfaces

Source models, authors and CC BY 4.0 attribution remain as documented in [ASSETS-V12](ASSETS-V12.md). No new third-party models or runtime libraries were introduced.

## Geometry and appearance

The repeatable input is the four v15 GLBs at commit `40f457f6746f77d3ac7e4e8291cef2487d1f22a6`. `tools/atlas-3d/compact-models.mjs INPUT OUTPUT` rebuilds all four runtime assets. Inputs and outputs must be separate directories.

- Paint geometry is excluded from simplification. For non-Porsche paint/glazing, duplicate and zero-area faces are removed; winding is corrected only when all three vertex normals oppose the face. Positions are retained.
- Small details and interiors use meshoptimizer's attribute-aware simplifier with normal/UV weights and permissive seam handling. Wheels use a tighter error threshold. Glass, lenses and tyres are excluded from simplification.
- Local textures use WebP up to 512px, quality 78. Draco uses 14-bit position, 12-bit normal and 12-bit UV precision. This is a lossy web-oriented derivative, not an unchanged source model.
- Non-Porsche paint has a softer clear coat; wheels have less aggressive metallic highlights. Glass uses opaque tinted surfaces to avoid overlapping transparent panes revealing incorrectly sorted geometry. Double-sided glazing retains visibility from both directions. BMW mirror material is neutral rather than red. Porsche paint/glass lighting is retained.
- All four transparent posters are recaptured from the final live renderer; poster and model revisions are both 17.

| Vehicle | v16 gzip | v17 gzip | Reduction | v17 triangles before final Draco packing |
|---|---:|---:|---:|---:|
| Porsche | 1,115,066 | 699,113 | 37.3% | 104,577 |
| S65 | 590,540 | 362,411 | 38.6% | 66,560 |
| X6 | 1,028,539 | 556,243 | 45.9% | 78,456 |
| GLS | 798,076 | 462,320 | 42.1% | 73,924 |

Total model transfer: 3,532,221 → 2,080,087 bytes (41.1% smaller). Decoder/renderer and page imagery are separate. Draco may discard degenerate triangles.

## Loading

Only the selected model downloads. Hover downloads and automatic background downloads of the other three cars were removed after the user's Chrome resource timings showed concurrent full-car transfers (X6 18.676s, S65 20.219s). Those observations are not a controlled before/after benchmark.

A new selection aborts the obsolete network transfer. Received bytes stay in memory. Returning to that car sends `Range` and `If-Range` when an ETag and byte-range support were supplied; a server returning a full 200 response replaces the partial bytes safely. GitHub Pages was verified to return 206 with an ETag and `Accept-Ranges: bytes` for a model. Completed downloads remain in the page cache and persistent Cache Storage (`atlas-models-v17`). HTTP errors, truncated/misaligned bodies and 15 seconds without network progress do not leave an endless loading indicator: the static image remains and a retry control becomes available.

Related implementation references: [meshoptimizer simplifier](https://github.com/zeux/meshoptimizer/blob/master/js/README.md#simplifier), [glTF Transform simplification](https://gltf-transform.dev/modules/functions/functions/simplify).
