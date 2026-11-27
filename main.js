/* The MHTML snapshot contains no JavaScript. Local header interactions. */
(() => {
  'use strict';
  const header = document.querySelector('[data-header]');
  const menu = document.querySelector('[data-mobile-menu]');
  const search = document.querySelector('[data-search-menu]');
  const burger = document.querySelector('[data-toggle-menu]');
  const searchToggle = document.querySelector('[data-toggle-search]');
  const main = document.querySelector('main');
  const footer = document.querySelector('footer');
  let current = null;
  let returnFocus = null;

  function updateHeight() {
    document.documentElement.style.setProperty('--header-height', `${header.offsetHeight}px`);
  }
  new ResizeObserver(updateHeight).observe(header);
  updateHeight();

  function setPanel(panel) {
    const previous = current;
    current = panel;
    header.classList.toggle('open', panel === 'menu');
    header.classList.toggle('search-open', panel === 'search');
    search.classList.toggle('open', panel === 'search');
    burger.classList.toggle('active', panel !== null);
    burger.setAttribute('aria-expanded', String(panel === 'menu'));
    burger.setAttribute('aria-label', panel ? 'Закрыть меню' : 'Открыть меню');
    searchToggle.setAttribute('aria-expanded', String(panel === 'search'));
    document.body.classList.toggle('overlay-open', panel !== null);
    menu.inert = panel !== 'menu';
    search.inert = panel !== 'search';
    main.inert = footer.inert = panel !== null;
    if (panel && !previous) returnFocus = document.activeElement;
    if (panel === 'search') search.querySelector('input').focus();
    if (!panel) returnFocus?.focus();
  }
  burger.addEventListener('click', () => setPanel(current ? null : 'menu'));
  searchToggle.addEventListener('click', (event) => {
    event.preventDefault();
    setPanel(current === 'search' ? null : 'search');
  });
  searchToggle.addEventListener('keydown', (event) => {
    if (event.key === ' ') { event.preventDefault(); searchToggle.click(); }
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && current) setPanel(null);
    if (event.key !== 'Tab' || !current) return;
    const focusable = [...header.querySelectorAll('a[href], button, input, select')]
      .filter(el => !el.closest('[inert]') && el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden');
    const first = focusable[0];
    const last = focusable.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });

  const categories = [...menu.querySelectorAll('[data-main-id]')];
  function activateCategory(item, toggle = false) {
    const wasActive = item.classList.contains('active');
    const id = item.dataset.mainId;
    categories.forEach(category => {
      const active = category === item && !(toggle && wasActive);
      category.classList.toggle('active', active);
      category.querySelector('.header__nav-link_main').classList.toggle('title-accent', active);
      category.querySelector('button').setAttribute('aria-expanded', String(active));
      category.querySelector('[data-subordinate-item-tablet]').classList.toggle('active', active);
    });
    menu.querySelectorAll('[data-subordinate-item-pk]').forEach(list => {
      const active = list.dataset.id === id && !(toggle && wasActive);
      list.classList.toggle('active', active);
      list.style.display = active ? 'block' : 'none';
    });
  }
  categories.forEach(item => {
    const button = item.querySelector('button');
    const label = item.querySelector('.header__nav-link_main').textContent.trim().replace(/\s+/g, ' ');
    button.setAttribute('aria-label', `Подразделы: ${label}`);
    button.addEventListener('click', () => activateCategory(item, true));
    item.querySelector('.header__nav-item-box').addEventListener('mouseenter', () => {
      if (matchMedia('(min-width: 1101px)').matches) activateCategory(item);
    });
    item.querySelector('.header__nav-link_main').addEventListener('focus', () => {
      if (matchMedia('(min-width: 1101px)').matches) activateCategory(item);
    });
  });
  activateCategory(categories[0]);
})();
