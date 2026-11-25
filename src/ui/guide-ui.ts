// The soldering course's guide as HTML: about the course, bench safety, a glossary and a quick
// reference (data in src/lessons/guide.ts, a lazy chunk passed in). Strings are escaped like any.
import { t, tk } from '../i18n';
import { coatTableHtml, flow061Html } from './lesson-ui';
import type { GuideTab } from '../lessons/guide';

type Esc = (s: string) => string;
type Guide = typeof import('../lessons/guide');

export const GUIDE_TABS: { id: GuideTab; label: string }[] = [
  { id: 'about', label: tk('About the course') },
  { id: 'safety', label: tk('Safety') },
  { id: 'glossary', label: tk('Glossary') },
  { id: 'reference', label: tk('Quick reference') },
];

/** The glossary entries matching a search (term or definition, in the shown language). */
export function glossaryItemsHtml(g: Guide, esc: Esc, query: string): string {
  const q = query.trim().toLowerCase();
  const items = g.GLOSSARY.filter((x) => !q || t(x.term).toLowerCase().includes(q) || t(x.def).toLowerCase().includes(q) || x.term.toLowerCase().includes(q));
  return items.length
    ? items.map((x) => `<div class="gd-term"><dt>${esc(t(x.term))}</dt><dd>${esc(t(x.def))} <span class="muted">${esc(x.where)}</span></dd></div>`).join('')
    : `<p class="muted">${t('No term matches.')}</p>`;
}

export function guideHtml(g: Guide, tab: GuideTab, esc: Esc, query: string): string {
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
      <input class="gd-search" id="gd-search" type="search" placeholder="${t('Search the glossary')}" value="${esc(query)}" aria-label="${t('Search the glossary')}">
      <dl class="gd-gloss" id="gd-gloss">${glossaryItemsHtml(g, esc, query)}</dl>`;
  else body = `
      ${g.REFERENCE.map((sec) => `
        <div class="lesson-table">
          <div class="sub">${esc(t(sec.title))}</div>
          <dl class="lesson-nums">${sec.rows.map((r) => `<div><dt>${esc(t(r.label))}</dt><dd class="mono">${esc(t(r.value))}</dd><dd class="gd-src">${esc(t(r.src))}</dd></div>`).join('')}</dl>
        </div>`).join('')}
      ${coatTableHtml('06-3', esc)}
      ${flow061Html(esc)}`;
  return `${tabs}<div class="lesson gd-body">${body}</div>`;
}
