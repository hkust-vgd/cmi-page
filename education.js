// Education page: each activity's text, picture and cards fade in and rise as they come into view, one after another
// in page order: blocks that arrive together follow each other closely, and a block never starts before the ones
// above it. The head script hid them before the first paint (see education.css).
(() => {
  window.eduReveal = true;
  if (!document.documentElement.classList.contains('edu-anim')) return;
  const blocks = [...document.querySelectorAll('.page-education .research-direction')].flatMap((activity) => [
    ...activity.querySelectorAll('.direction-content > *'),
    ...activity.querySelectorAll('.direction-visual, .direction-activities li')
  ]);
  if (!('IntersectionObserver' in window)) {
    blocks.forEach((el) => el.classList.add('edu-in'));
    return;
  }
  const STEP = 90; // ms between blocks that come into view together
  const EASE = 'cubic-bezier(.16, 1, .3, 1)';
  const order = new Map(blocks.map((el, k) => [el, k]));
  let nextSlot = performance.now() + 300; // the first ones follow the jump links
  function reveal(el, delay) {
    el.style.transition = `opacity .7s ${EASE}, transform .9s ${EASE}`;
    el.style.transitionDelay = `${Math.round(delay)}ms`;
    el.classList.add('edu-in');
    // Afterwards hand the element back to its own styles, so hover effects keep their usual speed.
    setTimeout(() => {
      el.style.transition = '';
      el.style.transitionDelay = '';
    }, delay + 1000);
  }
  const observer = new IntersectionObserver((entries) => {
    const now = performance.now();
    const arrived = entries.filter((entry) => entry.isIntersecting).map((entry) => entry.target)
      .sort((a, b) => order.get(a) - order.get(b));
    if (!arrived.length) return;
    const start = Math.min(Math.max(0, nextSlot - now), 300);
    arrived.forEach((el, k) => {
      observer.unobserve(el);
      reveal(el, start + Math.min(k, 6) * STEP);
    });
    nextSlot = now + start + Math.min(arrived.length - 1, 6) * STEP + STEP;
  }, { rootMargin: '0px 0px -10% 0px' });
  blocks.forEach((el) => observer.observe(el));
})();
