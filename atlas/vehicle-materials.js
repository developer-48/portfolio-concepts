import * as THREE from '../shared/three/three.module.min.js';

// Rebuilt vehicles have explicit pane/optic semantics. Porsche keeps its
// established material path in vehicle-renderer.js and never enters here.
export function createRebuiltMaterial(source,surface,vehicle){
  if(vehicle==='coupe')throw new Error('Porsche materials are protected');
  const name=source.name||'';
  let material=source.clone();
  material.forceSinglePass=true;
  if('transmission' in material)material.transmission=0;
  if(surface==='paint'){
    material=new THREE.MeshPhysicalMaterial({
      color:{sedan:0xa3adb4,crossover:0x244c72,suv:0x3d4850}[vehicle],
      metalness:.38,roughness:.34,clearcoat:1,clearcoatRoughness:.2,
      side:THREE.DoubleSide
    });
  }else if(['glass','roof-glass','lens','rear-lens'].includes(surface)){
    const pane=surface==='glass'||surface==='roof-glass';
    const red=surface==='rear-lens'&&(vehicle==='crossover'||source.color.r>source.color.g*2);
    material=new THREE.MeshPhysicalMaterial({
      color:red?0xa41623:pane?0x788b8b:0xb8c8c7,
      metalness:pane?.15:0,roughness:pane?.085:.045,
      clearcoat:0,clearcoatRoughness:.1,
      transparent:true,opacity:red?.72:surface==='roof-glass'?.28:pane?.22:.12,
      depthWrite:false,side:THREE.DoubleSide,envMapIntensity:.75
    });
    material.forceSinglePass=true;
  }else if(surface==='mirror'||(vehicle==='crossover'&&name==='Material_45')){
    material=new THREE.MeshStandardMaterial({color:0xc5ced1,metalness:1,roughness:.08,side:THREE.DoubleSide});
  }else if(surface==='rear-reflector'){
    material.color.set(0x9d1420);material.metalness=.25;material.roughness=.18;
    material.emissive?.set(0x620710);material.emissiveIntensity=.15;
    material.transparent=false;material.opacity=1;material.depthWrite=true;
  }else if(/tires|tyres|Scene_-_Root|rubber/i.test(name)){
    material.metalness=0;material.roughness=.86;material.transparent=false;material.opacity=1;material.depthWrite=true;
    material.normalScale?.set(.25,.25);
  }else if(/black_ext/i.test(name)){
    material.metalness=.12;material.roughness=.46;material.transparent=false;material.opacity=1;material.depthWrite=true;
  }else if(/chrome|metallic|rim|wheel_42|disc|caliper/i.test(name)){
    material.metalness=.85;material.roughness=.23;
    material.transparent=false;material.opacity=1;material.depthWrite=true;
  }else if(/wood|carbon/i.test(name)){
    material.metalness=.15;material.roughness=.3;material.transparent=false;material.opacity=1;
  }else if(surface==='interior'||/leather|carpet|seat|torped|black_int|alcantara/i.test(name)){
    material.metalness=0;material.roughness=/carpet|fabric|seatbelt|alcantara/i.test(name)?.88:.57;
    material.transparent=false;material.opacity=1;material.depthWrite=true;
    if(vehicle==='sedan'&&material.color.r>material.color.b*1.5)material.color.multiplyScalar(.6);
  }else if(surface==='trim'){
    material.color.set(0x151b21);material.metalness=.25;material.roughness=.3;
  }else{
    material.metalness=Math.min(material.metalness,.65);
    material.roughness=Math.max(.18,material.roughness);
  }
  material.name=source.name;
  return material;
}
