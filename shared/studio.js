(() => {
  const menu = document.querySelector('[data-menu]');
  const nav = document.querySelector('[data-nav]');
  function closeMenu(){if(!menu||!nav)return;menu.setAttribute('aria-expanded','false');menu.setAttribute('aria-label','Открыть меню');nav.classList.remove('is-open');}
  menu?.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',String(open));menu.setAttribute('aria-label',open?'Закрыть меню':'Открыть меню');nav.classList.toggle('is-open',open);});
  nav?.addEventListener('click',e=>{if(e.target.closest('a,button'))closeMenu();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu();});
  document.querySelectorAll('[data-close]').forEach(button=>button.addEventListener('click',()=>button.closest('dialog').close()));
  document.querySelectorAll('dialog').forEach(dialog=>dialog.addEventListener('click',e=>{if(e.target!==dialog)return;const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}));
  document.querySelectorAll('[data-open]').forEach(button=>button.addEventListener('click',()=>{closeMenu();document.getElementById(button.dataset.open)?.showModal();}));
  const bar=document.querySelector('[data-progress]');
  if(window.gsap&&window.ScrollTrigger){
    gsap.registerPlugin(ScrollTrigger);
    gsap.matchMedia().add('(prefers-reduced-motion: no-preference)',()=>{
      document.querySelectorAll('[data-parallax]').forEach(frame=>{const image=frame.querySelector('img');if(image)gsap.fromTo(image,{yPercent:-4,scale:1.1},{yPercent:4,scale:1.1,ease:'none',scrollTrigger:{trigger:frame,start:'top bottom',end:'bottom top',scrub:1.2}});});
      document.querySelectorAll('[data-strip]').forEach(strip=>gsap.fromTo(strip.firstElementChild,{xPercent:2},{xPercent:-18,ease:'none',scrollTrigger:{trigger:strip,start:'top bottom',end:'bottom top',scrub:1}}));
      document.querySelectorAll('[data-image-focus]').forEach(frame=>gsap.fromTo(frame,{clipPath:'inset(4% 3% round 60px)'},{clipPath:'inset(0% 0% round 32px)',ease:'none',scrollTrigger:{trigger:frame,start:'top 85%',end:'top 25%',scrub:1}}));
      if(bar)gsap.to(bar,{scaleX:1,ease:'none',scrollTrigger:{start:0,end:'max',scrub:true}});
    });
    document.fonts.ready.then(()=>ScrollTrigger.refresh());
    window.addEventListener('load',()=>ScrollTrigger.refresh(),{once:true});
  }
  window.Studio={
    download(name,content,type='text/plain;charset=utf-8'){
      const url=URL.createObjectURL(new Blob([content],{type}));const link=document.createElement('a');link.href=url;link.download=name;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
    },
    icon(name){return '<svg class="icon" aria-hidden="true"><use href="'+document.body.dataset.shared+'icons.svg#'+name+'"></use></svg>';}
  };
})();
