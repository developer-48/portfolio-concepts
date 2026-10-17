# ATLAS asset tools

Node 20.9+. Run `npm install` in this directory, then `npm run build` after changing `atlas/vehicle-renderer.js`. The generated ES module is committed for buildless GitHub Pages deployment. Three.js, GLTFLoader and meshopt remain local; the lightweight model transport is external so downloading can start before the renderer.

## Geometry

`node optimize.mjs INPUT_DIRECTORY OUTPUT_DIRECTORY`

Inputs are the four normalized, rigged v12 GLBs from commit `3fb11a0` (`assets/atlas-3d/{coupe,sedan,crossover,suv}.glb`), not previously simplified output. Preserve this baseline outside the published directory when rebuilding. Paint geometry and original normals are preserved; small details are simplified to ratio 0.35 with 0.001 error limit. Textures are WebP up to 768 px. Meshopt uses 14-bit positions / 12-bit normals. Each GLB also gets a gzip transport file; browsers without DecompressionStream request the raw GLB.

The four transparent 1280×640 WebP posters are captures of the actual renderer with the default `restore` pose, reduced motion, no UI and the same environment. If lighting, materials or the default camera change, regenerate all posters. Keep vertical field of view and image height aligned with the live canvas. QA screenshots and rendering helpers do not belong in the deployment.

Original models / authors / CC BY 4.0 attribution: ../../ASSETS-V12.md and ../../atlas/model-credits.html.
