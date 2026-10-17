(() => {
  const $ = selector => document.querySelector(selector);
  const money = value => new Intl.NumberFormat('ru-RU').format(value) + ' ₽';
  const icon = Studio.icon;
  const services = {
    film: {title:'Защита, которая остаётся незаметной.',text:'Плёнка на участках, которые первыми встречают дорогу. Подготовка, точная посадка на геометрию детали и аккуратная обработка краёв.',image:'atlas-hero',caption:'01 / Защита кузова',items:['Подбор зон и материала','Очистка и подготовка поверхности','Оклейка и контроль прилегания'],price:85000,time:'3–4 дня',href:'protection.html'},
    polish: {title:'Глубина цвета. Чистота отражений.',text:'Перед коррекцией оценивают лак и характер дефектов. Подход и интенсивность работы подбираются для конкретной поверхности.',image:'atlas-process',caption:'02 / Восстановление блеска',items:['Оценка состояния лакокрасочного покрытия','Согласование степени коррекции','Финишная обработка и контроль света'],price:24000,time:'1–2 дня',href:'paint.html'},
    coating: {title:'Последний штрих имеет значение.',text:'Защитный состав наносят на подготовленную поверхность. Он дополняет уход за кузовом и помогает сохранить аккуратный внешний вид.',image:'atlas-hero',caption:'03 / Защитные составы',items:['Подготовка поверхности перед нанесением','Выбор состава под задачу','Выдержка и рекомендации по уходу'],price:14000,time:'от 1 дня',href:'paint.html'},
    interior: {title:'Приятно снова оказаться внутри.',text:'Деликатный уход за материалами, к которым вы прикасаетесь каждый день. Салон разбирают на зоны, а не обрабатывают одним универсальным средством.',image:'atlas-interior',caption:'04 / Уход за интерьером',items:['Оценка материалов и загрязнений','Очистка кожи, текстиля и пластика','Сушка и проверка труднодоступных зон'],price:11000,time:'1–2 дня',href:'interior.html'}
  };
  function renderService(key){
    const item=services[key]; if(!item||!$('#a-service-panel'))return;
    document.querySelectorAll('[data-service]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.service===key)));
    $('#a-service-panel').innerHTML=`<div class="service-image"><img src="../assets/v6/${item.image}.webp" alt="${item.caption.split(' / ')[1]}" width="1536" height="1024"><span>${item.caption}</span></div><div class="service-description"><h3>${item.title}</h3><p>${item.text}</p><ul>${item.items.map(text=>`<li>${icon('check')}${text}</li>`).join('')}</ul><div class="service-facts"><div><small>Демонстрационная цена</small><b>от ${money(item.price)}</b></div><div><small>Ориентир по времени</small><b>${item.time}</b></div></div><a class="a-button secondary" href="${item.href}">Разобраться в услуге<span>${icon('layers')}</span></a></div>`;
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
  const packages={
    refresh:{title:'Чистый интерьер',price:11000,time:'1–2 дня',items:['Очистка кожи, текстиля и пластика','Работа с труднодоступными зонами','Сушка и контроль результата']},
    restore:{title:'Глубина цвета',price:38000,time:'2–3 дня',items:['Многоэтапная очистка кузова','Согласованная коррекция лака','Нанесение защитного покрытия']},
    protect:{title:'Защита спереди',price:85000,time:'3–4 дня',items:['Очистка и подготовка поверхности','Плёнка: капот, бампер, передние крылья','Оклейка зеркал и контроль краёв']}
  };
  const extras={glass:{title:'Уход за стёклами',price:3500},wheels:{title:'Уход за дисками',price:6000},interior:{title:'Глубокий уход за салоном',price:12000}};
  const classNames={'1':'Купе / седан','1.2':'Кроссовер','1.4':'Большой SUV'};
  let configuration;
  function calculate(){
    const key=$('input[name="package"]:checked').value;
    const factor=Number($('input[name="car-class"]:checked').value);
    const pack=packages[key];
    const interior=$('input[name="extra"][value="interior"]');
    interior.disabled=key==='refresh';
    if(interior.disabled)interior.checked=false;
    $('#interior-extra-note').textContent=interior.disabled?'Уже входит в выбранную программу':'Текстиль, кожа, пластик';
    Object.entries(extras).forEach(([name,item])=>{$(`[data-extra-cost="${name}"]`).textContent=name==='interior'&&interior.disabled?'Включено':'+ '+money(Math.round(item.price*factor));});
    const chosen=[...document.querySelectorAll('input[name="extra"]:checked')].map(input=>extras[input.value]);
    const base=Math.round(pack.price*factor);
    const total=base+chosen.reduce((sum,item)=>sum+Math.round(item.price*factor),0);
    configuration={key,pack,factor,chosen,base,total,className:classNames[String(factor)]};
    $('#configuration-result').dataset.package=key;
    $('#package-title').textContent=pack.title;
    $('#package-included').innerHTML=pack.items.map(text=>`<li>${icon('check')}${text}</li>`).join('');
    $('#estimate-price').textContent='от '+money(total);
    $('#estimate-duration').textContent='Программа: '+pack.time+(chosen.length?' · дополнения могут увеличить срок':'');
    $('#estimate-breakdown').innerHTML=`<div><span>${pack.title}</span><span>${money(base)}</span></div>`+chosen.map(item=>`<div><span>${item.title}</span><span>${money(Math.round(item.price*factor))}</span></div>`).join('');
  }
  document.querySelectorAll('.configure-options input').forEach(input=>input.addEventListener('change',calculate));
  function selectPackage(key){if(!packages[key])return;$(`input[name="package"][value="${key}"]`).checked=true;calculate();}
  document.querySelectorAll('[data-package-link]').forEach(link=>link.addEventListener('click',()=>selectPackage(link.dataset.packageLink)));
  calculate(); selectPackage(new URLSearchParams(location.search).get('package'));
  const brief=$('#a-brief');
  $('#open-brief').addEventListener('click',()=>{
    const c=configuration;
    $('#brief-estimate').innerHTML=`${c.className} · ${c.pack.title}<b>от ${money(c.total)}</b>Ориентир: ${c.pack.time}${c.chosen.length?' без учёта времени на дополнения':''}`;
    $('#brief-error').textContent='';$('#brief-success').textContent='';
    brief.showModal();
  });
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
