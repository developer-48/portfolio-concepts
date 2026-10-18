import test from'node:test';import assert from'node:assert/strict';import{repairSurfaceIndices}from'./repair-topology.mjs';
test('repairs reversed faces and removes duplicate/degenerate triangles without changing vertices',()=>{
 const p=new Float32Array([0,0,0,1,0,0,0,1,0]),n=new Float32Array([0,0,1,0,0,1,0,0,1]);const copy=p.slice();
 const result=repairSurfaceIndices(p,n,new Uint32Array([0,2,1,0,1,2,0,0,1]));assert.deepEqual([...result.indices],[0,1,2]);assert.equal(result.flipped,1);assert.equal(result.removed,2);assert.deepEqual(p,copy);
});
test('retains an intentional edge when its vertex normals do not unanimously oppose it',()=>{
 const p=new Float32Array([0,0,0,1,0,0,0,1,0]),n=new Float32Array([0,0,1,0,0,-1,0,0,-1]);assert.equal(repairSurfaceIndices(p,n,new Uint32Array([0,1,2])).flipped,0);
});
