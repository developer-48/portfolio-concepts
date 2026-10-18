# ATLAS v15 — 2026-10-18

Sources, authors and CC BY 4.0 licensing are unchanged; see [ASSETS-V12](ASSETS-V12.md). Embedded attribution is retained. No replacement models or external runtime dependencies were added.

- S65 and X6: offline spatial filtering of reflection normals after angle-weighted reconstruction, preserving body positions and topology.
- BMW: each glazing component is separate; front lenses, rear red lenses, two roof panes and cabin windows have their own surface policies. The panoramic seam uses continuous curvature normals instead of the source bevel normals. Roof glass is represented by dark reflective opaque glazing to avoid interior sorting artifacts.
- BMW tyres: alpha mode OPAQUE in the GLB and depthWrite=true at runtime. The old BLEND setting left depth writes disabled even after runtime transparency was removed, causing body panels to cover tyres from some angles.
- Glazing and BMW wheels/seals retain their geometry during optimisation. Runtime animation state, pricing, studio lighting and Porsche materials are unchanged.
- Updated transparent WebP posters for S65 and X6, captured from the actual final scene. Porsche/GLS GLB, gzip and posters remain byte-identical to v14.

| Model | GLB bytes | gzip bytes | Triangles |
|---|---:|---:|---:|
| coupe | 1741472 | 1306400 | 182014 |
| sedan | 1098664 | 725079 | 147669 |
| crossover | 1785568 | 1362828 | 171286 |
| suv | 1478888 | 1041605 | 173435 |

Normal filtering happens offline; the renderer retains on-demand rendering and its existing pixel budget. The BMW geometry/download increase stays within the existing 190k triangle / 1.75 MiB GLB / 1.3 MiB gzip limits.
