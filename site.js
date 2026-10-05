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
