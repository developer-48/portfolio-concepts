(() => {
  const stage = document.getElementById('vehicle-stage');
  if (!stage) return;
  const motion = stage.querySelector('.vehicle-motion');
  const models = [...stage.querySelectorAll('.vehicle-model')];
  const zones = [...stage.querySelectorAll('[data-zone]')];
  const sweep = stage.querySelector('.scene-sweep');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const pointer = matchMedia('(hover: hover) and (pointer: fine)');
  const gsap = window.gsap;
  const vehicles = {
    coupe: ['Купе', 'Спортивный силуэт', '01'],
    sedan: ['Седан', 'Четыре двери. Свой характер.', '02'],
    crossover: ['Кроссовер', 'Больше пространства', '03'],
    suv: ['Большой SUV', 'Полноразмерный класс', '04']
  };
  const treatments = {refresh:'Уход за интерьером',restore:'Полировка и покрытие',protect:'Защита передней части'};
  const zoneNames = {glass:'стёклами',wheels:'дисками',interior:'салоном'};
  let current;
  let transition;
  let lightTransition;

  function settle() {
    transition?.kill();
    lightTransition?.kill();
    if (gsap) {
      gsap.killTweensOf(motion);
      gsap.set([motion, ...models, ...zones], {clearProps:'transform,opacity,visibility'});
      gsap.set(sweep, {clearProps:'transform,opacity'});
    }
    models.forEach(model => model.classList.toggle('is-current',model.dataset.vehicle === current?.vehicle));
    stage.style.removeProperty('--light-x');
    stage.style.removeProperty('--light-y');
  }

  function update(next) {
    const previous = current;
    current = next;
    const [name,character,index] = vehicles[next.vehicle];
    document.getElementById('vehicle-name').textContent = name;
    document.getElementById('vehicle-character').textContent = character;
    document.getElementById('vehicle-index').textContent = index + ' / 04';
    document.getElementById('scene-treatment').textContent = treatments[next.key];
    stage.dataset.vehicle = next.vehicle;
    stage.dataset.mode = next.key;
    models.forEach(model => {
      const active = model.dataset.vehicle === next.vehicle;
      model.setAttribute('aria-hidden',String(!active));
      model.classList.toggle('is-current',active);
    });
    zones.forEach(zone => {
      const key = zone.dataset.zone;
      const included = key === 'interior' && next.key === 'refresh';
      const active = key === 'body' ? next.key === 'restore' : included || next.extras.includes(key);
      zone.setAttribute('aria-pressed',String(active));
      zone.setAttribute('aria-disabled',String(included));
      if (key !== 'body') zone.setAttribute('aria-label', included ? 'Уход за салоном включён в программу' : `${active?'Убрать':'Добавить'} уход за ${zoneNames[key]}`);
    });
    if (!gsap || reduce.matches || !previous) { settle(); return; }
    if (previous.vehicle !== next.vehicle) {
      settle();
      const incoming = models.find(model => model.dataset.vehicle === next.vehicle);
      const outgoing = models.find(model => model.dataset.vehicle === previous.vehicle);
      gsap.set(outgoing,{autoAlpha:1});
      gsap.set(incoming,{autoAlpha:0,xPercent:7,y:12,rotationY:-10,scale:.94});
      transition = gsap.timeline({onComplete:() => gsap.set(models,{clearProps:'transform,opacity,visibility'})})
        .to(outgoing,{autoAlpha:0,xPercent:-5,scale:.97,duration:.32,ease:'power2.in'},0)
        .to(incoming,{autoAlpha:1,xPercent:0,y:0,rotationY:0,scale:1,duration:.75,ease:'power3.out'},.12);
    }
    if (previous.key !== next.key || previous.extras.join() !== next.extras.join()) {
      lightTransition?.kill();
      lightTransition = gsap.timeline()
        .fromTo(sweep,{xPercent:-70,opacity:0},{xPercent:0,opacity:.7,duration:.4,ease:'power2.out'})
        .to(sweep,{xPercent:70,opacity:0,duration:.65,ease:'power2.inOut'});
    }
  }

  zones.forEach(zone => zone.addEventListener('click',() => {
    const key = zone.dataset.zone;
    if (zone.getAttribute('aria-disabled') === 'true') return;
    const input = document.querySelector(key === 'body' ? 'input[name="package"][value="restore"]' : `input[name="extra"][value="${key}"]`);
    if (!input || input.disabled) return;
    input.checked = key === 'body' || !input.checked;
    input.dispatchEvent(new Event('change',{bubbles:true}));
  }));

  if (gsap) {
    const rotateY = gsap.quickTo(motion,'rotationY',{duration:.7,ease:'power3.out'});
    const rotateX = gsap.quickTo(motion,'rotationX',{duration:.7,ease:'power3.out'});
    stage.addEventListener('pointermove',event => {
      if (reduce.matches || !pointer.matches || event.pointerType === 'touch') return;
      const bounds = stage.getBoundingClientRect();
      const x = (event.clientX - bounds.left) / bounds.width;
      const y = (event.clientY - bounds.top) / bounds.height;
      rotateY((x - .5) * 7);
      rotateX((.5 - y) * 4);
      stage.style.setProperty('--light-x',`${35 + x * 30}%`);
      stage.style.setProperty('--light-y',`${25 + y * 30}%`);
    });
    stage.addEventListener('pointerleave',() => {
      if (reduce.matches) return;
      rotateY(0); rotateX(0);
      stage.style.removeProperty('--light-x');
      stage.style.removeProperty('--light-y');
    });
  }
  reduce.addEventListener('change',settle);
  pointer.addEventListener('change',settle);
  window.AtlasShowroom = {update};
})();
