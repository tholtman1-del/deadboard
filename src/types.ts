// Core data model. All units are millimetres; world is y-up, board spans [0,w]x[0,h],
// board centred on z=0 (top copper at +thickness/2, bottom copper at -thickness/2).

export type V2 = [number, number];
export type Side = 'F' | 'B';
export type PadLayers = 'F' | 'B' | 'FB';
export type PadShape = 'rect' | 'circle' | 'oval' | 'roundrect';

export interface Pad {
  name: string;
  /** Position relative to the component origin, before component rotation. */
  at: V2;
  size: V2;
  /** Rotation relative to the component, degrees. */
  rot?: number;
  shape: PadShape;
  layers: PadLayers;
  drill?: number;
  net?: string;
}

export type ComponentKind =
  | 'resistor' | 'capacitor' | 'led' | 'diode' | 'battery' | 'switch' | 'fuse'
  | 'testpoint' | 'ic' | 'connector' | 'generic';

export type BodyShape =
  | 'box' | 'axial' | 'led' | 'radial' | 'coin' | 'tactile' | 'fuse' | 'header' | 'pin' | 'chip' | 'to92' | 'none';

export interface Body {
  shape: BodyShape;
  /** Footprint-local size: w along local x, h along local y, z height above board. */
  w: number;
  h: number;
  z: number;
  off?: V2;
  color?: string;
}

export type LedColor = 'red' | 'green' | 'yellow' | 'blue' | 'white' | 'orange';

export interface ComponentState {
  populated: boolean;
  /** Part seated rotated 180° relative to the silkscreen (swaps its two pins). */
  reversed: boolean;
  burnt: boolean;
  /** Pad indices with a cold (non-conducting) solder joint. */
  cold: number[];
  /** Switch contact state. */
  closed?: boolean;
  /** Partial short across the part (failed MLCC, liquid residue…): resistance between two pads. */
  leak?: { ohms: number; a?: string; b?: string };
  /** Value drift multiplier (corrosion, ageing): effective value = value × drift. */
  drift?: number;
  /** Resistive cold joints: pad index → series resistance (Ω). Pads listed in `cold` without an entry are open. */
  coldOhms?: Record<number, number>;
  /** Pads delaminated by overheating: permanently open (board damage; bypass with a jumper wire). */
  lifted?: number[];
  /**
   * Broken copper on a pad's net near that pad (corroded trace / via): the pad's local branch of
   * the net is cut off from the rest. Board damage — a new part does not fix it; a jumper does.
   */
  netBreak?: number[];
  /**
   * Visible liquid-damage residue / corrosion around the part (amount 0..1; `leaky`: the ionic
   * film is what forms `leak`; `pads`: where it sits, default all). Removed by IPA scrubbing.
   */
  residue?: { amount: number; leaky?: boolean; pads?: number[] };
  /**
   * Pads with rosin flux residue left by rework (amber film). Rosin is nonconductive, so it does
   * not change the circuit, but high-reliability work removes it with alcohol (NEETS 14 p. 3-25).
   */
  fluxResidue?: number[];
  /**
   * Through-hole pads whose solder was taken out in rework: 'clear' = an empty hole, the lead sits
   * loose (no contact, so the pad is also in `cold`); 'sweat' = a paper-thin film still bonds the
   * lead to the plated barrel (NEETS 14 p. 3-17: a sweat joint), which conducts and holds the part.
   */
  holes?: Record<number, 'clear' | 'sweat'>;
  /** Through-hole leads (pad indices) with a thermal shunt clipped on (a bench accessory). */
  shunts?: number[];
  /** Intermittent faults driven by temperature / board flex (see src/intermittent.ts). */
  intermittent?: import('./intermittent').IntermittentSpec[];
}

export interface Component {
  id: string;
  ref: string;
  kind: ComponentKind;
  /** Ohms (resistor), farads (capacitor), volts (battery), amps (fuse rating). */
  value: number;
  /** The value is an importer default, not known (e.g. a boardview carries no part values). */
  valueGuessed?: boolean;
  color?: LedColor;
  label?: string;
  /** Distributor order code from the design (KiCad "LCSC" field, e.g. "C5446"): names the exact part when the value doesn't. */
  lcsc?: string;
  footprint?: string;
  /** Resistor power rating in watts (default 0.5). */
  rating?: number;
  at: V2;
  rot: number;
  side: Side;
  pads: Pad[];
  /** Electrical role -> pad name. e.g. LED {A:'2', K:'1'}, battery {'+':'1','-':'2'} */
  pins: Record<string, string>;
  body: Body;
  state: ComponentState;
}

