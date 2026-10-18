import {build} from 'esbuild';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../../',import.meta.url));
await build({absWorkingDir:root,entryPoints:['atlas/vehicle-renderer.js'],bundle:true,minify:true,format:'esm',target:'es2020',external:['./model-data.js?v=19'],outfile:'atlas/vehicle-scene.min.js'});
