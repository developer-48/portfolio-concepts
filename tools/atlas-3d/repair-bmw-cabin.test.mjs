import test from 'node:test';
import assert from 'node:assert/strict';
import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import {dequantize} from '@gltf-transform/functions';
import {Matrix4, Vector3, BufferGeometry, Float32BufferAttribute, Mesh, MeshBasicMaterial, DoubleSide, Raycaster} from 'three';
import draco3d from 'draco3dgltf';
import {outerDoorBoundary,cabinShell,doorLiner} from './repair-bmw-cabin.mjs';

function edgeCounts({positions,indices}){
  const edges=new Map();
  const key=i=>positions.slice(i*3,i*3+3).map(v=>Math.round(v*1e5)).join(',');
  for(let i=0;i<indices.length;i+=3)for(let j=0;j<3;j++){
    const edge=[key(indices[i+j]),key(indices[i+(j+1)%3])].sort().join('|');
    edges.set(edge,(edges.get(edge)||0)+1);
  }
  return [...edges.values()];
}

test('floor and seat foundations are closed solids, including bottom faces',()=>{
  for(const shape of [cabinShell(0,0,1.57,1.75,.335,.39,.09),cabinShell(.435,.005,.455,.61,.385,.555,.055)])
    assert.ok(edgeCounts(shape).every(n=>n===2),'every edge must join exactly two faces');
});

const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'draco3d.decoder':await draco3d.createDecoderModule()});
const doc=await io.read(new URL('../../assets/atlas-3d/crossover.glb',import.meta.url).pathname);
await doc.transform(dequantize());
const nodes=doc.getRoot().listNodes();
function worldPoints(node){
  const a=node.getMesh().listPrimitives()[0].getAttribute('POSITION'),m=new Matrix4().fromArray(node.getWorldMatrix());
  return Array.from({length:a.getCount()},(_,i)=>new Vector3().fromArray(a.getElement(i,[])).applyMatrix4(m));
}

for(const [name,sign]of [['DoorLeft',1],['DoorRight',-1]])test(`${name}: backing follows the skin perimeter and moves with the door`,()=>{
  const door=nodes.find(n=>n.getName()===name),liner=nodes.find(n=>n.getName()===name+' inner shell');
  assert.equal(liner.getParentNode(),door,'liner must rotate with the outer skin');
  const skin=door.listChildren().find(n=>n.getExtras().surface==='paint'&&!n.getExtras().repair);
  const boundary=outerDoorBoundary(worldPoints(skin).flatMap(v=>v.toArray()),skin.getMesh().listPrimitives()[0].getIndices().getArray());
  const points=worldPoints(liner);
  for(const p of boundary)assert.ok(points.some(v=>v.distanceTo(new Vector3(...p))<.001),'the new rim must touch the source skin within 1 mm');
  const counts=edgeCounts(doorLiner(boundary,sign));
  assert.equal(counts.filter(n=>n===1).length,boundary.length,'only the rim against the original skin may remain open');
  assert.ok(counts.every(n=>n<=2),'no overlapping or non-manifold faces');
  assert.ok(points.every(p=>p.y<1.10),'door backing must not cover the window');
});

test('floor and seat bases block views through the under-seat area without entering wheel wells',()=>{
  const repaired=nodes.filter(n=>n.getExtras().repair==='bmw-cabin-v18'&&n.getExtras().surface==='interior');
  const meshes=repaired.map(n=>{
    assert.equal(n.getParentNode().getName(),'Body');
    const p=n.getMesh().listPrimitives()[0],g=new BufferGeometry();
    g.setAttribute('position',new Float32BufferAttribute(worldPoints(n).flatMap(v=>v.toArray()),3));g.setIndex(Array.from(p.getIndices().getArray()));
    const mesh=new Mesh(g,new MeshBasicMaterial({side:DoubleSide}));mesh.updateMatrixWorld();return mesh;
  });
  for(const x of [-.7,-.435,.435,.7])for(const z of [-.8,0,.7]){
    const ray=new Raycaster(new Vector3(x,.3,z),new Vector3(0,1,0),0,1);
    assert.ok(ray.intersectObjects(meshes).length,'the cabin must have a continuous underside');
  }
  for(const x of [-.435,.435]){
    const hits=new Raycaster(new Vector3(x,.65,0),new Vector3(0,-1,0),0,1).intersectObjects(meshes);
    assert.ok(hits[0]?.point.y>.55,'a seat must have a raised, closed foundation');
  }
  const floor=nodes.find(n=>n.getName()==='Continuous cabin floor');
  assert.ok(worldPoints(floor).every(p=>p.z>-.93&&p.z<.84),'floor must stop before front/rear wheel wells');
});
