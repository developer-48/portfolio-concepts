import * as THREE from '../shared/three/three.module.min.js';
import {GLTFLoader} from '../shared/three/GLTFLoader.js';
import {DRACOLoader} from '../shared/three/DRACOLoader.js';
import {requestModel} from './model-data.js?v=16';

import {resolveVisualEffect} from './visual-state.mjs';

const models={
  coupe:{file:'coupe',name:'Porsche 911 GT3 RS',height:1.43,cabin:[.12,1.10,.62],look:[-.15,.66,-.55]},
  sedan:{file:'sedan',name:'Mercedes-Benz S 65',height:1.33,cabin:[.10,1.04,.62],look:[-.15,.62,-.48]},
  crossover:{file:'crossover',name:'BMW X6 M',height:1.57,cabin:[.10,1.23,.62],look:[-.15,.80,-.45]},
  suv:{file:'suv',name:'Mercedes-Benz GLS',height:1.64,cabin:[.10,1.29,.65],look:[-.15,.85,-.45]}
};
const labels={restore:'Полировка · свет скользит по лаку',protect:'Плёнка · защита передней части',refresh:'Химчистка · материалы салона',interior:'Химчистка · материалы салона',glass:'Стёкла · очистка и защита',wheels:'Диски · глубокая очистка'};
const modeIds={restore:0,protect:1,refresh:2,interior:2,glass:3,wheels:4};

