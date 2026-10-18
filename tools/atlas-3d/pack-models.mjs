import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import {dequantize,draco,prune,dedup} from '@gltf-transform/functions';
import {MeshoptDecoder} from 'meshoptimizer';
import draco3d from 'draco3dgltf';
import fs from 'node:fs/promises';
import path from 'node:path';
import {gzipSync} from 'node:zlib';
const [input,output]=process.argv.slice(2);
if(!input||!output||path.resolve(input)===path.resolve(output))throw new Error('Usage: node pack-models.mjs MESHOPT_BASELINE_DIRECTORY OUTPUT_DIRECTORY');
await Promise.all([MeshoptDecoder.ready,fs.mkdir(output,{recursive:true})]);
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.decoder':MeshoptDecoder,'draco3d.encoder':await draco3d.createEncoderModule()});
for(const key of ['coupe','sedan','crossover','suv']){
 const d=await io.read(path.join(input,`${key}.glb`));
 for(const extension of d.getRoot().listExtensionsUsed())if(extension.extensionName==='EXT_meshopt_compression')extension.dispose();
 // Transport conversion only: no simplify, resize or material changes.
 // 14-bit positions and 10-bit normals retain the precision of the approved
 // quantized source while decoding in DRACOLoader's Web Workers.
 await d.transform(dequantize(),prune(),dedup(),draco({method:'edgebreaker',encodeSpeed:0,decodeSpeed:5,quantizePosition:14,quantizeNormal:10,quantizeTexcoord:14,quantizeGeneric:16}));
 const binary=await io.writeBinary(d),packed=gzipSync(binary,{level:9});
 await fs.writeFile(path.join(output,`${key}.glb`),binary);await fs.writeFile(path.join(output,`${key}.glb.gz`),packed);
 console.log(key,{glb:binary.length,gzip:packed.length});
}
