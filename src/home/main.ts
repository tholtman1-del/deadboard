// DEADBOARD homepage: fonts, brand mark, icons, the power-up log, legacy share links.
import '@fontsource-variable/inter';
import '@fontsource-variable/jetbrains-mono';
import './home.css';
import { markSvg } from '../ui/logo';
import { icon } from '../ui/icons';
import { initAnalytics, onFirstHide, scrollBucket, secondsBucket, SITE_HOST, trackEvent, visibleClock } from '../analytics';
import { initI18n, lang, saveLanguage, t } from '../i18n';
import { translatePage } from './translate';

initAnalytics();

// "home left": when the page is first hidden, one event that says when and why a visit ended:
// how long the page was looked at, how far it was scrolled and which section was the deepest one
// seen, whether and when the visitor first touched anything, how long the page took to show its
// main content, where they went (the bench, another page here, a link out, or away) and through
// which button, what the hero did (3D board, picture or the phone teaser) and how far the teaser
// got, and the page language. All values are ranges or fixed words. Not sent from automated
// browsers (navigator.webdriver: bots, our own scripts).
const visibleFor = visibleClock();
let deepest = 0;
addEventListener('scroll', () => {
  const max = document.documentElement.scrollHeight - innerHeight;
  if (max > 0) deepest = Math.max(deepest, scrollY / max);
}, { passive: true });
let leftTo = 'away';
let via = 'none';
document.addEventListener('click', (e) => {
  const a = (e.target as Element | null)?.closest?.('a');
  const href = a?.getAttribute('href');
  if (!a || !href || href.startsWith('#')) return;
  leftTo = /app\.html/.test(href) ? 'bench' : a.host && a.host !== location.host ? 'link out' : 'page';
  via = a.dataset.cta ?? (leftTo === 'page' ? 'link' : 'other');
}, true);
let firstTouch = -1;
for (const ev of ['pointerdown', 'keydown', 'wheel', 'touchstart', 'scroll']) {
  addEventListener(ev, () => { if (firstTouch < 0) firstTouch = visibleFor(); }, { passive: true, capture: true });
}
const sections = [...document.querySelectorAll<HTMLElement>('main > section')].map((el) => ({ el, name: el.id || el.classList[0] || 'section' }));
let seenAt = 0;
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) seenAt = Math.max(seenAt, sections.findIndex((x) => x.el === e.target));
  }, { threshold: 0.25 });
  for (const x of sections) io.observe(x.el);
}
// main content on screen (largest contentful paint), else the load event
let shownMs = -1;
try {
  new PerformanceObserver((list) => { const last = list.getEntries().at(-1); if (last) shownMs = last.startTime; }).observe({ type: 'largest-contentful-paint', buffered: true });
} catch { /* not supported */ }
addEventListener('load', () => { if (shownMs < 0) shownMs = performance.now(); });
const msBucket = (ms: number) => (ms < 0 ? 'not yet' : ms < 1000 ? '<1s' : ms < 2500 ? '1-2.5s' : ms < 4000 ? '2.5-4s' : '4s+');
let hero = 'teaser';
let teaserState = 'none';
onFirstHide(() => {
  if ((navigator as Navigator & { webdriver?: boolean }).webdriver) return;
  trackEvent('home left', {
    visible: secondsBucket(visibleFor()), scrolled: scrollBucket(deepest), to: leftTo, hero,
    seen: sections[seenAt]?.name ?? 'hero', touched: firstTouch < 0 ? 'never' : secondsBucket(firstTouch),
    via, shown: msBucket(shownMs), teaser: teaserState, lang: document.documentElement.lang === 'ru' || lang() === 'ru' ? 'ru' : 'en',
    // the three that answer "why did they leave" together (Umami cannot cross two properties)
    exit: `${leftTo} · ${sections[seenAt]?.name ?? 'hero'} · ${firstTouch < 0 ? 'no touch' : 'touched'}`,
  });
});

// Share links made before the homepage existed pointed at "/#s=…": hand them to the app.
if (location.hash.startsWith('#s=')) location.replace(`./app.html${location.hash}`);

