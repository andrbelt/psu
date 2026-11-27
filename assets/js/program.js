(() => {
  'use strict';
  const main = document.querySelector('.program-detail');
  if (!main) return;
  const links = [...main.querySelectorAll('.program-sidebar a')];
  const sections = links.map(link => main.querySelector(link.getAttribute('href')));
  const sidebar = main.querySelector('.program-sidebar');
  let framePending = false;
  function updateActiveSection() {
    const top = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-height')) || 86;
    let active = sections[0];
    for (const section of sections) if (section.getBoundingClientRect().top <= top + 100) active = section;
    links.forEach(link => {
      if (link.hash === '#' + active.id) link.setAttribute('aria-current','location');
      else link.removeAttribute('aria-current');
    });
    const bounds = main.getBoundingClientRect();
    sidebar.classList.toggle('is-outside-content', bounds.bottom <= top + 80);
    framePending = false;
  }
  window.addEventListener('scroll', () => {
    if (!framePending) { framePending = true; requestAnimationFrame(updateActiveSection); }
  }, {passive:true});
  window.addEventListener('resize', updateActiveSection);
  updateActiveSection();

  const faqItems = [...main.querySelectorAll('.program-faq-item')];
  faqItems.forEach(item => item.addEventListener('toggle', () => {
    if (item.open) faqItems.forEach(other => { if (other !== item) other.open = false; });
  }));

  const courseTabs = [...main.querySelectorAll('.program-course-tabs button')];
  function selectCourse(index) {
    courseTabs.forEach((tab, i) => {
      tab.setAttribute('aria-selected',String(i === index));
      tab.tabIndex = i === index ? 0 : -1;
      main.querySelector('#' + tab.getAttribute('aria-controls')).hidden = i !== index;
    });
  }
  courseTabs.forEach((tab, index) => {
    tab.addEventListener('click', () => selectCourse(index));
    tab.addEventListener('keydown', event => {
      if (!['ArrowRight','ArrowLeft','Home','End'].includes(event.key)) return;
      event.preventDefault();
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? courseTabs.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + courseTabs.length) % courseTabs.length;
      selectCourse(next);
      courseTabs[next].focus();
    });
  });

  main.querySelectorAll('[data-carousel]').forEach(carousel => {
    const track = carousel.querySelector('.program-carousel-track');
    const prev = carousel.querySelector('[data-prev]');
    const next = carousel.querySelector('[data-next]');
    const progress = carousel.querySelector('[data-progress]');
    const cards = [...track.children];
    const behavior = () => matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth';
    function update() {
      const width = cards[0].getBoundingClientRect().width;
      const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      const step = width + gap;
      const first = Math.max(0,Math.round(track.scrollLeft / step));
      const visible = Math.max(1,Math.floor((track.clientWidth + gap + 1) / step));
      prev.disabled = track.scrollLeft <= 2;
      next.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 2;
      progress.textContent = `${first + 1}–${Math.min(cards.length,first + visible)} / ${cards.length}`;
    }
    prev.addEventListener('click', () => track.scrollBy({left:-track.clientWidth,behavior:behavior()}));
    next.addEventListener('click', () => track.scrollBy({left:track.clientWidth,behavior:behavior()}));
    track.addEventListener('scroll', update, {passive:true});
    track.addEventListener('keydown', event => {
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        track.scrollBy({left:(event.key === 'ArrowRight' ? 1 : -1) * track.clientWidth,behavior:behavior()});
      }
    });
    new ResizeObserver(update).observe(track);
    update();
  });
})();
