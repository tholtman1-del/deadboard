// Devices: semiconductor models from datasheet quantities (src/spice/devicelib.ts). The official
// library is the mod official-solvers; a mod can add devices (parts the library lacks) or patch an
// official one (a better Vth, another forward-voltage point). Running mods' devices form an overlay
// that the solver looks up before the built-in library, on every board that uses that part number.
//
// Honest numbers: a patch that changes a model's numbers without naming its own `source` clears
// `verified` and says in `note` which mod changed what. Every device is checked by fitting its
// model, so a bad entry is refused at load and never reaches a solve.
import { allDevices, deviceSpec, diodeModelParams, fitMos, type DeviceDef, type UnitSpec } from '../spice/devicelib';
import type { LoadedMod } from './mods';
import { itemAddress } from './address';
import { applyPatches, type PatchEntry, type PatchResult } from './patches';
import { OFFICIAL_SOLVERS_MOD } from './solvers';

/** Patchable device fields (the MPN is the device's identity: add a new device instead). */
export const DEVICE_FIELDS = ['description', 'pkg', 'units', 'verified', 'source', 'thetaJA', 'note'] as const;

/** Item id of a device: its MPN in lowercase, other characters as "-". */
export const deviceItemId = (mpn: string) => mpn.toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/^[^a-z0-9]+/, '').slice(0, 80) || 'device';

type Raw = Record<string, unknown>;
const isObj = (x: unknown): x is Raw => !!x && typeof x === 'object' && !Array.isArray(x);
const pos = (x: unknown, max = Infinity) => typeof x === 'number' && Number.isFinite(x) && x > 0 && x <= max;
const pair = (x: unknown, maxA = 1e4, maxB = 1e3) => Array.isArray(x) && x.length === 2 && pos(x[0], maxA) && pos(x[1], maxB);
const pins = (x: unknown, names: string[]) => isObj(x) && names.every((n) => typeof x[n] === 'string' && (x[n] as string).length > 0 && (x[n] as string).length <= 10);

/** Problems with one unit (empty = fine). */
export function unitProblems(u: unknown, at: string): string[] {
  if (!isObj(u)) return [`${at} must be an object`];
  const p: string[] = [];
  if (u.kind === 'nmos' || u.kind === 'pmos') {
    if (!pos(u.vth, 20)) p.push(`${at}.vth must be the |Vgs(th)| in volts (0–20)`);
    if (!Array.isArray(u.rds) || !u.rds.length || u.rds.length > 4 || !u.rds.every((r) => pair(r, 1e4, 100))) p.push(`${at}.rds must list 1–4 [ohms, |Vgs|] points`);
    if (u.body !== undefined && !pair(u.body, 5, 1e3)) p.push(`${at}.body must be [|Vsd| volts, |Is| amps]`);
    if (u.caps !== undefined && !(Array.isArray(u.caps) && u.caps.length === 3 && u.caps.every((c) => typeof c === 'number' && c >= 0 && c < 1e-3))) p.push(`${at}.caps must be [Ciss, Crss, Coss] in farads`);
    if (!pins(u.pins, ['D', 'G', 'S'])) p.push(`${at}.pins must name the D, G and S pins`);
    else if (!p.length) { try { fitMos(u as never); } catch (e) { p.push(`${at}: the model can't be fitted (${e instanceof Error ? e.message : e})`); } }
  } else if (u.kind === 'npn' || u.kind === 'pnp') {
    if (!pos(u.hfe, 1e5)) p.push(`${at}.hfe must be a positive number`);
    if (!pair(u.vbe, 5, 10)) p.push(`${at}.vbe must be [Vbe volts, Ic amps]`);
    if (u.vaf !== undefined && !pos(u.vaf, 1e4)) p.push(`${at}.vaf must be the Early voltage in volts`);
    if (!pins(u.pins, ['C', 'B', 'E'])) p.push(`${at}.pins must name the C, B and E pins`);
  } else if (['diode', 'schottky', 'zener', 'led', 'tvs-bi'].includes(u.kind as string)) {
    if (!Array.isArray(u.vf) || !u.vf.length || u.vf.length > 6 || !u.vf.every((r) => pair(r, 10, 100))) p.push(`${at}.vf must list 1–6 [volts, amps] forward points`);
    if (u.bv !== undefined && !pair(u.bv, 1e4, 10)) p.push(`${at}.bv must be [volts, amps] at breakdown`);
    if (u.cj !== undefined && !(typeof u.cj === 'number' && u.cj >= 0 && u.cj < 1e-6)) p.push(`${at}.cj must be the junction capacitance in farads`);
    if (!pins(u.pins, ['A', 'K'])) p.push(`${at}.pins must name the A and K pins`);
    else if (!p.length) { try { diodeModelParams(u as never); } catch (e) { p.push(`${at}: the model can't be fitted (${e instanceof Error ? e.message : e})`); } }
  } else if (u.kind === 'res') {
    if (!pos(u.ohms, 1e9)) p.push(`${at}.ohms must be the resistance in ohms`);
    if (!pins(u.pins, ['1', '2'])) p.push(`${at}.pins must name its two pins, "1" and "2"`);
  } else {
    p.push(`${at}.kind must be nmos, pmos, npn, pnp, diode, schottky, zener, led, tvs-bi or res`);
  }
  return p;
}

