import {Vector3,Matrix4} from 'three';

// Spatial bilateral filtering of reflection normals, in model/world units.
// Positions, topology, UVs and silhouettes are unchanged. An angular gate keeps
// neighbouring panels with different orientations from blending into each other.
export function filterReflectionNormals(positions,normals,{radius=.18,passes=3,minimumDot=.85}={}){
 const entries=[],unique=new Map(),grid=new Map(),radius2=radius*radius;
 for(let i=0;i<positions.length;i+=3){
  const point=new Vector3().fromArray(positions,i),normal=new Vector3().fromArray(normals,i).normalize();
  const key=point.toArray().map(x=>Math.round(x*10000)).join(',')+':'+normal.toArray().map(x=>Math.round(x*20)).join(',');
  if(!unique.has(key)){
   const id=entries.length;unique.set(key,id);entries.push({point,normal,ids:[]});
   const cell=point.toArray().map(x=>Math.floor(x/radius)).join(',');if(!grid.has(cell))grid.set(cell,[]);grid.get(cell).push(id);
  }entries[unique.get(key)].ids.push(i);
 }
 for(let pass=0;pass<passes;pass++){
  const output=entries.map(entry=>{
   const cell=entry.point.toArray().map(x=>Math.floor(x/radius)),sum=new Vector3();
   for(let x=-1;x<=1;x++)for(let y=-1;y<=1;y++)for(let z=-1;z<=1;z++){
    for(const index of grid.get([cell[0]+x,cell[1]+y,cell[2]+z].join(','))||[]){
     const other=entries[index],distance=entry.point.distanceToSquared(other.point),dot=entry.normal.dot(other.normal);
     if(distance>radius2||dot<minimumDot)continue;
     const weight=Math.exp(-distance/(radius2*.3))*Math.pow((dot-minimumDot)/(1-minimumDot),2);sum.addScaledVector(other.normal,weight);
    }
   }return sum.lengthSq()>1e-12?sum.normalize():entry.normal.clone();
  });entries.forEach((entry,index)=>entry.normal=output[index]);
 }
 const result=new Float32Array(normals.length);for(const entry of entries)for(const offset of entry.ids)entry.normal.toArray(result,offset);return result;
}
export function refineReflections(document){
 for(const node of document.getRoot().listNodes()){
  const surface=node.getExtras().surface;if(!node.getMesh()||!['paint','glass','roof-glass'].includes(surface))continue;
  const matrix=new Matrix4().fromArray(node.getWorldMatrix());
  for(const primitive of node.getMesh().listPrimitives()){
   const position=primitive.getAttribute('POSITION'),normal=primitive.getAttribute('NORMAL');if(!normal)continue;
   const positions=new Float32Array(position.getCount()*3),normals=new Float32Array(normal.getCount()*3);
   for(let i=0;i<position.getCount();i++){
    new Vector3().fromArray(position.getElement(i,[])).applyMatrix4(matrix).toArray(positions,i*3);
    normals.set(normal.getElement(i,[]),i*3);
   }
   primitive.setAttribute('NORMAL',normal.clone().setNormalized(false).setArray(filterReflectionNormals(positions,normals,{radius:surface==='paint'?.24:.16,passes:3})));
  }
 }
}
