import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import {dequantize,transformPrimitive,joinPrimitives,compactPrimitive,prune,dedup,meshopt,textureCompress} from '@gltf-transform/functions';
import {MeshoptDecoder,MeshoptEncoder} from 'meshoptimizer';
import {Vector3,Matrix4,Box3} from 'three';import sharp from 'sharp';
await Promise.all([MeshoptDecoder.ready,MeshoptEncoder.ready]);
const [,,input,output,key]=process.argv;
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.decoder':MeshoptDecoder,'meshopt.encoder':MeshoptEncoder});
const d=await io.read(input);await d.transform(dequantize());const root=d.getRoot(),old=root.listNodes().filter(n=>n.getMesh()),box=new Box3();
for(const n of old){const m=new Matrix4().fromArray(n.getWorldMatrix());for(const p of n.getMesh().listPrimitives()){const a=p.getAttribute('POSITION');for(let i=0;i<a.getCount();i++)box.expandByPoint(new Vector3().fromArray(a.getElement(i,[])).applyMatrix4(m));}}
const size=box.getSize(new Vector3()),center=box.getCenter(new Vector3()),scale=4.65/size.z;
const norm=new Matrix4().makeScale(scale,scale,scale).multiply(new Matrix4().makeTranslation(-center.x,-box.min.y,-center.z));
const groups=new Map(),buf=root.listBuffers()[0],doorBounds={left:new Box3(),right:new Box3()};
function surface(name,mat){if(/paint_2$/i.test(mat))return 'trim';if(/glass|window/i.test(mat)&&/headlight|taillight|brakelight|tail_light|foglight/i.test(name))return 'lens';if(/glass|window|mirror/i.test(mat)&&/mirror/i.test(name))return 'mirror';if(/paint|marina_bay_blue|^body$/i.test(mat))return 'paint';if(/glass|window/i.test(mat)&&!/red_glass/i.test(mat))return 'glass';if(/wheel|rim|brake|calliper|tires|caliper|disc/i.test(name+' '+mat))return 'wheels';if(/interior|leather|seat|dashboard|torped|alcantara/i.test(name+' '+mat))return 'interior';return 'detail';}
function put(p,rig,type){const k=[rig,type,p.getMaterial()?.getName(),p.listSemantics().sort().join('/')].join('|');if(!groups.has(k))groups.set(k,{rig,type,ps:[]});groups.get(k).ps.push(p);if(rig!=='body'){const a=p.getAttribute('POSITION');for(let i=0;i<a.getCount();i++)doorBounds[rig].expandByPoint(new Vector3().fromArray(a.getElement(i,[])));}}
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
  const type=surface(name,p.getMaterial()?.getName()||'');let named='body';
  if(key==='sedan'||key==='suv'||key==='coupe'){
   if(key==='coupe'){if(/door[^ ]*_L(?:_|$)|mirror_L_/i.test(name))named='left';if(/door[^ ]*_R(?:_|$)|mirror_R_/i.test(name))named='right';}
   if(/(door|doorpanel|glass|window)[^ ]*_FL|mirror_L_/i.test(name))named='left';
   if(/(door|doorpanel|glass|window)[^ ]*_FR|mirror_R_/i.test(name))named='right';
   put(p,named,type);continue;
  }
  if(type==='wheels'){put(p,'body',type);continue;}
  const classified={body:[],left:[],right:[]};
  for(const c of components(p)){const b=c.box,sg=b.min.x>.58?'left':b.max.x<-.58?'right':'body';let isDoor=false;
   if(key==='coupe')isDoor=sg!=='body'&&b.min.z>-.73&&b.max.z<.83&&b.min.y>.2&&b.max.y<1.31;
   if(key==='crossover')isDoor=sg!=='body'&&b.min.z>-.28&&b.max.z<.94&&b.min.y>.25&&b.max.y<1.65;
   classified[isDoor?sg:'body'].push(...c.indices);
  }
  for(const [rig,indices] of Object.entries(classified)){if(!indices.length)continue;const q=p.clone().setIndices(d.createAccessor().setBuffer(buf).setType('SCALAR').setArray(new Uint32Array(indices)));compactPrimitive(q);put(q,rig,type);}
 }
}
for(const s of root.listScenes())s.dispose();const scene=d.createScene('ATLAS vehicle');const rigNodes={body:d.createNode('Body'),left:d.createNode('DoorLeft'),right:d.createNode('DoorRight')};
for(const [rig,node] of Object.entries(rigNodes)){scene.addChild(node);if(rig!=='body'&&!doorBounds[rig].isEmpty()){const b=doorBounds[rig];const x=(rig==='left'?1:-1)*(key==='coupe'?.73:.78);const z=key==='coupe'?.72:key==='crossover'?.78:b.max.z-.07;node.setTranslation([x,.7,z]);}}
for(const {rig,type,ps} of groups.values()){const p=ps.length>1?joinPrimitives(ps):ps[0];if(rig!=='body'){const pos=rigNodes[rig].getTranslation();transformPrimitive(p,new Matrix4().makeTranslation(-pos[0],-pos[1],-pos[2]).toArray());}const mesh=d.createMesh(type).addPrimitive(p);rigNodes[rig].addChild(d.createNode(type).setMesh(mesh).setExtras({surface:type}));}
// Source nodes are detached; only the normalized rig belongs to the output scene.
for(const n of root.listNodes())if(![...Object.values(rigNodes)].includes(n)&&!n.getParentNode()&&!scene.listChildren().includes(n))n.dispose();
await d.transform(prune(),dedup(),textureCompress({encoder:sharp,targetFormat:'webp',resize:[1024,1024],quality:88}),meshopt({encoder:MeshoptEncoder,level:'medium',quantizePosition:16,quantizeNormal:16}));
await io.write(output,d);console.log(key,'scale',scale,'size',size.toArray().map(x=>x*scale),'draws',groups.size,'doors',Object.fromEntries(Object.entries(doorBounds).map(([k,b])=>[k,[b.min.toArray(),b.max.toArray()]])));
