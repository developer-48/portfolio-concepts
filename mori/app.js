(() => {
  const items = [
    {id:1,name:'Капучино',category:'coffee',description:'Ровный баланс эспрессо, молока и мелкой пены.',sizes:[[250,240],[350,300]],milk:true,ingredients:'Эспрессо, молоко',allergens:'Молоко'},
    {id:2,name:'Флэт уайт',category:'coffee',description:'Двойной эспрессо, меньше молока, ярче вкус кофе.',sizes:[[180,270]],milk:true,ingredients:'Двойной эспрессо, молоко',allergens:'Молоко'},
    {id:3,name:'Латте',category:'coffee',description:'Много молока и мягкий кофейный вкус.',sizes:[[250,250],[350,310]],milk:true,ingredients:'Эспрессо, молоко',allergens:'Молоко'},
    {id:4,name:'Айс-латте',category:'cold',description:'Эспрессо и прохладное молоко со льдом.',sizes:[[350,280],[450,340]],milk:true,ingredients:'Эспрессо, молоко, лёд',allergens:'Молоко'},
    {id:5,name:'Эспрессо',category:'coffee',description:'Короткая чашка с плотным вкусом и шоколадным профилем.',sizes:[[40,150]],ingredients:'Кофе, вода'},
    {id:6,name:'Фильтр-кофе',category:'coffee',description:'Чёрный кофе с лёгким телом. Для долгого завтрака.',sizes:[[250,220],[350,270]],ingredients:'Кофе, вода'},
    {id:7,name:'Круассан',category:'bakery',description:'Слоёное тесто на сливочном масле, тонкая хрустящая корочка.',sizes:[[80,190]],unit:'г',ingredients:'Пшеничная мука, масло, молоко, сахар, яйцо, дрожжи',allergens:'Пшеница, молоко, яйцо'},
    {id:8,name:'Миндальный',category:'bakery',description:'Круассан с миндальным кремом и лепестками миндаля.',sizes:[[110,260]],unit:'г',ingredients:'Круассан, миндаль, масло, сахар, яйцо',allergens:'Пшеница, молоко, яйцо, миндаль'},
    {id:9,name:'Американо',category:'coffee',description:'Эспрессо с горячей водой. Чистый кофейный вкус.',sizes:[[200,180],[300,210]],ingredients:'Эспрессо, вода'},
    {id:10,name:'Какао',category:'coffee',description:'Шоколадный напиток на молоке, без эспрессо.',sizes:[[250,230],[350,280]],milk:true,ingredients:'Какао, молоко, сахар',allergens:'Молоко'},
    {id:11,name:'Тост с яйцом',category:'food',description:'Поджаренный хлеб, мягкое яйцо, сыр и свежая зелень.',sizes:[[180,350]],unit:'г',ingredients:'Пшеничный хлеб, яйцо, сыр, масло, зелень',allergens:'Пшеница, молоко, яйцо'},
    {id:12,name:'Йогурт с гранолой',category:'food',description:'Натуральный йогурт, хрустящая гранола и ягодный соус.',sizes:[[220,290]],unit:'г',ingredients:'Йогурт, овсяная гранола, миндаль, ягодный соус',allergens:'Молоко, овёс, миндаль'}
  ];
  const cart = [];
  const grid = document.getElementById('menu-grid');
  const drink = document.getElementById('drink');
  const options = document.getElementById('drink-options');
  const milkOptions = ['Обычное','Овсяное','Кокосовое'];
  let current = items[0], sizeIndex = 0, selectedMilk = 'Обычное', toastTimer;
  const icon = name => '<svg class="icon" aria-hidden="true"><use href="../shared/icons.svg#'+name+'"></use></svg>';
  const unit = item => item.unit || 'мл';
  function price(){return current.sizes[sizeIndex][1] + (current.milk && selectedMilk !== 'Обычное' ? 50 : 0);}
  function announce(message){const t=document.getElementById('toast');t.textContent=message;t.classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove('visible'),2500);}
  function updateItem(){
    document.getElementById('drink-price').textContent=price()+' ₽';
    let ingredients=current.ingredients;
    if(current.milk && selectedMilk!=='Обычное') ingredients=ingredients.replace('молоко',selectedMilk==='Овсяное'?'овсяный напиток':'кокосовый напиток');
    const composition=document.getElementById('drink-composition');composition.replaceChildren();
    const h=document.createElement('b'),p=document.createElement('p');h.textContent='Состав';p.textContent=ingredients+'.';composition.append(h,p);
    if(current.allergens){const note=document.createElement('small');note.textContent='В базовой рецептуре: '+current.allergens.toLowerCase()+'.';composition.append(note);}
  }
  function choiceGroup(title,name,values,onChange){
    const field=document.createElement('fieldset'),legend=document.createElement('legend'),group=document.createElement('div');legend.textContent=title;group.className='m-option-cards';field.append(legend,group);
    values.forEach((value,i)=>{const label=document.createElement('label'),input=document.createElement('input'),span=document.createElement('span');input.type='radio';input.name=name;input.value=String(i);input.checked=i===0;span.textContent=value;label.append(input,span);input.addEventListener('change',()=>{onChange(i);updateItem();});group.append(label);});return field;
  }
  function openItem(id){
    current=items.find(item=>item.id===id);sizeIndex=0;selectedMilk='Обычное';
    document.getElementById('drink-title').textContent=current.name;document.getElementById('drink-description').textContent=current.description;
    document.getElementById('drink-format').textContent=current.sizes.map(([size])=>size+' '+unit(current)).join(' / ');
    options.replaceChildren();
    if(current.sizes.length>1) options.append(choiceGroup('Объём','size',current.sizes.map(([size,cost])=>size+' '+unit(current)+' · '+cost+' ₽'),i=>{sizeIndex=i;}));
    if(current.milk) options.append(choiceGroup('Молоко','milk',milkOptions.map((m,i)=>m+(i?' · +50 ₽':'')),i=>{selectedMilk=milkOptions[i];}));
    updateItem();drink.showModal();
  }
  function renderMenu(category){
    const list=items.filter(item=>category==='all'||item.category===category);grid.replaceChildren();
    list.forEach((item,i)=>{
      const article=document.createElement('article');article.className='menu-card m-menu-entry';
      article.innerHTML='<span class="m-menu-index"></span><div class="m-menu-content"><div class="card-top"><h3></h3><span></span></div><p></p><small></small></div><button type="button">'+icon('plus')+'</button>';
      article.querySelector('.m-menu-index').textContent=String(i+1).padStart(2,'0');article.querySelector('h3').textContent=item.name;
      article.querySelector('.card-top>span').textContent=(item.sizes.length>1?'от ':'')+item.sizes[0][1]+' ₽';article.querySelector('p').textContent=item.description;
      article.querySelector('small').textContent=item.sizes.map(([size])=>size+' '+unit(item)).join(' / ')+(item.milk?' · Можно изменить молоко':'');
      const button=article.querySelector('button');button.setAttribute('aria-label','Выбрать '+item.name);button.addEventListener('click',()=>openItem(item.id));grid.append(article);
    });
    document.getElementById('menu-status').textContent='Показано позиций: '+list.length+'.';
    if(window.ScrollTrigger)ScrollTrigger.refresh();
  }
  document.querySelectorAll('[data-category]').forEach(button=>button.addEventListener('click',()=>{document.querySelectorAll('[data-category]').forEach(other=>other.setAttribute('aria-pressed',String(other===button)));renderMenu(button.dataset.category);}));
  function add(item,index=0,milk='Обычное'){
    const key=[item.id,index,item.milk?milk:''].join(':');const old=cart.find(row=>row.key===key);
    if(old) old.qty+=1;else cart.push({key,name:item.name,price:item.sizes[index][1]+(item.milk&&milk!=='Обычное'?50:0),options:item.sizes[index][0]+' '+unit(item)+(item.milk?' · '+milk:''),qty:1});
  }
  function renderCart(focusKey, action){
    const count=cart.reduce((sum,row)=>sum+row.qty,0);document.getElementById('basket-count').textContent=count;
    const list=document.getElementById('basket-items');list.replaceChildren();
    if(!count){const p=document.createElement('p');p.textContent='Пока здесь пусто. Начните с напитка или завтрака.';list.append(p);}
    cart.forEach(item=>{
      const row=document.createElement('div');row.className='basket-row';row.dataset.cartKey=item.key;row.innerHTML='<div><strong></strong><small></small></div><span class="m-row-price"></span><div class="m-quantity"><button type="button">'+icon('minus')+'</button><output></output><button type="button">'+icon('plus')+'</button></div>';
      row.querySelector('strong').textContent=item.name;row.querySelector('small').textContent=item.options;row.querySelector('.m-row-price').textContent=item.price*item.qty+' ₽';row.querySelector('output').textContent=item.qty;
      const [less,more]=row.querySelectorAll('button');less.dataset.quantity='less';more.dataset.quantity='more';less.setAttribute('aria-label','Уменьшить количество: '+item.name);more.setAttribute('aria-label','Добавить ещё: '+item.name);
      less.addEventListener('click',()=>{item.qty--;if(!item.qty)cart.splice(cart.indexOf(item),1);renderCart(item.key,'less');});more.addEventListener('click',()=>{item.qty++;renderCart(item.key,'more');});list.append(row);
    });
    document.getElementById('basket-total').textContent=count?'Итого: '+cart.reduce((sum,item)=>sum+item.price*item.qty,0)+' ₽':'';
    if(focusKey){const targetRow=[...list.children].find(row=>row.dataset.cartKey===focusKey)||list.querySelector('.basket-row');const target=targetRow?.querySelector('[data-quantity="'+action+'"]')||document.querySelector('#basket [data-close]');target.focus();}
  }
  document.getElementById('drink-form').addEventListener('submit',event=>{event.preventDefault();add(current,sizeIndex,selectedMilk);renderCart();drink.close();announce(current.name+' — в вашем выборе');});
  document.addEventListener('mori:pair-preview',event=>{const pair=event.detail.map(id=>items.find(item=>item.id===id)).filter(Boolean);document.getElementById('mori-pair-price').textContent=pair.reduce((total,item)=>total+item.sizes[0][1],0)+' ₽';});
  document.addEventListener('mori:add-pair',event=>{const pair=event.detail.map(id=>items.find(item=>item.id===id)).filter(Boolean);if(pair.length!==2)return;pair.forEach(item=>add(item));renderCart();document.getElementById('m-pair-status').textContent='Дуэт добавлен в ваш выбор.';announce('Дуэт добавлен в ваш выбор');});
  document.addEventListener('mori:open-item',event=>{if(items.some(item=>item.id===event.detail))openItem(event.detail);});
  renderMenu('all');renderCart();
const brews={filter:{title:'Чашка с ясным вкусом.',copy:'Смочите бумажный фильтр. Налейте немного воды на кофе, дайте ему раскрыться, затем медленно добавляйте оставшуюся воду круговыми движениями.',values:['18 г','300 мл','3 минуты'],labels:['кофе среднего помола','вода 92–96 °C','ориентир по времени']},turk:{title:'Тихое утро у плиты.',copy:'Используйте мелкий помол. Смешайте кофе с водой в турке и нагревайте на слабом огне. Снимите, когда начнёт подниматься пена, не доводя до кипения.',values:['10 г','100 мл','4 минуты'],labels:['кофе тонкого помола','холодная вода','ориентир по времени']},press:{title:'Плотно. Просто. Без спешки.',copy:'Залейте крупно смолотый кофе горячей водой. Дайте настояться, аккуратно размешайте и медленно опустите поршень. Сразу перелейте кофе в чашку.',values:['20 г','300 мл','4 минуты'],labels:['кофе крупного помола','вода 92–96 °C','время настаивания']}};
function renderBrew(key){const b=brews[key];const panel=document.getElementById('brew-info');panel.innerHTML='<h3></h3><p></p><div class="brew-measures"></div>';panel.querySelector('h3').textContent=b.title;panel.querySelector('p').textContent=b.copy;b.values.forEach((value,i)=>{const div=document.createElement('div');const num=document.createElement('b'),label=document.createElement('span');num.textContent=value;label.textContent=b.labels[i];div.append(num,label);panel.querySelector('.brew-measures').append(div);});}
document.querySelectorAll('[data-brew]').forEach(button=>button.addEventListener('click',()=>{document.querySelectorAll('[data-brew]').forEach(x=>x.setAttribute('aria-pressed',String(x===button)));renderBrew(button.dataset.brew);}));
  renderBrew('filter');
  if(window.gsap&&window.ScrollTrigger){
    gsap.matchMedia().add('(prefers-reduced-motion: no-preference)',()=>{
      gsap.to('.word-band div',{xPercent:-20,ease:'none',scrollTrigger:{trigger:'.word-band',start:'top bottom',end:'bottom top',scrub:1}});
    });
  }
})();
