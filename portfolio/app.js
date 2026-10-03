(() => {
  const menu = document.querySelector('.menu-button');
  const nav = document.getElementById('navigation');
  const closeMenu = () => { nav.classList.remove('is-open'); menu.setAttribute('aria-expanded', 'false'); menu.setAttribute('aria-label', 'Открыть меню'); };
  menu.addEventListener('click', () => { const open = menu.getAttribute('aria-expanded') !== 'true'; nav.classList.toggle('is-open', open); menu.setAttribute('aria-expanded', String(open)); menu.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню'); });
  nav.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });
  const projects = {
    kf21: { title: 'KF21', url: 'https://kf21.ru/', caption: 'Сайт образовательного проекта · Разработка с нуля по макету', description: 'Публичный лендинг образовательного проекта. Реализовал сайт с нуля по предоставленному макету.', role: 'Выполнил фронтенд-реализацию всего лендинга, адаптивную вёрстку и собственные визуальные доработки.', status: 'Показан публичный лендинг. Опыт работы над личными кабинетами описан отдельно.' },
    donuts: { title: '39 Donuts', url: 'https://developer-48.github.io/39donuts-franchise-concept-demo/', caption: 'Редизайн сайта франшизы · Дизайн и разработка', description: 'Самостоятельный редизайн рекламного сайта франшизы: структура, визуальная концепция и реализация.', role: 'Полностью разработал новый дизайн и сайт без участия других дизайнеров и разработчиков.', status: 'Здесь доступна демонстрация редизайна.' },
    mori: { title: 'MORI', url: '../mori/', caption: 'Личный концепт кофейни · Дизайн и разработка', description: 'Вымышленная кофейня с интерактивным меню. Самостоятельный концепт для портфолио.', role: 'Разработал дизайн и сайт: фильтры меню, настройка напитков, пересчёт цены и выбор рецепта.', status: 'Личная работа. Настоящие заказы и платежи не принимаются.' }
  };
  document.querySelectorAll('[data-showcase]').forEach(button => button.addEventListener('click', () => {
    const key = button.dataset.showcase, project = projects[key];
    document.querySelectorAll('[data-showcase]').forEach(other => other.setAttribute('aria-pressed', String(other === button)));
    document.querySelectorAll('[data-shot]').forEach(image => image.classList.toggle('is-active', image.dataset.shot === key));
    document.getElementById('showcase-link').href = project.url;
    document.getElementById('showcase-link').setAttribute('aria-label', 'Открыть ' + project.title);
    document.getElementById('showcase-caption').textContent = project.caption;
    document.querySelector('.showcase-stage').style.background = key === 'mori' ? '#fffdf4' : '#fff';
  }));
  const dialog = document.getElementById('case-dialog');
  document.querySelectorAll('[data-case]').forEach(button => button.addEventListener('click', () => {
    const project = projects[button.dataset.case];
    for (const [id, text] of Object.entries({ 'case-title': project.title, 'case-description': project.description, 'case-role': project.role, 'case-status': project.status })) document.getElementById(id).textContent = text;
    document.getElementById('case-link').href = project.url;
    dialog.showModal();
  }));
  document.getElementById('close-case').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target !== dialog) return; const rect = dialog.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close(); });
  if (!window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);
  gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', () => {
    gsap.from('.hero h1', { y: 22, duration: 1.05, ease: 'power3.out' });
    document.querySelectorAll('.media-image img').forEach(image => gsap.fromTo(image, { scale: 1.06, yPercent: -1.8 }, { scale: 1.06, yPercent: 1.8, ease: 'none', scrollTrigger: { trigger: image.parentElement, start: 'top bottom', end: 'bottom top', scrub: 1 } }));
    gsap.to('.hero-specialty', { x: -18, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 1 } });
  });
  document.fonts.ready.then(() => ScrollTrigger.refresh());
})();
