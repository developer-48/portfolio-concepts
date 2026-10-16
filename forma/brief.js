(() => {
  const services={
    architecture:{title:'Архитектура частного дома',intro:'От возможностей участка к понятной организации дома. Сначала определяем, как вы будете здесь жить, затем работаем с объёмом и фасадами.',items:['Анализ участка и исходных ограничений','Посадка дома, планировки и сценарии движения','Объём, фасады, разрезы и ключевые материалы'],result:'Согласованная архитектурная концепция. Состав рабочей документации определяется отдельно.',type:'Частный дом'},
    interior:{title:'Интерьер под ваш образ жизни',intro:'Работаем с существующим пространством: собираем удобную планировку, продумываем хранение, свет и материалы.',items:['Обмерный план и варианты расстановки мебели','Сценарии освещения и палитра отделки','Визуализации основных помещений и спецификации'],result:'Согласованный интерьер и комплект материалов по выбранному составу проекта.',type:'Интерьер'},
    complete:{title:'Дом и интерьер в одной логике',intro:'Связываем архитектуру с тем, что будет внутри. Окна, инженерные решения, мебель и свет обсуждаются как части одного пространства.',items:['Общее задание на дом и интерьер','Согласование объёмов, планировок и внутренних решений','Единый визуальный язык и этапность проектирования'],result:'Последовательный проект от посадки дома до деталей интерьера, с согласованными границами каждого этапа.',type:'Дом и интерьер'}
  };
  let service='architecture';
  function renderService(){
    const data=services[service],panel=document.getElementById('service-copy');panel.replaceChildren();
    const h=document.createElement('h3'),p=document.createElement('p'),list=document.createElement('ul'),result=document.createElement('div'),button=document.createElement('button');h.textContent=data.title;p.textContent=data.intro;
    data.items.forEach(text=>{const li=document.createElement('li');li.textContent=text;list.append(li);});result.className='a-service-result';const label=document.createElement('span'),copy=document.createElement('p');label.textContent='На выходе';copy.textContent=data.result;result.append(label,copy);
    button.type='button';button.className='a-service-brief';button.textContent='Подготовить задачу по этому направлению';button.addEventListener('click',()=>{document.querySelectorAll('[name="Направление"]').forEach(input=>{input.checked=input.value===data.type;});showStep(0);document.getElementById('brief').showModal();});panel.append(h,p,list,result,button);
  }
  document.querySelectorAll('[data-service]').forEach(button=>button.addEventListener('click',()=>{service=button.dataset.service;document.querySelectorAll('[data-service]').forEach(other=>other.setAttribute('aria-pressed',String(other===button)));renderService();}));
  const form=document.getElementById('project-brief'),error=document.getElementById('brief-error'),feedback=document.getElementById('brief-feedback');
  const steps=[...form.querySelectorAll('[data-brief-step]')];let step=0,fileUrl;
  function values(){const data=new FormData(form);return [['Направление',data.get('Направление')],['Место',String(data.get('Место')).trim()],['Площадь',data.get('Площадь')],['Приоритеты',data.getAll('Приоритеты').join(', ')||'Не указаны'],['Задача',String(data.get('Задача')).trim()],['Готовность',data.get('Готовность')]];}
  function review(){const dl=document.getElementById('brief-review');dl.replaceChildren();values().forEach(([label,value])=>{const row=document.createElement('div'),dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=label;dd.textContent=value;row.append(dt,dd);dl.append(row);});}
  function showStep(next,focus=false){
    step=next;steps.forEach((panel,i)=>{panel.hidden=i!==step;});document.querySelectorAll('.a-brief-progress li').forEach((li,i)=>{if(i===step)li.setAttribute('aria-current','step');else li.removeAttribute('aria-current');});
    document.getElementById('brief-back').hidden=step===0;document.getElementById('brief-next').hidden=step===2;document.getElementById('brief-save').hidden=step!==2;error.textContent='';feedback.replaceChildren();
    if(step===2)review();
    if(focus){const target=step===0?document.getElementById('brief-location'):step===1?steps[1].querySelector('input'):document.querySelector('.a-review-title');if(step===2)target.setAttribute('tabindex','-1');target.focus();}
  }
  function valid(){
    const field=document.getElementById(step===0?'brief-location':'brief-task');if(step===2)return true;
    if(!field.value.trim()){error.textContent=step===0?'Укажите город или регион, чтобы сохранить контекст проекта.':'Опишите задачу хотя бы одним предложением.';field.setAttribute('aria-invalid','true');field.focus();return false;}
    field.removeAttribute('aria-invalid');return true;
  }
  document.getElementById('brief-next').addEventListener('click',()=>{if(valid())showStep(step+1,true);});document.getElementById('brief-back').addEventListener('click',()=>showStep(step-1,true));
  form.addEventListener('input',event=>{if(event.target.matches('[aria-invalid]'))event.target.removeAttribute('aria-invalid');error.textContent='';feedback.replaceChildren();});
  form.addEventListener('submit',event=>{
    event.preventDefault();if(step<2){if(valid())showStep(step+1,true);return;}
    const content=['FORMA / Бриф проекта','Авторский концепт. Заявка не отправлена.','',...values().map(([label,value])=>label+'\n'+value+'\n')].join('\n');
    if(fileUrl)URL.revokeObjectURL(fileUrl);fileUrl=URL.createObjectURL(new Blob([content],{type:'text/plain;charset=utf-8'}));
    feedback.textContent='Бриф готов. ';const link=document.createElement('a');link.href=fileUrl;link.download='forma-project-brief.txt';link.textContent='Скачать файл ещё раз';feedback.append(link);link.click();
  });
  window.addEventListener('pagehide',()=>{if(fileUrl)URL.revokeObjectURL(fileUrl);});
  renderService();showStep(0);
})();
