const toggle = document.querySelector('.menu');
const nav = document.querySelector('#navigation');

// Keep the existing HTML navigation usable until the shared script loads.
// This also updates pages that still contain the original About and Contact links.
function addAboutDropdown(navigation) {
  if (!navigation || navigation.querySelector('.nav-about')) return;
  const directLinks = Array.from(navigation.children).filter(node => node.tagName === 'A');
  const pointsTo = (link, name) => (link.getAttribute('href') || '').split(/[?#]/)[0].split('/').pop() === name;
  const aboutLink = directLinks.find(link => pointsTo(link, 'about.html'));
  const contactLink = directLinks.find(link => pointsTo(link, 'contact.html'));
  if (!aboutLink) return;

  const group = document.createElement('div');
  group.className = 'nav-about';
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'about-toggle';
  button.setAttribute('aria-expanded', 'false');
  button.setAttribute('aria-controls', 'about-navigation');
  button.setAttribute('aria-label', 'Show About menu');
  button.innerHTML = 'About <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="m4 6 4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  if (aboutLink.hasAttribute('aria-current') || (contactLink && contactLink.hasAttribute('aria-current'))) {
    button.classList.add('section-active');
  }

  const panel = document.createElement('div');
  panel.className = 'about-dropdown';
  panel.id = 'about-navigation';
  panel.hidden = true;
  const missionLink = aboutLink.cloneNode(true);
  missionLink.setAttribute('href', 'about.html#mission-vision');
  missionLink.textContent = 'Mission & Vision';
  const contactItem = contactLink ? contactLink.cloneNode(true) : document.createElement('a');
  contactItem.setAttribute('href', 'contact.html');
  contactItem.textContent = 'Contact';
  panel.append(missionLink, contactItem);
  group.append(button, panel);
  aboutLink.replaceWith(group);
  if (contactLink) contactLink.remove();
}

function textToggleButton(label, panelId, ariaLabel) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'about-toggle';
  button.setAttribute('aria-expanded', 'false');
  button.setAttribute('aria-controls', panelId);
  button.setAttribute('aria-label', `Show ${ariaLabel}`);
  button.innerHTML = `${label} <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="m4 6 4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  return button;
}

function addResourcesDropdown(navigation) {
  if (!navigation || navigation.querySelector('.nav-resources')) return;
  const directLinks = Array.from(navigation.children).filter(node => node.tagName === 'A');
  const pointsTo = (link, name) => (link.getAttribute('href') || '').split(/[?#]/)[0].split('/').pop() === name;
  const resourcesLink = directLinks.find(link => pointsTo(link, 'resources.html'));
  if (!resourcesLink) return;

  const group = document.createElement('div');
  group.className = 'nav-resources';
  const button = textToggleButton('Resources', 'resources-navigation', 'resource sections');
  if (resourcesLink.hasAttribute('aria-current')) button.classList.add('section-active');

  const panel = document.createElement('div');
  panel.className = 'research-dropdown resources-dropdown';
  panel.id = 'resources-navigation';
  panel.hidden = true;
  const overviewLink = resourcesLink.cloneNode(true);
  overviewLink.setAttribute('href', 'resources.html');
  overviewLink.textContent = 'Resources overview';
  const datasetsLink = document.createElement('a');
  datasetsLink.setAttribute('href', 'resources-datasets.html');
  datasetsLink.textContent = 'Datasets';
  const toolsLink = document.createElement('a');
  toolsLink.setAttribute('href', 'resources-tools.html');
  toolsLink.textContent = 'Tools';
  const facilitiesLink = document.createElement('a');
  facilitiesLink.setAttribute('href', 'resources-facilities.html');
  facilitiesLink.textContent = 'Facilities';
  const currentPage = window.location.pathname.split('/').pop();
  [datasetsLink, toolsLink, facilitiesLink].forEach(link => {
    if (link.getAttribute('href') === currentPage) link.setAttribute('aria-current', 'page');
  });
  panel.append(overviewLink, datasetsLink, toolsLink, facilitiesLink);
  group.append(button, panel);
  resourcesLink.replaceWith(group);
}

// Convert the icon-only chevron next to Research into a single text toggle like About.
function useTextToggle(group, label, ariaLabel) {
  if (!group || group.dataset.textToggle) return;
  const link = group.querySelector(':scope > a');
  const icon = group.querySelector(':scope > button');
  const panel = group.querySelector(':scope > div');
  if (!link || !icon || !panel) return;
  const button = textToggleButton(label, panel.id, ariaLabel);
  if (link.hasAttribute('aria-current') || link.classList.contains('section-active')) {
    button.classList.add('section-active');
  }
  group.dataset.textToggle = 'true';
  link.remove();
  icon.replaceWith(button);
}

addAboutDropdown(nav);
addResourcesDropdown(nav);
document.querySelectorAll('.nav-research').forEach(group => useTextToggle(group, 'Research', 'research directions'));
const disclosures = [
  { group: '.nav-about', button: '.nav-about > .about-toggle', panel: '#about-navigation', label: 'About menu' },
  { group: '.nav-research', button: '.nav-research > .about-toggle', panel: '#research-navigation', label: 'research directions' },
  { group: '.nav-resources', button: '.nav-resources > .about-toggle', panel: '#resources-navigation', label: 'resource sections' },
].map(config => ({
  ...config,
  group: document.querySelector(config.group),
  button: document.querySelector(config.button),
  panel: document.querySelector(config.panel),
})).filter(item => item.group && item.button && item.panel);

function setDisclosureOpen(item, open) {
  item.button.setAttribute('aria-expanded', String(open));
  item.button.setAttribute('aria-label', `${open ? 'Hide' : 'Show'} ${item.label}`);
  item.panel.hidden = !open;
  if (open) {
    disclosures.forEach(other => {
      if (other !== item) setDisclosureOpen(other, false);
    });
  }
}

function setMenuOpen(open) {
  if (!toggle || !nav) return;
  toggle.setAttribute('aria-expanded', String(open));
  nav.classList.toggle('open', open);
  const icon = toggle.querySelector('span');
  if (icon) icon.textContent = open ? '−' : '＋';
  if (!open) disclosures.forEach(item => setDisclosureOpen(item, false));
}

if (toggle && nav) {
  toggle.addEventListener('click', () => {
    setMenuOpen(toggle.getAttribute('aria-expanded') !== 'true');
  });
}

disclosures.forEach(item => {
  setDisclosureOpen(item, false);
  item.button.addEventListener('click', () => {
    setDisclosureOpen(item, item.button.getAttribute('aria-expanded') !== 'true');
  });
  item.button.addEventListener('keydown', event => {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    event.preventDefault();
    setDisclosureOpen(item, true);
    const links = item.panel.querySelectorAll('a[href]');
    const target = event.key === 'ArrowUp' ? links[links.length - 1] : links[0];
    if (target) target.focus();
  });
  item.group.addEventListener('focusout', event => {
    if (!item.group.contains(event.relatedTarget)) setDisclosureOpen(item, false);
  });
  item.panel.addEventListener('click', event => {
    if (!event.target.closest('a[href]')) return;
    setDisclosureOpen(item, false);
    if (nav && nav.classList.contains('open')) setMenuOpen(false);
  });
});

document.addEventListener('click', event => {
  disclosures.forEach(item => {
    if (!item.group.contains(event.target)) setDisclosureOpen(item, false);
  });
});
document.addEventListener('keydown', event => {
  if (event.key !== 'Escape') return;
  const openItem = disclosures.find(item => !item.panel.hidden);
  if (openItem) {
    event.preventDefault();
    setDisclosureOpen(openItem, false);
    openItem.button.focus();
  } else if (nav && nav.classList.contains('open')) {
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
    if (event.target.closest('a, button, .edu-feature')) return;
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
