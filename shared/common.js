(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const menu = document.querySelector('.menu-toggle');
  if (menu) {
    const nav = document.getElementById(menu.getAttribute('aria-controls'));
    const close = () => {nav.classList.remove('is-open');menu.setAttribute('aria-expanded','false');if(menu.hasAttribute('aria-label'))menu.setAttribute('aria-label','Открыть меню');};
    menu.addEventListener('click', () => {const open=menu.getAttribute('aria-expanded')!=='true';nav.classList.toggle('is-open',open);menu.setAttribute('aria-expanded',String(open));if(menu.hasAttribute('aria-label'))menu.setAttribute('aria-label',open?'Закрыть меню':'Открыть меню');});
    nav.querySelectorAll('a,button').forEach(a=>a.addEventListener('click',close));
    document.addEventListener('keydown',e=>{if(e.key==='Escape')close();});
  }
  document.querySelectorAll('[data-open-dialog]').forEach(button=>button.addEventListener('click',()=>document.getElementById(button.dataset.openDialog).showModal()));
  document.querySelectorAll('dialog').forEach(dialog=>{
    dialog.querySelectorAll('[data-close]').forEach(button=>button.addEventListener('click',()=>dialog.close()));
    dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
  });
  document.querySelectorAll('[data-brief-form]').forEach(form=>{
    let fileUrl;
    form.addEventListener('submit',event=>{
      event.preventDefault();const data=new FormData(form);const content=[document.title,'Демонстрационный бриф. Никуда не отправлен.','',...Array.from(data,([key,value])=>key+': '+value)].join('\n');
      if(fileUrl)URL.revokeObjectURL(fileUrl);fileUrl=URL.createObjectURL(new Blob([content],{type:'text/plain;charset=utf-8'}));
      const feedback=form.querySelector('.feedback');feedback.textContent='Файл подготовлен. Данные остаются на вашем устройстве. ';const link=document.createElement('a');link.href=fileUrl;link.download=form.dataset.downloadFile||'concept-brief.txt';link.textContent='Скачать файл';link.style.textDecoration='underline';feedback.append(link);link.click();
    });
    window.addEventListener('pagehide',()=>{if(fileUrl)URL.revokeObjectURL(fileUrl);},{once:true});
  });
  if (!window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);
  gsap.matchMedia().add('(prefers-reduced-motion: no-preference)',()=>{
    document.querySelectorAll('[data-image-reveal]').forEach(el=>{
      const img=el.querySelector('img');if(img)gsap.fromTo(img,{scale:1.06,yPercent:-1.5},{scale:1.06,yPercent:1.5,ease:'none',scrollTrigger:{trigger:el,start:'top bottom',end:'bottom top',scrub:1}});
    });
    document.querySelectorAll('[data-magnetic]').forEach(el=>{
      const move=e=>{if(!matchMedia('(pointer:fine)').matches)return;const r=el.getBoundingClientRect();gsap.to(el,{x:(e.clientX-r.left-r.width/2)*.13,y:(e.clientY-r.top-r.height/2)*.13,duration:.3});};
      const leave=()=>gsap.to(el,{x:0,y:0,duration:.7,ease:'elastic.out(1,.5)'});el.addEventListener('pointermove',move);el.addEventListener('pointerleave',leave);
    });
  });
  const bar=document.querySelector('.scroll-line');if(bar)gsap.to(bar,{scaleX:1,ease:'none',scrollTrigger:{start:0,end:'max',scrub:true}});
  document.fonts.ready.then(()=>ScrollTrigger.refresh());
})();
