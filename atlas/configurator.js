(() => {
  const stage=document.getElementById('vehicle-stage');if(!stage)return;
  const images=[...stage.querySelectorAll('.vehicle-model')];
  const motion=stage.querySelector('.vehicle-motion');
  const button=document.getElementById('replay-treatment');
  const progress=stage.querySelector('.treatment-progress i');
  const reduce=matchMedia('(prefers-reduced-motion: reduce)');
  const fine=matchMedia('(hover: hover) and (pointer: fine)');
  const gsap=window.gsap;
  const vehicles={coupe:['Купе','Спортивный силуэт','01'],sedan:['Седан','Четыре двери. Свой характер.','02'],crossover:['Кроссовер','Больше пространства','03'],suv:['Большой SUV','Полноразмерный класс','04']};
  const descriptions={restore:'Полировка кузова и нанесение защитного состава.',protect:'Плёнка на переднюю часть кузова и зеркала.',refresh:'Деликатная очистка кожи, текстиля и пластика.'};
  const names={glass:'Стёкла',wheels:'Диски',interior:'Салон'};
  let current,engine,loading,visible=false;
  let unavailable=false;
  const playIcon='<path d="m8 5 11 7-11 7V5Z"/>';
  const pauseIcon='<path d="M9 5v14M15 5v14"/>';
  function status(info){
    if(info.unavailable!==undefined){unavailable=info.unavailable;if(unavailable)stage.dataset.renderer='fallback';}
    if(info.label)document.getElementById('scene-treatment').textContent=info.label;
    if(info.progress!==undefined)progress.style.transform=`scaleX(${info.progress})`;
    if(info.playing!==undefined){
      stage.dataset.playback=info.paused?'paused':info.playing?'playing':'complete';
      const text=info.paused?'Продолжить':info.playing?'Пауза':'Повторить';
      button.querySelector('span').textContent=text;
      button.querySelector('svg').innerHTML=info.playing&&!info.paused?pauseIcon:playIcon;
      button.setAttribute('aria-label',`${info.playing&&!info.paused?'Приостановить':text} анимацию обработки`);
    }
    button.hidden=reduce.matches||unavailable;
  }
  async function load(){
    if(loading||unavailable)return;
    loading=import('./vehicle-renderer.js?v=9').then(({createVehicleScene})=>{
      engine=createVehicleScene(stage,images,status);
      engine.setVisible(visible);
      if(current)return engine.update(current);
    }).catch(()=>{status({unavailable:true,label:'Ваш автомобиль · выбранный состав ниже'});engine?.dispose();engine=null;});
    return loading;
  }
  function update(next){
    current={...next,extras:[...next.extras]};
    const [name,character,index]=vehicles[next.vehicle];
    document.getElementById('vehicle-name').textContent=name;
    document.getElementById('vehicle-character').textContent=character;
    document.getElementById('vehicle-index').textContent=index+' / 04';
    document.getElementById('treatment-description').textContent=descriptions[next.key];
    stage.dataset.vehicle=next.vehicle;stage.dataset.mode=next.key;
    stage.setAttribute('aria-label',`${name}. ${descriptions[next.key]}${next.extras.length?' Также: '+next.extras.map(key=>names[key]).join(', ')+'.':''}`);
    images.forEach(image=>{
      const active=image.dataset.vehicle===next.vehicle;
      image.classList.toggle('is-current',active);image.setAttribute('aria-hidden',String(!active));
    });
    const areas=next.key==='refresh'?[]:['Кузов'];
    next.extras.forEach(key=>areas.push(names[key]));
    document.getElementById('selected-treatments').textContent='В составе: '+areas.join(' · ');
    if(engine)engine.update(current).catch(()=>{status({unavailable:true});engine?.dispose();engine=null;});
    else if(visible)load();
    if(!engine)document.getElementById('scene-treatment').textContent='Ваш автомобиль · выбранный состав ниже';
    status({});
  }
  const nearby=new IntersectionObserver(entries=>{
    if(entries.some(entry=>entry.isIntersecting)){load();nearby.disconnect();}
  },{rootMargin:'400px'});nearby.observe(stage);
  const observer=new IntersectionObserver(entries=>{
    visible=entries[0].isIntersecting;
    engine?.setVisible(visible);
    if(visible)load();
  },{threshold:.15});observer.observe(stage);
  button.addEventListener('click',()=>engine?.toggle());
  stage.addEventListener('pointermove',event=>{
    if(!gsap||reduce.matches||!fine.matches||event.pointerType==='touch')return;
    const r=stage.getBoundingClientRect();
    const x=(event.clientX-r.left)/r.width,y=(event.clientY-r.top)/r.height;
    gsap.to(motion,{rotationY:(x-.5)*5,rotationX:(.5-y)*2,duration:.8,ease:'power3.out',overwrite:true});
    engine?.pointer(x,.6);
    stage.style.setProperty('--light-x',`${35+x*30}%`);
    stage.style.setProperty('--light-y',`${25+y*30}%`);
  });
  stage.addEventListener('pointerleave',()=>{
    if(gsap)gsap.to(motion,{rotationY:0,rotationX:0,duration:.8,overwrite:true});
    engine?.pointer(0,0);
    stage.style.removeProperty('--light-x');stage.style.removeProperty('--light-y');
  });
  reduce.addEventListener('change',()=>{
    engine?.setReduced(reduce.matches);
    if(gsap){gsap.killTweensOf(motion);gsap.set(motion,{clearProps:'transform'});}
    status({});
  });
  window.AtlasShowroom={update};
})();
