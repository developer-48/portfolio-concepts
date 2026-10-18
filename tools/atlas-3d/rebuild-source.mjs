import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import {dequantize,transformPrimitive,joinPrimitives,compactPrimitive,prune,dedup,textureCompress,draco,weld} from '@gltf-transform/functions';
import {MeshoptDecoder,MeshoptSimplifier} from 'meshoptimizer';
import draco3d from 'draco3dgltf';
import fs from 'node:fs/promises';
import {gzipSync} from 'node:zlib';
import {smoothPartNormals} from './part-normals.mjs';
import {repairPaintNormals} from './surface-normals.mjs';
import {repairSurfaceIndices} from './repair-topology.mjs';
import {addBMWCabin} from './repair-bmw-cabin.mjs';
import {classifySurface} from './source-surfaces.mjs';
import {Vector3,Matrix4,Box3} from 'three';import sharp from 'sharp';
await Promise.all([MeshoptDecoder.ready,MeshoptSimplifier.ready]);
const [,,input,output,key]=process.argv;
if(!['sedan','crossover','suv'].includes(key))throw new Error('Only sedan, crossover and SUV may be rebuilt; Porsche is protected');
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.decoder':MeshoptDecoder,'draco3d.decoder':await draco3d.createDecoderModule(),'draco3d.encoder':await draco3d.createEncoderModule()});
const d=await io.read(input);await d.transform(dequantize());const root=d.getRoot(),old=root.listNodes().filter(n=>n.getMesh()),box=new Box3();
for(const n of old){const m=new Matrix4().fromArray(n.getWorldMatrix());for(const p of n.getMesh().listPrimitives()){const a=p.getAttribute('POSITION');for(let i=0;i<a.getCount();i++)box.expandByPoint(new Vector3().fromArray(a.getElement(i,[])).applyMatrix4(m));}}
const size=box.getSize(new Vector3()),center=box.getCenter(new Vector3()),scale=4.65/size.z;
const norm=new Matrix4().makeScale(scale,scale,scale).multiply(new Matrix4().makeTranslation(-center.x,-box.min.y,-center.z));
const groups=new Map(),buf=root.listBuffers()[0],doorBounds={left:new Box3(),right:new Box3()};

