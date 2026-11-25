// The soldering course's guide as HTML: about the course, bench safety, a glossary, a quick
// reference, an inspection drill and a missed-questions review (data in src/lessons/guide.ts and
// src/lessons/neets14.ts, lazy chunks passed in). Strings are escaped like any.
import { t, tk } from '../i18n';
import { coatTableHtml, flow061Html, quizKey } from './lesson-ui';
import { drillSvg, polaritySvg } from './lesson-diagrams';
import type { DrillVerdict, GuideTab } from '../lessons/guide';
import type { Lesson } from '../lessons/neets14';

type Esc = (s: string) => string;
type Guide = typeof import('../lessons/guide');
export type ReviewFilter = 'again' | 'unseen' | 'all';

export const GUIDE_TABS: { id: GuideTab; label: string }[] = [
  { id: 'about', label: tk('About the course') },
  { id: 'safety', label: tk('Safety') },
  { id: 'glossary', label: tk('Glossary') },
  { id: 'reference', label: tk('Quick reference') },
  { id: 'drill', label: tk('Inspection drill') },
  { id: 'review', label: tk('Review') },
];

/** The glossary entries matching a search (term or definition, in the shown language). */
export function glossaryItemsHtml(g: Guide, esc: Esc, query: string): string {
  const q = query.trim().toLowerCase();
  const items = g.GLOSSARY.filter((x) => !q || t(x.term).toLowerCase().includes(q) || t(x.def).toLowerCase().includes(q) || x.term.toLowerCase().includes(q));
  return items.length
    ? items.map((x) => `<div class="gd-term"><dt>${esc(t(x.term))}</dt><dd>${esc(t(x.def))} <span class="muted">${esc(x.where)}</span></dd></div>`).join('')
    : `<p class="muted">${t('No term matches.')}</p>`;
}

const verdictLabel = (v: DrillVerdict) => v === 'target' ? t('Target') : v === 'acceptable' ? t('Acceptable') : t('Defect');

function drillTabHtml(g: Guide, esc: Esc, picks: Record<string, DrillVerdict>): string {
  const total = g.INSPECTION_DRILL.length;
  const answered = g.INSPECTION_DRILL.filter((x) => picks[x.id]).length;
  const right = g.INSPECTION_DRILL.filter((x) => picks[x.id] === x.answer).length;
  const cards = g.INSPECTION_DRILL.map((item, i) => {
    const pick = picks[item.id];
    const ok = pick === item.answer;
    const btns = (['target', 'acceptable', 'defect'] as const).map((v) => {
      const cls = !pick ? '' : v === item.answer ? ' primary' : v === pick ? ' danger' : ' ghost';
      return `<button class="btn sm${cls}" data-drill="${item.id}" data-drill-v="${v}" aria-pressed="${pick === v}">${verdictLabel(v)}</button>`;
    }).join('');
    return `
      <div class="gd-drill-card${pick ? (ok ? ' ok' : ' bad') : ''}">
        <div class="gd-drill-head"><span class="mono muted">#${i + 1}</span><span>${esc(t(item.prompt))}</span></div>
        ${drillSvg(item.id)}
        <div class="gd-drill-act" role="group" aria-label="${t('Inspection verdict')}">${btns}</div>
        ${pick ? `<p class="gd-drill-why"><b class="${ok ? 'ok' : 'bad'}">${ok ? t('Correct') : t('Answer: {v}', { v: verdictLabel(item.answer) })}</b> ${esc(t(item.why))} <span class="muted">${esc(item.src)}</span></p>` : ''}
      </div>`;
  }).join('');
  return `
    <div class="gd-bar">
      <span>${t('Classify each joint or termination as Target, Acceptable or Defect, then check the rule.')}</span>
      <span class="mono muted">${t('{n} of {total} correct', { n: right, total })}</span>
      ${answered ? `<button class="btn sm ghost" id="gd-drill-reset">${t('Reset drill')}</button>` : ''}
    </div>
    <div class="gd-drill-grid">${cards}</div>`;
}

