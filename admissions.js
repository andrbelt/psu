(() => {
  'use strict';
  const { searchPrograms, selectOffers, paginate } = window.AdmissionsCore;
  const $ = selector => document.querySelector(selector);
  const form = $('#program-picker');
  const results = $('#program-results');
  const query = $('#program-query');
  const suggestions = $('#program-suggestions');
  const subjectHint = $('#subject-hint');
  const tabs = [$('#tab-exams'), $('#tab-program'), $('#tab-faculties')];
  const panels = [$('#panel-exams'), $('#panel-program'), $('#panel-faculties')];
  const pagination = $('#program-pagination');
  const state = { mode: 'exams', programId: null };
  const number = new Intl.NumberFormat('ru-RU');
  const escape = value => String(value ?? '').replace(/[&<>"']/g, character => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[character]));
  const plural = (n, one, few, many) => n % 100 >= 11 && n % 100 <= 14 ? many : n % 10 === 1 ? one : n % 10 >= 2 && n % 10 <= 4 ? few : many;
  let data;
  let subjectNames;
  let choices = [];
  let activeChoice = -1;
  let page = 1;

  function getFilters() {
    return {
      ...state,
      query: query.value,
      subjects: [...form.querySelectorAll('input[name="subject"]:checked')].map(input => input.value),
      facultyIds: [...form.querySelectorAll('input[name="faculty"]:checked')].map(input => input.value),
      paidOnly: $('#paid-only').checked,
      studyModes: [...form.querySelectorAll('input[name="study-mode"]:checked')].map(input => input.value),
    };
  }
  function remainingSubjects(filters) {
    return Math.max(0, data.form.minOtherSubjects - filters.subjects.filter(id => !data.form.requiredSubjectIds.includes(id)).length);
  }
  function closeSuggestions() {
    suggestions.hidden = true;
    query.setAttribute('aria-expanded', 'false');
    query.removeAttribute('aria-activedescendant');
    activeChoice = -1;
  }
  function chooseProgram(index) {
    const program = choices[index];
    if (!program) return;
    state.programId = program.id;
    query.value = program.title;
    $('#clear-query').hidden = false;
    closeSuggestions();
    render();
  }
  function highlightChoice(index) {
    activeChoice = index;
    [...suggestions.children].forEach((option, i) => option.setAttribute('aria-selected', String(i === index)));
    const option = suggestions.children[index];
    if (option) {
      query.setAttribute('aria-activedescendant', option.id);
      option.scrollIntoView({ block: 'nearest' });
    }
  }
  function openSuggestions() {
    choices = searchPrograms(data, query.value);
    activeChoice = -1;
    query.removeAttribute('aria-activedescendant');
    suggestions.innerHTML = choices.map((program, i) => `<li id="program-option-${i}" role="option" aria-selected="false" data-option="${i}">${escape(program.title)}<small>${escape(program.directionCode)} · ${escape(program.directionTitle)}</small></li>`).join('');
    suggestions.hidden = !choices.length;
    query.setAttribute('aria-expanded', String(choices.length > 0));
    $('#query-hint').textContent = choices.length
      ? `${choices.length} ${plural(choices.length, 'подсказка', 'подсказки', 'подсказок')}. Выбери программу из списка или продолжай вводить название.`
      : 'Такого названия нет в каталоге. Попробуй другой запрос.';
  }
  function examOption(exam) {
    const label = exam.type === 'dvi' ? exam.title : subjectNames[exam.subjectId];
    return `<div class="exam-option"><span>${escape(label)}${exam.type === 'dvi' ? '<span class="exam-dvi">Дополнительное вступительное испытание</span>' : ''}</span><strong aria-label="Минимум ${exam.minScore} баллов">${exam.minScore}</strong></div>`;
  }
  function examBlock(requirements, label = '') {
    if (!requirements) return '<p class="program-card-subcaption">Требования к экзаменам уточняются.</p>';
    return `${label ? `<p class="program-card-subcaption">${escape(label)}</p>` : ''}<ol class="exam-rows"><li class="exam-row">${examOption(requirements.primary)}</li><li class="exam-row">${requirements.choice.map(examOption).join('<span class="exam-or">или</span>')}</li><li class="exam-row">${examOption(requirements.russian)}</li></ol>`;
  }
  function resultStat(row, funding) {
    const result = row.results.find(result => result.funding === funding);
    const label = funding === 'budget' ? 'Бюджет' : 'Платно';
    let value = '<span class="stat-text">Нет данных</span>';
    let note = '';
    if (result?.status === 'reported' && result.passingScore !== null) {
      value = escape(result.passingScore);
      note = result.scope === 'group' ? 'Общий конкурс' : '';
    } else if (result?.status === 'scoreNotReported') {
      value = '<span class="stat-text">Не опубликован</span>';
    } else if (result?.status === 'dashInSource') {
      value = '<span class="stat-text">Нет данных</span>';
      note = 'В источнике — прочерк';
    } else if (!result && !(row[funding]?.plannedPlaces > 0)) {
      // A current-year zero does not establish whether there was a historical competition.
      value = '<span class="stat-text">Нет данных</span>';
    }
    return `<div class="program-stat"><dt>Проходной балл · ${label.toLowerCase()}</dt><dd>${value}</dd>${note ? `<small>${escape(note)}</small>` : ''}</div>`;
  }
  function card(row) {
    const { program, offer, budget, paid, matching } = row;
    const examGroups = [];
    matching.forEach(competition => {
      const key = JSON.stringify(competition.examRequirements);
      const group = examGroups.find(group => group.key === key);
      if (group) group.funding.push(data.catalogs.fundingTypes[competition.funding]);
      else examGroups.push({ key, requirements: competition.examRequirements, funding: [data.catalogs.fundingTypes[competition.funding]] });
    });
    const price = paid?.plannedPlaces === 0 ? 'Платного набора нет'
      : offer.tuition ? `${number.format(offer.tuition.amount)} ₽ <small>/ год</small>` : 'Не указана';
    const groupCompetition = [budget, paid].some(competition => competition?.scope === 'group');
    const places = competition => competition?.plannedPlaces != null ? number.format(competition.plannedPlaces) : '<span class="stat-text">Уточняется</span>';
    return `<a class="program-card" href="program.html" data-offer-id="${escape(offer.id)}" aria-labelledby="program-${escape(offer.id)}">
      <div class="program-card-main">${program.directionCode ? `<p class="program-card-code">${escape(program.directionCode)}</p>` : ''}<h3 id="program-${escape(offer.id)}">${escape(program.title)}</h3><p class="program-card-direction">Направление подготовки:<br>${escape(program.directionTitle)}</p><div class="program-tags"><span class="program-tag">${escape(data.catalogs.levels[program.level])}</span><span class="program-tag">${escape(data.catalogs.studyModes[offer.studyMode])}</span></div></div>
      <div class="program-card-exams"><p class="program-card-caption">Вступительные испытания</p><p class="program-card-subcaption">Предметы и минимальные баллы</p>${examGroups.map(group => examBlock(group.requirements, examGroups.length > 1 ? group.funding.join(' и ') : '')).join('')}</div>
      <div class="program-card-facts"><dl class="program-stats"><div class="program-stat"><dt>Бюджетные места</dt><dd>${places(budget)}</dd></div><div class="program-stat"><dt>Платные места</dt><dd>${places(paid)}</dd></div>${resultStat(row, 'budget')}${resultStat(row, 'paid')}</dl><dl class="program-tuition"><dt>Стоимость обучения</dt><dd>${price}</dd></dl>${groupCompetition ? '<p class="program-group-note">Места указаны для общего конкурса нескольких программ.</p>' : ''}</div>
    </a>`;
  }
  function render(resetPage = true) {
    if (resetPage) page = 1;
    const filters = getFilters();
    const remaining = remainingSubjects(filters);
    const selectedCount = filters.subjects.length - data.form.requiredSubjectIds.length;
    subjectHint.classList.remove('is-error');
    subjectHint.textContent = remaining
      ? `Выбери ещё ${remaining} ${plural(remaining, 'предмет', 'предмета', 'предметов')}. Пока показаны все программы с учётом дополнительных фильтров.`
      : `Выбрано ${filters.subjects.length} ${plural(filters.subjects.length, 'предмет', 'предмета', 'предметов')}, включая русский язык. Можно добавить ещё.`;
    const rows = selectOffers(data, filters);
    const paged = paginate(rows, page);
    page = paged.page;
    const programCount = new Set(rows.map(row => row.program.id)).size;
    const filteringExams = filters.mode === 'exams' && !remaining;
    $('#results-heading').textContent = filteringExams || (filters.mode === 'faculties' && filters.facultyIds.length) ? 'Подходящие программы'
      : filters.mode === 'program' && query.value.trim() ? 'Результаты поиска' : 'Все программы';
    $('#results-count').textContent = `${programCount} ${plural(programCount, 'программа', 'программы', 'программ')} · ${rows.length} ${plural(rows.length, 'вариант', 'варианта', 'вариантов')} обучения`;
    $('#picker-summary').textContent = filters.mode === 'exams' && remaining
      ? `Выбрано ${selectedCount} из ${data.form.minOtherSubjects} предметов по выбору. Верхнего ограничения нет.`
      : `Найдено ${programCount} ${plural(programCount, 'программа', 'программы', 'программ')}. ${filters.studyModes.length ? 'С учётом формы обучения.' : 'Все формы обучения.'}`;
    $('#faculty-hint').textContent = filters.facultyIds.length
      ? `Выбрано: ${filters.facultyIds.length}. Показаны программы выбранных факультетов и институтов. Можно добавить ещё.`
      : 'Без выбора показаны программы всех факультетов.';
    results.innerHTML = rows.length ? paged.items.map(card).join('')
      : '<div class="catalog-empty"><h3>Пока нет подходящих программ</h3><p>Измени предметы, специальность или факультеты либо сними дополнительные фильтры.</p><button class="btn btn_red" type="button" data-reset-empty style="margin-top:24px">Сбросить фильтры</button></div>';
    pagination.hidden = paged.pageCount <= 1;
    pagination.innerHTML = paged.pageCount > 1 ? `<button type="button" data-page="${page - 1}" ${page === 1 ? 'disabled' : ''} aria-label="Предыдущая страница">←</button>${Array.from({length:paged.pageCount}, (_, i) => `<button type="button" data-page="${i + 1}" aria-label="Страница ${i + 1}" ${page === i + 1 ? 'aria-current="page"' : ''}>${i + 1}</button>`).join('')}<button type="button" data-page="${page + 1}" ${page === paged.pageCount ? 'disabled' : ''} aria-label="Следующая страница">→</button><p class="pagination-range">${paged.start + 1}–${paged.start + paged.items.length} из ${paged.total}</p>` : '';
    results.setAttribute('aria-busy', 'false');
    $('#clear-query').hidden = !query.value;
  }
  function setMode(index) {
    state.mode = ['exams', 'program', 'faculties'][index];
    tabs.forEach((tab, i) => {
      tab.setAttribute('aria-selected', String(i === index));
      tab.tabIndex = i === index ? 0 : -1;
      panels[i].hidden = i !== index;
    });
    closeSuggestions();
    render();
  }
  function reset() {
    form.reset();
    state.programId = null;
    query.value = '';
    closeSuggestions();
    $('#query-hint').textContent = 'Можно искать по названию, направлению или коду.';
    render();
  }
  async function init() {
    try {
      if (location.protocol === 'file:') data = window.ADMISSIONS_DATA;
      else {
        const response = await fetch('assets/json/admissions.json');
        if (!response.ok) throw new Error('HTTP ' + response.status);
        data = await response.json();
      }
      if (!data?.programs?.length || !data?.offers?.length || data.schemaVersion !== 2) throw new Error('Unsupported catalog');
      subjectNames = Object.fromEntries(data.catalogs.subjects.map(subject => [subject.id, subject.label]));
      $('#admission-year').textContent = `Поступление — ${data.metadata.admissionYear}`;
      $('#catalog-info').textContent = `${data.programs.length} ${plural(data.programs.length, 'программа', 'программы', 'программ')} · Бакалавриат и специалитет`;
      $('#subject-options').innerHTML = data.catalogs.subjects.map(subject => {
        const required = data.form.requiredSubjectIds.includes(subject.id);
        return `<label class="subject-option"><input type="checkbox" name="subject" value="${escape(subject.id)}" ${required ? 'checked disabled' : ''}><span>${escape(subject.label)}</span></label>`;
      }).join('');
      $('#faculty-options').innerHTML = data.catalogs.faculties.map(faculty => `<label class="subject-option"><input type="checkbox" name="faculty" value="${escape(faculty.id)}"><span>${escape(faculty.label)}</span></label>`).join('');
      $('#study-mode-options').innerHTML = Object.entries(data.catalogs.studyModes).map(([id, label]) => `<label class="picker-check"><input type="checkbox" name="study-mode" value="${escape(id)}" ${data.form.filters.studyModes.includes(id) ? 'checked' : ''}><span>${escape(label)}</span></label>`).join('');
      $('#paid-only').checked = $('#paid-only').defaultChecked = data.form.filters.hasPaidPlaces;
      render();
    } catch (error) {
      results.setAttribute('aria-busy', 'false');
      $('#results-count').textContent = 'Каталог недоступен';
      subjectHint.textContent = 'Не удалось загрузить предметы.';
      results.innerHTML = '<div class="catalog-empty" role="alert"><h3>Не удалось загрузить программы</h3><p>Проверь наличие файла admissions.json в папке assets/json и обнови страницу.</p><button class="btn btn_red" type="button" data-retry style="margin-top:24px">Попробовать снова</button></div>';
    }
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => { if (data) setMode(index); });
    tab.addEventListener('keydown', event => {
      if (!data || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
      setMode(next);
      tabs[next].focus();
    });
  });
  form.addEventListener('change', () => { if (data) render(); });
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!data) return;
    if (state.mode === 'exams' && remainingSubjects(getFilters())) {
      subjectHint.classList.add('is-error');
      subjectHint.textContent = 'Для подбора по ЕГЭ выбери минимум два предмета помимо русского языка.';
      form.querySelector('input[name="subject"]:not(:disabled):not(:checked)')?.focus();
      return;
    }
    closeSuggestions();
    render();
    $('.catalog-heading').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
  });
  query.addEventListener('input', () => { if (data) { state.programId = null; openSuggestions(); render(); } });
  query.addEventListener('focus', () => { if (data) openSuggestions(); });
  query.addEventListener('keydown', event => {
    if (!data) return;
    if (event.key === 'Escape') { event.preventDefault(); closeSuggestions(); return; }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (suggestions.hidden) openSuggestions();
      if (choices.length) highlightChoice(event.key === 'ArrowDown' ? (activeChoice + 1) % choices.length : (activeChoice <= 0 ? choices.length : activeChoice) - 1);
    } else if (event.key === 'Enter' && !suggestions.hidden && activeChoice >= 0) {
      event.preventDefault();
      chooseProgram(activeChoice);
    }
  });
  suggestions.addEventListener('mousedown', event => event.preventDefault());
  suggestions.addEventListener('click', event => {
    const option = event.target.closest('[data-option]');
    if (option) chooseProgram(Number(option.dataset.option));
  });
  document.addEventListener('click', event => { if (!event.target.closest('.program-autocomplete')) closeSuggestions(); });
  query.addEventListener('blur', () => closeSuggestions());
  $('#clear-query').addEventListener('click', () => {
    state.programId = null;
    query.value = '';
    query.focus();
    openSuggestions();
    render();
  });
  $('#reset-picker').addEventListener('click', () => { if (data) reset(); });
  pagination.addEventListener('click', event => {
    const button = event.target.closest('button[data-page]');
    if (!button || button.disabled) return;
    page = Number(button.dataset.page);
    render(false);
    pagination.querySelector('[aria-current="page"]')?.focus({preventScroll:true});
    $('.catalog-heading').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
  });
  results.addEventListener('click', event => {
    if (event.target.closest('[data-reset-empty]')) reset();
    if (event.target.closest('[data-retry]')) init();
  });
  init();
})();
