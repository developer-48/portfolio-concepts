const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {gunzipSync}=require('node:zlib');
for(const vehicle of ['coupe','sedan','crossover','suv'])test(`${vehicle}: self-contained 3D geometry, two door rigs and explicit license`,()=>{
 const data=fs.readFileSync(path.join(__dirname,'../assets/atlas-3d',vehicle+'.glb'));
 assert.equal(data.toString('ascii',0,4),'glTF');assert.equal(data.readUInt32LE(4),2);assert.equal(data.readUInt32LE(8),data.length);
 assert.ok(data.length<1.75*1024*1024,'model exceeds geometry budget');
 const packed=fs.readFileSync(path.join(__dirname,'../assets/atlas-3d',vehicle+'.glb.gz'));
 assert.ok(packed.length<1.3*1024*1024,'model exceeds download budget');
 assert.deepEqual(gunzipSync(packed),data,'compressed and fallback models must match');
 const poster=fs.readFileSync(path.join(__dirname,'../assets/atlas-3d',vehicle+'-poster.webp'));
 assert.equal(poster.toString('ascii',8,12),'WEBP');assert.ok(poster.length<80000,'poster must be lightweight');
 const gltf=JSON.parse(data.subarray(20,20+data.readUInt32LE(12)).toString());
 assert.match(gltf.asset.extras.license,/CC-BY-4.0/);
 assert.ok(gltf.asset.extras.source.startsWith('https://sketchfab.com/'));
 for(const name of ['DoorLeft','DoorRight']){
  const door=gltf.nodes.find(n=>n.name===name);assert.ok(door?.children?.length>0,`${name} must have geometry`);
  assert.ok(door.translation[2]>.5,'door hinge must be at the front');
  assert.equal(Math.sign(door.translation[0]),name==='DoorLeft'?1:-1);
 }
 if(vehicle==='crossover'){
  const roof=gltf.nodes.filter(n=>n.extras?.surface==='roof-glass');
  assert.equal(roof.length,2,'panoramic roof panes must be separate from windows');
  assert.ok(gltf.nodes.some(n=>n.extras?.surface==='rear-lens'),'rear lenses must retain their own material');
  const tire=gltf.materials.find(m=>/tires/i.test(m.name));
  assert.ok(tire,'tire material must be present');
  assert.equal(tire.alphaMode||'OPAQUE','OPAQUE','tires must write depth instead of disappearing behind body panels');
 }
 const surfaces=new Set(gltf.nodes.map(n=>n.extras?.surface));
 for(const s of ['paint','interior','glass'])assert.ok(surfaces.has(s),`missing ${s} geometry`);
 for(const resource of [...gltf.buffers,...(gltf.images||[])])assert.equal(resource.uri,undefined,'all resources must be embedded');
 const triangles=gltf.meshes.flatMap(m=>m.primitives).reduce((n,p)=>n+gltf.accessors[p.indices].count/3,0);
 assert.ok(triangles>20000&&triangles<190000,`unexpected geometry budget: ${triangles}`);
});
