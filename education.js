// Education page: each activity's text, picture and cards fade in and rise as they scroll into view, with the same
// motion as the research pages (see education.css). Anything already on screen when the page opens is left as it is.
(() => {
  if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const blocks = [];
  document.querySelectorAll('.page-education .research-direction').forEach((activity) => {
    const text = activity.querySelector('.direction-content');
    if (text) [...text.children].forEach((child, k) => blocks.push([child, k]));
    activity.querySelectorAll('.direction-visual, .direction-activities li').forEach((el, k) => blocks.push([el, 2 + k]));
  });
  const hidden = blocks.filter(([el, k]) => {
    const box = el.getBoundingClientRect();
    if (box.bottom > 0 && box.top < window.innerHeight) return false;
    el.classList.add('edu-reveal');
    el.style.setProperty('--i', Math.min(k, 6));
    return true;
  });
  document.documentElement.classList.add('edu-anim');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      el.classList.add('in-view');
      observer.unobserve(el);
      // Once it has arrived, hand the element back to its own styles, so hover effects keep their usual speed.
      const delay = parseFloat(getComputedStyle(el).transitionDelay) * 1000 || 0;
      setTimeout(() => {
        el.classList.remove('edu-reveal', 'in-view');
        el.style.removeProperty('--i');
      }, delay + 1400);
    });
  }, { rootMargin: '0px 0px -12% 0px' });
  hidden.forEach(([el]) => observer.observe(el));
})();