/** Problems with a whole device (empty = valid). */
export function deviceProblems(d: Raw): string[] {
  const p: string[] = [];
  if (typeof d.mpn !== 'string' || !d.mpn.trim() || d.mpn.length > 60) p.push('"mpn" must be the part number (1–60 characters)');
  if (typeof d.description !== 'string' || d.description.length > 120) p.push('"description" must be text (up to 120 characters)');
  if (typeof d.pkg !== 'string' || d.pkg.length > 60) p.push('"pkg" must be the package name');
  if (!Array.isArray(d.units) || !d.units.length || d.units.length > 8) p.push('"units" must list 1–8 units (one per transistor / diode in the package)');
  else d.units.forEach((u, i) => p.push(...unitProblems(u, `units[${i}]`)));
  if (typeof d.verified !== 'boolean') p.push('"verified" must be true or false');
  if (d.verified === true && !(typeof d.source === 'string' && d.source.trim())) p.push('"verified": true needs a "source" (the datasheet: maker, document, revision)');
  for (const k of ['source', 'note'] as const) if (d[k] !== undefined && (typeof d[k] !== 'string' || (d[k] as string).length > 400)) p.push(`"${k}" must be text`);
  if (d.thetaJA !== undefined && !pos(d.thetaJA, 2000)) p.push('"thetaJA" must be °C/W');
  if (!p.length) {
    // the pin map must be usable: one pad per pin name
    const names = [...new Set((d.units as UnitSpec[]).flatMap((u) => Object.values(u.pins)))];
    try { deviceSpec(d as unknown as DeviceDef, names); } catch (e) { p.push(`the device can't be used (${e instanceof Error ? e.message : e})`); }
  }
  return p;
}

/** Reads one entry of a mod's `devices` list. */
export function parseDevice(raw: unknown, at: string, errs: string[], warnings: string[]): DeviceDef | null {
  if (!isObj(raw)) { errs.push(`${at} must be an object`); return null; }
  for (const k of Object.keys(raw)) if (k !== 'mpn' && !(DEVICE_FIELDS as readonly string[]).includes(k)) warnings.push(`${at}: unknown field "${k}" (ignored)`);
  const d: Raw = { description: '', pkg: '', verified: false, ...raw };
  for (const k of Object.keys(d)) if (k !== 'mpn' && !(DEVICE_FIELDS as readonly string[]).includes(k)) delete d[k];
  const problems = deviceProblems(d);
  if (problems.length) { errs.push(...problems.map((x) => `${at}: ${x}`)); return null; }
  return structuredClone(d) as unknown as DeviceDef;
}

export interface DeviceOverlay {
  /** Devices the solver should use instead of / besides the library. */
  overlay: DeviceDef[];
  /** What patches did, by device address. */
  log: Map<string, { title: string; res: PatchResult }>;
  /** Every device address that exists (official + running mods'). */
  addresses: Set<string>;
  /** Two mods adding the same part number: the later one is used. */
  clashes: { mpn: string; mods: string[] }[];
}

/** Builds the device overlay from the running mods (in load order). */
export function buildDeviceOverlay(active: LoadedMod[], library: readonly DeviceDef[] = allDevices()): DeviceOverlay {
  const items = new Map<string, DeviceDef>();
  for (const d of library) items.set(itemAddress(OFFICIAL_SOLVERS_MOD, 'devices', deviceItemId(d.mpn)), d);
  const added = new Map<string, { def: DeviceDef; mod: string }>(); // by MPN
  const clashes = new Map<string, string[]>();
  for (const m of active) {
    for (const d of m.manifest.devices) {
      items.set(itemAddress(m.manifest.id, 'devices', deviceItemId(d.mpn)), d);
      const k = d.mpn.toUpperCase();
      const prev = added.get(k);
      if (prev) clashes.set(d.mpn, [...(clashes.get(d.mpn) ?? [prev.mod]), m.manifest.id]);
      added.set(k, { def: d, mod: m.manifest.id });
    }
  }
  const entries = new Map<string, PatchEntry[]>();
  for (const m of active) {
    for (const patch of m.manifest.patches) {
      if (!patch.target.includes('/devices/')) continue;
      entries.set(patch.target, [...(entries.get(patch.target) ?? []), { modId: m.manifest.id, modName: m.manifest.name, patch }]);
    }
  }
  const log = new Map<string, { title: string; res: PatchResult }>();
  const patched = new Map<string, DeviceDef>(); // by MPN
  for (const [addr, es] of entries) {
    const base = items.get(addr);
    if (!base) continue;
    const { value, result } = applyPatches(base, es, DEVICE_FIELDS, deviceProblems, (v) => {
      if (v.description === undefined) v.description = '';
      if (v.pkg === undefined) v.pkg = '';
      if (v.verified === undefined) v.verified = false;
    });
    // numbers changed without the patch naming its own datasheet: no longer verified
    const unsourced = result.changes.filter((c) => (c.field === 'units' || c.field === 'thetaJA') && !es.find((e) => e.modId === c.modId)?.patch.set.source);
    if (unsourced.length && value.verified) {
      value.verified = false;
      const who = [...new Set(unsourced.map((c) => c.modId))].join(', ');
      value.note = [value.note, `values changed by ${who}${es.find((e) => e.patch.why)?.patch.why ? ` (${es.find((e) => e.patch.why)!.patch.why})` : ''}`].filter(Boolean).join(' · ');
    }
    log.set(addr, { title: base.mpn, res: result });
    if (result.changes.length) patched.set(base.mpn.toUpperCase(), value);
  }
  const overlay = new Map<string, DeviceDef>();
  for (const [k, { def }] of added) overlay.set(k, def);
  for (const [k, def] of patched) overlay.set(k, def);
  return { overlay: [...overlay.values()], log, addresses: new Set(items.keys()), clashes: [...clashes].map(([mpn, mods]) => ({ mpn, mods })) };
}
