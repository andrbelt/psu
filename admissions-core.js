/* Shared data logic. Usable both by a plain browser script and Node checks. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.AdmissionsCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, () => {
  'use strict';
  const normalize = value => String(value ?? '').toLocaleLowerCase('ru').replace(/ё/g, 'е').trim().replace(/\s+/g, ' ');
  const searchPrograms = (data, query) => {
    const words = normalize(query).split(' ').filter(Boolean);
    return data.programs.filter(program => {
      const text = normalize([program.title, program.directionTitle, program.directionCode, ...program.searchAliases].join(' '));
      return words.every(word => text.includes(word));
    });
  };
  function matchesExams(requirements, subjects) {
    if (!requirements) return false;
    const selected = new Set(subjects);
    return selected.has(requirements.primary.subjectId)
      && selected.has(requirements.russian.subjectId)
      && requirements.choice.some(exam => exam.type === 'dvi' || selected.has(exam.subjectId));
  }
  function selectOffers(data, filters) {
    const { mode = 'exams', subjects = [], query = '', programId = null, paidOnly = false, studyModes = [], facultyIds = [] } = filters;
    const required = data.form.requiredSubjectIds;
    const examsReady = required.every(id => subjects.includes(id))
      && subjects.filter(id => !required.includes(id)).length >= data.form.minOtherSubjects;
    const programs = new Map(data.programs.map(p => [p.id, p]));
    const competitions = new Map(data.competitions.map(c => [c.id, c]));
    const matchingIds = new Set(searchPrograms(data, query).map(p => p.id));
    return data.offers.filter(o => o.admissionYear === data.metadata.admissionYear).flatMap(offer => {
      if (studyModes.length && !studyModes.includes(offer.studyMode)) return [];
      if (mode === 'program' && (programId ? offer.programId !== programId : !matchingIds.has(offer.programId))) return [];
      if (mode === 'faculties' && facultyIds.length && !programs.get(offer.programId).facultyIds.some(id => facultyIds.includes(id))) return [];
      const budget = competitions.get(offer.competitionIds.budget) ?? null;
      const paid = competitions.get(offer.competitionIds.paid) ?? null;
      if (paidOnly && !(paid?.plannedPlaces > 0)) return [];
      const available = (paidOnly ? [paid] : [budget, paid]).filter(c => c && (c.plannedPlaces === null || c.plannedPlaces > 0));
      const matching = mode === 'exams' && examsReady
        ? available.filter(c => matchesExams(c.examRequirements, subjects)) : available;
      if (!matching.length) return [];
      return [{ offer, program: programs.get(offer.programId), budget, paid, matching,
        results: data.admissionResults.filter(r => r.year === data.metadata.resultYear && r.offerIds.includes(offer.id)) }];
    });
  }
  function paginate(rows, page = 1, pageSize = 10) {
    const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
    const currentPage = Math.min(pageCount, Math.max(1, Math.trunc(page) || 1));
    const start = (currentPage - 1) * pageSize;
    return { items: rows.slice(start, start + pageSize), page: currentPage, pageCount, start, total: rows.length };
  }
  return { normalize, searchPrograms, matchesExams, selectOffers, paginate };
});
