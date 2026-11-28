(() => {
  'use strict';

  const draft = window.AdmissionsPrototype;
  const get = id => document.getElementById(id);
  const escape = value => String(value).replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);
  const rulesUrl = 'https://olymp.psu.ru/assets/user-doc/informatics/pravila-priema_bkl-2026.pdf';
  const confirmedEvent = {
    id: 'history-olympiad', title: '«Юные таланты» по истории',
    text: 'Олимпиада для учеников 10–11-х классов.',
    date: '5 декабря 2026 — отбор, 12 декабря 2026 — финал',
    format: 'Отбор онлайн, финал в ПГНИУ', registration: 'До 4 декабря включительно',
    action: 'Условия и регистрация', url: 'https://olymp.psu.ru/news/otkryta-registratsiya-na-olimpiadu-po-istorii',
    ends: '2026-12-12'
  };
  const applyUrl = 'https://psu.ru/postuplenie/podat-dokumenty-s-20-iyunya/';
  const portalUrl = 'https://www.gosuslugi.ru/vuzonline';

  function facts(fields) {
    return '<dl class="entry-facts">' + fields.map(([label, value]) =>
      '<div><dt>' + escape(label) + '</dt><dd>' + escape(value) + '</dd></div>'
    ).join('') + '</dl>';
  }

  function dialogLink(id, label) {
    return '<a href="#' + escape(id) + '" data-entry-dialog>' + escape(label) + '</a>';
  }

  const dialogs = {
    'study-masters': {
      title: 'Магистратура',
      paragraphs: ['Выбери направление, если уже получаешь или получил диплом бакалавра либо специалиста. В условиях приёма проверь вступительное испытание и срок подачи заявления.'],
      links: [['Раздел поступления ПГНИУ', 'https://psu.ru/for-applicants/']]
    },
    'study-postgraduate': {
      title: 'Аспирантура',
      paragraphs: ['Посмотри научные специальности, если заканчиваешь магистратуру или специалитет и планируешь заниматься исследованиями. Проверь вступительные испытания и условия выбора научного руководителя.'],
      links: [['Раздел поступления ПГНИУ', 'https://psu.ru/for-applicants/']]
    },
    'document-list': {
      title: 'Список документов',
      paragraphs: ['Подготовь документ, удостоверяющий личность, и аттестат или диплом. Если хочешь учесть индивидуальные достижения, приложи подтверждающие документы.', 'Проверь полный список в правилах приёма для своей конкурсной группы.'],
      links: [['Правила приёма на 2026 год', rulesUrl]]
    },
    'ways-to-apply': {
      title: 'Способы подачи',
      paragraphs: ['Подать заявление можно через Госуслуги, лично в приёмной комиссии или почтой. Для иностранных граждан предусмотрены отдельные условия подачи.'],
      links: [['Госуслуги', portalUrl], ['Страница подачи документов ПГНИУ', applyUrl], ['Адрес очного приёма', 'index.html#contacts']]
    },
    'club-sport': {
      title: 'Спорт',
      paragraphs: ['Выбери секцию или познакомься с турклубом «Пермский период». Уточни у организаторов, где проходит ближайшая тренировка или выезд.']
    },
    'club-arts': {
      title: 'Творчество',
      paragraphs: ['Если любишь сцену, присоединяйся к команде Студвесны или загляни в «Канифоль». Для спокойного вечера поищи встречи любителей настольных игр.']
    },
    'club-media': {
      title: 'Медиа',
      paragraphs: ['В студенческом медиацентре попробуй себя в съёмке, монтаже, дизайне или работе с текстом. Для знакомства подготовь пару идей на университетскую тему.']
    },
    'club-volunteering': {
      title: 'Волонтёрство',
      paragraphs: ['Помогай проводить университетские события, встречать гостей и ориентировать школьников на кампусе. Выбери событие и уточни, какие задачи нужны команде.']
    }
  };

  for (const event of draft.events) {
    dialogs[event.id] = {
      title: event.title,
      paragraphs: [event.instructions, 'Запись откроется перед мероприятием.'],
      links: event.id === 'college-open-day' ? [['Страница колледжа', 'college.html#college-open-day']] : []
    };
  }

  function eventCard(event) {
    const url = event.url || (event.id === 'college-open-day' && !get('college-event') ? 'college.html#college-open-day' : '');
    const destination = url ? '<a href="' + escape(url) + '">' + escape(event.url ? event.action : 'Открыть страницу колледжа') + '</a>'
      : dialogLink(event.id, event.action);
    return '<article class="entry-card admissions-event-card"><h3>' +
      escape(event.title) + '</h3><p>' + escape(event.text) + '</p>' + facts([
        ['Дата', event.date], ['Формат', event.format], ['Запись', event.registration]
      ]) + destination + '</article>';
  }

  function renderMainContent() {
    const olympiad = draft.openUniversity;
    get('open-university-card').innerHTML = '<h4>' + escape(olympiad.title) + '</h4><p>' +
      escape(olympiad.text) + '</p>' + facts(olympiad.fields) +
      '<a href="' + rulesUrl + '">Как учитывался результат в 2026 году</a>';
    get('graduate-cards').innerHTML = draft.graduates.map(graduate =>
      '<article class="entry-card admissions-graduate"><img src="assets/images/program/' + escape(graduate.photo) +
      '" alt="Портрет для карточки «' + escape(graduate.name) + '»" loading="lazy" width="400" height="300">' +
      '<div class="entry-card-content"><h3>' + escape(graduate.name) + '</h3><p>Выпуск ' + graduate.year +
      ' · ' + escape(graduate.job) + '</p><p>' + escape(graduate.story) + '</p></div></article>'
    ).join('');
    get('partner-cards').innerHTML = draft.partners.map(partner =>
      '<li><span class="partner-logo partner-logo-' + escape(partner.shape) + '" style="--partner-color:' +
      escape(partner.color) + '" aria-hidden="true">' + escape(partner.mark) + '</span><p>' +
      escape(partner.name) + '</p><small>' + escape(partner.field) + '</small></li>'
    ).join('');

    get('housing-card').innerHTML = '<h3>Общежития</h3><p>Узнай, кому дают место, когда подать заявку и сколько стоит проживание.</p>' +
      facts(draft.housing.fields) + '<a href="https://psu.ru/university-life/informatsiya-ob-obshchezhitiyakh/">Условия заселения</a>';
    get('scholarships-card').innerHTML = '<h3>Стипендии</h3><p>Посмотри, какие стипендии доступны первокурсникам и что нужно для их получения.</p>' +
      draft.scholarships.map(item => '<h4>' + escape(item.title) + '</h4><p>' + escape(item.condition) + '</p>' +
        facts([['Сумма', item.amount], ['Период выплаты', item.period]])).join('');
    get('contact-hours').textContent = draft.contactHours;
  }

  const dialog = get('admissions-dialog');
  let opener;
  document.addEventListener('click', event => {
    const link = event.target.closest('[data-entry-dialog]');
    if (!link || event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const entry = dialogs[link.hash.slice(1)];
    if (!entry || dialog.open) return;
    event.preventDefault();
    opener = link;
    get('admissions-dialog-title').textContent = entry.title;
    get('admissions-dialog-body').innerHTML = entry.paragraphs.map(text => '<p>' + escape(text) + '</p>').join('') +
      (entry.links?.length ? '<div class="admissions-link-list">' + entry.links.map(([label, url]) =>
        '<a href="' + escape(url) + '">' + escape(label) + '</a>'
      ).join('') + '</div>' : '');
    dialog.showModal();
  });
  dialog.addEventListener('close', () => opener?.focus({ preventScroll: true }));

  const calendar = draft.calendar;
  const college = get('college-event');
  if (college) {
    college.innerHTML = eventCard(draft.events.find(event => event.id === 'college-open-day'));
    return;
  }

  const dateFormat = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', timeZone: 'UTC' });
  const permDate = new Intl.DateTimeFormat('sv-SE', {
    year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'Asia/Yekaterinburg'
  });
  const calendarModes = { budget: 'Бюджет', contract: 'Контракт' };
  const keyDateIds = ['end', 'consentDeadline', 'contractDeadline', 'enrollment'];

  function icsText(value) {
    return value.replace(/[\\,;]/g, '\\$&').replace(/\r?\n/g, '\\n');
  }

  function foldIcsLine(line) {
    const encoder = new TextEncoder();
    let size = 0;
    let result = '';
    for (const character of line) {
      const length = encoder.encode(character).length;
      if (size + length > 75) {
        result += '\r\n ';
        size = 1;
      }
      result += character;
      size += length;
    }
    return result;
  }

  function icsLink(entry, funding) {
    const { id, date, title, description } = entry;
    const eventId = calendar.year + '-' + funding + '-' + id;
    const calendarText = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//PGNIU Admissions//Calendar//RU', 'BEGIN:VEVENT',
      'UID:' + eventId + '@admissions-prototype.pgniu',
      'DTSTAMP:' + new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z'),
      'DTSTART;VALUE=DATE:' + date.replace(/-/g, ''),
      'SUMMARY:' + icsText(title + ' — ПГНИУ (' + calendarModes[funding] + ')'),
      'DESCRIPTION:' + icsText(description),
      'END:VEVENT', 'END:VCALENDAR', ''
    ].map(foldIcsLine).join('\r\n');
    return '<a href="data:text/calendar;charset=utf-8,' + encodeURIComponent(calendarText) + '" download="' + eventId +
      '.ics" aria-label="' + escape('Добавить в календарь: ' + title + ', ' + calendarModes[funding]) + '">В календарь</a>';
  }

  function calendarItem(entry, funding, closest) {
    return '<li class="calendar-date">' +
      '<div>' + (closest ? '<span class="calendar-date-badge">Ближайшая дата</span>' : '') + '<time datetime="' +
      entry.date + '">' + dateFormat.format(new Date(entry.date)) + '</time></div><div><strong>' +
      escape(entry.title) + '</strong><p>' + escape(entry.description) + '</p></div>' + icsLink(entry, funding) + '</li>';
  }

  function renderCalendar(funding) {
    const entries = Object.entries(calendar[funding]).map(([id, [day, title, description]]) =>
      ({ id, date: calendar.year + '-' + day, title, description })
    ).sort((a, b) => a.date.localeCompare(b.date));
    const nearest = entries.find(entry => entry.date >= permDate.format(new Date()));
    const visible = new Set(nearest ? [nearest.id] : []);
    for (const entry of entries) {
      if (keyDateIds.includes(entry.id)) visible.add(entry.id);
    }
    get('calendar-key-dates').innerHTML = entries.filter(entry => visible.has(entry.id))
      .map(entry => calendarItem(entry, funding, entry === nearest)).join('');
    get('calendar-other-dates').innerHTML = entries.filter(entry => !visible.has(entry.id))
      .map(entry => calendarItem(entry, funding, false)).join('');
    get('calendar-status').textContent = 'Показаны сроки поступления: ' + calendarModes[funding].toLowerCase();
  }

  function setupEvents() {
    const track = get('admissions-events-track');
    const previous = document.querySelector('[data-events-previous]');
    const next = document.querySelector('[data-events-next]');
    const events = confirmedEvent.ends >= permDate.format(new Date()) ? [confirmedEvent, ...draft.events] : draft.events;
    track.innerHTML = events.map(event => '<li>' + eventCard(event) + '</li>').join('');
    const update = () => {
      previous.disabled = track.scrollLeft < 2;
      next.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 2;
    };
    const move = direction => {
      const gap = parseFloat(getComputedStyle(track).columnGap);
      track.scrollBy({ left: direction * (track.firstElementChild.offsetWidth + gap),
        behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
    };
    previous.addEventListener('click', () => move(-1));
    next.addEventListener('click', () => move(1));
    track.addEventListener('scroll', update, { passive: true });
    new ResizeObserver(update).observe(track);
    update();
  }

  function setupLifeTabs() {
    const tabs = [...get('life-widget').querySelectorAll('[role="tab"]')];
    const select = index => tabs.forEach((tab, i) => {
      const active = index === i;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
      get(tab.getAttribute('aria-controls')).hidden = !active;
    });
    tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => select(index));
      tab.addEventListener('keydown', event => {
        const destinations = { ArrowLeft: (index + tabs.length - 1) % tabs.length,
          ArrowRight: (index + 1) % tabs.length, Home: 0, End: tabs.length - 1 };
        if (!Object.hasOwn(destinations, event.key)) return;
        event.preventDefault();
        const destination = destinations[event.key];
        select(destination);
        tabs[destination].focus();
      });
    });
  }

  renderMainContent();
  setupEvents();
  setupLifeTabs();
  get('calendar-year').textContent = calendar.year;
  const calendarSection = get('calendar');
  calendarSection.addEventListener('change', event => {
    if (event.target.name === 'admission-funding') renderCalendar(event.target.value);
  });
  window.addEventListener('pageshow', () => renderCalendar(calendarSection.querySelector('input:checked').value));
})();
