// Community mods (src/mods/community.ts, scripts/community.ts): the published catalogue matches the
// zips it lists, the catalogue reader drops bad entries, downloads are checked against the
// catalogue, and a submission survives the trip through the feedback route. No network.
import { COMMUNITY_FORMAT, downloadCommunityMod, MAX_SUBMIT_BYTES, parseIndex, sha256Hex, submissionFields, submissionZip, SUBMISSION_TYPE, type CommunityMod } from '../src/mods/community';
import { loadMod, zipSource } from '../src/mods/mods';

function assert(c: unknown, m: string): asserts c { if (!c) throw new Error(m); }
async function rejects(p: Promise<unknown>, re: RegExp, m: string) {
  try { await p; } catch (e) { const msg = e instanceof Error ? e.message : String(e); assert(re.test(msg), `${m}: wrong error "${msg}"`); return; }
  throw new Error(`${m}: did not throw`);
}

interface Fs { readFileSync(p: string): Uint8Array; readdirSync(p: string): string[]; existsSync(p: string): boolean }
const fsName = 'node:fs';
const fs = (await import(/* @vite-ignore */ fsName)) as Fs;
const root = new URL('..', import.meta.url).pathname;
const text = (p: string) => new TextDecoder().decode(fs.readFileSync(`${root}${p}`));

// ---- the published catalogue is current (rebuild: npm run community) ----
const index = parseIndex(JSON.parse(text('public/community/index.json')));
const raw = JSON.parse(text('public/community/index.json')) as { mods: unknown[] };
assert(index.mods.length === raw.mods.length, 'every catalogue entry parses');
const zips = ['examples', 'community'].flatMap((d) => (fs.existsSync(`${root}public/${d}`) ? fs.readdirSync(`${root}public/${d}`).filter((n) => n.endsWith('.zip')).map((n) => `${d}/${n}`) : []));
assert(zips.length === index.mods.length && zips.every((z) => index.mods.some((m) => m.file === z)), `every published zip is listed (${zips.join(', ')}): run npm run community`);
for (const m of index.mods) {
  const bytes = new Uint8Array(fs.readFileSync(`${root}public/${m.file}`));
  assert(bytes.length === m.size && (await sha256Hex(bytes)) === m.sha256, `${m.file} changed since it was listed: run npm run community`);
  const mod = await loadMod(await zipSource(bytes, m.file, 'test'));
  const mf = mod.manifest;
  assert(mf.id === m.id && mf.name === m.name && mf.version === m.version && mf.license === m.license && mf.author === m.author, `${m.file}: listing matches its mod.json`);
  assert(m.example === m.file.startsWith('examples/') && m.code === !!mf.code, `${m.id}: example / code flags`);
  assert(m.bench.fail === 0, `${m.id}: listed with a failing bench check`);
}
assert(index.mods.some((m) => m.id === 'board-notes' && m.contents.knowledge === 26 && !m.code), 'board-notes is listed: 26 knowledge packs (one per shipped board), data only');
assert(index.mods.find((m) => m.id === 'night-light-extras')?.requires['starter-kit'], 'dependencies are listed (installed together)');

// ---- the reader leaves bad entries out ----
{
  const good = index.mods[0];
  const r = parseIndex({ format: COMMUNITY_FORMAT, mods: [
    good,
    { ...good, file: 'https://evil.example/x.zip' },
    { ...good, file: '../secret.zip' },
    { ...good, id: 'BAD ID' },
    { ...good, sha256: 'xyz' },
    null, 'text',
  ] });
  assert(r.mods.length === 1 && r.mods[0].id === good.id, 'only the good entry is kept (files only from examples/ or community/)');
  let threw = false;
  try { parseIndex({ format: 'other', mods: [] }); } catch { threw = true; }
  assert(threw, 'a file that is not a catalogue is refused');
}

