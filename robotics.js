// One active hardware card at a time; hover, keyboard and touch share the same state.
(() => {
  const cards = [...document.querySelectorAll('[data-component]')];
  let active = null;
  function close(card) {
    if (!card) return;
    card.removeAttribute('data-active');
    card.querySelector('button').setAttribute('aria-expanded', 'false');
    card.querySelector('.component-detail').hidden = true;
    if (active === card) active = null;
  }
  function open(card) {
    if (active !== card) close(active);
    active = card;
    card.setAttribute('data-active', '');
    card.querySelector('button').setAttribute('aria-expanded', 'true');
    card.querySelector('.component-detail').hidden = false;
  }
  cards.forEach(card => {
    const button = card.querySelector('button');
    card.addEventListener('pointerenter', event => {
      if (event.pointerType === 'mouse') open(card);
    });
    card.addEventListener('pointerleave', event => {
      if (event.pointerType === 'mouse' && !card.contains(document.activeElement)) close(card);
    });
    button.addEventListener('focus', () => open(card));
    card.addEventListener('focusout', event => {
      if (!card.contains(event.relatedTarget)) close(card);
    });
    // A tap/click keeps the description open; tap outside or press Escape to dismiss.
    button.addEventListener('click', () => open(card));
  });
  document.addEventListener('pointerdown', event => {
    if (active && !active.contains(event.target)) close(active);
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && active) close(active);
  });
})();

// Keep full-size figures on this page, with native dialog focus and Escape support.
(() => {
  const figures = [...document.querySelectorAll('a.work-media')];
  if (!figures.length) return;
  const dialog = document.createElement('dialog');
  dialog.className = 'media-dialog';
  dialog.setAttribute('aria-labelledby', 'media-dialog-title');
  dialog.innerHTML = '<div class="media-dialog-heading"><h2 id="media-dialog-title"></h2><button class="media-dialog-close" type="button" aria-label="Close enlarged image" autofocus>×</button></div><img class="media-dialog-image" alt=""><p class="media-dialog-caption"></p>';
  document.body.append(dialog);
  const image = dialog.querySelector('img');
  const title = dialog.querySelector('h2');
  const caption = dialog.querySelector('.media-dialog-caption');
  const close = dialog.querySelector('button');
  let trigger = null;
  figures.forEach(figure => {
    figure.removeAttribute('target');
    figure.setAttribute('aria-haspopup', 'dialog');
    figure.addEventListener('click', event => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      trigger = figure;
      const source = figure.querySelector('img');
      title.textContent = figure.closest('.work-card').querySelector('h3').textContent;
      caption.textContent = source.alt;
      image.alt = source.alt;
      image.src = figure.href;
      dialog.showModal();
    });
  });
  close.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    const bounds = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) dialog.close();
  });
  dialog.addEventListener('close', () => trigger?.focus({preventScroll:true}));
})();

// Muted, on-demand hover previews; the play button also works on touch screens.
(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  document.querySelectorAll('[data-video-preview]').forEach(preview => {
    const video = preview.querySelector('video');
    const button = preview.querySelector('.demo-toggle');
    let wanted = false;
    let pinned = false;
    function stop() {
      wanted = false;
      pinned = false;
      video.pause();
      preview.classList.remove('is-playing');
      button.textContent = '▶ Play video';
      button.setAttribute('aria-label', 'Play jellyfish robot video');
      button.setAttribute('aria-pressed', 'false');
    }
    function play() {
      wanted = true;
      if (!video.getAttribute('src')) video.src = video.dataset.src;
      video.play().catch(stop);
    }
    video.addEventListener('playing', () => {
      if (!wanted) return stop();
      preview.classList.add('is-playing');
      button.textContent = 'Ⅱ Pause video';
      button.setAttribute('aria-label', 'Pause jellyfish robot video');
      button.setAttribute('aria-pressed', 'true');
    });
    preview.addEventListener('pointerenter', event => {
      if (event.pointerType === 'mouse' && !reducedMotion.matches) play();
    });
    preview.addEventListener('pointerleave', () => { if (!pinned) stop(); });
    button.addEventListener('click', () => {
      if (wanted) stop();
      else { pinned = true; play(); }
    });
    new IntersectionObserver(([entry]) => { if (!entry.isIntersecting) stop(); }).observe(preview);
    document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
    document.querySelector('.media-dialog')?.addEventListener('close', stop);
    reducedMotion.addEventListener('change', () => { if (reducedMotion.matches) stop(); });
  });
})();
