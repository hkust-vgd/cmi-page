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
