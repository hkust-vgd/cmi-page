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

// Enlarge each project's displayed panel without leaving the page.
(() => {
  const figures = [...document.querySelectorAll('a.feature-media, a.restoration-media')];
  if (!figures.length) return;
  const dialog = document.createElement('dialog');
  dialog.className = 'conservation-lightbox';
  dialog.setAttribute('aria-labelledby', 'conservation-lightbox-title');
  dialog.setAttribute('aria-describedby', 'conservation-lightbox-caption');
  dialog.innerHTML = '<div class="conservation-lightbox-heading"><h2 id="conservation-lightbox-title"></h2><button type="button" aria-label="Close enlarged image" autofocus>×</button></div><div class="conservation-lightbox-stage"></div><p id="conservation-lightbox-caption"></p>';
  document.body.append(dialog);
  const stage = dialog.querySelector('.conservation-lightbox-stage');
  let trigger = null;
  figures.forEach(figure => {
    figure.setAttribute('aria-haspopup', 'dialog');
    figure.addEventListener('click', event => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      trigger = figure;
      const sourcePanel = figure.querySelector('.conservation-panel');
      const sourceImage = figure.querySelector('img');
      const panel = (sourcePanel || sourceImage).cloneNode(true);
      const image = sourcePanel ? panel.querySelector('img') : panel;
      image.loading = 'eager';
      stage.replaceChildren(panel);
      const ratio = sourcePanel ? (panel.classList.contains('coast-panel') ? 1651 / 924 : 1651 / 982) : Number(sourceImage.getAttribute('width')) / Number(sourceImage.getAttribute('height'));
      stage.style.setProperty('--panel-ratio', ratio);
      dialog.querySelector('h2').textContent = figure.closest('.project-feature, .restoration-card').querySelector('h3').textContent;
      dialog.querySelector('#conservation-lightbox-caption').textContent = figure.closest('figure')?.querySelector('figcaption')?.textContent || sourceImage.alt;
      dialog.showModal();
    });
  });
  dialog.querySelector('button').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    const bounds = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) dialog.close();
  });
  dialog.addEventListener('close', () => trigger?.focus({preventScroll:true}));
})();
