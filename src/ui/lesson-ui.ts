// The lesson before a soldering-track board and the inspection after it, as HTML. Strings from
// the lesson data are ours or quotes of a public-domain textbook; they are still escaped like
// any other text (the app's `esc`).
import { t } from '../i18n';
import type { Lesson } from '../lessons/neets14';
import { BEST_JOINT_C, DWELL_LIMIT_S, RULES, type Inspection } from '../workmanship';

type Esc = (s: string) => string;

const sourceLine = (l: Lesson, esc: Esc) =>
  `<a href="${esc(l.source.url)}" target="_blank" rel="noopener">${esc(l.source.doc)}</a>, ${t('pages {pages}', { pages: esc(l.source.pages) })}`;

/** Before the repair: the rules in short, the numbers, the figure, the task, and the original text folded. */
export function lessonBriefHtml(l: Lesson, esc: Esc, base: string, phone: boolean): string {
  const rules = `
      <ul class="lesson-points">${l.points.map((p) => `<li>${esc(t(p))}</li>`).join('')}</ul>
      ${l.numbers.length ? `<dl class="lesson-nums">${l.numbers.map((n) => `<div><dt>${esc(t(n.label))}</dt><dd class="mono">${esc(t(n.value))}</dd></div>`).join('')}</dl>` : ''}
      ${l.figure ? `<figure class="lesson-fig"><img src="${esc(base + l.figure.src)}" alt="${esc(t(l.figure.caption))}" loading="lazy" /><figcaption>${esc(t(l.figure.caption))}</figcaption></figure>` : ''}`;
  const task = `<div class="lesson-task"><b>${t('On this board')}</b><span>${esc(t(l.task))}</span></div>`;
  // phones: the task first, the rules folded (the text keeps its size; it is folded, not shrunk)
  return `
    <div class="lesson">
      <p class="lesson-src muted">${sourceLine(l, esc)}</p>
      ${phone ? `${task}<details class="lesson-orig"><summary>${t('The rules')} (${l.points.length})</summary>${rules}</details>` : `${rules}${task}`}
      <details class="lesson-orig">
        <summary>${t('Read the original text (English)')}</summary>
        ${l.original.map((p) => `<p>${esc(p)}</p>`).join('')}
        <p class="muted">${t('Quoted from {doc}, a US Government work in the public domain (Distribution Statement A).', { doc: esc(l.source.doc) })}</p>
      </details>
    </div>`;
}

/** After the repair: the inspector's verdict, the measured joints, and the module's own review questions. */
export function debriefHtml(l: Lesson | undefined, ins: Inspection, esc: Esc): string {
  const rejects = ins.findings.filter((f) => fails(l, f.kind));
  // procedure rules only where the lesson teaches them
  const notes = ins.findings.filter((f) => !rejects.includes(f) && (!RULES[f.kind].procedural || (l?.grades.includes(f.kind) ?? false)));
  const accepted = rejects.length === 0;
  // one entry per rule, with every place it applies
  const grouped = (list: Inspection['findings'], bad: boolean) => [...new Set(list.map((f) => f.kind))].map((kind) => {
    const r = RULES[kind];
    const where = list.filter((f) => f.kind === kind).map((f) => `${f.where}${f.detail ? ` (${f.detail})` : ''}`).join(', ');
    return `
      <li class="ins-f ${bad ? 'bad' : 'note'}">
        <div class="ins-h"><b>${esc(t(r.title))}</b> <span class="mono">${esc(where)}</span></div>
        <div class="ins-rule">${esc(t(r.rule))} <span class="muted">${t('NEETS 14, p. {page}', { page: esc(r.source.page) })}</span></div>
      </li>`;
  }).join('');
  const joints = ins.joints.length ? `
    <table class="ins-joints">
      <thead><tr><th>${t('Joint')}</th><th>${t('Molten')}</th><th>${t('Peak')}</th><th>${t('Part body')}</th><th>${t('Flux')}</th></tr></thead>
      <tbody>${ins.joints.map((j) => `
        <tr>
          <td class="mono">${esc(j.where)}${j.times > 1 ? ` <span class="muted">×${j.times}</span>` : ''}</td>
          <td class="mono ${j.molten > DWELL_LIMIT_S ? 'warn' : ''}">${j.molten.toFixed(1)} s</td>
          <td class="mono">${Math.round(j.peak)} °C</td>
          <td class="mono">${Math.round(j.bodyPeak)} °C${j.shunt ? ` <span class="muted">${t('shunt')}</span>` : ''}</td>
          <td>${j.flux ? t('yes') : t('no')}</td>
        </tr>`).join('')}</tbody>
    </table>
    <p class="muted ins-ref">${t('The textbook: about {c} °C at the joint, soldering done in {s} s.', { c: BEST_JOINT_C, s: '2–3' })}</p>` : '';
  const qs = l?.questions.length ? `
    <div class="ins-qs">
      <div class="card-title">${t('Review questions')} <span class="muted">${t('from the textbook')}</span></div>
      ${l.questions.map((q) => `
        <details class="ins-q">
          <summary><span class="mono muted">${esc(q.ref)}</span> ${esc(t(q.q))}</summary>
          <p>${esc(t(q.a))} <span class="muted">${t('NEETS 14, p. {page}', { page: esc(q.page) })}</span></p>
        </details>`).join('')}
    </div>` : '';
  return `
    <div class="inspection">
      <div class="ins-verdict ${accepted ? 'ok' : 'bad'}">
        <b>${accepted ? t('Accepted') : t('Rejected')}</b>
        <span>${accepted ? t('The board works and the workmanship passes inspection.') : t('{n} defect fails inspection.|{n} defects fail inspection.', { n: rejects.length })}</span>
      </div>
      ${rejects.length ? `<ul class="ins-list">${grouped(rejects, true)}</ul>` : ''}
      ${notes.length ? `<div class="sub">${t('Remarks')}</div><ul class="ins-list">${grouped(notes, false)}</ul>` : ''}
      ${joints}
      ${qs}
    </div>`;
}

/** Whether the inspection accepts the work under this lesson's graded rules. */
export function lessonAccepted(l: Lesson | undefined, ins: Inspection): boolean {
  return !ins.findings.some((f) => fails(l, f.kind));
}

/** A finding fails the inspection: a reject rule this lesson grades, or a procedure the lesson teaches. */
function fails(l: Lesson | undefined, kind: keyof typeof RULES): boolean {
  const r = RULES[kind];
  if (!l) return r.severity === 'reject';
  return l.grades.includes(kind) && (r.severity === 'reject' || !!r.procedural);
}