export interface Trace { id: string; layer: Side; a: V2; b: V2; w: number; net?: string }
export interface Via { id: string; at: V2; d: number; drill: number; side?: Side; net?: string }
export interface Blob { id: string; at: V2; r: number; layer: Side }
export interface Jumper { id: string; a: V2; b: V2; la: Side; lb: Side }
export interface Zone { id: string; layer: Side; net?: string; poly: V2[] }
export interface SilkLine { a: V2; b: V2; w: number; side: Side }
export interface SilkText { at: V2; text: string; size: number; side: Side; rot?: number }

export interface Board {
  w: number;
  h: number;
  thickness: number;
  color?: string;
  components: Component[];
  traces: Trace[];
  vias: Via[];
  blobs: Blob[];
  jumpers: Jumper[];
  zones: Zone[];
  silk: SilkLine[];
  texts: SilkText[];
  nextId: number;
  /**
   * Nets with copper the model does not draw (inner-layer planes / tracks of a multilayer
   * board): their vias and through-hole pads are joined by the design netlist, as the hidden
   * plane joins them. Outer-layer copper of these nets still connects by geometry.
   */
  hiddenCopperNets?: string[];
  /**
   * Pad shapes are an importer's estimate (boardviews store pin positions, not copper): pads and
   * vias of different named nets never join by touching, since that overlap is an artefact of
   * the estimate (stacked pads, guessed sizes), not a short. Solder blobs, jumpers and traces
   * still join whatever they touch.
   */
  estimatedPads?: boolean;
  /**
   * Inner-layer copper of a multilayer board, for display only (X-ray, selected-net overlay).
   * Electrically it is represented by hiddenCopperNets; tools never act on it.
   */
  inner?: InnerCopper;
}

/** `layer` is the inner layer number: 1 for In1.Cu, 2 for In2.Cu, … */
export interface InnerCopper {
  traces: { layer: number; a: V2; b: V2; w: number; net?: string }[];
  zones: { layer: number; net?: string; poly: V2[] }[];
}

export type SwitchMap = Record<string, boolean>;

export type Objective =
  | { type: 'led'; ref: string; on: boolean; switches?: SwitchMap }
  | { type: 'voltage'; a: string; b?: string; min: number; max: number; switches?: SwitchMap };

export interface FlagLock { salt: string; iv: string; ct: string }

export interface ScenarioMeta {
  title: string;
  author: string;
  difficulty: number;
  description: string;
  hints: string[];
  par?: number;
  /** Who designed the board (attribution required by open-hardware licences). */
  credits?: string;
  /** SPDX licence id of the board design, e.g. "CERN-OHL-S-2.0", "Apache-2.0". */
  license?: string;
  /** Where the original design files live (repository URL at a pinned commit). */
  source?: string;
}

export interface Scenario {
  format: 'pcbfix/1';
  id: string;
  meta: ScenarioMeta;
  board: Board;
  objectives: Objective[];
  /** Flag encrypted with a key derived from the repaired circuit's topology. */
  lock?: FlagLock;
  /** Solver the scenario is built for (regulated rails need 'spice-power'); the app switches to it. */
  solver?: 'fast' | 'spice' | 'spice-power';
  /** A solver from a code mod the board is made for (its address); `solver` is the fallback. */
  modSolver?: string;
  /** Model calibration from bench measurements of a real board (see src/calibrate.ts). */
  calibration?: { loadScale?: number; source?: string };
  /** Solder alloy on the board (rework melting points): lead-free SAC305 unless set. */
  alloy?: 'sac305' | 'sn63' | 'sn60';
  /** A problem generated on a fixed board (src/scenarios/generate.ts): the board it started from. */
  generated?: { from: string; title: string };
  /** Import checks that failed (nets joined or split, counts off); set by importers, not saved. */
  importWarnings?: string[];
}
