import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import {dequantize, draco, prune, dedup} from '@gltf-transform/functions';
import {BufferGeometry, Float32BufferAttribute, Matrix4, Vector2, Vector3, ShapeUtils} from 'three';
import {toCreasedNormals} from 'three/addons/utils/BufferGeometryUtils.js';
import draco3d from 'draco3dgltf';
import fs from 'node:fs/promises';
import {gzipSync} from 'node:zlib';
import {pathToFileURL} from 'node:url';

// Weld positions only for boundary detection; leave the accepted exterior's
// vertices, normals, UV seams and topology untouched.
export function outerDoorBoundary(positions, indices) {
  const ids=[], points=[], lookup=new Map(), edges=new Map();
  for(let i=0;i<positions.length;i+=3){
    const p=Array.from(positions.slice(i,i+3)),key=p.map(v=>Math.round(v*100000)).join(',');
    if(!lookup.has(key)){lookup.set(key,points.length);points.push(p);}
    ids.push(lookup.get(key));
  }
  for(let i=0;i<indices.length;i+=3)for(let j=0;j<3;j++){
    const a=ids[indices[i+j]],b=ids[indices[i+(j+1)%3]];
    if(a===b)continue;
    const key=[a,b].sort((a,b)=>a-b).join(',');
    if(!edges.has(key))edges.set(key,{a,b,count:0});
    edges.get(key).count++;
  }
  const pending=new Set([...edges.values()].filter(e=>e.count===1)),loops=[];
  while(pending.size){
    const edge=pending.values().next().value;pending.delete(edge);
    const loop=[edge.a,edge.b];
    while(loop.at(-1)!==loop[0]){
      const end=loop.at(-1),next=[...pending].find(e=>e.a===end||e.b===end);
      if(!next)break;
      pending.delete(next);loop.push(next.a===end?next.b:next.a);
    }
    if(loop.at(-1)===loop[0]&&loop.length>10)loops.push(loop.slice(0,-1).map(i=>points[i]));
  }
  const area=loop=>Math.abs(ShapeUtils.area(loop.map(p=>new Vector2(p[2],p[1]))));
  loops.sort((a,b)=>area(b)-area(a));
  if(!loops[0]||area(loops[0])<.5)throw new Error('BMW door perimeter was not found');
  return loops[0];
}

// The return consists of the perimeter walls and a backing behind the original
// upholstery. Its open outer rim is joined to the existing painted door skin.
export function doorLiner(boundary,sign){
  const inner=boundary.map(p=>[sign*.79,p[1],p[2]]),positions=[...boundary.flat(),...inner.flat()],indices=[],n=boundary.length;
  for(let i=0;i<n;i++){const j=(i+1)%n;indices.push(i,j,n+j,i,n+j,n+i);}
  for(const [a,b,c] of ShapeUtils.triangulateShape(inner.map(p=>new Vector2(p[2],p[1])),[]))indices.push(n+a,n+b,n+c);
  return {positions,indices};
}

// A closed, bevelled shell. The upper surface joins the existing carpet and
// seat upholstery; the lower and side faces prevent a view through the car.
export function cabinShell(cx,cz,width,length,bottom,top,bevel=.025){
  const ring=(w,l,y)=>[
    [cx-w/2+bevel,y,cz-l/2],[cx+w/2-bevel,y,cz-l/2],
    [cx+w/2,y,cz-l/2+bevel],[cx+w/2,y,cz+l/2-bevel],
    [cx+w/2-bevel,y,cz+l/2],[cx-w/2+bevel,y,cz+l/2],
    [cx-w/2,y,cz+l/2-bevel],[cx-w/2,y,cz-l/2+bevel]
  ];
  const lower=ring(width-.025,length-.025,bottom),upper=ring(width,length,top),positions=[...lower.flat(),...upper.flat()],indices=[];
  for(let i=0;i<8;i++){const j=(i+1)%8;indices.push(i,j,8+j,i,8+j,8+i);}
  for(const [a,b,c] of ShapeUtils.triangulateShape(upper.map(p=>new Vector2(p[0],p[2])),[])){indices.push(a,c,b,8+a,8+b,8+c);}
  return {positions,indices};
}

