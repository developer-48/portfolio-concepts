import test from 'node:test';
import assert from 'node:assert/strict';
import {smoothPartNormals} from './part-normals.mjs';

test('reflection filtering preserves disconnected neighbouring panels and geometry',()=>{
 const positions=new Float32Array([0,0,0,.05,0,0,.1,0,0,0,.05,0,.05,.05,0,.1,.05,0,0,0,.02,.05,0,.02,.1,0,.02,0,.05,.02,.05,.05,.02,.1,.05,.02]);
 const original=positions.slice(),normals=new Float32Array([...Array(6).fill([0,0,1]).flat(),...Array(6).fill([.2,0,Math.sqrt(.96)]).flat()]);
 const indices=new Uint16Array([0,1,3,1,4,3,1,2,4,2,5,4,6,7,9,7,10,9,7,8,10,8,11,10]);
 const filtered=smoothPartNormals(positions,normals,indices,{radius:.3,passes:3});
 for(let i=0;i<normals.length;i++)assert.ok(Math.abs(filtered[i]-normals[i])<1e-6,'adjacent but disconnected panes must not blend');
 assert.deepEqual(positions,original,'normal filtering must not move panel seams');
});
