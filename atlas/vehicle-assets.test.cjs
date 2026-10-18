const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {gunzipSync}=require('node:zlib');
for(const vehicle of ['coupe','sedan','crossover','suv'])test(`${vehicle}: self-contained 3D geometry, two door rigs and explicit license`,()=>{
 const data=fs.readFileSync(path.join(__dirname,'../assets/atlas-3d',vehicle+'.glb'));
 assert.equal(data.toString('ascii',0,4),'glTF');assert.equal(data.readUInt32LE(4),2);assert.equal(data.readUInt32LE(8),data.length);
 const rebuilt=vehicle!=='coupe';
 assert.ok(data.length<(rebuilt?1500:850)*1024,'model exceeds geometry budget');
 const packed=fs.readFileSync(path.join(__dirname,'../assets/atlas-3d',vehicle+'.glb.gz'));
 assert.ok(packed.length<(rebuilt?1350:700)*1024,'model exceeds download budget');
 assert.deepEqual(gunzipSync(packed),data,'compressed and fallback models must match');
 const poster=fs.readFileSync(path.join(__dirname,'../assets/atlas-3d',vehicle+'-poster.webp'));
 assert.equal(poster.toString('ascii',8,12),'WEBP');assert.ok(poster.length<80000,'poster must be lightweight');
 const gltf=JSON.parse(data.subarray(20,20+data.readUInt32LE(12)).toString());
 assert.match(gltf.asset.extras.license,/CC-BY-4.0/);
 assert.ok(gltf.extensionsRequired.includes('KHR_draco_mesh_compression'),'model must use the worker-decoded compact transport');
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
 assert.ok(triangles>(rebuilt?150000:20000)&&triangles<(rebuilt?260000:115000),`unexpected geometry budget: ${triangles}`);
 if(rebuilt){
  assert.equal(gltf.asset.extras.preparation,'source-rebuild-v19');
  assert.ok(surfaces.has('rear-lens'),'rear optics must remain separate from windows');
  const interior=gltf.nodes.filter(n=>n.extras?.surface==='interior').flatMap(n=>gltf.meshes[n.mesh].primitives).reduce((sum,p)=>sum+gltf.accessors[p.indices].count/3,0);
  assert.ok(interior>12000,`interior detail was lost: ${interior}`);
 }
 if(vehicle==='suv')assert.equal(gltf.nodes.filter(n=>n.extras?.surface==='roof-glass').length,2,'two panoramic panes must retain glass materials');
});

test('the decoder is local and ships its license',()=>{
 const base=path.join(__dirname,'../shared/three/draco');
 assert.deepEqual([...fs.readFileSync(path.join(base,'draco_decoder.wasm')).subarray(0,4)],[0,97,115,109]);
 for(const name of ['draco_wasm_wrapper.js','draco_decoder.js','LICENSE'])assert.ok(fs.statSync(path.join(base,name)).size>100);
});


test('Porsche model, transport and preview are unchanged',()=>{
 const {createHash}=require('node:crypto');
 const hashes={'coupe.glb':'16bfff5ca3d0300e4244afe79a6fd116828ad18d53802367707866152b857521','coupe.glb.gz':'fe0b8f5eeb3474bfc53a38baa5dd6c92011317a1111beae3006ce59c52f82976','coupe-poster.webp':'16d37ef42d8dfb22526f776d3073aef276182b55f0f1e95f086b8ae0b6034161'};
 for(const [name,hash]of Object.entries(hashes))assert.equal(createHash('sha256').update(fs.readFileSync(path.join(__dirname,'../assets/atlas-3d',name))).digest('hex'),hash,name);
});