export function createVehicleScene(stage,_images,onStatus){
  const gsap=window.gsap;
  const host=stage.querySelector('.vehicle-body');
  const renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});
  renderer.setClearColor(0x101a24,0);
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.05;
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.shadowMap.autoUpdate=false;
  const canvas=renderer.domElement;canvas.className='vehicle-canvas';canvas.setAttribute('aria-hidden','true');host.append(canvas);
  const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(34,1,.025,60);
  const target=new THREE.Vector3();
  // Softboxes form long reflections across the paint; no remote HDR download.
  const studio=new THREE.Scene();studio.background=new THREE.Color(.055,.064,.075);
  const panelGeometry=new THREE.PlaneGeometry(1,1),panelMaterials=[];
  function softbox(x,y,z,w,h,power,color=0xffffff){
    const material=new THREE.MeshBasicMaterial({color:new THREE.Color(color).multiplyScalar(power),side:THREE.DoubleSide});panelMaterials.push(material);
    const panel=new THREE.Mesh(panelGeometry,material);panel.position.set(x,y,z);panel.scale.set(w,h,1);panel.lookAt(0,.8,0);studio.add(panel);
  }
  softbox(-3,5,1,1.4,7,4.5);softbox(4,3,-2,.8,7,4.2,0xd5e6f4);
  softbox(1,5,-5,5,1.1,3.8);softbox(0,1,6,5,2,1.3,0xffeadb);
  const pmrem=new THREE.PMREMGenerator(renderer),environment=pmrem.fromScene(studio,.035);
  scene.environment=environment.texture;scene.environmentIntensity=1;
  panelGeometry.dispose();panelMaterials.forEach(m=>m.dispose());pmrem.dispose();
  const ambient=new THREE.HemisphereLight(0xdce8f3,0x141b20,.45);scene.add(ambient);
  const keyLight=new THREE.DirectionalLight(0xfff4e7,2.5);keyLight.position.set(-3,8,3.5);scene.add(keyLight);
  keyLight.castShadow=true;keyLight.shadow.mapSize.set(1024,1024);Object.assign(keyLight.shadow.camera,{left:-3.6,right:3.6,top:3.6,bottom:-3.6,near:1,far:14});keyLight.shadow.bias=-.00015;keyLight.shadow.normalBias=.018;keyLight.shadow.camera.updateProjectionMatrix();
  const edgeLight=new THREE.DirectionalLight(0xb6d8ef,.65);edgeLight.position.set(-3,2,-4);scene.add(edgeLight);
  const cabinLight=new THREE.PointLight(0xffedcf,0,3,1.5);cabinLight.position.set(0,1.4,-.4);scene.add(cabinLight);
  const contact=new THREE.Mesh(new THREE.PlaneGeometry(14,14),new THREE.ShadowMaterial({opacity:.16}));contact.rotation.x=-Math.PI/2;contact.position.y=-.008;contact.receiveShadow=true;scene.add(contact);
  let shadowDoor=-1;
  const shadowCanvas=document.createElement('canvas');shadowCanvas.width=128;shadowCanvas.height=256;
  const ctx=shadowCanvas.getContext('2d');ctx.setTransform(64,0,0,128,64,128);const gradient=ctx.createRadialGradient(0,0,.08,0,0,1);
  gradient.addColorStop(0,'rgba(0,0,0,.65)');gradient.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=gradient;ctx.fillRect(-1,-1,2,2);
  const shadowTexture=new THREE.CanvasTexture(shadowCanvas),shadow=new THREE.Mesh(new THREE.PlaneGeometry(3.2,5.6),new THREE.MeshBasicMaterial({map:shadowTexture,transparent:true,depthWrite:false}));
  shadow.rotation.x=-Math.PI/2;shadow.position.y=-.015;scene.add(shadow);
  const draco=new DRACOLoader().setDecoderPath(new URL('../shared/three/draco/',import.meta.url).href).setWorkerLimit(2);
  draco.preload();
  const loader=new GLTFLoader().setDRACOLoader(draco);
  const cache=new Map(),pendingModels=new Map();
  const fx={progress:{value:0},strength:{value:0},mode:{value:0}};
  const pose={x:5,y:2.5,z:5,tx:0,ty:.65,tz:0,fov:34,door:0,light:0};
  let current=null,record=null,timeline=null,activeEffect=null,paused=false,visible=false,reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  let playbackVersion=0,requestedEffect='restore';
  const cacheLimit=matchMedia('(max-width:760px)').matches||navigator.deviceMemory<4?2:4;
  let disposed=false,lost=false,ticket=0,raf=0,frameCount=0,lastStatus=0,loading=false,drag=null;
  let frameSamples=[],previousFrame=0,quality=Math.min(devicePixelRatio,matchMedia('(max-width:760px)').matches?1.35:1.75);
  const metricsEnabled=new URLSearchParams(location.search).has('qa3d');
  const metrics={frames:0,slowFrames:0,worstFrame:0};

  function report(label){
    if(label)onStatus({label});
    onStatus({playing:!!timeline,paused:paused&&!!timeline,...(!loading?{progress:timeline?timeline.progress():1}:{})});
    const playback=timeline?(paused?'paused':'playing'):'complete';if(stage.dataset.playback!==playback)stage.dataset.playback=playback;
  }
  function applyPose(){
    camera.position.set(pose.x,pose.y,pose.z);target.set(pose.tx,pose.ty,pose.tz);camera.lookAt(target);
    if(camera.fov!==pose.fov){camera.fov=pose.fov;camera.updateProjectionMatrix();}
    if(record){record.left.rotation.y=-pose.door;record.right.rotation.y=pose.door*.72;}
    cabinLight.intensity=pose.light;const inside=THREE.MathUtils.clamp((pose.fov-43)/29,0,1);scene.environmentIntensity=1-inside*.55;ambient.intensity=.45-inside*.15;keyLight.intensity=2.5-inside*1.7;edgeLight.intensity=.65-inside*.45;
    if(Math.abs(shadowDoor-pose.door)>.025){renderer.shadowMap.needsUpdate=true;shadowDoor=pose.door;}
  }
  function draw(now){
    raf=0;if(disposed||lost||!visible||document.hidden)return;
    applyPose();renderer.render(scene,camera);frameCount++;
    if(timeline&&!paused&&previousFrame){const delta=now-previousFrame;if(delta<150){frameSamples.push(delta);if(metricsEnabled){metrics.frames++;metrics.worstFrame=Math.max(metrics.worstFrame,delta);if(delta>34)metrics.slowFrames++;}}}
    previousFrame=timeline&&!paused?now:0;
    if(frameSamples.length>=50){const mean=frameSamples.reduce((a,b)=>a+b,0)/frameSamples.length;frameSamples=[];if(mean>26&&quality>1){quality=Math.max(1,quality-.25);resize();}}
    if(now-lastStatus>100){lastStatus=now;report();}
    if(metricsEnabled){stage.dataset.frames=String(frameCount);stage.dataset.calls=String(renderer.info.render.calls);stage.dataset.triangles=String(renderer.info.render.triangles);stage.dataset.renderStats=JSON.stringify(metrics);stage.dataset.memory=JSON.stringify(renderer.info.memory);stage.dataset.door=pose.door.toFixed(3);stage.dataset.focus=activeEffect||current?.key||'';}
  }
  function invalidate(){if(!raf&&visible&&!document.hidden&&!lost&&!disposed)raf=requestAnimationFrame(draw);}
  function resize(){
    const width=Math.round(host.clientWidth),height=Math.round(host.clientHeight);if(!width||!height)return;
    const dpr=Math.min(quality,matchMedia('(max-width:760px)').matches?1.35:1.75,Math.sqrt(900000/(width*height)));
    if(canvas.width!==Math.round(width*dpr)||canvas.height!==Math.round(height*dpr)){renderer.setPixelRatio(dpr);renderer.setSize(width,height,false);}
    camera.aspect=width/height;camera.updateProjectionMatrix();invalidate();
  }
  const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(host);
  function decorate(material,surface,vehicle){
    if(vehicle!=='coupe')material=material.clone();
    const name=material.name||'';
    material.forceSinglePass=true;
    if('transmission' in material)material.transmission=0;
    if(/plastic|rubber|carpet|fabric|leather|seat|stitch|speakers|torped/i.test(name)||surface==='interior'){
      material.metalness=0;material.roughness=/rubber|carpet|fabric|seatbelt/i.test(name)?.86:.57;
      if(!material.map&&/leather|fabric|plastic|seat|torped/i.test(name)){
        const c=material.color,neutral=Math.max(c.r,c.g,c.b)-Math.min(c.r,c.g,c.b)<.06;
        if(neutral&&Math.max(c.r,c.g,c.b)>.065)c.multiplyScalar(.22);
        else if(c.r>c.g*2)c.multiplyScalar(.55);
      }
    }else if(/carbon/i.test(name)){material.metalness=.15;material.roughness=.32;}
    else if(/chrome|metal|rim|wheel/i.test(name)){if(/wheels_chrome|GT3RS_black/i.test(name))material.color.multiplyScalar(.5);material.metalness=.85;material.roughness=Math.max(.22,Math.min(.4,material.roughness));}
    else if(/light|glass|screen/i.test(name)){material.metalness=.18;material.roughness=Math.max(.12,material.roughness);}
    else {material.metalness=Math.min(.55,material.metalness);material.roughness=Math.max(.28,material.roughness);}
    if(surface==='paint')material=new THREE.MeshPhysicalMaterial({color:({coupe:0x06412f,sedan:0x87969e,crossover:0x314c68,suv:0x474d50})[vehicle],side:['sedan','crossover'].includes(vehicle)?THREE.DoubleSide:THREE.FrontSide,metalness:.38,roughness:.34,clearcoat:1,clearcoatRoughness:vehicle==='coupe'?.2:.27});
    if(surface==='glass'||surface==='roof-glass'){
      material=material.clone();material.color.set(vehicle==='coupe'?0x718783:0x23333f);material.transparent=true;material.opacity=vehicle==='coupe'?.22:.65;material.depthWrite=false;material.roughness=.085;material.metalness=.25;material.forceSinglePass=true;
      if(vehicle==='sedan'||vehicle==='crossover'){material.clearcoat=.6;material.clearcoatRoughness=.18;}
      if(surface==='roof-glass'){material.color.set(0x111d26);material.opacity=1;material.transparent=false;material.depthWrite=true;material.roughness=.16;}
    }
    if(vehicle!=='coupe'&&/tires|tyres/i.test(name)){material.metalness=0;material.roughness=.88;material.transparent=false;material.depthWrite=true;material.opacity=1;material.clearcoat=0;material.normalScale?.set(.35,.35);}
    if(vehicle!=='coupe'&&/^black_ext/i.test(name)){material.metalness=.12;material.clearcoat=.15;material.roughness=Math.max(.4,material.roughness);}
    if(surface==='trim'){material.color.set(0x12171b);material.metalness=.2;material.roughness=.3;}
    if(surface==='lens'||surface==='rear-lens'){material.color.set(surface==='rear-lens'?0xc52022:0xffffff);material.opacity=surface==='rear-lens'?.75:.18;material.transparent=true;material.depthWrite=false;material.roughness=.09;material.metalness=0;}
    if(surface==='mirror'){material.color.set(0xb4bcc2);material.opacity=1;material.transparent=false;material.depthWrite=true;material.metalness=1;material.roughness=.12;}
    const kind={paint:0,interior:2,glass:3,'roof-glass':3,wheels:4}[surface]??5;
    material.onBeforeCompile=shader=>{
      shader.uniforms.atlasProgress=fx.progress;shader.uniforms.atlasStrength=fx.strength;shader.uniforms.atlasMode=fx.mode;
      shader.vertexShader='varying vec3 vAtlasWorld;\n'+shader.vertexShader.replace('#include <worldpos_vertex>','#include <worldpos_vertex>\nvAtlasWorld=(modelMatrix*vec4(transformed,1.0)).xyz;');
      shader.fragmentShader=`varying vec3 vAtlasWorld;uniform float atlasProgress;uniform float atlasStrength;uniform float atlasMode;\n`+shader.fragmentShader.replace('#include <opaque_fragment>',`
        ${surface==='glass'?`diffuseColor.a *= mix(${vehicle==='coupe'?'.2,1.8':'.8,1.35'},pow(1.0-abs(dot(normal,normalize(vViewPosition))),3.0));`:''}
        float scan = mix(-2.5,2.5,atlasProgress);
        float band = 1.0-smoothstep(.015,.16,abs(vAtlasWorld.z-scan));
        float selected = ${kind===0?'1.0-step(1.5,atlasMode)':`1.0-step(.1,abs(atlasMode-${kind}.0))`};
        float mirror = smoothstep(.90,1.0,abs(vAtlasWorld.x))*step(.8,vAtlasWorld.y)*step(vAtlasWorld.y,1.5)*step(.05,vAtlasWorld.z)*step(vAtlasWorld.z,.75);
        float front = max(smoothstep(.35,.7,vAtlasWorld.z),mirror);
        float film = (1.0-step(.1,abs(atlasMode-1.0)))*front;
        vec3 light = mix(vec3(.35,.68,.85),vec3(.35,.9,1.0),film);
        float grid = max(1.0-smoothstep(.03,.09,abs(fract(vAtlasWorld.x*13.0)-.5)),1.0-smoothstep(.03,.09,abs(fract(vAtlasWorld.z*13.0)-.5)));
        outgoingLight += selected*atlasStrength*light*(band*.9+film*(band*.5+grid*.12));
        #include <opaque_fragment>`);
    };
    material.customProgramCacheKey=()=>`atlas-surface-${kind}-${surface}-${surface==='glass'&&vehicle!=='coupe'?'tinted':'original'}`;
    return material;
  }
  function disposeRecord(item){
    const materials=new Set(),textures=new Set(),geometries=new Set();item.root.traverse(o=>{if(!o.isMesh)return;geometries.add(o.geometry);materials.add(o.material);for(const value of Object.values(o.material))if(value?.isTexture)textures.add(value);});
    geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>{t.source?.data?.close?.();t.dispose();});
    item.root.removeFromParent();
  }
  async function loadModel(vehicle){
    if(cache.has(vehicle)){const item=cache.get(vehicle);cache.delete(vehicle);cache.set(vehicle,item);return item;}
    if(pendingModels.has(vehicle))return pendingModels.get(vehicle);
    const request=(async()=>{
    const progress=ratio=>{
      if(disposed||current?.vehicle!==vehicle||!loading)return;
      onStatus({progress:ratio,label:ratio===1?'Готовим объёмную сцену…':ratio?`Загружаем 3D-модель · ${Math.round(ratio*100)}%`:'Загружаем 3D-модель…'});
    };
    const downloadStarted=performance.now();
    const buffer=await requestModel(vehicle,progress);
    const downloadMs=performance.now()-downloadStarted;
    if(disposed)return null;
    const decodeStarted=performance.now();
    const data=await loader.parseAsync(buffer,'');
    const decodeMs=performance.now()-decodeStarted;
    const root=data.scene,materialCache=new Map();root.traverse(o=>{if(!o.isMesh)return;
      const surface=o.userData.surface||o.parent?.userData.surface||'detail';
      const key=o.material.uuid+'|'+surface;
      if(!materialCache.has(key))materialCache.set(key,decorate(o.material,surface,vehicle));
      o.material=materialCache.get(key);o.frustumCulled=true;o.castShadow=!['glass','roof-glass'].includes(surface)&&!o.material.transparent;o.receiveShadow=surface==='interior';
    });
    const item={root,downloadMs,decodeMs,left:root.getObjectByName('DoorLeft'),right:root.getObjectByName('DoorRight')};
    if(disposed){disposeRecord(item);return null;}
    cache.set(vehicle,item);
    while(cache.size>cacheLimit){const entry=[...cache.entries()].find(([,value])=>value!==record&&value!==item);if(!entry)break;cache.delete(entry[0]);disposeRecord(entry[1]);}
    return item;
    })();
    pendingModels.set(vehicle,request);
    try{return await request;}finally{if(pendingModels.get(vehicle)===request)pendingModels.delete(vehicle);}
  }
  function kill(){playbackVersion++;if(timeline){timeline.kill();timeline=null;}fx.strength.value=0;previousFrame=0;activeEffect=null;}
  function outside(){const h=models[current.vehicle].height;return{x:4.8,y:1.8,z:5.5,tx:0,ty:h*.46,tz:0,fov:32,door:0,light:0};}
  function front(){return{...outside(),x:1.25,y:1.5,z:5.5,ty:.65,tz:.45,fov:32};}
  function entrance(){return{...outside(),x:5.15,y:2.15,z:1.85,ty:models[current.vehicle].height*.57,fov:38,door:1.08,light:1.8};}
  function cabin(){const c=models[current.vehicle];return{x:c.cabin[0],y:c.cabin[1],z:c.cabin[2],tx:c.look[0],ty:c.look[1],tz:c.look[2],fov:72,door:1.08,light:1.2};}
  function restPose(){return current.key==='refresh'?entrance():current.key==='protect'?front():outside();}
  function createTimeline(done){
    previousFrame=0;const version=playbackVersion;
    const t=gsap.timeline({paused:true,onUpdate:invalidate,onComplete:()=>{if(version!==playbackVersion)return;timeline=null;fx.strength.value=0;invalidate();done?.();report();}});timeline=t;return t;
  }
  function begin(t,label){report(label);stage.dataset.effect=activeEffect||current.key;if(visible&&!document.hidden&&!paused)t.play();invalidate();}
  function setDetail(detail){stage.dataset.detail=detail;}
  function addInterior(t){
    t.call(()=>{setDetail('door');report('Салон · открываем передние двери');},[],0)
     .to(pose,{...entrance(),door:0,light:0,duration:.9,ease:'power2.inOut'},0)
     .to(pose,{door:1.08,light:1.8,duration:1.15,ease:'power2.inOut'},.9)
     .call(()=>{setDetail('enter');report('Салон · кожа, текстиль и детали');},[],2.25)
     .to(pose,{x:1.65,y:models[current.vehicle].height*.8,z:.1,tx:0,ty:models[current.vehicle].height*.65,tz:.4,fov:60,duration:.8,ease:'power2.inOut'},2.25)
     .to(pose,{...cabin(),duration:1.1,ease:'power2.inOut'},3.05)
     .call(()=>setDetail('cabin'),[],4.15)
     .to(fx.strength,{value:.55,duration:.6},3.65)
     .to(fx.progress,{value:1,duration:2.3,ease:'none'},3.65)
     .to(fx.strength,{value:0,duration:.5},5.7)
     .to(pose,{...entrance(),duration:1.6,ease:'power2.inOut'},6.2)
     .call(()=>setDetail('door'),[],7.8);
  }
  function animateEffect(effect,done){
    kill();activeEffect=effect;fx.mode.value=modeIds[effect];fx.progress.value=0;
    if(reduced){Object.assign(pose,restPose());setDetail(current.key==='refresh'?'door':'body');activeEffect=current.key;stage.dataset.effect=current.key;invalidate();report('Состав выбран · модель можно повернуть');return;}
    const t=createTimeline(done);setDetail('body');
    if(effect==='refresh'||effect==='interior')addInterior(t);
    else{
      const dest=effect==='protect'?front():outside();
      if(effect==='wheels')Object.assign(dest,{x:5.2,y:1.3,z:2.1,ty:.48,fov:36});
      if(effect==='glass')Object.assign(dest,{x:3.3,y:2.8,z:4.3,ty:1,fov:34});
      const {door,light,...view}=dest;
      t.to(pose,{door:0,light:0,duration:.4,ease:'power2.inOut'},0)
       .to(pose,{...view,duration:1.15,ease:'power2.inOut'},0)
       .to(fx.strength,{value:1,duration:.5},.9)
       .to(fx.progress,{value:1,duration:effect==='protect'?3.7:2.7,ease:'none'},1.15)
       .to(fx.strength,{value:0,duration:.55},effect==='protect'?4.3:3.35);
    }
    begin(t,labels[effect]);
  }
  function finish(){
    activeEffect=current.key;
    const rest=restPose();
    if(reduced||Object.keys(rest).every(key=>Math.abs(pose[key]-rest[key])<.0001)){Object.assign(pose,rest);setDetail(current.key==='refresh'?'door':'body');invalidate();report('Состав выбран · поверните модель');return;}
    const t=createTimeline(()=>{setDetail(current.key==='refresh'?'door':'body');report('Состав выбран · поверните модель');});
    t.to(pose,{...restPose(),duration:.9,ease:'power2.inOut'});begin(t,'Возвращаемся к выбранной программе');
  }
  function play(effect=current.key){if(!record||loading)return;paused=false;metrics.frames=0;metrics.slowFrames=0;metrics.worstFrame=0;animateEffect(effect,finish);}
  async function update(nextState){
    if(lost){onStatus({unavailable:true,ready:false,label:'Изображение автомобиля · 3D недоступно'});return;}
    const previous=current;current={...nextState,extras:[...nextState.extras]};
    const changedModel=!previous||previous.vehicle!==current.vehicle;
    const changedProgram=!previous||previous.key!==current.key;
    const effect=resolveVisualEffect(previous,current,loading?requestedEffect:activeEffect);
    if(effect)requestedEffect=effect;
    if(!changedModel&&!changedProgram){if(effect&&!loading)play(effect);return;}
    kill();paused=false;
    if(changedModel){
      const version=++ticket,loadStarted=performance.now();loading=true;stage.dataset.loading='true';onStatus({ready:false,vehicle:current.vehicle});report('Загружаем 3D-модель…');onStatus({progress:0});
      try{
        const item=await loadModel(current.vehicle);if(version!==ticket||disposed)return;
        record?.root.removeFromParent();record=item;scene.add(record.root);renderer.shadowMap.needsUpdate=true;shadowDoor=-1;
        Object.assign(pose,outside());applyPose();resize();
        onStatus({label:'Готовим 3D · изображение уже доступно'});
        const compileStarted=performance.now();if(!item.compiled){await renderer.compileAsync(scene,camera);item.compiled=true;}
        if(metricsEnabled){stage.dataset.downloadMs=String(Math.round(item.downloadMs));stage.dataset.decodeMs=String(Math.round(item.decodeMs));stage.dataset.compileMs=String(Math.round(performance.now()-compileStarted));stage.dataset.loadMs=String(Math.round(performance.now()-loadStarted));stage.dataset.readyMs=String(Math.round(performance.now()));}
        if(version!==ticket||disposed)return;
        loading=false;stage.dataset.loading='false';
        applyPose();renderer.render(scene,camera);stage.dataset.renderer='webgl';
        stage.dataset.model=models[current.vehicle].name;onStatus({unavailable:false,ready:true,vehicle:current.vehicle,model:models[current.vehicle].name});
        invalidate();play(requestedEffect);
      }catch(error){if(version!==ticket||disposed)return;loading=false;stage.dataset.loading='false';stage.dataset.renderer='fallback';onStatus({unavailable:true,ready:false,vehicle:current?.vehicle,label:'Изображение автомобиля · 3D недоступно'});console.warn('ATLAS: model could not load',error);}
    }else if(!loading)play();
  }
  function syncVisibility(){
    if(!visible||document.hidden){timeline?.pause();if(raf)cancelAnimationFrame(raf);raf=0;previousFrame=0;}
    else{if(!paused)timeline?.resume();invalidate();}
  }
  function setVisible(value){visible=value;syncVisibility();}
  document.addEventListener('visibilitychange',syncVisibility);
  function setReduced(value){reduced=value;kill();paused=false;if(record&&current){Object.assign(pose,restPose());setDetail(current.key==='refresh'?'door':'body');invalidate();report('Состав выбран · модель можно повернуть');}}
  function toggle(){if(loading)return;if(!timeline){play();return;}paused=!paused;syncVisibility();if(paused)timeline.pause();report();}
  function stopForInspection(){kill();paused=false;fx.strength.value=0;setDetail('inspect');report('Осмотр модели · вращайте мышью или пальцем');}
  function rotate(dx,dy){
    const delta=new THREE.Vector3(pose.x-pose.tx,pose.y-pose.ty,pose.z-pose.tz),s=new THREE.Spherical().setFromVector3(delta);
    s.theta-=dx*.009;s.phi=THREE.MathUtils.clamp(s.phi+dy*.006,.45,Math.PI*.48);s.radius=Math.max(4.4,s.radius);
    delta.setFromSpherical(s);pose.x=pose.tx+delta.x;pose.y=pose.ty+delta.y;pose.z=pose.tz+delta.z;invalidate();
  }
  function pointerDown(event){if(!record||loading||event.button!==0)return;drag={x:event.clientX,y:event.clientY,moved:false};canvas.setPointerCapture(event.pointerId);}
  function pointerMove(event){if(!drag)return;const dx=event.clientX-drag.x,dy=event.clientY-drag.y;if(!drag.moved){if(Math.abs(dx)+Math.abs(dy)<3)return;stopForInspection();drag.moved=true;if(pose.fov>60)Object.assign(pose,entrance());}rotate(dx,dy);drag.x=event.clientX;drag.y=event.clientY;}
  function pointerUp(){drag=null;}
  canvas.addEventListener('pointerdown',pointerDown);canvas.addEventListener('pointermove',pointerMove);canvas.addEventListener('pointerup',pointerUp);canvas.addEventListener('pointercancel',pointerUp);
  function keydown(event){if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home'].includes(event.key)||!record||loading)return;event.preventDefault();stopForInspection();if(event.key==='Home'){Object.assign(pose,restPose());invalidate();return;}if(pose.fov>60)Object.assign(pose,entrance());rotate(event.key==='ArrowLeft'?-18:event.key==='ArrowRight'?18:0,event.key==='ArrowUp'?-12:event.key==='ArrowDown'?12:0);}
  stage.addEventListener('keydown',keydown);
  function contextLost(event){event.preventDefault();lost=true;kill();stage.dataset.renderer='fallback';onStatus({unavailable:true,ready:false,vehicle:current?.vehicle,label:'Изображение автомобиля · 3D недоступно'});}
  canvas.addEventListener('webglcontextlost',contextLost);
  return {update,setVisible,setReduced,toggle,dispose(){disposed=true;ticket++;kill();cancelAnimationFrame(raf);resizeObserver.disconnect();document.removeEventListener('visibilitychange',syncVisibility);stage.removeEventListener('keydown',keydown);cache.forEach(disposeRecord);cache.clear();shadow.geometry.dispose();shadow.material.dispose();shadowTexture.dispose();contact.geometry.dispose();contact.material.dispose();keyLight.shadow.dispose();environment.dispose();draco.dispose();renderer.dispose();canvas.remove();}};
}
