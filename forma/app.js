(() => {
  document.querySelectorAll('[data-gallery]').forEach(button => button.addEventListener('click', () => {
    const key = button.dataset.gallery;
    document.querySelectorAll('[data-gallery]').forEach(other => other.setAttribute('aria-pressed', String(other === button)));
    document.querySelectorAll('[data-gallery-image]').forEach(image => image.classList.toggle('is-active', image.dataset.galleryImage === key));
    document.querySelector('.a-gallery-index').textContent = key === 'outside' ? '01 / 02' : '02 / 02';
  }));
  document.querySelectorAll('.a-steps details').forEach(detail => detail.addEventListener('toggle', () => {
    if (detail.open) document.querySelectorAll('.a-steps details').forEach(other => { if (other !== detail) other.open = false; });
  }));
  if (!window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);
  gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', () => {
    gsap.from('.a-hero h1', { y: 20, duration: 1.2, ease: 'power3.out' });
    gsap.to('.a-gallery-images img', { scale: 1.045, ease: 'none', scrollTrigger: { trigger: '.a-gallery', start: 'top bottom', end: 'bottom top', scrub: 1.2 } });
    gsap.fromTo('.a-approach-image img', { scale: 1.06, yPercent: -1.5 }, { scale: 1.06, yPercent: 1.5, ease: 'none', scrollTrigger: { trigger: '.a-approach-image', start: 'top bottom', end: 'bottom top', scrub: 1 } });
  });
})();