export function addBMWCabin(doc){
  const root=doc.getRoot(),buffer=root.listBuffers()[0];
  if(root.listNodes().some(n=>n.getExtras().repair==='bmw-cabin-v18'))throw new Error('Cabin repair is already applied');
  const paint=doc.createMaterial('BMW inner painted door shell').setBaseColorFactor([.03,.055,.085,1]).setMetallicFactor(.28).setRoughnessFactor(.42).setDoubleSided(true);
  const carpet=doc.createMaterial('BMW carpet floor backing').setBaseColorFactor([.022,.025,.028,1]).setMetallicFactor(0).setRoughnessFactor(.94).setDoubleSided(true);
  const base=doc.createMaterial('BMW seat base plastic').setBaseColorFactor([.038,.042,.045,1]).setMetallicFactor(0).setRoughnessFactor(.7).setDoubleSided(true);
  function add(parent,name,data,material,surface){
    const inverse=new Matrix4().fromArray(parent.getWorldMatrix()).invert();
    let geometry=new BufferGeometry();
    geometry.setAttribute('position',new Float32BufferAttribute(data.positions,3));geometry.setIndex(data.indices);
    geometry.applyMatrix4(inverse);geometry=toCreasedNormals(geometry,Math.PI/5);
    const attr=(name,type,array)=>doc.createAccessor(name).setBuffer(buffer).setType(type).setArray(array);
    const primitive=doc.createPrimitive().setAttribute('POSITION',attr(name+' positions','VEC3',geometry.attributes.position.array))
      .setAttribute('NORMAL',attr(name+' normals','VEC3',geometry.attributes.normal.array))
      .setIndices(attr(name+' indices','SCALAR',Uint32Array.from({length:geometry.attributes.position.count},(_,i)=>i))).setMaterial(material);
    parent.addChild(doc.createNode(name).setMesh(doc.createMesh(name).addPrimitive(primitive)).setExtras({surface,repair:'bmw-cabin-v18'}));
  }
  for(const [name,sign] of [['DoorLeft',1],['DoorRight',-1]]){
    const door=root.listNodes().find(n=>n.getName()===name);
    const skin=door.listChildren().find(n=>n.getExtras().surface==='paint'),p=skin.getMesh().listPrimitives()[0],a=p.getAttribute('POSITION'),m=new Matrix4().fromArray(skin.getWorldMatrix()),positions=[];
    for(let i=0;i<a.getCount();i++)positions.push(...new Vector3().fromArray(a.getElement(i,[])).applyMatrix4(m).toArray());
    add(door,name+' inner shell',doorLiner(outerDoorBoundary(positions,p.getIndices().getArray()),sign),paint,'paint');
  }
  const body=root.listNodes().find(n=>n.getName()==='Body');
  // Stop before the rear wheel wells: a rectangular backing must not protrude
  // into the source model's sculpted wheel arches.
  add(body,'Continuous cabin floor',cabinShell(0,-.045,1.57,1.75,.335,.39,.09),carpet,'interior');
  for(const sign of [-1,1]){
    add(body,sign>0?'Driver seat plinth':'Passenger seat plinth',cabinShell(sign*.435,.005,.455,.61,.385,.555,.055),base,'interior');
  }
  return doc;
}

export async function repairBMW(input,output){
  const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
    'draco3d.decoder':await draco3d.createDecoderModule(),
    'draco3d.encoder':await draco3d.createEncoderModule()
  });
  const doc=await io.read(input);await doc.transform(dequantize());
  addBMWCabin(doc);
  await doc.transform(prune(),dedup(),draco({method:'edgebreaker',encodeSpeed:0,decodeSpeed:5,quantizePosition:14,quantizeNormal:12,quantizeTexcoord:12}));
  const binary=await io.writeBinary(doc),packed=gzipSync(binary,{level:9});
  await fs.writeFile(output,binary);await fs.writeFile(output+'.gz',packed);
  return {glb:binary.length,gzip:packed.length};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  const [input,output]=process.argv.slice(2);
  if(!input||!output||input===output)throw new Error('Usage: repair-bmw-cabin.mjs INPUT_V17.glb OUTPUT.glb');
  console.log(await repairBMW(input,output));
}
