import test from 'node:test';
import assert from 'node:assert/strict';
import {filterReflectionNormals} from './reflection-normals.mjs';
test('reflection filter reduces normal noise without moving geometry or rounding a perpendicular crease',()=>{
 const positions=new Float32Array([0,0,0,.03,0,0,.06,0,0,.03,0,0]);
 const normals=new Float32Array([-.1,.995,0,.15,.989,0,-.1,.995,0,1,0,0]);
 const originalPositions=positions.slice(),originalNormals=normals.slice();
 const output=filterReflectionNormals(positions,normals,{radius:.12,passes:3});
 assert.deepEqual(positions,originalPositions);assert.deepEqual(normals,originalNormals);
 assert.ok(Math.abs(output[3]-output[0])<.05,'adjacent reflection normals should be continuous');
 assert.deepEqual([...output.slice(9)],[1,0,0],'a perpendicular panel keeps its crease');
 for(let i=0;i<output.length;i+=3)assert.ok(Math.abs(Math.hypot(...output.slice(i,i+3))-1)<1e-6);
});
test('distant panels do not influence each other',()=>{
 const p=new Float32Array([0,0,0,2,0,0]),n=new Float32Array([0,1,0,.6,.8,0]);
 const output=filterReflectionNormals(p,n,{radius:.2});
 for(let i=0;i<n.length;i++)assert.ok(Math.abs(output[i]-n[i])<1e-6);
});
