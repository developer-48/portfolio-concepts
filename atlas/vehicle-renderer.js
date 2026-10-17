import * as THREE from '../shared/three/three.module.min.js';
import {surfaces} from './vehicle-surfaces.js?v=8';

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
    float cabin=1.0-step(.5,abs(uMode-2.0));
    float glass=1.0-step(.5,abs(uMode-3.0));
    float wheels=1.0-step(.5,abs(uMode-4.0));
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
    // Warm light is contained inside the cabin glazing, without colouring the body.
    float warm=zone.g*(band(p.x,phase,.15)*.85+.12)*cabin*effect;
    color+=vec3(1.0,.51,.17)*warm;
    color+=zone.g*uSelected.z*vec3(.035,.018,.006);
    // A hydrophobic sweep and small travelling highlights only touch the glass.
    vec2 cells=p*vec2(82.0,61.0)+vec2(0.0,uProgress*12.0);
    vec2 cell=fract(cells)-.5;
    float seed=fract(sin(dot(floor(cells),vec2(12.9898,78.233)))*43758.5453);
    float beads=band(length(cell),.10,.03)*step(.64,seed);
    color+=zone.g*glass*effect*vec3(.3,.75,1.0)*(glow*.6+line*.9+beads*.4);
    color+=zone.g*uSelected.x*vec3(.005,.018,.024);
    float rims=wheelLight(p,uWheelA,uProgress)+wheelLight(p,uWheelB,uProgress);
    color+=zone.b*wheels*effect*vec3(.55,.82,1.0)*rims;
    color+=zone.b*uSelected.y*vec3(.025,.032,.038);
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
  if(!context) throw new Error('WebGL unavailable');
  const renderer=new THREE.WebGLRenderer({canvas,context,alpha:true,antialias:true});
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.debug.onShaderError=()=>{throw new Error('Treatment renderer could not compile');};
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
  canvas.className='vehicle-canvas';canvas.setAttribute('aria-hidden','true');
  const host=stage.querySelector('.vehicle-models');host.append(canvas);
  const scene=new THREE.Scene();
  const camera=new THREE.OrthographicCamera(-1.5,1.5,1,-1,.1,10);camera.position.z=5;
  const geometry=new THREE.PlaneGeometry(3,2);
  const cache=new Map();
  const gsap=window.gsap;
  let current,record,timeline,swap,visible=false,reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  let request=0,lost=false,userPaused=false,started=false,disposed=false;
  const modeIds={restore:0,protect:1,refresh:2,interior:2,glass:3,wheels:4};
  const labels={restore:'Полировка · восстановление блеска',protect:'Плёнка · нанесение защитного слоя',refresh:'Салон · деликатная обработка',interior:'Салон · деликатная обработка',glass:'Стёкла · гидрофобная защита',wheels:'Диски · очистка и покрытие'};
  const filmMaterial=new THREE.ShaderMaterial({vertexShader:filmVertex,fragmentShader:filmFragment,uniforms:{uPeel:{value:0},uOpacity:{value:0}},transparent:true,depthWrite:false,side:THREE.DoubleSide});
  const filmMesh=new THREE.Mesh(new THREE.PlaneGeometry(1,1,32,24),filmMaterial);filmMesh.position.z=.1;filmMesh.renderOrder=3;scene.add(filmMesh);
  function draw(){if(!disposed&&!lost&&visible)renderer.render(scene,camera);}
  function report(label){onStatus({playing:!!timeline?.isActive(),paused:userPaused,progress:timeline?.progress()||0,label,reduced});}
  function fit(){
    const width=host.clientWidth,height=host.clientHeight;if(!width||!height)return;
    renderer.setSize(width,height,false);
    const aspect=width/height;
    const halfW=aspect>1.5?aspect:1.5,halfH=aspect>1.5?1:1.5/aspect;
    camera.left=-halfW;camera.right=halfW;camera.top=halfH;camera.bottom=-halfH;camera.updateProjectionMatrix();draw();
  }
  const resize=new ResizeObserver(fit);resize.observe(host);
  function hood(shape){
    const points=shape.hood;
    const positions=filmMesh.geometry.attributes.position;
    const uv=filmMesh.geometry.attributes.uv;
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
    const image=images.find(item=>item.dataset.vehicle===key);
    await image.decode();
    if(disposed)return null;
    if(cache.has(key))return cache.get(key);
    const photo=new THREE.Texture(image);photo.colorSpace=THREE.SRGBColorSpace;photo.needsUpdate=true;
    const shape=surfaces[key],maps=makeMaps(shape);
    const wheel=([x,y,rx,ry])=>new THREE.Vector4(x/1200,y/800,rx/1200,ry/800);
    const uniforms={uPhoto:{value:photo},uZones:{value:maps.zones},uFilm:{value:maps.film},uProgress:{value:1},uMode:{value:0},uProgram:{value:0},uOpacity:{value:0},uMotion:{value:reduced?0:1},uSelected:{value:new THREE.Vector3()},uPointer:{value:new THREE.Vector2()},uWheelA:{value:wheel(shape.wheels[0])},uWheelB:{value:wheel(shape.wheels[1])}};
    const material=new THREE.ShaderMaterial({vertexShader,fragmentShader,uniforms,transparent:true,depthWrite:false});
    const mesh=new THREE.Mesh(geometry,material);mesh.visible=false;scene.add(mesh);
    const value={mesh,uniforms,photo,...maps};cache.set(key,value);return value;
  }
  function finish(){
    timeline?.kill();timeline=null;swap?.kill();swap=null;userPaused=false;
    cache.forEach(value=>{value.mesh.visible=value===record;value.uniforms.uOpacity.value=value===record?1:0;});
    if(record){record.uniforms.uProgress.value=1;record.uniforms.uMotion.value=0;}
    filmMaterial.uniforms.uOpacity.value=0;filmMaterial.uniforms.uPeel.value=0;
    draw();report('Состав выбран · можно сохранить расчёт');
  }
  function play(only){
    if(!record||!current||reduced||lost||!gsap){finish();return;}
    timeline?.kill();userPaused=false;started=true;
    const sequence=only?[only]:[current.key,...current.extras.filter(key=>!(current.key==='refresh'&&key==='interior'))];
    if(!sequence.length){finish();return;}
    const u=record.uniforms;
    u.uMotion.value=1;
    timeline=gsap.timeline({paused:true,onUpdate:()=>{draw();onStatus({playing:true,paused:userPaused,progress:timeline.progress(),reduced});},onComplete:()=>{filmMaterial.uniforms.uOpacity.value=0;draw();report('Обработка показана · ваш состав готов');}});
    for(const key of sequence){
      const duration=key==='protect'?5.5:key==='restore'?4.6:3;
      const start=timeline.duration();
      timeline.call(()=>{u.uMode.value=modeIds[key];u.uProgress.value=0;onStatus({label:labels[key]});},[],start);
      timeline.to(u.uProgress,{value:1,duration,ease:'none'},start);
      if(key==='protect'){
        timeline.set(filmMaterial.uniforms.uPeel,{value:1},start);
        timeline.fromTo(filmMaterial.uniforms.uOpacity,{value:0},{value:1,duration:.7},start+.2);
        timeline.to(filmMaterial.uniforms.uPeel,{value:0,duration:3.2,ease:'power2.inOut'},start+.7);
        timeline.to(filmMaterial.uniforms.uOpacity,{value:0,duration:.8},start+4.2);
      }
    }
    if(visible&&!document.hidden)timeline.play();
    report();
  }
  async function update(next){
    const ticket=++request;
    const changedVehicle=current?.vehicle!==next.vehicle;
    current=next;
    timeline?.kill();swap?.kill();filmMaterial.uniforms.uOpacity.value=0;
    const nextRecord=await getRecord(next.vehicle);
    if(ticket!==request||disposed||!nextRecord)return;
    const old=record;record=nextRecord;
    const u=record.uniforms;
    u.uProgram.value=modeIds[next.key];
    u.uSelected.value.set(Number(next.extras.includes('glass')),Number(next.extras.includes('wheels')),Number(next.extras.includes('interior')));
    u.uMode.value=modeIds[next.key];u.uProgress.value=1;
    cache.forEach(value=>{value.mesh.visible=value===record;value.uniforms.uOpacity.value=value===record?1:0;});
    hood(surfaces[next.vehicle]);fit();
    stage.dataset.renderer='webgl';
    if(changedVehicle&&old&&old!==record&&visible&&!reduced&&gsap){
      old.mesh.visible=true;old.uniforms.uOpacity.value=1;
      record.uniforms.uOpacity.value=0;
      swap=gsap.timeline({onUpdate:draw,onComplete:()=>{old.mesh.visible=false;play();}})
        .to(old.uniforms.uOpacity,{value:0,duration:.35},0)
        .to(record.uniforms.uOpacity,{value:1,duration:.55},.08);
    } else if(next.changed&&['glass','wheels','interior'].includes(next.changed)) {
      if(next.extras.includes(next.changed))play(next.changed);else finish();
    } else play();
    draw();
  }
  function setVisible(value){
    visible=value;
    if(!value||document.hidden){timeline?.pause();swap?.pause();return;}
    fit();
    if(!userPaused&&!reduced){if(timeline&&timeline.progress()<1)timeline.resume();else if(!started&&record)play();swap?.resume();}
    draw();
  }
  function setReduced(value){reduced=value;if(value)finish();else if(visible)play();}
  function toggle(){
    if(!timeline||timeline.progress()===1){play();return;}
    userPaused=!userPaused;if(userPaused)timeline.pause();else if(visible)timeline.resume();report();
  }
  function pointer(x,y){if(!record||reduced)return;record.uniforms.uPointer.value.set(x,y);draw();}
  function visibility(){setVisible(visible);}
  document.addEventListener('visibilitychange',visibility);
  canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();lost=true;timeline?.pause();stage.dataset.renderer='fallback';onStatus({unavailable:true});});
  canvas.addEventListener('webglcontextrestored',()=>{lost=false;stage.dataset.renderer='webgl';onStatus({unavailable:false});fit();if(current)update(current).catch(()=>onStatus({unavailable:true}));});
  return {update,setVisible,setReduced,toggle,pointer,dispose(){disposed=true;request++;timeline?.kill();swap?.kill();resize.disconnect();document.removeEventListener('visibilitychange',visibility);cache.forEach(value=>{value.photo.dispose();value.zones.dispose();value.film.dispose();value.mesh.material.dispose();});geometry.dispose();filmMesh.geometry.dispose();filmMaterial.dispose();renderer.dispose();canvas.remove();}};
}
