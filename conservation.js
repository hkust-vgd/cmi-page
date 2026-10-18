// Blend adjacent illustrated poses at display refresh rate, without a control UI.
(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  document.querySelectorAll('[data-phoenix]').forEach(scene => {
    const [current, next] = scene.querySelectorAll('.phoenix-sprite');
    const frameDuration = 100;
    let visible = false;
    let request = 0;
    let start = 0;
    const position = frame => `${(frame % 4) * 100 / 3}% ${Math.floor(frame / 4) * 100 / 3}%`;
    function render(time) {
      if (!start) start = time;
      const progress = (time - start) / frameDuration;
      const frame = Math.floor(progress) % 16;
      const fraction = progress % 1;
      current.style.backgroundPosition = position(frame);
      next.style.backgroundPosition = position((frame + 1) % 16);
      // Short in-betweens soften pose changes without a long ghost trail.
      const blend = Math.max(0, Math.min(1, (fraction - 0.45) / 0.55));
      next.style.opacity = String(blend * blend * (3 - 2 * blend));
      request = requestAnimationFrame(render);
    }
    function update() {
      cancelAnimationFrame(request);
      start = 0;
      const active = visible && !document.hidden && !reducedMotion.matches;
      scene.querySelector('.phoenix-bob').style.animationPlayState = active ? 'running' : 'paused';
      if (active) request = requestAnimationFrame(render);
      else {
        current.style.backgroundPosition = position(0);
        next.style.opacity = '0';
      }
    }
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      update();
    }).observe(scene);
    reducedMotion.addEventListener('change', update);
    document.addEventListener('visibilitychange', update);
  });
})();
