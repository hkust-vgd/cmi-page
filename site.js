const toggle = document.querySelector('.menu');
const nav = document.querySelector('#navigation');
const researchGroup = document.querySelector('.nav-research');
const researchToggle = document.querySelector('.research-toggle');
const researchNav = document.querySelector('#research-navigation');

function setResearchOpen(open) {
  researchToggle.setAttribute('aria-expanded', String(open));
  researchToggle.setAttribute('aria-label', `${open ? 'Hide' : 'Show'} research directions`);
  researchNav.hidden = !open;
}

function setMenuOpen(open) {
  toggle.setAttribute('aria-expanded', String(open));
  nav.classList.toggle('open', open);
  toggle.querySelector('span').textContent = open ? '−' : '＋';
  if (!open) setResearchOpen(false);
}

toggle.addEventListener('click', () => {
  setMenuOpen(toggle.getAttribute('aria-expanded') !== 'true');
});
researchToggle.addEventListener('click', () => {
  setResearchOpen(researchToggle.getAttribute('aria-expanded') !== 'true');
});
document.addEventListener('click', event => {
  if (!researchGroup.contains(event.target)) setResearchOpen(false);
});
researchGroup.addEventListener('focusout', event => {
  if (!researchGroup.contains(event.relatedTarget)) setResearchOpen(false);
});
document.addEventListener('keydown', event => {
  if (event.key !== 'Escape') return;
  if (!researchNav.hidden) {
    setResearchOpen(false);
    researchToggle.focus();
  } else if (nav.classList.contains('open')) {
    setMenuOpen(false);
    toggle.focus();
  }
});
window.matchMedia('(max-width: 980px)').addEventListener('change', () => setMenuOpen(false));

const heroImg = document.querySelector('.hero-visual img');
const heroMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const heroDesktop = window.matchMedia('(min-width: 641px)');
let heroTicking = false;

function updateHero() {
  heroTicking = false;
  if (!heroImg) return;
  if (heroMotion.matches || !heroDesktop.matches) {
    heroImg.style.transform = '';
    return;
  }
  const offset = window.scrollY * 0.35;
  heroImg.style.transform = offset > 0
    ? `translate3d(0, ${offset}px, 0) scale(1.12)`
    : '';
}

window.addEventListener('scroll', () => {
  if (!heroTicking) {
    heroTicking = true;
    requestAnimationFrame(updateHero);
  }
}, { passive: true });

if (heroImg) {
  heroImg.addEventListener('animationend', () => {
    heroImg.classList.add('hero-zoom-done');
  }, { once: true });
}