function put(p,rig,type,piece=""){const k=[rig,type,piece,p.getMaterial()?.getName(),p.listSemantics().sort().join('/')].join('|');if(!groups.has(k))groups.set(k,{rig,type,ps:[]});groups.get(k).ps.push(p);if(rig!=='body'){const a=p.getAttribute('POSITION');for(let i=0;i<a.getCount();i++)doorBounds[rig].expandByPoint(new Vector3().fromArray(a.getElement(i,[])));}}
function components(p){const a=p.getAttribute('POSITION'),idx=p.getIndices().getArray(),map=new Map(),parents=[],keys=[];
 for(let i=0;i<a.getCount();i++){const k=a.getElement(i,[]).map(v=>Math.round(v*10000)).join(',');if(!map.has(k)){map.set(k,parents.length);parents.push(parents.length);}keys.push(map.get(k));}
 function find(x){while(parents[x]!==x){parents[x]=parents[parents[x]];x=parents[x];}return x;}
 for(let i=0;i<idx.length;i+=3){parents[find(keys[idx[i]])]=find(keys[idx[i+1]]);parents[find(keys[idx[i]])]=find(keys[idx[i+2]]);}
 const c=new Map();for(let i=0;i<idx.length;i+=3){const id=find(keys[idx[i]]);if(!c.has(id))c.set(id,{indices:[],box:new Box3()});const g=c.get(id);for(let j=0;j<3;j++){g.indices.push(idx[i+j]);g.box.expandByPoint(new Vector3().fromArray(a.getElement(idx[i+j],[])));}}
 return [...c.values()];
}
for(const n of old){const name=n.getName();if(/engine|gavril_v8/i.test(name))continue;
 for(const orig of n.getMesh().listPrimitives()){
  if(orig.getMode()!==4)continue;
  const p=orig.clone();for(const s of p.listSemantics())p.setAttribute(s,p.getAttribute(s).clone());p.setIndices(p.getIndices()?.clone());transformPrimitive(p,norm.clone().multiply(new Matrix4().fromArray(n.getWorldMatrix())).toArray());
  const type=classifySurface(name,p.getMaterial()?.getName()||'',key);let named='body';
  if(key==='sedan'||key==='suv'){
   if(/(door|doorpanel|glass|window)[^ ]*_FL|mirror_L_/i.test(name))named='left';
   if(/(door|doorpanel|glass|window)[^ ]*_FR|mirror_R_/i.test(name))named='right';
   if(['glass','roof-glass','lens','rear-lens'].includes(type)){
    let piece=0;for(const c of components(p)){
     const q=p.clone().setIndices(d.createAccessor().setBuffer(buf).setType('SCALAR').setArray(new Uint32Array(c.indices)));compactPrimitive(q);
     const pane=key==='suv' && /^gls_sunroof_/.test(name) && c.box.min.y>1.5?'roof-glass':type;
     put(q,named,pane,name+'-'+piece++);
    }
   }else put(p,named,type,type==='paint'?name:'');continue;
  }
  if(type==='wheels'){put(p,'body',type);continue;}
  // Independent panes sort independently. Keep the panoramic roof and lamp lenses
  // separate from cabin windows instead of merging every transparent triangle.
  if(key==='crossover'&&type==='glass'){
   let piece=0;
   for(const c of components(p)){
    const b=c.box,sg=b.min.x>.58?'left':b.max.x<-.58?'right':'body';
    const rig=sg!=='body'&&b.min.z>-.28&&b.max.z<.94&&b.min.y>.25&&b.max.y<1.65?sg:'body';
    const pane=b.min.y>1.5?'roof-glass':b.max.y<1.16&&b.max.z<-1.7?'rear-lens':b.max.y<1.16&&b.min.z>1.7?'lens':'glass';
    const q=p.clone().setIndices(d.createAccessor().setBuffer(buf).setType('SCALAR').setArray(new Uint32Array(c.indices)));
    compactPrimitive(q);
    // Thin source glazing contains bevel normals that produce a bright zigzag
    // along its shared seam. Shade both panes with the continuous roof curvature.
    if(pane==='roof-glass'){
     const positions=q.getAttribute('POSITION'),normals=new Float32Array(positions.getCount()*3);
     for(let i=0;i<positions.getCount();i++){const [x,,z]=positions.getElement(i,[]);new Vector3(.31*x,1,.18*(z+.2)).normalize().toArray(normals,i*3);}
     q.setAttribute('NORMAL',q.getAttribute('NORMAL').clone().setArray(normals).setNormalized(false));
    }
    put(q,rig,pane,String(piece++));
   }continue;
  }
  const classified={body:[],left:[],right:[]};
  for(const c of components(p)){const b=c.box,sg=b.min.x>.58?'left':b.max.x<-.58?'right':'body';let isDoor=false;
   if(key==='crossover')isDoor=sg!=='body'&&b.min.z>-.28&&b.max.z<.94&&b.min.y>.25&&b.max.y<1.65;
   classified[isDoor?sg:'body'].push(...c.indices);
  }
  for(const [rig,indices] of Object.entries(classified)){if(!indices.length)continue;const q=p.clone().setIndices(d.createAccessor().setBuffer(buf).setType('SCALAR').setArray(new Uint32Array(indices)));compactPrimitive(q);put(q,rig,type);}
 }
}
for(const s of root.listScenes())s.dispose();const scene=d.createScene('ATLAS vehicle');const rigNodes={body:d.createNode('Body'),left:d.createNode('DoorLeft'),right:d.createNode('DoorRight')};
for(const [rig,node] of Object.entries(rigNodes)){scene.addChild(node);if(rig!=='body'&&!doorBounds[rig].isEmpty()){const b=doorBounds[rig];const x=(rig==='left'?1:-1)*.78;const z=key==='crossover'?.78:b.max.z-.07;node.setTranslation([x,.7,z]);}}
for(const {rig,type,ps} of groups.values()){const p=ps.length>1?joinPrimitives(ps):ps[0];if(rig!=='body'){const pos=rigNodes[rig].getTranslation();transformPrimitive(p,new Matrix4().makeTranslation(-pos[0],-pos[1],-pos[2]).toArray());}const mesh=d.createMesh(type).addPrimitive(p);rigNodes[rig].addChild(d.createNode(type).setMesh(mesh).setExtras({surface:type}));}
// Source nodes are detached; only the normalized rig belongs to the output scene.
for(const n of root.listNodes())if(![...Object.values(rigNodes)].includes(n)&&!n.getParentNode()&&!scene.listChildren().includes(n))n.dispose();
if(key==='crossover')for(const material of root.listMaterials())if(/tires/i.test(material.getName()))material.setAlphaMode('OPAQUE').setBaseColorFactor([...material.getBaseColorFactor().slice(0,3),1]);
const previous=await io.read(new URL(`../../assets/atlas-3d/${key}.glb`,import.meta.url).pathname);
root.getAsset().extras={...previous.getRoot().getAsset().extras,preparation:'source-rebuild-v19'};
for(const ext of root.listExtensionsUsed())if(ext.extensionName==='EXT_meshopt_compression')ext.dispose();
await d.transform(prune(),dedup(),weld());
// No spatial smoothing across separate panels, and no repeated simplification.
await repairPaintNormals(d);
for(const n of root.listNodes())if(n.getMesh())for(const p of n.getMesh().listPrimitives()){
 if(['paint','glass','roof-glass','lens','rear-lens'].includes(n.getExtras().surface)){
  const a=p.getAttribute('NORMAL');p.setAttribute('NORMAL',a.clone().setArray(smoothPartNormals(p.getAttribute('POSITION').getArray(),a.getArray(),p.getIndices().getArray(),{radius:n.getExtras().surface==='paint'?.35:.12,passes:4,minimumDot:n.getExtras().surface==='paint'?.7:.85})));
  const repaired=repairSurfaceIndices(p.getAttribute('POSITION').getArray(),p.getAttribute('NORMAL').getArray(),p.getIndices().getArray());
  p.setIndices(p.getIndices().clone().setArray(repaired.indices));
 }
}
// A single conservative pass on the fresh source, with a strict geometric
// error limit. Panels, panes, lamp optics, tyres and seals keep every triangle.
for(const n of root.listNodes())if(n.getMesh())for(const p of n.getMesh().listPrimitives()){
 const surface=n.getExtras().surface,material=p.getMaterial()?.getName()||'';
 if(['paint','glass','roof-glass','lens','rear-lens','rear-reflector','trim'].includes(surface)||/tires|Scene_-_Root|black_ext/i.test(material))continue;
 const pos=p.getAttribute('POSITION'),normal=p.getAttribute('NORMAL'),uv=p.getAttribute('TEXCOORD_0');
 const stride=(normal?3:0)+(uv?2:0),attributes=new Float32Array(pos.getCount()*stride);
 for(let i=0;i<pos.getCount();i++){if(normal)attributes.set(normal.getElement(i,[]),i*stride);if(uv)attributes.set(uv.getElement(i,[]),i*stride+(normal?3:0));}
 const weights=[...(normal?[.5,.5,.5]:[]),...(uv?[1,1]:[])];
 const ratio=surface==='interior'?.8:.65;
 const [indices]=MeshoptSimplifier.simplifyWithAttributes(new Uint32Array(p.getIndices().getArray()),new Float32Array(pos.getArray()),3,attributes,stride,weights,null,Math.floor(p.getIndices().getCount()*ratio/3)*3,.00035,['Permissive']);
 p.setIndices(p.getIndices().clone().setArray(indices));compactPrimitive(p);
}
if(key==='crossover')addBMWCabin(d);
await d.transform(prune(),dedup(),textureCompress({encoder:sharp,targetFormat:'webp',resize:[1024,1024],quality:86}),draco({method:'edgebreaker',encodeSpeed:0,decodeSpeed:5,quantizePosition:15,quantizeNormal:12,quantizeTexcoord:12}));
const binary=await io.writeBinary(d);await fs.writeFile(output,binary);await fs.writeFile(output+'.gz',gzipSync(binary,{level:9}));
console.log(key,{bytes:binary.length,gzip:gzipSync(binary,{level:9}).length,draws:groups.size,triangles:root.listMeshes().flatMap(m=>m.listPrimitives()).reduce((sum,p)=>sum+p.getIndices().getCount()/3,0)});
