import * as THREE from './assets/three.module.js';
export function initInk(){
const stage=document.querySelector('.ink-stage'),hero=document.getElementById('hero'),canvas=document.getElementById('ink-canvas');const motion=matchMedia('(prefers-reduced-motion: reduce)');if(motion.matches)return;
let renderer;try{renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:false,powerPreference:'low-power'});}catch{return;}
renderer.setPixelRatio(Math.min(devicePixelRatio,1.35));const scene=new THREE.Scene(),camera=new THREE.OrthographicCamera(-1,1,1,-1,0,1);
const uniforms={uAspect:{value:1},uPointer:{value:new THREE.Vector2(.65,.55)},uFollower:{value:new THREE.Vector2(.65,.55)},uTime:{value:0},uScroll:{value:0}};
const material=new THREE.ShaderMaterial({transparent:true,uniforms,vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position,1.0);}',fragmentShader:`
precision mediump float;varying vec2 vUv;uniform float uAspect,uTime,uScroll;uniform vec2 uPointer,uFollower;
void ball(vec2 p,vec2 c,float r,inout float f,inout vec2 grad){vec2 d=p-c;float den=dot(d,d)+.002;float r2=r*r;f+=r2/den;grad+=-2.*r2*d/(den*den);}
void main(){vec2 p=(vUv-.5)*vec2(uAspect,1.);vec2 target=(uPointer-.5)*vec2(uAspect,1.);vec2 follower=(uFollower-.5)*vec2(uAspect,1.);float f=0.;vec2 g=vec2(0.);float t=uTime;vec2 center=vec2(.07+sin(t*.4)*.025,.03+uScroll*.07);
ball(p,center,.195,f,g);ball(p,center+vec2(.12+sin(t*.7)*.026,.12),.12,f,g);ball(p,center+vec2(-.095,-.14+cos(t*.5)*.02),.14,f,g);ball(p,center+vec2(.13,-.12),.095,f,g);
ball(p,mix(center,follower,.53),.077,f,g);ball(p,follower,.085,f,g);ball(p,mix(follower,target,.58),.048,f,g);ball(p,target,.028,f,g);
float alpha=smoothstep(1.03,1.08,f);if(alpha<.01)discard;float edge=1.-smoothstep(1.08,2.9,f);vec2 n=normalize(g+vec2(.001));float shine=pow(max(dot(n,normalize(vec2(-.7,.6))),0.),5.)*edge;
vec3 color=mix(vec3(.043,.052,.075),vec3(.15,.17,.25),edge*.6);color+=shine*vec3(.27,.29,.43);float iridescence=sin((p.x-p.y)*10.+t*.16);color+=edge*max(iridescence,0.)*vec3(.014,.011,.07);gl_FragColor=vec4(color,alpha);}`});
const geometry=new THREE.PlaneGeometry(2,2);scene.add(new THREE.Mesh(geometry,material));
let visible=true,running=false,raf=0,last=0,frame=0,dirtyUntil=performance.now()+2600;const target=new THREE.Vector2(.65,.55),follow=new THREE.Vector2(.65,.55);
function resize(){const width=stage.clientWidth,height=stage.clientHeight;if(!width||!height)return;renderer.setSize(width,height,false);uniforms.uAspect.value=width/height;dirtyUntil=performance.now()+1200;start();}
function tick(now){raf=0;if(!visible||document.hidden||motion.matches){running=false;return;}if(now-last>32){last=now;frame++;follow.lerp(target,.075);uniforms.uPointer.value.lerp(target,.18);uniforms.uFollower.value.copy(follow);uniforms.uTime.value=now*.001;uniforms.uScroll.value=Math.min(1,scrollY/Math.max(hero.clientHeight,1));renderer.render(scene,camera);stage.classList.add('ready');}if(now<dirtyUntil||follow.distanceTo(target)>.003){raf=requestAnimationFrame(tick);}else{running=false;}}
function start(){if(!running&&visible&&!document.hidden&&!motion.matches){running=true;raf=requestAnimationFrame(tick);}}
function pointer(event){const r=stage.getBoundingClientRect();target.set(THREE.MathUtils.clamp((event.clientX-r.left)/r.width,-.2,1.15),THREE.MathUtils.clamp(1-(event.clientY-r.top)/r.height,-.1,1.1));dirtyUntil=performance.now()+1100;start();}
function scroll(){dirtyUntil=performance.now()+650;start();}function leave(){target.set(.65,.55);dirtyUntil=performance.now()+1200;start();}
hero.addEventListener('pointermove',pointer,{passive:true});hero.addEventListener('pointerleave',leave);window.addEventListener('scroll',scroll,{passive:true});const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(stage);const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible){dirtyUntil=performance.now()+600;start();}else{cancelAnimationFrame(raf);running=false;}},{threshold:0});observer.observe(hero);
document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(raf);running=false;}else{dirtyUntil=performance.now()+600;start();}});motion.addEventListener('change',()=>{if(motion.matches){cancelAnimationFrame(raf);running=false;stage.classList.remove('ready');}else{dirtyUntil=performance.now()+600;start();}});
canvas.addEventListener('webglcontextlost',()=>{cancelAnimationFrame(raf);running=false;stage.classList.remove('ready');});resize();
window.addEventListener('pagehide',()=>{cancelAnimationFrame(raf);observer.disconnect();resizeObserver.disconnect();renderer.dispose();geometry.dispose();material.dispose();},{once:true});
}
