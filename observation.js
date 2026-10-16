// Direction 01 showcase carousel: advances on its own, pauses on hover, focus or the pause button,
// and switches with the arrows, the blocks, arrow keys or a swipe.
(function () {
  const root = document.querySelector('.showcase-carousel');
  if (!root) return;
  const track = root.querySelector('.carousel-track');
  const slides = Array.from(root.querySelectorAll('.carousel-slide'));
  const dots = Array.from(root.querySelectorAll('.carousel-dot'));
  const toggle = root.querySelector('.carousel-toggle');
  const DELAY = 6000;
  let index = 0;
  let timer = null;
  let paused = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let held = false;

  root.style.setProperty('--carousel-delay', DELAY + 'ms');
  slides.forEach(function (slide) { // decode every figure now so none is blank mid-slide
    const img = slide.querySelector('img');
    if (img && img.decode) img.decode().catch(function () {});
  });
  root.querySelector('.carousel-controls').hidden = false;

  function schedule() {
    clearTimeout(timer);
    root.classList.remove('is-running');
    root.classList.toggle('is-paused', paused);
    toggle.setAttribute('aria-label', paused ? 'Play slideshow' : 'Pause slideshow');
    if (paused || held || document.hidden) return;
    void root.offsetWidth; // restart the progress animation on the current block
    root.classList.add('is-running');
    timer = setTimeout(function () { show(index + 1); }, DELAY);
  }

  function show(n) {
    index = (n + slides.length) % slides.length;
    track.style.transform = 'translateX(' + (-100 * index) + '%)';
    slides.forEach(function (slide, i) {
      const current = i === index;
      slide.setAttribute('aria-hidden', String(!current));
      slide.inert = !current;
    });
    dots.forEach(function (dot, i) {
      if (i === index) dot.setAttribute('aria-current', 'true');
      else dot.removeAttribute('aria-current');
    });
    schedule();
  }

  root.querySelector('.carousel-prev').addEventListener('click', function () { show(index - 1); });
  root.querySelector('.carousel-next').addEventListener('click', function () { show(index + 1); });
  dots.forEach(function (dot, i) { dot.addEventListener('click', function () { show(i); }); });
  toggle.addEventListener('click', function () { paused = !paused; schedule(); });

  function hold(on) { held = on; schedule(); }
  root.addEventListener('mouseenter', function () { hold(true); });
  root.addEventListener('mouseleave', function () { hold(root.contains(document.activeElement)); });
  root.addEventListener('focusin', function () { hold(true); });
  root.addEventListener('focusout', function (event) { if (!root.contains(event.relatedTarget)) hold(root.matches(':hover')); });
  document.addEventListener('visibilitychange', schedule);

  root.addEventListener('keydown', function (event) {
    if (event.key === 'ArrowLeft') { show(index - 1); event.preventDefault(); }
    if (event.key === 'ArrowRight') { show(index + 1); event.preventDefault(); }
  });

  let startX = null;
  let startY = 0;
  const viewport = root.querySelector('.carousel-viewport');
  viewport.addEventListener('touchstart', function (event) {
    startX = event.touches[0].clientX;
    startY = event.touches[0].clientY;
  }, { passive: true });
  viewport.addEventListener('touchend', function (event) {
    if (startX === null) return;
    const dx = event.changedTouches[0].clientX - startX;
    const dy = event.changedTouches[0].clientY - startY;
    startX = null;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) show(index + (dx < 0 ? 1 : -1));
  }, { passive: true });

  show(0);
})();
