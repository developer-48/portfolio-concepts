(() => {
  const $ = selector => document.querySelector(selector);
  const money = value => new Intl.NumberFormat('ru-RU').format(value) + ' ₽';
  const icon = Studio.icon;
  // Native lazy-loading may fetch photos several screens away on slow networks.
  // Start these secondary images only when their own block is approaching.
  const imageObserver='IntersectionObserver' in window?new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting){const image=entry.target;image.src=image.dataset.src;delete image.dataset.src;imageObserver.unobserve(image);}},{rootMargin:'200px'}):null;
  function observeImage(image){if(!image?.dataset.src)return;if(imageObserver)imageObserver.observe(image);else{image.src=image.dataset.src;delete image.dataset.src;}}
  document.querySelectorAll('img[data-src]').forEach(observeImage);
  const services = {
    film: {title:'Защита, которая остаётся незаметной.',text:'Плёнка на участках, которые первыми встречают дорогу. Подготовка, точная посадка на геометрию детали и аккуратная обработка краёв.',image:'../assets/atlas-v9/film.webp',alt:'Укладка прозрачной защитной плёнки на капот зелёного Porsche 911',caption:'01 / Защита кузова',items:['Подбор зон и материала','Очистка и подготовка поверхности','Оклейка и контроль прилегания'],price:85000,time:'3–4 дня',href:'protection.html'},
    polish: {title:'Глубина цвета. Чистота отражений.',text:'Перед коррекцией оценивают лак и характер дефектов. Подход и интенсивность работы подбираются для конкретной поверхности.',image:'../assets/atlas-v9/polish.webp',alt:'Полировка капота Porsche 911 машинкой с мягким кругом',caption:'02 / Восстановление блеска',items:['Оценка состояния лакокрасочного покрытия','Согласование степени коррекции','Финишная обработка и контроль света'],price:24000,time:'1–2 дня',href:'paint.html'},
    coating: {title:'Последний штрих имеет значение.',text:'Защитный состав наносят на подготовленную поверхность. Он дополняет уход за кузовом и помогает сохранить аккуратный внешний вид.',image:'../assets/atlas-v9/coating.webp',alt:'Нанесение керамического состава аппликатором на зелёный кузов Porsche 911',caption:'03 / Защитные составы',items:['Подготовка поверхности перед нанесением','Выбор состава под задачу','Выдержка и рекомендации по уходу'],price:14000,time:'от 1 дня',href:'paint.html'},
    interior: {title:'Приятно снова оказаться внутри.',text:'Деликатный уход за материалами, к которым вы прикасаетесь каждый день. Салон разбирают на зоны, а не обрабатывают одним универсальным средством.',image:'../assets/atlas-v9/interior.webp',alt:'Деликатная чистка кожаного сиденья в салоне Porsche 911',caption:'04 / Уход за интерьером',items:['Оценка материалов и загрязнений','Очистка кожи, текстиля и пластика','Сушка и проверка труднодоступных зон'],price:11000,time:'1–2 дня',href:'interior.html'}
  };
  function renderService(key){
    const item=services[key]; if(!item||!$('#a-service-panel'))return;
    document.querySelectorAll('[data-service]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.service===key)));
    const previous=$('#a-service-panel img');if(previous)imageObserver?.unobserve(previous);
    $('#a-service-panel').innerHTML=`<div class="service-image"><img data-src="${item.image}" alt="${item.alt}" width="1536" height="1024" loading="lazy" fetchpriority="low"><span>${item.caption}</span></div><div class="service-description"><h3>${item.title}</h3><p>${item.text}</p><ul>${item.items.map(text=>`<li>${icon('check')}${text}</li>`).join('')}</ul><div class="service-facts"><div><small>Демонстрационная цена</small><b>от ${money(item.price)}</b></div><div><small>Ориентир по времени</small><b>${item.time}</b></div></div><a class="a-button secondary" href="${item.href}">Разобраться в услуге<span>${icon('layers')}</span></a></div>`;
    observeImage($('#a-service-panel img'));
    if(window.gsap&&!matchMedia('(prefers-reduced-motion: reduce)').matches){
      const photo=$('#a-service-panel .service-image img');
      gsap.fromTo(photo,{opacity:.35,scale:1.035},{opacity:1,scale:1,duration:.7,ease:'power2.out'});
    }
    window.ScrollTrigger?.refresh();
  }
  document.querySelectorAll('[data-service]').forEach(button=>button.addEventListener('click',()=>renderService(button.dataset.service)));
  renderService('film');

  const steps=[...document.querySelectorAll('[data-process-step]')];
  function highlight(step,index){
    steps.forEach(item=>item.classList.toggle('is-current',item===step));
    $('#process-number').textContent=step.dataset.processStep;
    $('#process-caption').textContent=step.dataset.caption;
    $('.process-meter span').style.width=((index+1)/steps.length*100)+'%';
  }
  if(steps.length){
    highlight(steps[0],0);
    if(window.ScrollTrigger)steps.forEach((step,index)=>ScrollTrigger.create({trigger:step,start:'top 65%',onEnter:()=>highlight(step,index),onLeaveBack:()=>highlight(steps[Math.max(0,index-1)],Math.max(0,index-1))}));
  }

  if(!$('#configuration-result'))return;
  const Care=window.AtlasCare;
  const {extras}=Care;
  let state=Care.initial(new URLSearchParams(location.search).get('package'));
  let configuration;
  function render(changed){
    const c=configuration=Care.calculate(state);
    document.querySelectorAll('input[name="car-class"]').forEach(input=>input.checked=input.value===state.vehicle);
    document.querySelectorAll('input[name="package"]').forEach(input=>input.checked=input.value===state.program);
    document.querySelectorAll('input[name="extra"]').forEach(input=>{
      const included=c.pack.includes.includes(input.value);
      input.checked=c.effective.includes(input.value);
      input.disabled=included;
      input.closest('label').dataset.included=String(included);
      $(`[data-extra-cost="${input.value}"]`).textContent=included?'В программе':'+ '+money(Math.round(extras[input.value].price*c.factor));
    });
    $('#interior-extra-note').textContent=c.pack.includes.includes('interior')?'Уже включена. Повторной оплаты нет.':'Кожа, текстиль, пластик и сушка';
    $('#configuration-result').dataset.package=c.key;
    $('#package-title').textContent=c.pack.title;
    $('#package-included').innerHTML=c.pack.items.map(text=>`<li>${icon('check')}${text}</li>`).join('');
    $('#estimate-price').textContent='от '+money(c.total);
    $('#mobile-estimate-price').textContent='от '+money(c.total);
    $('#estimate-duration').textContent='Программа: '+c.pack.time+(c.chosen.length?' · дополнения могут увеличить срок':'');
    $('#estimate-breakdown').innerHTML=`<div><span>${c.pack.title}</span><span>${money(c.base)}</span></div>`+c.chosen.map(item=>`<div><span>${item.title}</span><span>${money(Math.round(item.price*c.factor))}</span></div>`).join('');
    window.AtlasShowroom?.update({vehicle:c.vehicle,key:c.key,extras:c.effective,changed});
  }
  document.querySelectorAll('.configure-options input').forEach(input=>input.addEventListener('change',()=>{
    const type={'car-class':'vehicle',package:'program',extra:'extra'}[input.name];
    state=Care.change(state,{type,value:input.value,checked:input.checked});
    render(type==='extra'?input.value:type);
  }));
  document.querySelectorAll('[data-package-link]').forEach(link=>link.addEventListener('click',()=>{
    state=Care.change(state,{type:'program',value:link.dataset.packageLink});render('program');
  }));
  render();
  const brief=$('#a-brief');
  document.querySelectorAll('[data-save-brief]').forEach(button=>button.addEventListener('click',()=>{
    const c=configuration;
    $('#brief-estimate').innerHTML=`${c.className} · ${c.pack.title}<b>от ${money(c.total)}</b>Ориентир: ${c.pack.time}${c.chosen.length?' без учёта времени на дополнения':''}`;
    $('#brief-error').textContent='';$('#brief-success').textContent='';
    brief.showModal();
  }));
  $('#a-brief-form').addEventListener('submit',event=>{
    event.preventDefault();
    const model=$('#car-model'),year=$('#car-year');
    model.removeAttribute('aria-invalid');year.removeAttribute('aria-invalid');
    $('#brief-error').textContent='';$('#brief-success').textContent='';
    if(!model.value.trim()){model.setAttribute('aria-invalid','true');$('#brief-error').textContent='Укажите марку и модель автомобиля.';model.focus();return;}
    if(year.value.trim()&&(!/^\d{4}$/.test(year.value.trim())||Number(year.value)<1900||Number(year.value)>new Date().getFullYear()+1)){
      year.setAttribute('aria-invalid','true');$('#brief-error').textContent='Укажите год четырьмя цифрами: от 1900 до '+(new Date().getFullYear()+1)+'.';year.focus();return;
    }
    const c=configuration;
    Studio.download('atlas-care-brief.txt',[
      'ATLAS — демонстрационный бриф','',
      'Автомобиль: '+model.value.trim(),'Год: '+(year.value.trim()||'не указан'),'Класс: '+c.className,'',
      'Программа: '+c.pack.title,...c.pack.items.map(item=>'• '+item),'Базовая стоимость для выбранного класса: '+money(c.base),'',
      'Дополнения:',...(c.chosen.length?c.chosen.map(item=>'• '+item.title+': '+money(Math.round(item.price*c.factor))):['Нет']),
      '', 'Предварительно: от '+money(c.total),'Ориентир по базовой программе: '+c.pack.time,
      c.chosen.length?'Дополнения могут увеличить срок.':'','Пожелания: '+($('#car-note').value.trim()||'не указаны'),'',
      'Вымышленная студия. Демонстрационные цены. Заказ не создан, данные никуда не отправлены.',
      'Окончательный состав, цена и срок в реальной студии согласуются после осмотра автомобиля.'
    ].join('\n'));
    $('#brief-success').textContent='Бриф подготовлен к скачиванию. Заказ не создавался.';
  });
})();
