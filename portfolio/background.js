(() => {
  const canvas = document.getElementById('flow-background');
  const context = canvas.getContext('2d', { alpha: true });
  if (!context) return;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const control = document.getElementById('motion-toggle');
  let width = 0, height = 0, last = 0, raf = 0;
  let enabled = !motion.matches, activeUntil = performance.now() + 2200;
  let scrollTarget = 0, scrollFlow = 0;
  const pointer = { x: innerWidth * .64, y: innerHeight * .35 };
  const follower = { ...pointer };

  function render(time) {
    context.clearRect(0, 0, width, height);
    const t = time * .00013;
    const glow = context.createRadialGradient(follower.x, follower.y, 0, follower.x, follower.y, 350);
    glow.addColorStop(0, 'rgba(128,91,207,.10)');
    glow.addColorStop(1, 'rgba(128,91,207,0)');
    context.fillStyle = glow;
    context.fillRect(0, 0, width, height);
    for (let line = 0; line < 19; line++) {
      context.beginPath();
      for (let step = 0; step <= 54; step++) {
        const x = step / 54 * (width + 120) - 60;
        const baseline = line / 18 * height;
        const dx = x - follower.x, dy = baseline - follower.y;
        const influence = Math.exp(-(dx * dx + dy * dy) / 115000);
        const y = baseline + Math.sin(x / 230 + line * .19 + t) * 24
          + Math.cos(x / 430 - line * .26 + t * .7) * 37
          + influence * Math.sin((baseline - follower.y) / 150) * 125
          + scrollFlow * Math.sin(x / width * Math.PI) * 25;
        if (!step) context.moveTo(x, y); else context.lineTo(x, y);
      }
      context.strokeStyle = line % 3 === 0 ? 'rgba(170,148,219,.115)' : 'rgba(137,150,191,.065)';
      context.lineWidth = line % 3 === 0 ? .8 : .65;
      context.stroke();
    }
  }
  function tick(now) {
    raf = 0;
    if (document.hidden || !enabled) { canvas.dataset.motion = 'paused'; return; }
    if (now - last >= 33) {
      last = now;
      follower.x += (pointer.x - follower.x) * .12;
      follower.y += (pointer.y - follower.y) * .12;
      scrollFlow += (scrollTarget - scrollFlow) * .08;
      render(now);
      canvas.dataset.motion = 'running';
    }
    if (now < activeUntil || Math.abs(follower.x - pointer.x) + Math.abs(follower.y - pointer.y) > .4) {
      raf = requestAnimationFrame(tick);
    } else canvas.dataset.motion = 'idle';
  }
  function wake(duration = 1300) {
    activeUntil = performance.now() + duration;
    if (!raf && enabled && !document.hidden) raf = requestAnimationFrame(tick);
  }
  function resize() {
    width = innerWidth; height = innerHeight;
    const ratio = Math.min(devicePixelRatio, 1.25);
    canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    render(performance.now()); wake();
  }
  window.addEventListener('pointermove', event => {
    if (event.pointerType === 'touch') return;
    pointer.x = event.clientX; pointer.y = event.clientY; wake();
  }, { passive: true });
  window.addEventListener('scroll', () => { scrollTarget = Math.sin(scrollY * .0014); wake(850); }, { passive: true });
  window.addEventListener('resize', resize, { passive: true });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { cancelAnimationFrame(raf); raf = 0; canvas.dataset.motion = 'paused'; } else wake();
  });
  function setEnabled(value) {
    enabled = value;
    control.setAttribute('aria-pressed', String(enabled));
    control.setAttribute('aria-label', enabled ? 'Остановить фоновую анимацию' : 'Включить фоновую анимацию');
    if (!enabled) { cancelAnimationFrame(raf); raf = 0; canvas.dataset.motion = 'paused'; }
    else wake();
  }
  motion.addEventListener('change', () => setEnabled(!motion.matches));
  control.addEventListener('click', () => setEnabled(!enabled));
  window.addEventListener('pagehide', () => cancelAnimationFrame(raf), { once: true });
  setEnabled(enabled); resize();
})();
