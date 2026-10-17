const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
for(const vehicle of ['coupe','sedan','crossover','suv'])test(`${vehicle}: self-contained 3D geometry, two door rigs and explicit license`,()=>{
 const data=fs.readFileSync(path.join(__dirname,'../assets/atlas-3d',vehicle+'.glb'));
 assert.equal(data.toString('ascii',0,4),'glTF');assert.equal(data.readUInt32LE(4),2);assert.equal(data.readUInt32LE(8),data.length);
 assert.ok(data.length<4*1024*1024,'model exceeds lazy-load budget');
 const gltf=JSON.parse(data.subarray(20,20+data.readUInt32LE(12)).toString());
 assert.match(gltf.asset.extras.license,/CC-BY-4.0/);
 assert.ok(gltf.asset.extras.source.startsWith('https://sketchfab.com/'));
 for(const name of ['DoorLeft','DoorRight']){
  const door=gltf.nodes.find(n=>n.name===name);assert.ok(door?.children?.length>0,`${name} must have geometry`);
  assert.ok(door.translation[2]>.5,'door hinge must be at the front');
  assert.equal(Math.sign(door.translation[0]),name==='DoorLeft'?1:-1);
 }
 const surfaces=new Set(gltf.nodes.map(n=>n.extras?.surface));
 for(const s of ['paint','interior','glass'])assert.ok(surfaces.has(s),`missing ${s} geometry`);
 for(const resource of [...gltf.buffers,...(gltf.images||[])])assert.equal(resource.uri,undefined,'all resources must be embedded');
 const triangles=gltf.meshes.flatMap(m=>m.primitives).reduce((n,p)=>n+gltf.accessors[p.indices].count/3,0);
 assert.ok(triangles>20000&&triangles<450000,`unexpected geometry budget: ${triangles}`);
});