// ---- downloads are checked against the catalogue ----
{
  const m = index.mods.find((x) => x.id === 'board-notes')!;
  const bytes = new Uint8Array(fs.readFileSync(`${root}public/${m.file}`));
  const serve = (b: Uint8Array, status = 200) => (async (url: string) => {
    assert(url === `./${m.file}`, `asks for the listed file (${url})`);
    return new Response(new Uint8Array(b), { status });
  }) as unknown as typeof fetch;
  const got = await downloadCommunityMod(m, './', serve(bytes));
  assert(got.length === bytes.length, 'download ok');
  const tampered = bytes.slice(); tampered[100] ^= 1;
  await rejects(downloadCommunityMod(m, './', serve(tampered)), /doesn't match the catalogue/, 'a changed file is refused');
  await rejects(downloadCommunityMod(m, './', serve(bytes.slice(0, 50))), /doesn't match the catalogue/, 'a short download is refused');
  await rejects(downloadCommunityMod(m, './', serve(bytes, 404)), /HTTP 404/, 'missing file');
  const huge: CommunityMod = { ...m, size: 200 * 1048576 };
  await rejects(downloadCommunityMod(huge, './', serve(bytes)), /limit/, 'too big for the app');
}

// ---- a submission: the zip inside the message, read back by `npm run feedback` ----
{
  const bytes = new Uint8Array(fs.readFileSync(`${root}public/examples/board-notes.zip`));
  const manifest = { id: 'board-notes', name: 'Board notes', version: '1.0.0', license: 'CC0-1.0' };
  const f = await submissionFields({ manifest, bytes, link: '', note: ' Packs for every board. ', contact: 'me@example.org', bench: '13 passed · 0 warning(s) · 0 failed' });
  assert(f.type === SUBMISSION_TYPE && f.mod === 'board-notes v1.0.0' && f._replyto === 'me@example.org' && f.message === 'Packs for every board.', 'message fields');
  assert(Object.keys(f).pop() === 'modzip', 'the file is the last field');
  // FormSubmit hands fields back as strings, exactly as sent
  const back = JSON.parse(JSON.stringify(f)) as Record<string, string>;
  const zip = await submissionZip(back);
  assert(zip && zip.length === bytes.length && zip.every((x, i) => x === bytes[i]), 'the zip arrives intact');
  const mod = await loadMod(await zipSource(zip, 'sub.zip', 'test'));
  assert(mod.manifest.id === 'board-notes', 'and loads as the mod');
  await rejects(submissionZip({ ...back, modzip: back.modzip.slice(0, -8) + 'AAAAAAAA' }), /damaged/, 'a damaged file is caught');
  assert((await submissionZip({ type: 'Bug report', message: 'x' })) === null, 'feedback reports carry no mod');

  // the largest mod sent inline, with the longest note, stays under FormSubmit's limit (64 KB stored;
  // measured 2026-11-21: 40 KB mods go through, 52 KB ones are refused)
  const atCap = new Uint8Array(MAX_SUBMIT_BYTES).map((_, i) => (i * 2654435761) >>> 24);
  const full = await submissionFields({ manifest, bytes: atCap, link: '', note: 'x'.repeat(2000), contact: 'someone@example.org', bench: '13 passed · 0 warning(s) · 0 failed' });
  const total = JSON.stringify({ _template: 'box', _captcha: 'false', ...full }).length;
  assert(full.modzip && total < 60_000, `a mod at the cap encodes to ${total} characters: keep it under FormSubmit's 64 KB`);

  // too big to send: a link is needed, and then no file travels
  const big = new Uint8Array(MAX_SUBMIT_BYTES + 1);
  await rejects(submissionFields({ manifest, bytes: big, link: '', note: '', contact: '', bench: '' }), /limit/, 'too big without a link');
  await rejects(submissionFields({ manifest, bytes: big, link: 'ftp://x/y.zip', note: '', contact: '', bench: '' }), /https/, 'links must be https');
  const linked = await submissionFields({ manifest, bytes: big, link: 'https://github.com/me/mod/releases/v1.zip', note: '', contact: '', bench: '' });
  assert(!linked.modzip && linked.link.startsWith('https://') && (await submissionZip(linked)) === null && linked.contact === '(none)' && !linked._replyto, 'link only');
}

console.log(`COMMUNITY TESTS PASSED (catalogue current: ${index.mods.length} mods; bad entries dropped; downloads checked; submission round trip, damage caught, size limit + link)`);
