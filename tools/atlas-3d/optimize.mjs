import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import {dequantize,simplifyPrimitive,weld,prune,dedup,meshopt,textureCompress} from '@gltf-transform/functions';
import {MeshoptDecoder,MeshoptEncoder,MeshoptSimplifier} from 'meshoptimizer';
import sharp from 'sharp';
import {repairPaintNormals} from './surface-normals.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';
import {gzipSync} from 'node:zlib';
const [input,output]=process.argv.slice(2);
if(!input||!output)throw new Error('Usage: node optimize.mjs INPUT_DIRECTORY OUTPUT_DIRECTORY');
await fs.mkdir(output,{recursive:true});
await Promise.all([MeshoptDecoder.ready,MeshoptEncoder.ready,MeshoptSimplifier.ready]);
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.decoder':MeshoptDecoder,'meshopt.encoder':MeshoptEncoder});
for(const key of ['sedan','crossover','suv']){
 const d=await io.read(path.join(input,`${key}.glb`));
 await d.transform(dequantize(),weld());
 await repairPaintNormals(d);
 // Runtime car paint is procedural and uses only position + normal.
 for(const n of d.getRoot().listNodes())if(n.getMesh()&&n.getExtras().surface==='paint')for(const p of n.getMesh().listPrimitives())for(const semantic of p.listSemantics())if(!['POSITION','NORMAL'].includes(semantic))p.setAttribute(semantic,null);
 await d.transform(weld());
 let before=0,after=0;
 for(const n of d.getRoot().listNodes())if(n.getMesh())for(const p of n.getMesh().listPrimitives()){
  before+=p.getIndices().getCount()/3;
  const paint=n.getExtras().surface==='paint';
  if(!paint)simplifyPrimitive(p,{simplifier:MeshoptSimplifier,ratio:.35,error:.001,lockBorder:false});
  after+=p.getIndices().getCount()/3;
 }
 await d.transform(weld(),prune(),dedup(),textureCompress({encoder:sharp,targetFormat:'webp',resize:[768,768],quality:85}),meshopt({encoder:MeshoptEncoder,level:'high',quantizePosition:14,quantizeNormal:12}));
 const prior=await io.read(path.join(output,`${key}.glb`));
 d.getRoot().getAsset().extras=prior.getRoot().getAsset().extras;
 await io.write(path.join(output,`${key}.glb`),d);
 await fs.writeFile(path.join(output,`${key}.glb.gz`),gzipSync(await fs.readFile(path.join(output,`${key}.glb`)),{level:9,mtime:0}));
 console.log(key,{before,after,bytes:(await fs.stat(path.join(output,`${key}.glb`))).size});
}
