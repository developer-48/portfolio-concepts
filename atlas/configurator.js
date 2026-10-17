(() => {
  const stage=document.getElementById('vehicle-stage');if(!stage)return;
  const fallback=stage.querySelector('.vehicle-model');
  const button=document.getElementById('replay-treatment');
  const progress=stage.querySelector('.treatment-progress i');
  const label=document.getElementById('scene-treatment');
  const reduce=matchMedia('(prefers-reduced-motion: reduce)');
  const vehicles={coupe:['Купе','Porsche 911 GT3 RS','01'],sedan:['Седан','Mercedes-Benz S 65','02'],crossover:['Кроссовер','BMW X6 M','03'],suv:['Большой SUV','Mercedes-Benz GLS','04']};
  const descriptions={restore:'Полировка кузова и нанесение защитного состава.',protect:'Плёнка на переднюю часть кузова и зеркала.',refresh:'Деликатная очистка кожи, текстиля и деталей салона.'};
  const names={glass:'Стёкла',wheels:'Диски',interior:'Салон'};
  let engine,current,loading,transport,primed=false,visible=false,unavailable=false,lastPlayback='',lastProgress=-1;
  const playIcon='<path d="m8 5 11 7-11 7V5Z"/>',pauseIcon='<path d="M9 5v14M15 5v14"/>';
  function status(info){
    if(info.unavailable!==undefined)unavailable=info.unavailable;
    if(info.label&&label.textContent!==info.label)label.textContent=info.label;
    if(info.progress!==undefined){const value=Math.round(info.progress*500)/500;if(value!==lastProgress){progress.style.transform=`scaleX(${value})`;lastProgress=value;}}
    if(info.playing!==undefined){
      const playback=info.paused?'paused':info.playing?'playing':'complete';
      if(playback!==lastPlayback){
        lastPlayback=playback;stage.dataset.playback=playback;
        const text=info.paused?'Продолжить':info.playing?'Пауза':'Повторить';
        button.querySelector('span').textContent=text;
        button.querySelector('svg').innerHTML=info.playing&&!info.paused?pauseIcon:playIcon;
        button.setAttribute('aria-label',`${info.playing&&!info.paused?'Приостановить':text} анимацию обработки`);
      }
    }
    button.hidden=reduce.matches||unavailable;
  }
  function prepare(){
    transport??=import('./model-data.js?v=14');
    if(!primed){const link=document.createElement('link');link.rel='modulepreload';link.href='./vehicle-scene.min.js?v=14';link.fetchPriority='low';document.head.append(link);primed=true;}
    transport.then(({requestModel})=>requestModel(current?.vehicle||'coupe')).catch(()=>{});
  }
  async function load(){
    if(loading||unavailable)return;
    prepare();loading=import('./vehicle-scene.min.js?v=14').then(({createVehicleScene})=>{
      engine=createVehicleScene(stage,[],status);engine.setVisible(visible);if(current)return engine.update(current);
    }).catch(error=>{stage.dataset.renderer='fallback';status({unavailable:true,label:'3D недоступно · расчёт продолжает работать'});engine?.dispose();engine=null;console.warn('ATLAS: 3D initialization failed',error);});
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
    stage.setAttribute('aria-label',`${character}. Интерактивная 3D-модель. Поворот: мышь, палец или клавиши со стрелками. Home — вернуть ракурс. ${descriptions[next.key]}`);
    if(changedVehicle){fallback.src=`../assets/atlas-3d/${next.vehicle}-poster.webp?v=14`;fallback.alt=`${character} · студийный вид`;if(primed)prepare();}
    const areas=next.key==='refresh'?['Салон']:['Кузов'];next.extras.forEach(key=>{if(!areas.includes(names[key]))areas.push(names[key]);});
    document.getElementById('selected-treatments').textContent='В составе: '+areas.join(' · ');
    if(engine)engine.update(current).catch(()=>{stage.dataset.renderer='fallback';status({unavailable:true});engine?.dispose();engine=null;});else if(visible)load();
  }
  const nearby=new IntersectionObserver(entries=>{if(entries.some(entry=>entry.isIntersecting)){load();nearby.disconnect();}},{rootMargin:'1400px'});nearby.observe(stage);
  const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;engine?.setVisible(visible);if(visible)load();},{threshold:.05});observer.observe(stage);
  button.addEventListener('click',()=>engine?.toggle());
  reduce.addEventListener('change',()=>{engine?.setReduced(reduce.matches);status({});});
  if(!navigator.connection?.saveData){if('requestIdleCallback' in window)requestIdleCallback(prepare,{timeout:1200});else setTimeout(prepare,500);}
  window.AtlasShowroom={update};
})();
