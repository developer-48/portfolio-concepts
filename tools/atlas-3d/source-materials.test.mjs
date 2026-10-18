import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../../shared/three/three.module.min.js';
import {classifySurface} from './source-surfaces.mjs';
import {createRebuiltMaterial} from '../../atlas/vehicle-materials.js';

test('GLS source panes and tailgate optics are not mistaken for opaque trim',()=>{
 assert.equal(classifySurface('gls_sunroof_gls_carbonn.005_0','gls_carbonn.005','suv'),'glass');
 assert.equal(classifySurface('gls_tailgatelightglass_L_etk800_glass.002_0','etk800_glass.002','suv'),'rear-lens');
 assert.equal(classifySurface('gls_headlightglass_L_gls_glass_1.043_0','gls_glass_1.043','suv'),'lens');
 assert.equal(classifySurface('gls_tailgate_gls_black_chrome.036_0','gls_black_chrome.036','suv'),'detail');
 assert.equal(classifySurface('gls_door_RL_wheel_42b.038_0','wheel_42b.038','suv'),'detail');
 assert.equal(classifySurface('gls_mirror_L_mirror.159_0','etk800_interior.001','suv'),'mirror');
});

test('body paint, glazing, optics, rubber and leather have distinct physical responses',()=>{
 const source=new THREE.MeshStandardMaterial({color:0x3d4850,metalness:1,roughness:0,transparent:true,opacity:.2});
 for(const vehicle of ['sedan','crossover','suv']){
  const paint=createRebuiltMaterial(source,'paint',vehicle);assert.equal(paint.clearcoat,1);assert.ok(paint.metalness>.2&&paint.metalness<.6);assert.equal(paint.opacity,1);
  for(const surface of ['glass','roof-glass','lens']){const pane=createRebuiltMaterial(source,surface,vehicle);assert.equal(pane.transparent,true);assert.ok(pane.opacity>0&&pane.opacity<.4);assert.equal(pane.depthWrite,false);}
  source.color.set(0xaa1122);const tail=createRebuiltMaterial(source,'rear-lens',vehicle);assert.ok(tail.color.r>tail.color.g*3);assert.ok(tail.opacity>.5);source.color.set(0x3d4850);
 }
 source.name='tires';const rubber=createRebuiltMaterial(source,'wheels','crossover');assert.equal(rubber.opacity,1);assert.equal(rubber.transparent,false);assert.equal(rubber.metalness,0);assert.ok(rubber.roughness>.8);
 source.name='black_int';const leather=createRebuiltMaterial(source,'interior','crossover');assert.equal(leather.metalness,0);assert.ok(leather.roughness>.5);
 assert.equal(source.opacity,.2,'source material must not be mutated');
 assert.throws(()=>createRebuiltMaterial(source,'paint','coupe'),/protected/);
});