const principles = document.querySelector('.edu-principles-window');
if (principles) {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const track = principles.querySelector('.edu-principles-track');
  const cards = [...track.querySelectorAll('article')];
  function hideClone(card) {
    const clone = card.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    return clone;
  }
  const cloneBeforeCard = hideClone(cards[cards.length - 2]);
  const cloneBefore = hideClone(cards[cards.length - 1]);
  const cloneAfter = hideClone(cards[0]);
  const cloneAfterCard = hideClone(cards[1]);
  track.prepend(cloneBeforeCard, cloneBefore);
  track.append(cloneAfter, cloneAfterCard);
  const slides = [cloneBeforeCard, cloneBefore, ...cards, cloneAfter, cloneAfterCard];
  const dots = [...document.querySelectorAll('.edu-principles-dots button')];
  let index = 0;
  let timer = 0;
  let hovering = false;
  let pressing = false;
  let programmatic = false;
  let ready = false;
  let settleTimer = 0;
  let settleTries = 0;

  function realFromSlide(itemIndex) {
    let real = itemIndex - 2;
    if (real < 0) real += cards.length;
    else if (real >= cards.length) real -= cards.length;
    return real;
  }

  function isClone(itemIndex) {
    return itemIndex < 2 || itemIndex >= cards.length + 2;
  }

  function paused() {
    return hovering || pressing || document.hidden;
  }

  function peek() {
    return parseFloat(getComputedStyle(track).paddingLeft) || 0;
  }

  function scrollLeftFor(article) {
    const windowRect = principles.getBoundingClientRect();
    const articleRect = article.getBoundingClientRect();
    return principles.scrollLeft + articleRect.left - windowRect.left - peek();
  }

  function setDots(next) {
    dots.forEach((dot, dotIndex) => {
      dot.setAttribute('aria-selected', dotIndex === next ? 'true' : 'false');
    });
  }

  function nearestSlide() {
    const target = principles.getBoundingClientRect().left + peek();
    let best = 1;
    let bestDist = Infinity;
    slides.forEach((article, itemIndex) => {
      const dist = Math.abs(article.getBoundingClientRect().left - target);
      if (dist < bestDist) {
        bestDist = dist;
        best = itemIndex;
      }
    });
    return { itemIndex: best, settled: bestDist < 2 };
  }

  function relocate(fromArticle, realIndex) {
    const toArticle = cards[realIndex];
    const delta = toArticle.getBoundingClientRect().left - fromArticle.getBoundingClientRect().left;
    programmatic = true;
    index = realIndex;
    const previous = principles.style.scrollBehavior;
    principles.style.scrollBehavior = 'auto';
    principles.scrollLeft += delta;
    principles.style.scrollBehavior = previous;
    setDots(index);
    window.clearTimeout(settleTimer);
    settleTries = 0;
    settleTimer = window.setTimeout(() => { programmatic = false; }, 150);
  }

  function jumpTo(realIndex) {
    programmatic = true;
    index = realIndex;
    const previous = principles.style.scrollBehavior;
    principles.style.scrollBehavior = 'auto';
    principles.scrollLeft = scrollLeftFor(cards[realIndex]);
    principles.style.scrollBehavior = previous;
    setDots(index);
    window.clearTimeout(settleTimer);
    settleTimer = window.setTimeout(() => { programmatic = false; }, 150);
  }

  function finishProgrammatic() {
    window.clearTimeout(settleTimer);
    const found = nearestSlide();
    if (!found.settled) {
      if (settleTries < 40) {
        settleTries += 1;
        settleTimer = window.setTimeout(finishProgrammatic, 50);
      } else {
        settleTries = 0;
        programmatic = false;
      }
      return;
    }
    settleTries = 0;
    if (isClone(found.itemIndex)) {
      relocate(slides[found.itemIndex], realFromSlide(found.itemIndex));
      return;
    }
    programmatic = false;
    syncFromScroll();
  }

  function goTo(next, behavior) {
    const count = cards.length;
    let wrappingForward = next >= count;
    let wrappingBackward = next < 0;
    const real = (next % count + count) % count;
    if (!wrappingForward && !wrappingBackward && real !== index) {
      const forward = (real - index + count) % count;
      const backward = (index - real + count) % count;
      if (real === 0 && forward < backward) wrappingForward = true;
      else if (real === count - 1 && backward < forward) wrappingBackward = true;
    }
    index = real;
    setDots(index);
    settleTries = 0;
    const article = wrappingForward ? cloneAfter : wrappingBackward ? cloneBefore : cards[real];
    const left = scrollLeftFor(article);
    if (behavior !== 'smooth' || reduceMotion.matches) {
      principles.scrollLeft = left;
      if (wrappingForward || wrappingBackward) jumpTo(real);
      return;
    }
    programmatic = true;
    principles.scrollTo({ left, behavior: 'smooth' });
    window.clearTimeout(settleTimer);
    settleTimer = window.setTimeout(finishProgrammatic, 900);
  }

  function syncFromScroll() {
    const found = nearestSlide();
    if (!found.settled) return;
    if (isClone(found.itemIndex)) {
      relocate(slides[found.itemIndex], realFromSlide(found.itemIndex));
      return;
    }
    const real = realFromSlide(found.itemIndex);
    if (real === index) return;
    index = real;
    setDots(index);
  }

  function start() {
    window.clearInterval(timer);
    if (reduceMotion.matches || cards.length < 2) return;
    timer = window.setInterval(() => {
      if (paused()) return;
      goTo(index + 1, 'smooth');
    }, 4200);
  }

  principles.addEventListener('scroll', () => {
    if (!ready || programmatic) return;
    syncFromScroll();
  }, { passive: true });
  principles.addEventListener('scrollend', () => {
    if (!ready) return;
    finishProgrammatic();
  });
  dots.forEach((dot, dotIndex) => {
    dot.addEventListener('click', () => {
      goTo(dotIndex, 'smooth');
      start();
    });
  });
  track.addEventListener('click', (event) => {
    const article = event.target.closest('article');
    const itemIndex = slides.indexOf(article);
    if (itemIndex < 0) return;
    const real = realFromSlide(itemIndex);
    if (real === index && !isClone(itemIndex)) return;
    goTo(real, 'smooth');
    start();
  });
  principles.addEventListener('pointerenter', () => { hovering = true; });
  principles.addEventListener('pointerleave', () => { hovering = false; });
  principles.addEventListener('pointerdown', () => { pressing = true; });
  principles.addEventListener('pointerup', () => { pressing = false; });
  principles.addEventListener('pointercancel', () => { pressing = false; });
  principles.addEventListener('focusin', () => { hovering = true; });
  principles.addEventListener('focusout', () => { hovering = false; });
  reduceMotion.addEventListener('change', start);
  let lastWidth = 0;
  let resizeTimer = 0;
  const observer = new ResizeObserver(() => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      const width = principles.clientWidth;
      if (cards[0].offsetWidth < 1 || width === lastWidth || pressing) return;
      lastWidth = width;
      jumpTo(ready ? index : 0);
      if (!ready) {
        ready = true;
        start();
      }
    }, 60);
  });
  observer.observe(principles);
}
