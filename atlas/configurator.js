(() => {
  const stage=document.getElementById('vehicle-stage');if(!stage)return;
  const posters=[...stage.querySelectorAll('[data-poster]')];
  const button=document.getElementById('replay-treatment');
  const progress=stage.querySelector('.treatment-progress i');
  const label=document.getElementById('scene-treatment');
  const caption=document.querySelector('.scene-caption');
  const reduce=matchMedia('(prefers-reduced-motion: reduce)');
  const vehicles={coupe:['Купе','Porsche 911 GT3 RS','01'],sedan:['Седан','Mercedes-Benz S 65','02'],crossover:['Кроссовер','BMW X6 M','03'],suv:['Большой SUV','Mercedes-Benz GLS','04']};
  const descriptions={restore:'Полировка кузова и нанесение защитного состава.',protect:'Плёнка на переднюю часть кузова и зеркала.',refresh:'Деликатная очистка кожи, текстиля и деталей салона.'};
  const names={glass:'Стёкла',wheels:'Диски',interior:'Салон'};
  let engine,current,loading,transport,primed=!!document.querySelector('link[rel="modulepreload"][href*="vehicle-scene"]'),visible=false,unavailable=false,ready=false,lastPlayback='',lastProgress=-1;
  const playIcon='<path d="m8 5 11 7-11 7V5Z"/>',pauseIcon='<path d="M9 5v14M15 5v14"/>';
  const mayPrefetch=()=>!document.hidden&&!navigator.connection?.saveData&&!/^(slow-)?2g$/.test(navigator.connection?.effectiveType||'');
  function showReady(value){
    ready=value;stage.dataset.view=value?'three':'poster';stage.tabIndex=value?0:-1;
    caption.textContent=value?'Объёмная модель · ваш ракурс':unavailable?'Студийный вид':'Студийный вид · 3D готовится';
    if(current){const name=vehicles[current.vehicle][1];stage.setAttribute('aria-label',`${name}. ${value?'Интерактивная 3D-модель. Поворот: мышь, палец или клавиши со стрелками. Home — вернуть ракурс.':'Изображение автомобиля. '+(unavailable?'':'3D загружается.')} ${descriptions[current.key]}`);}
  }
  function status(info){
    if(info.vehicle&&info.vehicle!==current?.vehicle)return;
    if(info.unavailable!==undefined)unavailable=info.unavailable;
    if(info.ready!==undefined)showReady(info.ready);
    if(info.label&&label.textContent!==info.label)label.textContent=info.label;
    if(info.progress!==undefined){const value=Math.round(info.progress*500)/500;if(value!==lastProgress){progress.style.transform=`scaleX(${value})`;lastProgress=value;}}
    if(info.playing!==undefined)lastPlayback=info.paused?'paused':info.playing?'playing':'complete';
    const playing=lastPlayback==='playing',paused=lastPlayback==='paused';
    const text=unavailable?'Загрузить 3D':!ready?'Загрузка 3D':paused?'Продолжить':playing?'Пауза':'Повторить';
    button.disabled=!ready&&!unavailable;button.querySelector('span').textContent=text;
    button.querySelector('svg').innerHTML=ready&&playing?pauseIcon:playIcon;
    button.setAttribute('aria-label',unavailable?'Повторить загрузку 3D':!ready?'3D-модель загружается':`${playing?'Приостановить':text} анимацию обработки`);
    button.hidden=reduce.matches&&!unavailable;
  }
  function prepare(){
    transport??=import('./model-data.js?v=17');
    if(!primed){const link=document.createElement('link');link.rel='modulepreload';link.href='./vehicle-scene.min.js?v=17';link.fetchPriority='high';document.head.append(link);primed=true;}
    transport.then(({requestModel})=>requestModel(current?.vehicle||'coupe')).catch(()=>{});
  }
  const afterPaint=()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
  async function load(){
    if(loading||engine)return loading;
    prepare();loading=import('./vehicle-scene.min.js?v=17').then(async({createVehicleScene})=>{
      // The selected predecoded poster gets a paint before WebGL setup starts.
      await afterPaint();engine=createVehicleScene(stage,[],status);engine.setVisible(visible);if(current)await engine.update(current);
    }).catch(error=>{stage.dataset.renderer='fallback';status({unavailable:true,ready:false,label:'Изображение автомобиля · 3D недоступно'});engine?.dispose();engine=null;console.warn('ATLAS: 3D initialization failed',error);}).finally(()=>{loading=null;});
    return loading;
  }
  function update(next){
    const changedVehicle=current?.vehicle!==next.vehicle;
    current={...next,extras:[...next.extras]};
    const [name,character,index]=vehicles[next.vehicle];
    document.getElementById('vehicle-name').textContent=name;
    document.getElementById('vehicle-character').textContent=character;
    document.getElementById('vehicle-index').textContent=index+' / 04';
    document.getElementById('treatment-description').textContent=descriptions[next.key];
    stage.dataset.vehicle=next.vehicle;stage.dataset.mode=next.key;
    if(changedVehicle){
      // This synchronous path has no import, network request or 3D dependency.
      posters.forEach(image=>{const selected=image.dataset.poster===next.vehicle;image.classList.toggle('is-current',selected);image.setAttribute('aria-hidden',String(!selected));});
      status({ready:false,unavailable:false,progress:0,label:'Изображение готово · загружаем 3D'});
      if(primed)prepare();
    }else showReady(ready);
    const areas=next.key==='refresh'?['Салон']:['Кузов'];next.extras.forEach(key=>{if(!areas.includes(names[key]))areas.push(names[key]);});
    document.getElementById('selected-treatments').textContent='В составе: '+areas.join(' · ');
    if(engine)engine.update(current).catch(()=>{stage.dataset.renderer='fallback';status({unavailable:true,ready:false});engine?.dispose();engine=null;});else if(visible)load();
  }
  // Four lightweight renders are loaded and decoded independently of 3D.
  posters.forEach(image=>image.decode?.().catch(()=>{}));
  const nearby=new IntersectionObserver(entries=>{if(entries.some(entry=>entry.isIntersecting)){load();nearby.disconnect();}},{rootMargin:'1400px'});nearby.observe(stage);
  const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;engine?.setVisible(visible);if(visible)load();},{threshold:.05});observer.observe(stage);
  button.addEventListener('click',()=>{if(unavailable){engine?.dispose();engine=null;status({unavailable:false,ready:false,label:'Повторная загрузка 3D…'});load();}else if(ready)engine?.toggle();});
  reduce.addEventListener('change',()=>{engine?.setReduced(reduce.matches);status({});});
  if(mayPrefetch()){if('requestIdleCallback' in window)requestIdleCallback(prepare,{timeout:1200});else setTimeout(prepare,500);}
  window.AtlasShowroom={update};
})();
