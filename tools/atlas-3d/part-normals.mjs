import {filterReflectionNormals} from './reflection-normals.mjs';

// A hood and the adjacent fender can be millimetres apart but are different
// surfaces. Filter only within a connected component, never by proximity alone.
export function smoothPartNormals(positions,normals,indices,{radius=.12,passes=2,minimumDot=.85}={}){
  const keys=new Map(),parents=[],ids=[];
  for(let i=0;i<positions.length;i+=3){
    const key=Array.from(positions.slice(i,i+3)).map(v=>Math.round(v*1e5)).join(',');
    if(!keys.has(key)){keys.set(key,parents.length);parents.push(parents.length);}
    ids.push(keys.get(key));
  }
  const find=i=>{while(parents[i]!==i){parents[i]=parents[parents[i]];i=parents[i];}return i;};
  for(let i=0;i<indices.length;i+=3){parents[find(ids[indices[i]])]=find(ids[indices[i+1]]);parents[find(ids[indices[i+1]])]=find(ids[indices[i+2]]);}
  const groups=new Map();
  for(let i=0;i<ids.length;i++){const id=find(ids[i]);if(!groups.has(id))groups.set(id,[]);groups.get(id).push(i);}
  const output=new Float32Array(normals);
  for(const group of groups.values()){
    if(group.length<6)continue;
    const ps=new Float32Array(group.length*3),ns=new Float32Array(group.length*3);
    group.forEach((index,i)=>{ps.set(positions.slice(index*3,index*3+3),i*3);ns.set(normals.slice(index*3,index*3+3),i*3);});
    const smoothed=filterReflectionNormals(ps,ns,{radius,passes,minimumDot});
    group.forEach((index,i)=>output.set(smoothed.subarray(i*3,i*3+3),index*3));
  }
  return output;
}
