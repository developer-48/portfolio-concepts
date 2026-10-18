import {repairSurfaceIndices} from './repair-topology.mjs';
import{NodeIO}from'@gltf-transform/core';import{ALL_EXTENSIONS}from'@gltf-transform/extensions';import{dequantize,weld,prune,dedup,draco,compactPrimitive,textureCompress}from'@gltf-transform/functions';import{MeshoptDecoder,MeshoptSimplifier}from'meshoptimizer';import draco3d from'draco3dgltf';import sharp from'sharp';import fs from'node:fs/promises';import path from'node:path';import{gzipSync}from'node:zlib';
await Promise.all([MeshoptDecoder.ready,MeshoptSimplifier.ready]);const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.decoder':MeshoptDecoder,'draco3d.decoder':await draco3d.createDecoderModule(),'draco3d.encoder':await draco3d.createEncoderModule()});
const [input,target]=process.argv.slice(2);if(!input||!target||path.resolve(input)===path.resolve(target))throw new Error('Use separate input and output directories');await fs.mkdir(target,{recursive:true});
for(const key of ['coupe','sedan','crossover','suv']){
 const source=`${input}/${key}.glb`;
 const d=await io.read(source);
 for(const ext of d.getRoot().listExtensionsUsed())if(ext.extensionName==='EXT_meshopt_compression')ext.dispose();
 await d.transform(dequantize());
 let before=0,after=0;
 for(const node of d.getRoot().listNodes())if(node.getMesh())for(const p of node.getMesh().listPrimitives()){
  const surface=node.getExtras().surface;
  if(key!=='coupe'&&['paint','glass','roof-glass'].includes(surface)){const repaired=repairSurfaceIndices(p.getAttribute('POSITION').getArray(),p.getAttribute('NORMAL').getArray(),p.getIndices().getArray());p.setIndices(p.getIndices().clone().setArray(repaired.indices));}
  if(surface==='paint')for(const s of p.listSemantics())if(!['POSITION','NORMAL'].includes(s))p.setAttribute(s,null);
 }
 
 await d.transform(weld());
 for(const node of d.getRoot().listNodes())if(node.getMesh())for(const p of node.getMesh().listPrimitives()){
  const surface=node.getExtras().surface;before+=p.getIndices().getCount()/3;
  const delicate=['glass','roof-glass','lens','rear-lens'].includes(surface)||/tires|tyres/i.test(p.getMaterial()?.getName());
  if(surface!=='paint'&&!delicate){
   // Attribute-aware simplification can cross redundant UV/normal splits while
   // still accounting for shading and texture error. Paint and glass are excluded.
   const pos=p.getAttribute('POSITION'),norm=p.getAttribute('NORMAL'),uv=p.getAttribute('TEXCOORD_0'),stride=(norm?3:0)+(uv?2:0);
   const attrs=new Float32Array(pos.getCount()*stride);
   for(let i=0;i<pos.getCount();i++){if(norm)attrs.set(norm.getElement(i,[]),i*stride);if(uv)attrs.set(uv.getElement(i,[]),i*stride+(norm?3:0));}
   const weights=[...(norm?[.15,.15,.15]:[]),...(uv?[.2,.2]:[])];
   const [indices]=MeshoptSimplifier.simplifyWithAttributes(new Uint32Array(p.getIndices().getArray()),new Float32Array(pos.getArray()),3,attrs,stride,weights,null,Math.floor(p.getIndices().getCount()*(surface==='wheels'?.5:.2)/3)*3,surface==='wheels'?.001:.004,['Permissive']);
   p.setIndices(p.getIndices().clone().setArray(indices));compactPrimitive(p);
  }
  after+=p.getIndices().getCount()/3;
 }
 await d.transform(weld(),prune(),dedup(),textureCompress({encoder:sharp,targetFormat:'webp',resize:[512,512],quality:78}),draco({method:'edgebreaker',encodeSpeed:0,decodeSpeed:5,quantizePosition:14,quantizeNormal:12,quantizeTexcoord:12}));
 const b=await io.writeBinary(d),gz=gzipSync(b,{level:9});await fs.writeFile(target+'/'+key+'.glb',b);await fs.writeFile(target+'/'+key+'.glb.gz',gz);console.log(key,{before,after,bytes:b.length,gzip:gz.length});
}
