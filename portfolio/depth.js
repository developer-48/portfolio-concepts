(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  document.querySelectorAll('[data-process]').forEach(story => {
    const buttons = [...story.querySelectorAll('[data-process-choice]')];
    const panels = [...story.querySelectorAll('[data-process-panel]')];
    // Visibility keeps the tallest explanation in the layout; inert and hidden
    // remove inactive content from both interaction and the accessibility tree.
    panels.forEach(panel => { panel.inert = panel.hidden; });
    buttons.forEach(button => button.addEventListener('click', () => {
      const choice = button.dataset.processChoice;
      if (story.dataset.current === choice) return;
      story.dataset.current = choice;
      buttons.forEach(other => other.setAttribute('aria-pressed', String(other === button)));
      panels.forEach(panel => {
        const active = panel.dataset.processPanel === choice;
        panel.hidden = !active;
        panel.inert = !active;
      });
      // Only the selected process is animated. No scroll reveal or layout shift.
      if (!reducedMotion.matches && window.gsap) {
        const graphic = story.querySelector('.document-composition, .network-composition');
        gsap.killTweensOf(graphic);
        gsap.fromTo(graphic, { y: 4 }, { y: 0, duration: .35, ease: 'power2.out', clearProps: 'transform' });
      }
    }));
  });
})();
