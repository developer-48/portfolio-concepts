import{unweld,weld}from'@gltf-transform/functions';
import{Vector3}from'three';
// Reconstruct angle-weighted normals; retain 30-degree creases and the original geometry.
export async function repairPaintNormals(d){
 await d.transform(unweld());

for(const n of d.getRoot().listNodes())if(n.getMesh()&&n.getExtras().surface==='paint')for(const p of n.getMesh().listPrimitives()){
 const a=p.getAttribute('POSITION'),normal=p.getAttribute('NORMAL'),idx=p.getIndices()?.getArray()||Uint32Array.from({length:a.getCount()},(_,i)=>i),points=Array.from({length:a.getCount()},(_,i)=>new Vector3().fromArray(a.getElement(i,[]))),keys=points.map(v=>v.toArray().map(x=>Math.round(x*1e5)).join(',')),faces=new Map(),angles=new Float32Array(a.getCount()*3);
 for(let i=0;i<idx.length;i+=3){const vs=[idx[i],idx[i+1],idx[i+2]],ps=vs.map(j=>points[j]),fn=new Vector3().subVectors(ps[1],ps[0]).cross(new Vector3().subVectors(ps[2],ps[0])).normalize();if(fn.lengthSq()<.5)continue;
  vs.forEach((vi,k)=>{const weight=new Vector3().subVectors(ps[(k+1)%3],ps[k]).angleTo(new Vector3().subVectors(ps[(k+2)%3],ps[k]));if(!faces.has(keys[vi]))faces.set(keys[vi],[]);faces.get(keys[vi]).push({fn,weight});});
 }
 for(let i=0;i<points.length;i++){const base=Math.floor(i/3)*3,old=new Vector3().subVectors(points[base+1],points[base]).cross(new Vector3().subVectors(points[base+2],points[base])).normalize(),sum=new Vector3();for(const {fn,weight}of faces.get(keys[i])||[])if(old.dot(fn)>.866)sum.addScaledVector(fn,weight);if(sum.lengthSq()<1e-12)sum.copy(old);sum.normalize();angles.set(sum.toArray(),i*3);}
 // Bilateral smoothing removes small triangle-to-triangle changes without crossing creases.
 const neighboring=new Map();
 for(let i=0;i<points.length;i+=3)for(let j=0;j<3;j++){const k=keys[i+j];if(!neighboring.has(k))neighboring.set(k,new Set());for(let v=0;v<3;v++)neighboring.get(k).add(i+v);}
 for(let iteration=0;iteration<3;iteration++){
  const next=angles.slice();
  for(let i=0;i<points.length;i++){const original=new Vector3().fromArray(angles,i*3),sum=new Vector3();let weight=0;
   for(const j of neighboring.get(keys[i])||[]){const value=new Vector3().fromArray(angles,j*3),dot=original.dot(value);if(dot<.85)continue;sum.add(value);weight++;}
   if(weight)original.lerp(sum.multiplyScalar(1/weight).normalize(),.55).normalize();next.set(original.toArray(),i*3);
  }angles.set(next);
 }
 p.setAttribute('NORMAL',normal.clone().setArray(angles).setNormalized(false));
}
 await d.transform(weld());
}
