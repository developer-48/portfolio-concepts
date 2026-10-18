// Keep the shape and vertex attributes. Remove coincident/zero-area faces and
// correct winding only when all three smooth normals clearly face the other way.
export function repairSurfaceIndices(positions,normals,indices){
 const kept=[],seen=new Set();let flipped=0,removed=0;
 for(let i=0;i<indices.length;i+=3){
  const ids=[indices[i],indices[i+1],indices[i+2]],points=ids.map(id=>Array.from(positions.subarray(id*3,id*3+3)));
  const a=points[1].map((x,k)=>x-points[0][k]),b=points[2].map((x,k)=>x-points[0][k]),face=[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],length=Math.hypot(...face);
  const key=points.map(p=>p.map(x=>Math.round(x*1e6)).join(',')).sort().join('|');
  if(length<1e-10||seen.has(key)){removed++;continue;}seen.add(key);
  if(ids.every(id=>face.reduce((sum,x,k)=>sum+x*normals[id*3+k],0)/length<-.5)){[ids[1],ids[2]]=[ids[2],ids[1]];flipped++;}
  kept.push(...ids);
 }
 return{indices:new Uint32Array(kept),flipped,removed};
}