for (const el of document.querySelectorAll<HTMLElement>('[data-mark]')) el.innerHTML = markSvg(el.closest('.small') ? 18 : 24);
for (const el of document.querySelectorAll<HTMLElement>('[data-icon]')) el.innerHTML = icon(el.dataset.icon!, 18);
// Language: the app's choice (?lang=, saved, browser), switchable in place from the header.
const TITLE = document.title;
const hasTranslatable = document.querySelector('[data-t], [data-t-attr]') !== null;
const staticRu = !hasTranslatable && document.documentElement.lang === 'ru';
async function setLanguage(code?: string) {
  await initI18n(staticRu ? 'ru' : code);
  if (hasTranslatable) {
    translatePage();
    document.title = lang() === 'en' ? TITLE : t('DEADBOARD — bring dead boards back');
  }
  for (const b of document.querySelectorAll<HTMLButtonElement>('[data-lang]')) b.setAttribute('aria-pressed', String(b.dataset.lang === (staticRu ? 'ru' : lang())));
  document.documentElement.classList.remove('i18n-wait');
  relabelBoard?.();
}
let relabelBoard: (() => void) | undefined;
for (const b of document.querySelectorAll<HTMLButtonElement>('[data-lang]')) {
  b.addEventListener('click', () => {
    if (staticRu) {
      if (b.dataset.lang === 'en') { saveLanguage('en'); location.href = './'; }
      return;
    }
    if (b.dataset.lang === lang()) return;
    saveLanguage(b.dataset.lang!); // the app opens in the same language
    void setLanguage(b.dataset.lang);
  });
}
void setLanguage().catch(() => document.documentElement.classList.remove('i18n-wait'));

for (const el of document.querySelectorAll<HTMLElement>('[data-year]')) el.textContent = String(new Date().getFullYear());

// A tiny playable first repair in the hero (index.html .hero-teaser), on every screen. Pressing SW1 leaves
// the LED dark and the supply at 0.0 mA; the way to find out why is the bench.
const teaser = document.querySelector<HTMLElement>('[data-teaser]');
if (teaser) {
  const btn = teaser.querySelector<SVGGElement>('[data-teaser-btn]')!;
  const cap = teaser.querySelector<HTMLElement>('[data-teaser-cap]')!;
  const amps = teaser.querySelector<SVGTextElement>('[data-teaser-amps]')!;
  // after the press the hero's main button becomes the next step: "Find the fault →" on the same link
  const cta = document.querySelector<HTMLAnchorElement>('.hero .cta a[data-cta="hero"]');
  const press = () => {
    btn.classList.add('down', 'pressed');
    setTimeout(() => btn.classList.remove('down'), 180);
    amps.textContent = '0.0 mA';
    cap.textContent = t('Dead: 0.0 mA. Something on this board is broken.');
    if (cta) cta.innerHTML = t('Find the fault <span aria-hidden="true">→</span>');
    if (teaserState === 'none') teaserState = 'pressed';
  };
  btn.addEventListener('click', press);
  btn.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); press(); } });
  cta?.addEventListener('click', () => { if (teaserState === 'pressed') teaserState = 'went'; });
}

// "N boards fixed by players in the last 30 days", from the public stats (stats.html); only on the
// website, and only once the number is worth showing. The request sends nothing about the visitor.
const live = document.querySelector<HTMLElement>('[data-live-stats]');
if (live && location.hostname === SITE_HOST) {
  void fetch('https://stats.deadboard.org/v1/summary').then((r) => (r.ok ? r.json() : null)).then((sum: { v?: number; fixed?: number } | null) => {
    if (sum?.v !== 1 || typeof sum.fixed !== 'number' || sum.fixed < 100) return;
    const show = () => { live.textContent = t('{n} board fixed by players in the last 30 days|{n} boards fixed by players in the last 30 days', { n: sum.fixed! }); };
    show();
    live.hidden = false;
    const prev = relabelBoard;
    relabelBoard = () => { prev?.(); show(); };
  }).catch(() => {});
}
