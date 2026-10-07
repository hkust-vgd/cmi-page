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
