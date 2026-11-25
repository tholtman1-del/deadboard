import type { Board, Component, Objective, Scenario } from '../types';

export function normalizeBoard(b: Partial<Board>): Board {
  const board: Board = {
    w: num(b.w, 50), h: num(b.h, 30), thickness: num(b.thickness, 1.6), color: b.color,
    components: arr(b.components).map(normalizeComponent),
    traces: arr(b.traces), vias: arr(b.vias), blobs: arr(b.blobs), jumpers: arr(b.jumpers),
    zones: arr(b.zones), silk: arr(b.silk), texts: arr(b.texts), nextId: num(b.nextId, 1),
    ...(Array.isArray(b.hiddenCopperNets) && { hiddenCopperNets: b.hiddenCopperNets.filter((n) => typeof n === 'string') }),
    ...(b.estimatedPads === true && { estimatedPads: true }),
    ...(b.coating && ['parylene', 'epoxy', 'acrylic', 'polyurethane', 'varnish', 'rtv'].includes(b.coating.type) && { coating: { type: b.coating.type, thick: !!b.coating.thick, ...(b.coating.solventSoluble && { solventSoluble: true }) } }),
    ...(Array.isArray(b.nicks) && { nicks: b.nicks.filter((n) => n && typeof n.id === 'string' && isPt(n.at) && (n.layer === 'F' || n.layer === 'B') && [n.len, n.depth, n.rot, n.width].every((x) => typeof x === 'number' && isFinite(x))) }),
    ...(b.inner && typeof b.inner === 'object' && {
      inner: {
        traces: arr(b.inner.traces).filter((t) => t && Number.isInteger(t.layer) && isPt(t.a) && isPt(t.b) && typeof t.w === 'number'),
        zones: arr(b.inner.zones).filter((z) => z && Number.isInteger(z.layer) && Array.isArray(z.poly) && z.poly.length >= 3 && z.poly.every(isPt)),
      },
    }),
  };
  // Make sure freshly generated ids never collide with existing ones.
  board.nextId = Math.max(board.nextId, 1 + board.traces.length + board.blobs.length + board.jumpers.length + board.components.length) + 1000;
  return board;
}

function normalizeComponent(c: Component): Component {
  if (typeof c.ref !== 'string' || !Array.isArray(c.pads)) throw new Error('Invalid component');
  return {
    ...c,
    rot: num(c.rot, 0),
    side: c.side === 'B' ? 'B' : 'F',
    pins: c.pins ?? {},
    lcsc: typeof c.lcsc === 'string' && /^C\d{1,9}$/.test(c.lcsc) ? c.lcsc : undefined,
    body: c.body ?? { shape: 'box', w: 2, h: 2, z: 1 },
    state: {
      populated: c.state?.populated ?? true,
      reversed: !!c.state?.reversed,
      burnt: !!c.state?.burnt,
      cold: Array.isArray(c.state?.cold) ? c.state.cold.filter((x) => Number.isInteger(x)) : [],
      closed: !!c.state?.closed,
      ...(c.state?.leak && isFinite(c.state.leak.ohms) && c.state.leak.ohms > 0 && { leak: c.state.leak }),
      ...(typeof c.state?.drift === 'number' && isFinite(c.state.drift) && c.state.drift > 0 && { drift: c.state.drift }),
      ...(c.state?.coldOhms && typeof c.state.coldOhms === 'object' && { coldOhms: c.state.coldOhms }),
      ...(Array.isArray(c.state?.lifted) && { lifted: c.state.lifted.filter((x) => Number.isInteger(x)) }),
      ...(Array.isArray(c.state?.netBreak) && { netBreak: c.state.netBreak.filter((x) => Number.isInteger(x)) }),
      ...(c.state?.residue && typeof c.state.residue.amount === 'number' && c.state.residue.amount > 0 && {
        residue: { amount: Math.min(1, c.state.residue.amount), ...(c.state.residue.leaky && { leaky: true }), ...(Array.isArray(c.state.residue.pads) && { pads: c.state.residue.pads.filter((x) => Number.isInteger(x)) }) },
      }),
      ...(c.state?.holes && typeof c.state.holes === 'object' && { holes: Object.fromEntries(Object.entries(c.state.holes).filter(([k, v]) => Number.isInteger(Number(k)) && (v === 'clear' || v === 'sweat'))) }),
      ...(typeof c.state?.coating === 'string' && ['removed', 'parylene', 'epoxy', 'acrylic', 'polyurethane', 'varnish', 'rtv'].includes(c.state.coating) && { coating: c.state.coating }),
      ...(c.state?.coatCharred === true && { coatCharred: true }),
      ...(c.state?.esdHandled === true && { esdHandled: true }),
      ...(c.state?.esdDamaged === true && { esdDamaged: true }),
      ...(Array.isArray(c.state?.shunts) && { shunts: c.state.shunts.filter((x) => Number.isInteger(x)) }),
      ...(Array.isArray(c.state?.fluxResidue) && { fluxResidue: c.state.fluxResidue.filter((x) => Number.isInteger(x)) }),
      ...(Array.isArray(c.state?.intermittent) && { intermittent: c.state.intermittent.filter((f) => f && typeof f.threshold === 'number' && ['thermal-open', 'thermal-leak', 'flex-open', 'flex-close'].includes(f.kind)) }),
    },
  };
}

