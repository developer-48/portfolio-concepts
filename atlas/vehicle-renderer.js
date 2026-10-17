import * as THREE from '../shared/three/three.module.min.js';
import {surfaces} from './vehicle-surfaces.js?v=9';

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
    float surface=p.x+.12*sin(p.y*6.0)+.09*p.y;
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
    color+=vec3(.04,.19,.25)*film*hasFilm*(.12+filmReveal*.22);
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
  const pixels=ctx.getImageData(0,0,1200,800);
  for(let i=0;i<pixels.data.length;i+=4){
    const x=(i/4)%1200,y=Math.floor(i/4/1200);
    const strength=y<(Math.min(shape.hood[0][1],shape.hood[1][1])-.02)*800?0:pixels.data[i]*Math.max(0,Math.min(1,(shape.front*1200-x)/20));
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
  renderer.setPixelRatio(Math.min(devicePixelRatio,2.5));
  canvas.className='vehicle-canvas';canvas.setAttribute('aria-hidden','true');
  const host=stage.querySelector('.vehicle-models');
  const body=host.querySelector('.vehicle-body');body.append(canvas);
  const scene=new THREE.Scene();
  const camera=new THREE.OrthographicCamera(-1.5,1.5,1,-1,.1,10);camera.position.z=5;
  const geometry=new THREE.PlaneGeometry(3,2);
  const cache=new Map();
  const gsap=window.gsap;
  let current,record,main,extra,swap,activeExtra=null,pending=[];
  let visible=false,reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  let request=0,lost=false,userPaused=false,disposed=false,ready=false;
  const modeIds={restore:0,protect:1,refresh:2,interior:2,glass:3,wheels:4};
  const labels={restore:'Полировка · восстановление блеска',protect:'Плёнка · нанесение защитного слоя',refresh:'Салон · очистка кожи и текстиля',interior:'Салон · очистка кожи и текстиля',glass:'Стёкла · гидрофобная обработка',wheels:'Диски · очистка и защита'};
  const filmMaterial=new THREE.ShaderMaterial({vertexShader:filmVertex,fragmentShader:filmFragment,uniforms:{uPeel:{value:0},uOpacity:{value:0}},transparent:true,depthWrite:false,side:THREE.DoubleSide});
  const filmMesh=new THREE.Mesh(new THREE.PlaneGeometry(1,1,32,24),filmMaterial);filmMesh.position.z=.1;filmMesh.renderOrder=3;scene.add(filmMesh);
  const interior=stage.querySelector('.interior-detail');
  let interiorRequest=0;
  async function showInterior(show,instant=false){
    if(!interior)return;
    const ticket=++interiorRequest;
    if(show){
      const image=interior.querySelector(`[data-cabin="${current?.vehicle}"]`);
      try{await image?.decode();}catch{return;}
      if(ticket!==interiorRequest||disposed)return;
    }
    gsap?.killTweensOf([interior,body]);
    if(!gsap||instant||reduced){interior.style.opacity=show?'1':'0';body.style.opacity=show?'0':'1';}
    else {
      gsap.to(interior,{opacity:show?1:0,duration:.45,ease:'power2.inOut',overwrite:true});
      gsap.to(body,{opacity:show?0:1,duration:.45,ease:'power2.inOut',overwrite:true});
    }
    stage.dataset.detail=show?'interior':'body';
  }
  function draw(){if(!disposed&&!lost&&visible)renderer.render(scene,camera);}
  function clock(){return extra||main||swap;}
  function report(label){const t=clock();onStatus({playing:!!t&&t.progress()<1,paused:userPaused,progress:t?t.progress():ready?1:0,label,reduced});}
  function tick(){draw();report();}
  function run(t){if(visible&&!document.hidden&&!userPaused)t.play();}
  function fit(){
    const width=host.clientWidth,height=host.clientHeight;if(!width||!height)return;
    // Match dense displays without letting large canvases grow unbounded.
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
      const x=top[0]*(1-v)+bottom[0]*v,y=top[1]*(1-v)+bottom[1]*v;
      positions.setXYZ(i,(x-.5)*3,(.5-y)*2,.015*Math.sin(u*Math.PI));
    }
    positions.needsUpdate=true;
  }
  async function getRecord(key){
    if(cache.has(key))return cache.get(key);
    const image=images.find(item=>item.dataset.vehicle===key);await image.decode();
    if(disposed)return null;if(cache.has(key))return cache.get(key);
    const photo=new THREE.Texture(image);photo.colorSpace=THREE.SRGBColorSpace;
    photo.generateMipmaps=false;photo.minFilter=THREE.LinearFilter;photo.magFilter=THREE.LinearFilter;photo.needsUpdate=true;
    const shape=surfaces[key],maps=makeMaps(shape);
    const wheel=([x,y,rx,ry])=>new THREE.Vector4(x/1200,y/800,rx/1200,ry/800);
    const uniforms={uPhoto:{value:photo},uZones:{value:maps.zones},uFilm:{value:maps.film},uProgress:{value:1},uMode:{value:0},uProgram:{value:0},uOpacity:{value:0},uMotion:{value:reduced?0:1},uExtraMode:{value:-1},uExtraProgress:{value:1},uSelected:{value:new THREE.Vector3()},uPointer:{value:new THREE.Vector2()},uWheelA:{value:wheel(shape.wheels[0])},uWheelB:{value:wheel(shape.wheels[1])}};
    const material=new THREE.ShaderMaterial({vertexShader,fragmentShader,uniforms,transparent:true,depthWrite:false});
    const mesh=new THREE.Mesh(geometry,material);mesh.visible=false;scene.add(mesh);
    const value={mesh,uniforms,photo,...maps};cache.set(key,value);return value;
  }
  function updateSelections(){
    if(!record)return;
    record.uniforms.uSelected.value.set(Number(current.extras.includes('glass')),Number(current.extras.includes('wheels')),Number(current.extras.includes('interior')));
  }
  function killExtra(){
    extra?.kill();extra=null;activeExtra=null;
    if(record){record.uniforms.uExtraMode.value=-1;record.uniforms.uExtraProgress.value=1;}
    showInterior(current?.key==='refresh');
  }
  function cancel(){
    main?.kill();main=null;swap?.kill();swap=null;killExtra();pending=[];
    filmMaterial.uniforms.uOpacity.value=0;filmMaterial.uniforms.uPeel.value=0;
  }
  function finish(){
    cancel();userPaused=false;
    cache.forEach(value=>{value.mesh.visible=value===record;value.uniforms.uOpacity.value=value===record?1:0;});
    if(record){record.uniforms.uProgress.value=1;record.uniforms.uMotion.value=0;}
    showInterior(current?.key==='refresh',true);
    draw();report('Состав выбран · можно сохранить расчёт');
  }
  function nextExtra(){
    if(!record||!ready||main||extra||swap||reduced||lost)return;
    pending=pending.filter(key=>current.extras.includes(key)&&!(current.key==='refresh'&&key==='interior'));
    const key=pending.shift();
    if(!key){stage.dataset.effect=current.key;report('Обработка показана · ваш состав готов');return;}
    activeExtra=key;
    const u=record.uniforms;
    u.uExtraMode.value=modeIds[key];u.uExtraProgress.value=0;u.uMotion.value=1;
    showInterior(key==='interior');
    stage.dataset.effect=key;
    extra=gsap.timeline({paused:true,onUpdate:tick,onComplete:()=>{
      extra=null;activeExtra=null;u.uExtraMode.value=-1;u.uExtraProgress.value=1;
      showInterior(current.key==='refresh');draw();nextExtra();
    }});
    extra.fromTo(u.uExtraProgress,{value:0},{value:1,duration:key==='interior'?4.4:3.2,ease:'none'});
    report(labels[key]);run(extra);
  }
  function play(){
    if(!record||!current)return;
    cancel();userPaused=false;ready=true;
    if(reduced||lost||!gsap){finish();return;}
    const u=record.uniforms,key=current.key;
    u.uMode.value=modeIds[key];u.uProgress.value=0;u.uMotion.value=1;
    pending=current.extras.filter(item=>!(key==='refresh'&&item==='interior'));
    showInterior(key==='refresh');stage.dataset.effect=key;
    main=gsap.timeline({paused:true,onUpdate:tick,onComplete:()=>{
      main=null;u.uProgress.value=1;filmMaterial.uniforms.uOpacity.value=0;draw();nextExtra();
    }});
    main.fromTo(u.uProgress,{value:0},{value:1,duration:key==='protect'?5.5:key==='restore'?4.6:4.4,ease:'none'},0);
    if(key==='protect'){
      main.set(filmMaterial.uniforms.uPeel,{value:1},0);
      main.fromTo(filmMaterial.uniforms.uOpacity,{value:0},{value:1,duration:.7},.2);
      main.to(filmMaterial.uniforms.uPeel,{value:0,duration:3.2,ease:'power2.inOut'},.7);
      main.to(filmMaterial.uniforms.uOpacity,{value:0,duration:.8},4.2);
    }
    report(labels[key]);run(main);
  }
  async function update(next){
    const previous=current;
    const sameScene=previous?.vehicle===next.vehicle&&previous?.key===next.key;
    current={...next,extras:[...next.extras]};
    if(sameScene){
      updateSelections();
      if(ready){
        pending=pending.filter(key=>next.extras.includes(key));
        const added=next.extras.filter(key=>!previous.extras.includes(key)&&!(next.key==='refresh'&&key==='interior'));
        pending=[...new Set([...pending,...added])];
        if(activeExtra&&!next.extras.includes(activeExtra))killExtra();
        if(!reduced)nextExtra();
      }
      draw();return;
    }
    const ticket=++request,changedVehicle=previous?.vehicle!==next.vehicle;
    ready=false;cancel();userPaused=false;showInterior(false,true);
    const nextRecord=await getRecord(next.vehicle);
    if(ticket!==request||disposed||!nextRecord)return;
    const old=record;record=nextRecord;
    const u=record.uniforms;
    u.uProgram.value=modeIds[current.key];u.uMode.value=modeIds[current.key];u.uProgress.value=1;
    u.uExtraMode.value=-1;u.uExtraProgress.value=1;updateSelections();
    cache.forEach(value=>{value.mesh.visible=value===record;value.uniforms.uOpacity.value=value===record?1:0;});
    hood(surfaces[current.vehicle]);fit();stage.dataset.renderer='webgl';
    if(changedVehicle&&old&&old!==record&&visible&&!reduced&&gsap){
      old.mesh.visible=true;old.uniforms.uOpacity.value=1;u.uOpacity.value=0;
      swap=gsap.timeline({paused:true,onUpdate:draw,onComplete:()=>{old.mesh.visible=false;swap=null;play();}})
        .to(old.uniforms.uOpacity,{value:0,duration:.35},0).to(u.uOpacity,{value:1,duration:.55},.08);
      run(swap);
    }else play();
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
  return {update,setVisible,setReduced,toggle,pointer,dispose(){disposed=true;request++;cancel();interiorRequest++;gsap?.killTweensOf([interior,body]);resize.disconnect();document.removeEventListener('visibilitychange',visibility);cache.forEach(value=>{value.photo.dispose();value.zones.dispose();value.film.dispose();value.mesh.material.dispose();});geometry.dispose();filmMesh.geometry.dispose();filmMaterial.dispose();renderer.dispose();canvas.remove();}};
}