function reviewTabHtml(lessons: readonly Lesson[] | null, esc: Esc, quiz: Record<string, 'known' | 'again'>, filter: ReviewFilter): string {
  if (!lessons) return `<p class="muted">${t('Loading review questions…')}</p>`;
  const all = lessons.flatMap((l, idx) => l.questions.map((q) => ({ lesson: l, n: idx + 1, q, key: quizKey(l.scenario, q) })));
  const known = all.filter((x) => quiz[x.key] === 'known').length;
  const again = all.filter((x) => quiz[x.key] === 'again').length;
  const unseen = all.filter((x) => !quiz[x.key]).length;
  const shown = all.filter((x) => filter === 'all' ? true : filter === 'again' ? quiz[x.key] === 'again' : !quiz[x.key]);
  const where = (q: Lesson['questions'][number]) => q.source === 'to'
    ? t('self-check · T.O. 00-25-259, {para}', { para: esc(q.page) })
    : q.module === 4 ? t('NEETS 4, p. {page}', { page: esc(q.page) }) : t('NEETS 14, p. {page}', { page: esc(q.page) });
  const pills: [ReviewFilter, string][] = [
    ['again', t('Needs review ({n})', { n: again })],
    ['unseen', t('Unanswered ({n})', { n: unseen })],
    ['all', t('All ({n})', { n: all.length })],
  ];
  return `
    <div class="gd-bar">
      <div class="row wrap" role="group" aria-label="${t('Filter review questions')}">
        ${pills.map(([id, lbl]) => `<button class="btn sm${filter === id ? ' primary' : ' ghost'}" data-rev-filter="${id}" aria-pressed="${filter === id}">${lbl}</button>`).join('')}
      </div>
      <span class="mono muted">${t('{n} of {total} known', { n: known, total: all.length })}</span>
    </div>
    ${shown.length ? `<div class="ins-qs">${shown.map(({ lesson, n, q, key }) => {
      const mark = quiz[key];
      return `
        <details class="ins-q${mark ? ` ${mark}` : ''}">
          <summary><span class="mono muted">${t('L{n}', { n })} · ${esc(q.ref)}</span> ${esc(t(q.q))}</summary>
          <p>${esc(t(q.a))} <span class="muted">${esc(t(lesson.title))} · ${where(q)}</span></p>
          <div class="ins-qact" role="group" aria-label="${t('Did you know it?')}">
            <button class="btn sm${mark === 'known' ? ' primary' : ''}" data-quiz="${esc(key)}" data-quiz-v="known" aria-pressed="${mark === 'known'}">${t('I knew it')}</button>
            <button class="btn sm ghost${mark === 'again' ? ' active' : ''}" data-quiz="${esc(key)}" data-quiz-v="again" aria-pressed="${mark === 'again'}">${t('Not yet')}</button>
          </div>
        </details>`;
    }).join('')}</div>` : `<p class="muted">${filter === 'again' ? t('No questions marked for review. Mark any question "Not yet" after a lesson to collect it here.') : t('Every review question has been answered.')}</p>`}`;
}

export interface GuideState {
  query: string;
  drill: Record<string, DrillVerdict>;
  quiz: Record<string, 'known' | 'again'>;
  lessons: readonly Lesson[] | null;
  reviewFilter: ReviewFilter;
}

export function guideHtml(g: Guide, tab: GuideTab, esc: Esc, state: GuideState): string {
  const tabs = `<div class="gd-tabs" role="tablist">${GUIDE_TABS.map((x) => `<button class="${x.id === tab ? 'on' : ''}" role="tab" aria-selected="${x.id === tab}" data-guide-tab="${x.id}">${t(x.label)}</button>`).join('')}</div>`;
  const quoted = (paras: string[]) => `
    <details class="lesson-orig">
      <summary>${t('Read the original text (English)')}</summary>
      ${paras.map((p) => `<p>${esc(p)}</p>`).join('')}
      <p class="muted">${t('Quoted from US Government works in the public domain (Distribution Statement A).')}</p>
    </details>`;
  let body = '';
  if (tab === 'about') body = `<ul class="lesson-points">${g.GUIDE_ABOUT.points.map((p) => `<li>${esc(t(p))}</li>`).join('')}</ul>`;
  else if (tab === 'safety') body = `<ul class="lesson-points gd-safety">${g.GUIDE_SAFETY.points.map((p) => `<li>${esc(t(p))}</li>`).join('')}</ul>${quoted(g.GUIDE_SAFETY.original)}`;
  else if (tab === 'glossary') body = `
      <input class="gd-search" id="gd-search" type="search" placeholder="${t('Search the glossary')}" value="${esc(state.query)}" aria-label="${t('Search the glossary')}">
      <dl class="gd-gloss" id="gd-gloss">${glossaryItemsHtml(g, esc, state.query)}</dl>`;
  else if (tab === 'drill') body = drillTabHtml(g, esc, state.drill);
  else if (tab === 'review') body = reviewTabHtml(state.lessons, esc, state.quiz, state.reviewFilter);
  else body = `
      <div class="gd-bar gd-noprint">
        <span>${t('Bench cheat sheet: numbers, pinouts, coating removal and identification.')}</span>
        <button class="btn sm" id="gd-print">${t('Print cheat sheet')}</button>
      </div>
      <div class="lesson-table">
        <div class="sub">${t('Component pin 1 and polarity')}</div>
        ${polaritySvg()}
      </div>
      ${g.REFERENCE.map((sec) => `
        <div class="lesson-table">
          <div class="sub">${esc(t(sec.title))}</div>
          <dl class="lesson-nums">${sec.rows.map((r) => `<div><dt>${esc(t(r.label))}</dt><dd class="mono">${esc(t(r.value))}</dd><dd class="gd-src">${esc(t(r.src))}</dd></div>`).join('')}</dl>
        </div>`).join('')}
      ${coatTableHtml('06-3', esc)}
      ${flow061Html(esc)}`;
  return `${tabs}<div class="lesson gd-body">${body}</div>`;
}