const num = (v: unknown, d: number) => (typeof v === 'number' && isFinite(v) ? v : d);
function arr<T>(v: T[] | undefined): T[] { return Array.isArray(v) ? v : []; }
const isPt = (p: unknown) => Array.isArray(p) && p.length === 2 && typeof p[0] === 'number' && typeof p[1] === 'number';

export function parseScenario(text: string): Scenario {
  const raw = JSON.parse(text) as Partial<Scenario>;
  if (raw.format !== 'pcbfix/1') throw new Error('Not a pcbfix/1 scenario file');
  if (!raw.board) throw new Error('Scenario has no board');
  const meta = raw.meta ?? ({} as Scenario['meta']);
  return {
    format: 'pcbfix/1',
    id: String(raw.id ?? 'imported-' + Date.now().toString(36)),
    meta: {
      title: String(meta.title ?? 'Untitled board').slice(0, 120),
      author: String(meta.author ?? 'anonymous').slice(0, 80),
      difficulty: Math.min(5, Math.max(1, Math.round(num(meta.difficulty, 2)))),
      description: String(meta.description ?? '').slice(0, 4000),
      hints: arr(meta.hints).map(String).slice(0, 10),
      par: meta.par === undefined ? undefined : num(meta.par, 0),
      ...(typeof meta.credits === 'string' && { credits: meta.credits.slice(0, 400) }),
      ...(typeof meta.license === 'string' && { license: meta.license.slice(0, 60) }),
      ...(typeof meta.source === 'string' && /^https:\/\//.test(meta.source) && { source: meta.source.slice(0, 300) }),
    },
    board: normalizeBoard(raw.board),
    objectives: arr<Objective>(raw.objectives).filter((o) => o && (o.type === 'led' || o.type === 'voltage')),
    lock: raw.lock && typeof raw.lock.ct === 'string' ? raw.lock : undefined,
    ...(raw.generated && typeof raw.generated.from === 'string' && typeof raw.generated.title === 'string' && {
      generated: { from: raw.generated.from.slice(0, 120), title: raw.generated.title.slice(0, 120) },
    }),
    ...((raw.alloy === 'sac305' || raw.alloy === 'sn63' || raw.alloy === 'sn60') && { alloy: raw.alloy }),
    ...((raw.solver === 'fast' || raw.solver === 'spice' || raw.solver === 'spice-power') && { solver: raw.solver }),
    ...(raw.calibration && typeof raw.calibration.loadScale === 'number' && raw.calibration.loadScale > 0 && {
      calibration: { loadScale: raw.calibration.loadScale, ...(typeof raw.calibration.source === 'string' && { source: raw.calibration.source.slice(0, 200) }) },
    }),
  };
}

export function serializeScenario(s: Scenario): string {
  const { importWarnings: _, ...saved } = s;
  return JSON.stringify(saved);
}
