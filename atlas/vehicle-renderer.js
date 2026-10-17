import * as THREE from '../shared/three/three.module.min.js';
import {surfaces} from './vehicle-surfaces.js?v=9';
import {frontSurfaces} from './vehicle-front-surfaces.js?v=11';

const vertexShader = `
  varying vec2 vUv;
  void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }
`;
const fragmentShader = `
  uniform sampler2D uPhoto;
  uniform sampler2D uZones;
  uniform sampler2D uFilm;
  uniform float uProgress;
  uniform float uMode;
  uniform float uProgram;
  uniform float uFrontal;
  uniform float uOpacity;
  uniform float uMotion;
  uniform float uExtraMode;
  uniform float uExtraProgress;
  uniform vec3 uSelected;
  uniform vec2 uPointer;
  uniform vec4 uWheelA;
  uniform vec4 uWheelB;
  varying vec2 vUv;
  float band(float x,float center,float width){return exp(-pow((x-center)/width,2.0));}
  float wheelLight(vec2 p,vec4 wheel,float phase){
    vec2 q=(p-wheel.xy)/wheel.zw;
    float rim=band(length(q),.9,.12);
    float arc=pow(max(0.0,cos(atan(q.y,q.x)-phase*6.283)),12.0);
    return rim*(.16+arc*1.5);
  }
  void main(){
    vec2 p=vec2(vUv.x,1.0-vUv.y);
    vec4 photo=texture2D(uPhoto,vUv);
    vec3 zone=texture2D(uZones,vUv).rgb;
    float film=texture2D(uFilm,vUv).r;
    float polish=1.0-step(.5,abs(uMode));
    float protection=1.0-step(.5,abs(uMode-1.0));
    float glass=1.0-step(.5,abs(uExtraMode-3.0));
    float wheels=1.0-step(.5,abs(uExtraMode-4.0));
    float effect=smoothstep(0.0,.08,uProgress)*(1.0-smoothstep(.86,1.0,uProgress))*uMotion;
    float phase=mix(-.25,1.45,uProgress);
    // Curved coordinates make the lighting wrap across the photographed panels.
    float surface=mix(p.x+.12*sin(p.y*6.0)+.09*p.y,p.y+.025*cos(p.x*6.283),uFrontal);
    float line=band(surface,phase,.009);
    float glow=band(surface,phase,.065);
    float second=band(surface,phase-.07,.017);
    float luminance=dot(photo.rgb,vec3(.21,.72,.07));
    vec3 color=photo.rgb;
    float shine=zone.r*(line*1.05+glow*.25+second*.12)*effect*polish;
    color+=vec3(.53,.79,1.0)*shine*(.65+luminance);
    // A restrained clear layer remains after the film settles on the paint.
    float hasFilm=1.0-step(.5,abs(uProgram-1.0));
    float filmReveal=smoothstep(surface-.05,surface+.05,phase);
    color+=vec3(.04,.19,.25)*film*hasFilm*(.12+filmReveal*.22)*mix(1.0,.16,uFrontal);
    float gridX=pow(.5+.5*cos((p.x+.12*p.y)*340.0),20.0);
    float gridY=pow(.5+.5*cos((p.y-.05*sin(p.x*6.0))*340.0),20.0);
    float filmDetail=(max(gridX,gridY)*.16+line*1.1+glow*.35)*film*protection*effect;
    color+=vec3(.24,.83,1.0)*filmDetail;
    // Extras have an independent clock; they never overwrite the body treatment.
    float extraEffect=sin(clamp(uExtraProgress,0.0,1.0)*3.14159)*uMotion;
    float extraPhase=mix(.2,1.15,uExtraProgress);
    float glassLight=band(p.x+p.y*.18,extraPhase,.055);
    color+=zone.g*glass*extraEffect*vec3(.24,.35,.39)*glassLight;
    color+=zone.g*uSelected.x*vec3(.003,.009,.012);
    float rims=wheelLight(p,uWheelA,uExtraProgress)+wheelLight(p,uWheelB,uExtraProgress);
    color+=zone.b*wheels*extraEffect*vec3(.14,.18,.20)*rims;
    color+=zone.b*uSelected.y*vec3(.008,.010,.012);
    // The user can inspect reflections by moving the pointer; no idle oscillation.
    float pointerLight=band(surface,uPointer.x*.5+.35,.12)*uPointer.y;
    color+=zone.r*pointerLight*vec3(.07,.10,.12);
    gl_FragColor=vec4(color,photo.a*uOpacity);
    #include <colorspace_fragment>
  }
`;
const filmVertex = `
  uniform float uPeel;
  varying vec2 vUv;
  void main(){
    vUv=uv;
    vec3 p=position;
    float curl=sin(uv.y*1.5708)*uPeel;
    p.y+=curl*.27;
    p.x+=sin(uv.x*3.14159)*curl*.035;
    p.z+=curl*.42;
    gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0);
  }
`;
const filmFragment = `
  uniform float uOpacity;
  uniform float uPeel;
  varying vec2 vUv;
  void main(){
    float edge=1.0-smoothstep(.0,.035,min(min(vUv.x,1.0-vUv.x),min(vUv.y,1.0-vUv.y)));
    float roll=exp(-pow((vUv.y-(.22+uPeel*.5))/.075,2.0));
    float weave=pow(.5+.5*cos(vUv.x*180.0),24.0)*.04;
    vec3 col=mix(vec3(.13,.5,.6),vec3(.78,.97,1.0),min(1.0,edge*.7+roll*.7));
    gl_FragColor=vec4(col,(.08+edge*.5+roll*.3+weave)*uOpacity);
    #include <colorspace_fragment>
  }
`;

function makeMaps(shape) {
  const canvas=document.createElement('canvas');canvas.width=1200;canvas.height=800;
  const ctx=canvas.getContext('2d');
  ctx.fillStyle='#000';ctx.fillRect(0,0,1200,800);
  const fill=(path,color)=>{ctx.fillStyle=color;ctx.fill(new Path2D(path));};
  fill(shape.paint,'#f00');
  shape.voids.forEach(path=>fill(path,'#000'));
  shape.glass.forEach(path=>fill(path,'#0f0'));
  shape.wheels.forEach(([x,y,rx,ry])=>{
    ctx.fillStyle='#000';ctx.beginPath();ctx.ellipse(x,y,rx+10,ry+8,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#00f';ctx.beginPath();ctx.ellipse(x,y,rx*.88,ry*.86,0,0,Math.PI*2);ctx.fill();
  });
  const zones=new THREE.CanvasTexture(canvas);
  zones.colorSpace=THREE.NoColorSpace;
  const filmCanvas=document.createElement('canvas');filmCanvas.width=1200;filmCanvas.height=800;
  const fc=filmCanvas.getContext('2d');
  if(shape.filmPath){fc.fillStyle='white';fc.fill(new Path2D(shape.filmPath));}
  const coverage=shape.filmPath?fc.getImageData(0,0,1200,800).data:null;
  const pixels=ctx.getImageData(0,0,1200,800);
  for(let i=0;i<pixels.data.length;i+=4){
    const x=(i/4)%1200,y=Math.floor(i/4/1200);
    const strength=coverage?pixels.data[i]*coverage[i+3]/255:y<(Math.min(shape.hood[0][1],shape.hood[1][1])-.02)*800?0:pixels.data[i]*Math.max(0,Math.min(1,(shape.front*1200-x)/20));
    pixels.data[i]=pixels.data[i+1]=pixels.data[i+2]=strength;
  }
  fc.putImageData(pixels,0,0);
  fc.fillStyle='white';fc.fill(new Path2D(shape.mirror));
  const film=new THREE.CanvasTexture(filmCanvas);film.colorSpace=THREE.NoColorSpace;
  return {zones,film};
}

export function createVehicleScene(stage,images,onStatus) {
  const canvas=document.createElement('canvas');
  const context=canvas.getContext('webgl2',{alpha:true,antialias:true,powerPreference:'low-power'});
  if(!context)throw new Error('WebGL unavailable');
  const renderer=new THREE.WebGLRenderer({canvas,context,alpha:true,antialias:true});
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.debug.onShaderError=()=>{throw new Error('Treatment renderer could not compile');};
  canvas.className='vehicle-canvas';canvas.setAttribute('aria-hidden','true');
  const host=stage.querySelector('.vehicle-models');
  const body=host.querySelector('.vehicle-body');body.append(canvas);
  const entry=host.querySelector('.vehicle-entry');
  const interior=host.querySelector('.interior-detail');
  const frame=interior.querySelector('.cabin-frame');
  const cabinLight=interior.querySelector('.cabin-light');
  const scene=new THREE.Scene();
  const camera=new THREE.OrthographicCamera(-1.5,1.5,1,-1,.1,10);camera.position.z=5;
  const geometry=new THREE.PlaneGeometry(3,2);
  const cache=new Map(),gsap=window.gsap;
  let current,record,programRecord,sideRecord,main,extra,swap,activeExtra=null,pending=[];
  let visible=false,reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  let request=0,lost=false,userPaused=false,disposed=false,ready=false;
  const modeIds={restore:0,protect:1,refresh:2,interior:2,glass:3,wheels:4};
  const labels={restore:'Полировка · восстановление блеска',protect:'Плёнка · сканирование передней части',refresh:'Салон · кожа, текстиль и детали',interior:'Салон · кожа, текстиль и детали',glass:'Стёкла · гидрофобная обработка',wheels:'Диски · очистка и защита'};
  const filmMaterial=new THREE.ShaderMaterial({vertexShader:filmVertex,fragmentShader:filmFragment,uniforms:{uPeel:{value:0},uOpacity:{value:0}},transparent:true,depthWrite:false,side:THREE.DoubleSide});
  const filmMesh=new THREE.Mesh(new THREE.PlaneGeometry(1,1,32,24),filmMaterial);filmMesh.position.z=.1;filmMesh.renderOrder=3;scene.add(filmMesh);

  function resetDetail(detail='body'){
    const cabin=detail==='cabin';
    if(gsap){
      gsap.set([body,entry,frame],{clearProps:'transform'});
      gsap.set(body,{opacity:cabin?0:1});gsap.set(entry,{opacity:0});
      gsap.set(interior,{opacity:cabin?1:0});gsap.set(cabinLight,{opacity:0,xPercent:0});
    }else{body.style.opacity=cabin?'0':'1';entry.style.opacity='0';interior.style.opacity=cabin?'1':'0';}
    stage.dataset.detail=detail;
  }
  // Camera cuts and material animation share one timeline: pause, visibility and
  // cancellation apply to every layer, including the transition into the cabin.
  function addInterior(t,at=0){
    t.call(()=>{stage.dataset.detail='entry';report('Обзор автомобиля · открываем салон');},[],at)
      .to(body,{opacity:0,xPercent:-5,scale:.97,duration:.85,ease:'power2.inOut'},at)
      .fromTo(entry,{opacity:0,xPercent:5,scale:.96},{opacity:1,xPercent:0,scale:1,duration:1.1,ease:'power2.inOut'},at)
      .call(()=>{stage.dataset.detail='cabin';report('Переходим в салон');},[],at+1.9)
      .to(entry,{opacity:0,scale:1.13,xPercent:-3,duration:1.15,ease:'power2.inOut'},at+1.9)
      .to(interior,{opacity:1,duration:1.1,ease:'power2.inOut'},at+2.15)
      .fromTo(frame,{scale:1.09},{scale:1,duration:2,ease:'power2.out'},at+2.15)
      .call(()=>report(labels.interior),[],at+3.4)
      .fromTo(cabinLight,{xPercent:-70,opacity:0},{xPercent:60,opacity:.65,duration:2,ease:'sine.inOut'},at+3.5)
      .to(cabinLight,{opacity:0,duration:.5},at+5.1);
  }
  function draw(){if(!disposed&&!lost&&visible)renderer.render(scene,camera);}
  function clock(){return extra||main||swap;}
  function report(label){const t=clock();onStatus({playing:!!t&&t.progress()<1,paused:userPaused&&!!t,progress:t?t.progress():ready?1:0,label,reduced});}
  function tick(){draw();report();}
  function run(t){if(visible&&!document.hidden&&!userPaused)t.play();}
  function fit(){
    const width=host.clientWidth,height=host.clientHeight;if(!width||!height)return;
    const ratio=Math.min(devicePixelRatio||1,2.5,Math.sqrt(2200000/(width*height)));
    if(renderer.getPixelRatio()!==ratio)renderer.setPixelRatio(ratio);
    renderer.setSize(width,height,false);
    const aspect=width/height;
    const halfW=aspect>1.5?aspect:1.5,halfH=aspect>1.5?1:1.5/aspect;
    camera.left=-halfW;camera.right=halfW;camera.top=halfH;camera.bottom=-halfH;camera.updateProjectionMatrix();draw();
  }
  const resize=new ResizeObserver(fit);resize.observe(host);
  function hood(shape){
    const points=shape.hood,positions=filmMesh.geometry.attributes.position,uv=filmMesh.geometry.attributes.uv;
    for(let i=0;i<positions.count;i++){
      const u=uv.getX(i),v=uv.getY(i);
      const top=[points[0][0]*(1-u)+points[1][0]*u,points[0][1]*(1-u)+points[1][1]*u];
      const bottom=[points[2][0]*(1-u)+points[3][0]*u,points[2][1]*(1-u)+points[3][1]*u];
      positions.setXYZ(i,(top[0]*(1-v)+bottom[0]*v-.5)*3,(.5-top[1]*(1-v)-bottom[1]*v)*2,.015*Math.sin(u*Math.PI));
    }
    positions.needsUpdate=true;
  }
  async function getRecord(vehicle,angle){
    const key=vehicle+':'+angle;if(cache.has(key))return cache.get(key);
    const image=images.find(item=>item.dataset.vehicle===vehicle&&item.dataset.angle===angle);await image.decode();
    if(disposed)return null;if(cache.has(key))return cache.get(key);
    const photo=new THREE.Texture(image);photo.colorSpace=THREE.SRGBColorSpace;
    photo.generateMipmaps=false;photo.minFilter=THREE.LinearFilter;photo.magFilter=THREE.LinearFilter;photo.needsUpdate=true;
    const shape=angle==='front'?frontSurfaces[vehicle]:surfaces[vehicle],maps=makeMaps(shape);
    const wheel=([x,y,rx,ry])=>new THREE.Vector4(x/1200,y/800,rx/1200,ry/800);
    const uniforms={uPhoto:{value:photo},uZones:{value:maps.zones},uFilm:{value:maps.film},uProgress:{value:1},uMode:{value:0},uProgram:{value:0},uFrontal:{value:angle==='front'?1:0},uOpacity:{value:0},uMotion:{value:reduced?0:1},uExtraMode:{value:-1},uExtraProgress:{value:1},uSelected:{value:new THREE.Vector3()},uPointer:{value:new THREE.Vector2()},uWheelA:{value:wheel(shape.wheels[0])},uWheelB:{value:wheel(shape.wheels[1])}};
    const mesh=new THREE.Mesh(geometry,new THREE.ShaderMaterial({vertexShader,fragmentShader,uniforms,transparent:true,depthWrite:false}));mesh.visible=false;scene.add(mesh);
    const value={mesh,uniforms,photo,shape,angle,...maps};cache.set(key,value);return value;
  }
  function updateSelections(){
    for(const value of [sideRecord,programRecord])if(value){
      value.uniforms.uSelected.value.set(Number(current.extras.includes('glass')),Number(current.extras.includes('wheels')),Number(current.extras.includes('interior')));
      value.uniforms.uProgram.value=modeIds[current.key];
    }
  }
  function activate(value){
    if(!value)return;record=value;
    cache.forEach(item=>{item.mesh.visible=item===value;item.uniforms.uOpacity.value=item===value?1:0;item.mesh.position.x=0;item.mesh.scale.setScalar(1);});
    hood(value.shape);stage.dataset.angle=value.angle;
  }
  function changeAngle(value,t){
    const old=record;if(!old||old===value){activate(value);return 0;}
    activate(value);old.mesh.visible=true;old.uniforms.uOpacity.value=1;value.uniforms.uOpacity.value=0;
    t.to(old.uniforms.uOpacity,{value:0,duration:.55,ease:'power2.inOut'},0)
      .to(value.uniforms.uOpacity,{value:1,duration:.8,ease:'power2.inOut'},0)
      .fromTo(value.mesh.position,{x:.09},{x:0,duration:.8,ease:'power2.out'},0)
      .call(()=>{old.mesh.visible=false;},[],.8);
    return .8;
  }
  function killExtra(){
    extra?.kill();extra=null;activeExtra=null;
    cache.forEach(value=>{value.uniforms.uExtraMode.value=-1;value.uniforms.uExtraProgress.value=1;});
  }
  function cancel(){
    main?.kill();main=null;swap?.kill();swap=null;killExtra();pending=[];
    filmMaterial.uniforms.uOpacity.value=0;filmMaterial.uniforms.uPeel.value=0;
  }
  function finish(){
    cancel();userPaused=false;activate(programRecord);
    if(record){record.uniforms.uProgress.value=1;record.uniforms.uMotion.value=0;}
    resetDetail(current?.key==='refresh'?'cabin':'body');draw();report('Состав выбран · можно сохранить расчёт');
  }
  function settle(){
    const detail=current.key==='refresh'?'cabin':'body';
    if(record===programRecord&&stage.dataset.detail===detail){report('Обработка показана · ваш состав готов');return;}
    swap=gsap.timeline({paused:true,onUpdate:tick,onComplete:()=>{
      swap=null;resetDetail(detail);draw();
      if(pending.length)nextExtra();else report('Обработка показана · ваш состав готов');
    }});
    changeAngle(programRecord,swap);
    swap.to(body,{opacity:detail==='body'?1:0,xPercent:0,scale:1,duration:.65,ease:'power2.inOut'},0)
      .to(entry,{opacity:0,duration:.65},0)
      .to(interior,{opacity:detail==='cabin'?1:0,duration:.65,ease:'power2.inOut'},0);
    stage.dataset.detail=detail;report('Возвращаемся к выбранной программе');run(swap);
  }
  function nextExtra(){
    if(!record||!ready||main||extra||swap||reduced||lost)return;
    pending=pending.filter(key=>current.extras.includes(key)&&!(current.key==='refresh'&&key==='interior'));
    const key=pending.shift();
    if(!key){stage.dataset.effect=current.key;settle();return;}
    activeExtra=key;stage.dataset.effect=key;
    extra=gsap.timeline({paused:true,onUpdate:tick,onComplete:()=>{
      extra=null;activeExtra=null;record.uniforms.uExtraMode.value=-1;record.uniforms.uExtraProgress.value=1;
      draw();nextExtra();
    }});
    const wasCabin=stage.dataset.detail==='cabin';
    const offset=changeAngle(key==='wheels'||key==='interior'?sideRecord:programRecord,extra);
    resetDetail();
    if(wasCabin){gsap.set(interior,{opacity:1});gsap.set(body,{opacity:0});extra.to(interior,{opacity:0,duration:.65},0).to(body,{opacity:1,duration:.65},0);}
    const start=Math.max(offset,wasCabin ? .65 : 0),u=record.uniforms;
    u.uExtraMode.value=modeIds[key];u.uExtraProgress.value=0;u.uMotion.value=1;
    extra.fromTo(u.uExtraProgress,{value:0},{value:1,duration:key==='interior'?6.2:3.2,ease:'none'},start);
    if(key==='interior')addInterior(extra,start);
    report(labels[key]);run(extra);
  }
  function play(){
    if(!programRecord||!current)return;
    cancel();userPaused=false;ready=true;activate(programRecord);resetDetail();
    if(reduced||lost||!gsap){finish();return;}
    const u=record.uniforms,key=current.key;
    u.uMode.value=modeIds[key];u.uProgress.value=0;u.uMotion.value=1;
    pending=current.extras.filter(item=>!(key==='refresh'&&item==='interior'));stage.dataset.effect=key;
    main=gsap.timeline({paused:true,onUpdate:tick,onComplete:()=>{
      main=null;u.uProgress.value=1;filmMaterial.uniforms.uOpacity.value=0;draw();nextExtra();
    }});
    main.fromTo(u.uProgress,{value:0},{value:1,duration:key==='protect'?5.8:key==='restore'?4.6:6.2,ease:'none'},0);
    if(key==='protect'){
      main.set(filmMaterial.uniforms.uPeel,{value:1},0)
        .fromTo(filmMaterial.uniforms.uOpacity,{value:0},{value:1,duration:.7},.3)
        .to(filmMaterial.uniforms.uPeel,{value:0,duration:3.4,ease:'power2.inOut'},.9)
        .to(filmMaterial.uniforms.uOpacity,{value:0,duration:.8},4.5);
    }
    if(key==='refresh')addInterior(main);
    report(labels[key]);run(main);
  }
  async function update(next){
    const previous=current,sameScene=previous?.vehicle===next.vehicle&&previous?.key===next.key;
    current={...next,extras:[...next.extras]};
    if(sameScene){
      updateSelections();
      if(ready){
        pending=pending.filter(key=>next.extras.includes(key));
        const added=next.extras.filter(key=>!previous.extras.includes(key)&&!(next.key==='refresh'&&key==='interior'));
        pending=[...new Set([...pending,...added])];
        if(activeExtra&&!next.extras.includes(activeExtra)){killExtra();activate(programRecord);resetDetail(current.key==='refresh'?'cabin':'body');report();}
        if(!reduced)nextExtra();
      }
      draw();return;
    }
    const ticket=++request;ready=false;cancel();userPaused=false;resetDetail();
    const ownImages=[...host.querySelectorAll(`.scene-vehicle-image[data-vehicle="${next.vehicle}"]`)];
    const [side,front]=await Promise.all([getRecord(next.vehicle,'side'),getRecord(next.vehicle,'front'),...ownImages.map(image=>image.decode())]);
    if(ticket!==request||disposed||!side||!front)return;
    sideRecord=side;programRecord=current.key==='protect'?front:side;updateSelections();
    programRecord.uniforms.uMode.value=modeIds[current.key];programRecord.uniforms.uProgress.value=1;
    stage.dataset.renderer='webgl';fit();
    if(record&&record!==programRecord&&visible&&!reduced&&gsap){
      swap=gsap.timeline({paused:true,onUpdate:tick,onComplete:()=>{swap=null;play();}});
      changeAngle(programRecord,swap);report('Меняем ракурс автомобиля');run(swap);
    }else{activate(programRecord);play();}
    draw();
  }
  function setVisible(value){
    visible=value;
    if(!value||document.hidden){main?.pause();extra?.pause();swap?.pause();return;}
    fit();if(!userPaused&&!reduced){main?.resume();extra?.resume();swap?.resume();}draw();
  }
  function setReduced(value){reduced=value;if(value)finish();else if(visible)play();}
  function toggle(){
    if(!clock()){play();return;}
    userPaused=!userPaused;
    if(userPaused){main?.pause();extra?.pause();swap?.pause();}else if(visible&&!document.hidden){main?.resume();extra?.resume();swap?.resume();}
    report();
  }
  function pointer(x,y){if(!record||reduced)return;record.uniforms.uPointer.value.set(x,y);draw();}
  function visibility(){setVisible(visible);}
  document.addEventListener('visibilitychange',visibility);
  canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();lost=true;main?.pause();extra?.pause();swap?.pause();stage.dataset.renderer='fallback';onStatus({unavailable:true});});
  canvas.addEventListener('webglcontextrestored',()=>{lost=false;stage.dataset.renderer='webgl';onStatus({unavailable:false});fit();play();});
  return {update,setVisible,setReduced,toggle,pointer,dispose(){disposed=true;request++;cancel();resize.disconnect();document.removeEventListener('visibilitychange',visibility);cache.forEach(value=>{value.photo.dispose();value.zones.dispose();value.film.dispose();value.mesh.material.dispose();});geometry.dispose();filmMesh.geometry.dispose();filmMaterial.dispose();renderer.dispose();canvas.remove();}};
}
