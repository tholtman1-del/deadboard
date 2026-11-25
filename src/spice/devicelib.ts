// Discrete semiconductor library: datasheet key specs → fitted SPICE models + pin maps.
//
// Each entry stores the *datasheet quantities* (Rds(on) at given Vgs, Vf at given If, hFE…)
// and the pad→terminal map; SPICE parameters are fitted from them at build time, so a spec
// correction automatically corrects the model.
//
// Provenance: `verified: true` only when every number in the entry was read from the
// manufacturer datasheet named in `source` (typical column; a value the datasheet gives only as
// a limit, or derived from limits, is called out in `note`). Entries checked only against
// datasheet limits, or whose datasheet was not read, stay `verified: false` and say so in
// `note`. Numbers are facts transcribed from the documents; no datasheet text is copied.
import type { PartSpec } from './board';
import { VT_300K } from './devices';
import { formatSpiceNumber as fmt } from './units';

export interface MosSpec {
  kind: 'nmos' | 'pmos';
  /** |VGS(th)| typical (V). */
  vth: number;
  /** Rds(on) typical (Ω) at |VGS| (V); two points allow fitting threshold + gain from the on-curve. */
  rds: [number, number][];
  /** Body diode |VSD| (V) at |IS| (A). */
  body?: [number, number];
  /** Ciss, Crss, Coss (F). */
  caps?: [number, number, number];
  pins: { D: string; G: string; S: string };
}
export interface BjtSpec { kind: 'npn' | 'pnp'; hfe: number; vbe: [number, number]; vaf?: number; pins: { C: string; B: string; E: string } }
export interface DiodeSpec {
  kind: 'diode' | 'schottky' | 'zener' | 'led' | 'tvs-bi';
  /** Forward points (V, A). */
  vf: [number, number][];
  /** Reverse breakdown / zener voltage (V) at current (A). */
  bv?: [number, number];
  cj?: number;
  pins: { A: string; K: string };
}
/** One resistor of a network or array package (isolated or bussed): `ohms` between pins 1 and 2. */
export interface ResSpec { kind: 'res'; ohms: number; pins: { '1': string; '2': string } }
export type UnitSpec = MosSpec | BjtSpec | DiodeSpec | ResSpec;

export interface DeviceDef {
  mpn: string;
  /** LCSC order codes of parts these numbers cover, for boards whose value names no part ("Schottky Diode" + C8598). */
  lcsc?: string[];
  description: string;
  pkg: string;
  units: UnitSpec[];
  verified: boolean;
  /** Datasheet the numbers were read from: maker, document id, revision, date. */
  source?: string;
  /** Junction-to-ambient thermal resistance (°C/W) as the datasheet states it (condition in `note`). */
  thetaJA?: number;
  note?: string;
}

// Pin numbers are DATASHEET pin numbers. Multi-pin packages (SOT, SON, PowerPAK…) follow
// IPC numbering, so footprint pad = datasheet pin on practically every CAD library. Two-pin
// diodes are the exception — libraries disagree on whether pad 1 is the anode or cathode —
// so their mapping is resolved per board from netlist evidence (see inferDiodeConvention).
const DEVICES: DeviceDef[] = [
  { mpn: 'FDC638APZ', description: 'P-MOSFET −20 V −4.5 A', pkg: 'SuperSOT-6 (TSOT-23-6)', verified: true,
    source: 'onsemi FDC638APZ/D Rev. 3, Nov 2023', thetaJA: 156,
    note: 'θJA on the minimum pad (note 1b)',
    units: [{ kind: 'pmos', vth: 0.8, rds: [[4.5, 0.037], [2.5, 0.052]], body: [0.8, 1.3], caps: [750e-12, 130e-12, 155e-12], pins: { D: '1', G: '3', S: '4' } }] },
  { mpn: 'DMN5L06VK', description: 'dual N-MOSFET 50 V 0.28 A', pkg: 'SOT-563', verified: true,
    source: 'Diodes Inc. DS30769 Rev. 15-3, Nov 2024', thetaJA: 500,
    note: 'the table gives limits only (VGS(th) 0.49–1.0 V, RDS(on) ≤ 2.0 Ω at 5 V, VSD 0.5–1.4 V, Ciss ≤ 50 pF): typicals read from Figs. 3, 6, 8 and 9 at 25 °C (about ±10 %); no typical capacitance: omitted',
    units: [
      { kind: 'nmos', vth: 0.8, rds: [[10, 1.05], [5, 1.15]], body: [0.75, 0.1], pins: { D: '6', G: '2', S: '1' } },
      { kind: 'nmos', vth: 0.8, rds: [[10, 1.05], [5, 1.15]], body: [0.75, 0.1], pins: { D: '3', G: '5', S: '4' } },
    ] },
  { mpn: 'DMN32D2LFB4', description: 'N-MOSFET 30 V small signal', pkg: 'X2-DFN1006-3', verified: true,
    source: 'Diodes Inc. DS31124 Rev. 9-2, Aug 2015', thetaJA: 357,
    note: 'the table gives RDS(on), VGS(th) and VSD as limits only (RDS(on) ≤ 1.2 Ω at 4 V, ≤ 1.5 Ω at 2.5 V; VGS(th) 0.6–1.2 V): their typicals are read from Figs. 3, 5, 6 and 8 at 25 °C (about ±10 %). Capacitances are table typicals. The pin-out drawing names no pin numbers: pads net-checked per board',
    units: [{ kind: 'nmos', vth: 0.75, rds: [[4, 0.8], [1.8, 1.5]], body: [0.8, 0.2], caps: [39e-12, 3.6e-12, 10e-12], pins: { G: '1', S: '2', D: '3' } }] },
  { mpn: 'NTUD3169CZ', description: 'complementary N+P MOSFET 20 V', pkg: 'SOT-963', verified: true,
    source: 'onsemi NTUD3169CZ/D Rev. 2, Jun 2025', thetaJA: 1000,
    note: 'VGS(th) has no typical (0.4–1.0 V): midpoint used. Pinout matches package style 9; which unit is N is net-checked per board. θJA on the minimum pad',
    units: [
      { kind: 'nmos', vth: 0.7, rds: [[4.5, 0.75], [2.5, 1.0]], body: [0.6, 0.01], caps: [12.5e-12, 2.6e-12, 3.6e-12], pins: { S: '1', G: '2', D: '6' } },
      { kind: 'pmos', vth: 0.7, rds: [[4.5, 2.0], [2.5, 2.6]], body: [0.6, 0.01], caps: [13.5e-12, 2.0e-12, 3.8e-12], pins: { D: '3', S: '4', G: '5' } },
    ] },
  { mpn: 'SI5419DU', description: 'P-MOSFET −30 V (DC-in isolation)', pkg: 'PowerPAK ChipFET single', verified: true,
    source: 'Vishay Si5419DU, doc. 69001 Rev. B, 07-Feb-2011', thetaJA: 34,
    note: 'VGS(th) has no typical (1.2–2.5 V): midpoint used. Pinout not legible in the text extraction: pads net-checked per board. θJA typical, t ≤ 5 s on 1" × 1" FR4',
    units: [{ kind: 'pmos', vth: 1.85, rds: [[10, 0.016], [4.5, 0.027]], body: [0.85, 7.9], caps: [1400e-12, 200e-12, 240e-12], pins: { S: '1', G: '4', D: '5' } }] },
  { mpn: 'SI7137DP', description: 'P-MOSFET −20 V (battery FET)', pkg: 'PowerPAK SO-8', verified: true,
    source: 'Vishay Si7137DP, doc. 69063 Rev. D, 18-May-2009', thetaJA: 15,
    note: 'VGS(th) has no typical (0.5–1.4 V): midpoint used. θJA typical, t ≤ 10 s on 1" × 1" FR4 (54 °C/W max steady state)',
    units: [{ kind: 'pmos', vth: 0.95, rds: [[10, 0.0016], [4.5, 0.002]], body: [0.64, 5], caps: [20000e-12, 2650e-12, 2150e-12], pins: { S: '1', G: '4', D: '5' } }] },
  { mpn: 'SI8409DB', description: 'P-MOSFET −30 V load switch', pkg: 'MICRO FOOT 1.6x1.6', verified: true,
    source: 'Vishay Si8409DB, doc. 73111 Rev. D, 20-Jul-2015', thetaJA: 72,
    note: 'VGS(th) has no typical (0.6–1.4 V): midpoint used. Capacitances only as a graph: omitted. θJA typical, steady state',
    units: [{ kind: 'pmos', vth: 1.0, rds: [[4.5, 0.038], [2.5, 0.052]], body: [0.8, 1], pins: { G: '1', D: '2', S: '4' } }] },
  { mpn: 'IRF9395', description: 'dual P-MOSFET −30 V, common drain (inrush/back-to-back)', pkg: 'DirectFET MC dual', verified: true,
    source: 'Infineon (IR) IRF9395MTRPbF datasheet, revision history to 2014-02-24',
    note: 'drains common on the thermal pads (no boardview net); body diodes oppose. VSD given only as a maximum (1.2 V at 11 A). Package is DirectFET, not PQFN: pad numbers come from the board footprint (net-checked)',
    units: [
      { kind: 'pmos', vth: 1.8, rds: [[10, 0.0053], [4.5, 0.009]], body: [1.2, 11], caps: [3241e-12, 466e-12, 820e-12], pins: { S: '1', G: '3', D: '7' } },
      { kind: 'pmos', vth: 1.8, rds: [[10, 0.0053], [4.5, 0.009]], body: [1.2, 11], caps: [3241e-12, 466e-12, 820e-12], pins: { S: '4', G: '6', D: '7' } },
    ] },
  { mpn: 'SISA18DN', description: 'N-MOSFET 30 V (VR high side)', pkg: 'PowerPAK 1212-8S', verified: true,
    source: 'Vishay SiSA18DN datasheet, doc. 62579 Rev. A, 27-Aug-2012 (via the Digi-Key API), cross-checked with SPICE Device Model doc. 62712 Rev. B', thetaJA: 31,
    note: 'RDS(on), capacitances and VSD are the datasheet typicals (identical to the SPICE document\'s measured column). VGS(th) has no typical (1.2–2.4 V): the SPICE model\'s 1.5 V is used. Pinout per the datasheet: 1-3 S, 4 G, 5-8 D. θJA typical, t ≤ 10 s',
    units: [{ kind: 'nmos', vth: 1.5, rds: [[10, 0.006], [4.5, 0.0096]], body: [0.77, 5], caps: [1000e-12, 34e-12, 287e-12], pins: { S: '1', G: '4', D: '5' } }] },
  { mpn: 'SISA12DN', description: 'N-MOSFET 30 V (VR low side)', pkg: 'PowerPAK 1212-8S', verified: true,
    source: 'Vishay SPICE Device Model SiSA12DN, doc. 62570 Rev. B, 29-Jul-2013 (measured-data column)',
    note: 'values from the measured column of Vishay\'s SPICE model document (the product datasheet was not read); VGS(th) only in the simulated column. That document has no pinout: pads per the PowerPAK 1212-8 layout, net-checked per board',
    units: [{ kind: 'nmos', vth: 1.5, rds: [[10, 0.0032], [4.5, 0.0044]], body: [0.86, 10], caps: [2070e-12, 51e-12, 600e-12], pins: { S: '1', G: '4', D: '5' } }] },
  { mpn: 'CSD58873Q3D', description: 'synchronous buck power block 30 V', pkg: 'SON 3.3x3.3', verified: false,
    note: 'TGR (pad 4) is the control-FET source sense, tied internally to VSW. No public datasheet (apparently a custom part: not in TI\'s catalogue or jlcparts): unverified estimates. Its public sibling CSD87333Q3D below has the same package and pinout but different FETs',
    units: [
      { kind: 'nmos', vth: 1.4, rds: [[8, 0.0092], [4.5, 0.011]], body: [0.8, 5], caps: [900e-12, 50e-12, 250e-12], pins: { D: '1', G: '3', S: '6' } },
      { kind: 'nmos', vth: 1.2, rds: [[8, 0.0041], [4.5, 0.0049]], body: [0.7, 5], caps: [1900e-12, 90e-12, 500e-12], pins: { D: '6', G: '5', S: '9' } },
    ] },
  { mpn: 'CSD87333Q3D', description: 'synchronous buck power block 30 V (5 V gate drive)', pkg: 'SON 3.3x3.3 (DPB0008A)', verified: true,
    source: 'TI SLPS350A, Feb 2014, revised Jan 2017', thetaJA: 150,
    note: 'control and sync FET have identical specs. Pins 1-2 VIN, 3 TG, 4 TGR (control-FET source return, tied internally to VSW), 5 BG, 6-8 VSW, 9 PGND. θJA on minimum copper (80 °C/W on 1 in² of 2 oz Cu)',
    units: [
      { kind: 'nmos', vth: 0.95, rds: [[8, 0.0119], [4.5, 0.0134]], body: [0.8, 4], caps: [509e-12, 8.2e-12, 222e-12], pins: { D: '1', G: '3', S: '6' } },
      { kind: 'nmos', vth: 0.95, rds: [[8, 0.0119], [4.5, 0.0134]], body: [0.8, 4], caps: [509e-12, 8.2e-12, 222e-12], pins: { D: '6', G: '5', S: '9' } },
    ] },
  { mpn: 'NTMFD4902NF', description: 'dual N-MOSFET power stage 30 V (charger)', pkg: 'SO-8FL dual', verified: true,
    source: 'onsemi NTMFD4902NF/D Rev. 5, May 2019', thetaJA: 65.9,
    note: 'VGS(th) has no typical (1.2–2.2 V): midpoint used. Q2 has an integrated Schottky (VSD 0.37 V at 2 A). θJA of Q1 on 1 in² 2 oz Cu (Q2 62.8)',
    units: [
      { kind: 'nmos', vth: 1.7, rds: [[10, 0.0052], [4.5, 0.008]], body: [0.75, 3], caps: [1150e-12, 105e-12, 360e-12], pins: { D: '2', G: '1', S: '10' } },
      { kind: 'nmos', vth: 1.7, rds: [[10, 0.0033], [4.5, 0.005]], body: [0.37, 2], caps: [1590e-12, 83e-12, 813e-12], pins: { D: '10', G: '8', S: '5' } },
    ] },
  { mpn: 'BC846BLP', description: 'NPN 65 V (thermal-sense diode)', pkg: 'X2-DFN1006-3', verified: true,
    source: 'Diodes Inc. BC846BLP4, DS35751 Rev. 3-2, Sep 2017 (datasheet link from the jlcparts / LCSC catalogue)', thetaJA: 272,
    note: 'board value "BC846BLP" = Diodes BC846BLP4. hFE 270 and VBE(on) 0.65 V typical at 2 mA. The Early voltage is not specified: the model uses its 100 V default (estimate). The pin drawing has letters only: pads net-checked per board. θJA on the minimum pad (120 °C/W on a larger one)',
    units: [{ kind: 'npn', hfe: 270, vbe: [0.65, 2e-3], pins: { B: '1', E: '2', C: '3' } }] },
  { mpn: 'MMBT3904LP', description: 'NPN 40 V general purpose', pkg: 'X2-DFN1006-3', verified: false,
    source: 'Diodes Inc. DS31835 Rev. 7, Aug 2023', thetaJA: 310,
    note: 'hFE typical ≈ 200 at 1–10 mA read from Fig. 4 (table: 100–300 at 10 mA). VBE stays an estimate (Fig. 7 temperature labels are inconsistent; VBE(sat) 0.65–0.85 V at 10 mA), Early voltage not specified: unverified',
    units: [{ kind: 'npn', hfe: 200, vbe: [0.65, 10e-3], vaf: 100, pins: { B: '1', E: '2', C: '3' } }] },
  { mpn: '4116R-2-331', description: 'resistor network, 8 × 330 Ω isolated (through-hole DIP)', pkg: 'DIP-16', verified: false,
    note: 'Bourns 4100R-series thick-film network, isolated circuit (-2): resistor n between pins n and 17 − n; 331 = 330 Ω. Unverified: values decoded from the part number, the datasheet was not read for this entry (tolerance, power and temperature coefficient are not modelled). Used by the soldering-track board «Skipping Pattern»',
    units: [1, 2, 3, 4, 5, 6, 7, 8].map((n) => ({ kind: 'res' as const, ohms: 330, pins: { '1': String(n), '2': String(17 - n) } })) },
  { mpn: '2N7000', description: 'N-MOSFET 60 V 200 mA (through-hole)', pkg: 'TO-92', verified: false,
    note: 'Unverified: typical values recalled from the onsemi 2N7000 datasheet, not read for this entry (VGS(th) 0.8–3 V, typ 2.1 V; RDS(on) typ 1.2 Ω at 10 V, ≈1.8 Ω at 4.5 V; Ciss/Crss/Coss ≈ 20/4/11 pF). Pins 1 S, 2 G, 3 D (flat face to the front). Used by the soldering-track board «ESD»',
    units: [{ kind: 'nmos', vth: 2.1, rds: [[10, 1.2], [4.5, 1.8]], body: [0.88, 0.4], caps: [20e-12, 4e-12, 11e-12], pins: { S: '1', G: '2', D: '3' } }] },
  { mpn: 'FP10-5R-331', description: 'resistor network, 5 × 330 Ω isolated (10-lead flat pack, generic)', pkg: 'flat pack, 10 leads', verified: false,
    note: 'Unverified, a generic stand-in, not a manufacturer part number: an isolated network in the 10-lead flat pack of military boards, resistor n between pins n and 11 − n. Used by the soldering-track board «Flat Packs»',
    units: [1, 2, 3, 4, 5].map((n) => ({ kind: 'res' as const, ohms: 330, pins: { '1': String(n), '2': String(11 - n) } })) },
  { mpn: '2N2219A', description: 'NPN 40 V 800 mA (TO-39 metal can)', pkg: 'TO-39', verified: false,
    note: 'Unverified: pins 1 E, 2 B, 3 C per onsemi 2N2219/D (TO-39 case 205AB); hFE is at least 100 at 150 mA there (sources disagree on 75 vs 100), the typical 150 used here at small currents is an estimate, as are VBE 0.65 V at 10 mA and the 100 V Early voltage (not specified). Used by the soldering-track board «TO Packages»',
    units: [{ kind: 'npn', hfe: 150, vbe: [0.65, 10e-3], vaf: 100, pins: { E: '1', B: '2', C: '3' } }] },
  { mpn: '2N3904', description: 'NPN 40 V general purpose (through-hole)', pkg: 'TO-92', verified: false,
    note: 'the through-hole 2N3904; same transistor type as MMBT3904, so hFE ≈ 200 and VBE 0.65 V at 10 mA are taken from the MMBT3904LP entry above (Diodes DS31835). The 2N3904 datasheet itself was not read for this entry: its usual limits are hFE 100–300 at 10 mA and VBE(sat) 0.65–0.85 V. Pins 1 E, 2 B, 3 C (flat face to the front, leads down), the common TO-92 order for this part. Early voltage not specified (100 V default, estimate). Used by the hand-made bike light',
    units: [{ kind: 'npn', hfe: 200, vbe: [0.65, 10e-3], vaf: 100, pins: { E: '1', B: '2', C: '3' } }] },
  { mpn: 'RB160M-60', description: 'Schottky 60 V 1 A', pkg: 'PMDU (SOD-123F class)', verified: true,
    source: 'ROHM RB160M-60 datasheet, 3 pages (revision not printed on the copy read)',
    note: 'VF typical 0.54 V at 1 A from the table; 10 mA and 0.1 A points read from Fig. 1 at 25 °C (about ±15 mV); CJO ≈ the 0 V end of Fig. 3. BV is the 60 V reverse rating, not a measured breakdown',
    units: [{ kind: 'schottky', vf: [[0.265, 0.01], [0.33, 0.1], [0.54, 1]], bv: [60, 1e-3], cj: 200e-12, pins: { K: '1', A: '2' } }] },
  { mpn: 'RB521ES-30', description: 'Schottky 30 V 0.1 A', pkg: 'DSN0603-2 (SMD0603)', verified: true,
    source: 'ROHM RB521ES-30 datasheet, Rev. A, 2016.01',
    note: 'VF points read from the 25 °C VF-IF curve (1 mA, 10 mA, 100 mA; about ±15 mV; the curve ends at 100 mA). The document disagrees with itself at 10 mA: table typical 350 mV (max 370), curve ≈ 315 mV, dispersion map of 30 parts averages 295 mV; the curve is used. CJO ≈ the 0 V end of the VR-Ct curve. IR 1.2 µA typical at 10 V. BV is the 30 V rating; Io is 100 mA. Pin drawing has no numbers: pads net-checked per board',
    units: [{ kind: 'schottky', vf: [[0.215, 0.001], [0.315, 0.01], [0.58, 0.1]], bv: [30, 1e-3], cj: 6.5e-12, pins: { K: '1', A: '2' } }] },
  { mpn: 'NSR1020MW2', description: 'Schottky 20 V 1 A', pkg: 'SOD-323', verified: true,
    source: 'onsemi NSR1020MW2/D Rev. 4, Oct 2025',
    note: 'VF typical only at 10 mA (0.24 V); 0.1 A and 1 A points are the maximum limits. BV is the 20 V reverse rating, not a measured breakdown',
    units: [{ kind: 'schottky', vf: [[0.24, 0.01], [0.33, 0.1], [0.54, 1]], bv: [20, 1e-3], cj: 25e-12, pins: { K: '1', A: '2' } }] },
  { mpn: 'BAT30CWFILM', description: 'dual Schottky 30 V, common cathode', pkg: 'SOT-323', verified: true,
    source: 'ST BAT30 datasheet, DocID12564 Rev 5, Apr 2015', thetaJA: 550,
    note: 'VF typical 0.53 V at 0.3 A from the table (which gives only maxima below that: 0.375 V at 10 mA, 0.5 V at 0.1 A); 10 mA and 0.1 A points read from Fig. 9 at 25 °C (about ±20 mV; 0.1 A taken as 0.39 V, the value a Shockley + RS fit through all three points gives). CJO = 22 pF at 0 V. BV is the 30 V rating. Configuration drawing (anodes bottom, cathode top) matches standard SOT-323 numbering',
    units: [
      { kind: 'schottky', vf: [[0.28, 0.01], [0.39, 0.1], [0.53, 0.3]], bv: [30, 1e-3], cj: 22e-12, pins: { A: '1', K: '3' } },
      { kind: 'schottky', vf: [[0.28, 0.01], [0.39, 0.1], [0.53, 0.3]], bv: [30, 1e-3], cj: 22e-12, pins: { A: '2', K: '3' } },
    ] },
  { mpn: 'SDZT15R6.8', description: 'Zener 6.8 V', pkg: 'SMD0603 (SOD-962)', verified: false,
    source: 'ROHM SDZ series data sheet (SDZ6.8, taping code T15R), Rev. 002, 2017-02-23',
    note: 'VZ checked: 6.47–7.14 V at 5 mA, typical curve ≈ 6.8 V. The datasheet gives no forward-voltage figure, so the forward points stay unverified estimates (was listed as SOD-523)',
    units: [{ kind: 'zener', vf: [[0.7, 0.01], [0.8, 0.1]], bv: [6.8, 5e-3], pins: { K: '1', A: '2' } }] },
  { mpn: 'ESD112-B1-02ELS', description: 'bidirectional ESD protection (ultra-low C)', pkg: 'TSSLP-2', verified: false,
    source: 'Infineon ESD112-B1-02 series data sheet Rev. 1.3, 2013-11-27',
    note: 'line capacitance 0.2 pF typical (matches); breakdown given as 7 V without a typical, so the 9 V estimate is only checked to lie above it',
    units: [{ kind: 'tvs-bi', vf: [], bv: [9, 1e-3], cj: 0.2e-12, pins: { K: '1', A: '2' } }] },
  // ---- parts of the open-hardware demo boards (Jetson Nano baseboard, MNT Reform), 2026-11-19 ----
  // Drafted with `npm run parts -- extract` and checked against the PDFs by hand.
  { mpn: 'BSS138PW', description: 'N-MOSFET 60 V small signal (level shifter)', pkg: 'SOT-323 (SC-70)', verified: true,
    source: 'Nexperia BSS138PW product data sheet Rev. 1, 2 Nov 2010', thetaJA: 415,
    note: 'Pinout 1 G, 2 S, 3 D. θJA typical in free air on the standard footprint (480 max)',
    units: [{ kind: 'nmos', vth: 1.2, rds: [[10, 0.9], [5, 1.0]], body: [0.75, 0.115], caps: [38e-12, 4e-12, 7e-12], pins: { G: '1', S: '2', D: '3' } }] },
  { mpn: 'PMV50ENEA', description: 'N-MOSFET 30 V', pkg: 'SOT-23 (TO-236AB)', verified: true,
    source: 'Nexperia PMV50ENEA product data sheet, 10 Mar 2016 (no revision number printed)', thetaJA: 211,
    note: 'Pinout 1 G, 2 S, 3 D. θJA typical in free air on the standard footprint (245 max)',
    units: [{ kind: 'nmos', vth: 1.5, rds: [[10, 0.030], [4.5, 0.039]], body: [0.7, 1], caps: [276e-12, 42e-12, 55e-12], pins: { G: '1', S: '2', D: '3' } }] },
  { mpn: 'PMV50EPEA', description: 'P-MOSFET −30 V', pkg: 'SOT-23 (TO-236AB)', verified: true,
    source: 'Nexperia PMV50EPEA product data sheet, 30 Jun 2016 (no revision number printed)', thetaJA: 227,
    note: 'Pinout 1 G, 2 S, 3 D. θJA typical in free air on the standard footprint (261 max)',
    units: [{ kind: 'pmos', vth: 2.0, rds: [[10, 0.035], [4.5, 0.049]], body: [0.75, 4], caps: [793e-12, 84e-12, 134e-12], pins: { G: '1', S: '2', D: '3' } }] },
  { mpn: 'IRLML6402', description: 'P-MOSFET −20 V (battery power path)', pkg: 'SOT-23 (Micro3)', verified: true,
    source: 'International Rectifier IRLML6402PbF datasheet, April 28, 2014 (no revision number printed)', thetaJA: 75,
    note: 'Pinout 1 G, 2 S, 3 D. VGS(th) typical 0.55 V; RDS(on) typical 50 mΩ at 4.5 V, 80 mΩ at 2.5 V; body diode only a 1.2 V maximum in the table: 0.76 V at 1 A read from Fig. 7 at 25 °C (about ±20 mV). θJA typical (100 max)',
    units: [{ kind: 'pmos', vth: 0.55, rds: [[4.5, 0.050], [2.5, 0.080]], body: [0.76, 1], caps: [633e-12, 110e-12, 145e-12], pins: { G: '1', S: '2', D: '3' } }] },
  { mpn: 'WPM2015', description: 'P-MOSFET −20 V (battery power path)', pkg: 'SOT-23', verified: true,
    source: 'Will Semiconductor WPM2015 datasheet, Rev. 1.2, Mar 2018', thetaJA: 120,
    note: 'Pinout 1 G, 2 S, 3 D (pin drawing). VGS(th) typical 0.62 V; RDS(on) typical 81 mΩ at 4.5 V, 103 mΩ at 2.5 V; body diode typical 0.74 V at 0.9 A. θJA typical, steady state, mounting a (155 max)',
    units: [{ kind: 'pmos', vth: 0.62, rds: [[4.5, 0.081], [2.5, 0.103]], body: [0.74, 0.9], caps: [534e-12, 54e-12, 62e-12], pins: { G: '1', S: '2', D: '3' } }] },
  { mpn: '1N5819', description: 'Schottky 40 V 1 A (JEDEC 1N5819, SOD-123 versions)', pkg: 'SOD-123', verified: true,
    source: 'Diodes Incorporated 1N5819HW, DS30217 Rev. 21-2, April 2023', thetaJA: 225,
    note: 'One maker\'s 1N5819: boards that name another maker\'s SOD-123 1N5819 (e.g. "1N5819S4") get these numbers too, same JEDEC type, not checked part by part. VF typical 0.32 V at 0.1 A and 0.45 V at 1 A (table); 1 mA and 10 mA read from Fig. 1 at 25 °C (about ±20 mV). CJO ≈ the 0 V end of Fig. 3 (50 pF typical at 4 V). BV is the 40 V rating',
    units: [{ kind: 'schottky', vf: [[0.15, 0.001], [0.225, 0.01], [0.32, 0.1], [0.45, 1]], bv: [40, 1e-3], cj: 100e-12, pins: { K: '1', A: '2' } }] },
  { mpn: 'DMG3415U', description: 'P-MOSFET −20 V (battery power path)', pkg: 'SOT-23', verified: true,
    source: 'Diodes Incorporated DMG3415U, DS31735 Rev. 13-3, March 2018', thetaJA: 139,
    note: 'Pinout 1 G, 2 S, 3 D (board net-checked: gate on VBUS). VGS(th) typical 0.55 V; RDS(on) typical 31 mΩ at 4.5 V, 40 mΩ at 2.5 V (51 mΩ at 1.8 V). Body diode only in Fig. 8 (linear scale): ≈0.62 V at 1 A at 25 °C, read to about ±30 mV. Not recommended for new designs (maker: use DMP2045U)',
    units: [{ kind: 'pmos', vth: 0.55, rds: [[4.5, 0.031], [2.5, 0.040]], body: [0.62, 1], caps: [294e-12, 25e-12, 104e-12], pins: { G: '1', S: '2', D: '3' } }] },
  { mpn: 'B5819W', lcsc: ['C8598'], description: 'Schottky 40 V 1 A', pkg: 'SOD-123', verified: true,
    source: 'MDD (microdiode.com) B5817W thru B5819W, Rev: 2025A4', thetaJA: 160,
    note: 'One maker\'s B5819W (the board\'s BOM names no maker). Table gives only VF maximum (0.60 V at 1 A for B5819W); 0.31 V at 0.1 A and 0.44 V at 1 A read from the 25 °C forward curve (about ±20 mV; the curve starts at 0.1 A). CJO ≈ the 0 V end of the capacitance curve (≈330 pF). BV is the 40 V rating',
    units: [{ kind: 'schottky', vf: [[0.31, 0.1], [0.44, 1]], bv: [40, 1e-3], cj: 330e-12, pins: { K: '1', A: '2' } }] },
  { mpn: 'SI7850DP', description: 'N-MOSFET 60 V', pkg: 'PowerPAK SO-8 single', verified: true,
    source: 'Vishay Si7850DP, doc. 71625 Rev. E, 09-Feb-09', thetaJA: 22,
    note: 'VGS(th) has no typical (1–3 V): midpoint used. Capacitances only as a graph: omitted. Pinout 1-3 S, 4 G, 5-8 D. θJA typical, t ≤ 10 s on 1" × 1" FR4 (58 °C/W steady state)',
    units: [{ kind: 'nmos', vth: 2.0, rds: [[10, 0.018], [4.5, 0.025]], body: [0.85, 3.8], pins: { S: '1', G: '4', D: '5' } }] },
  { mpn: 'SI7461DP', description: 'P-MOSFET −60 V', pkg: 'PowerPAK SO-8 single', verified: true,
    source: 'Vishay Si7461DP, doc. 72567 Rev. J, 13-Jul-15', thetaJA: 18,
    note: 'VGS(th) has no typical (1–3 V): midpoint used. Capacitances only as a graph: omitted. Pinout 1-3 S, 4 G, 5-8 D. θJA typical, t ≤ 10 s on 1" × 1" FR4 (52 °C/W steady state)',
    units: [{ kind: 'pmos', vth: 2.0, rds: [[10, 0.0115], [4.5, 0.015]], body: [0.8, 4.5], pins: { S: '1', G: '4', D: '5' } }] },
  { mpn: 'BAT46WJ', description: 'Schottky 100 V', pkg: 'SOD-323F (SC-90)', verified: true,
    source: 'Nexperia BAT46WJ product data sheet, 1 Oct 2022 (no revision number printed)', thetaJA: 310,
    note: 'VF typicals from the table at 0.1, 10 and 250 mA (50 mA: 0.415 V). Cd is given only as a maximum (39 pF at 0 V): used as CJO. BV is the 100 V reverse rating. Pinout 1 K, 2 A. θJA is the maximum, standard footprint',
    units: [{ kind: 'schottky', vf: [[0.175, 1e-4], [0.315, 0.01], [0.71, 0.25]], bv: [100, 1e-3], cj: 39e-12, pins: { K: '1', A: '2' } }] },
  { mpn: 'SBR0560S1', description: 'super barrier rectifier 60 V 0.5 A', pkg: 'SOD-123', verified: true,
    source: 'Diodes Inc. SBR0560S1, DS31525 Rev. 3-2, Sep 2017', thetaJA: 305,
    note: 'one VF typical in the table (0.44 V at 0.5 A; 0.25 A has a 0.44 V maximum only); 10 mA and 0.1 A points read from Fig. 2 at 25 °C (about ±20 mV). BV is the 60 V rating. θJA on FR-4 with the recommended pad layout',
    units: [{ kind: 'schottky', vf: [[0.207, 0.01], [0.28, 0.1], [0.44, 0.5]], bv: [60, 1e-3], pins: { K: '1', A: '2' } }] },
  { mpn: '1N4148WS', description: 'switching diode 75 V', pkg: 'SOD-323F', verified: true,
    source: 'onsemi 1N4148WS/D Rev. 2, Feb 2017', thetaJA: 500,
    note: 'a JEDEC type made by many vendors: the onsemi sheet is used (the board BOM names no maker). The table gives limits only (VF ≤ 1 V at 10 mA): the 1, 10 and 100 mA points are read from Fig. 2 at 25 °C (about ±20 mV); CJO ≈ the 0 V end of Fig. 1 (table: ≤ 4 pF). BV is the 100 V minimum at 100 µA. Pinout 1 K, 2 A. θJA on the minimum land pad',
    units: [{ kind: 'diode', vf: [[0.6, 1e-3], [0.72, 0.01], [0.95, 0.1]], bv: [100, 1e-4], cj: 0.57e-12, pins: { K: '1', A: '2' } }] },
  { mpn: 'GREEN-56MCD-2MA-2.65V', description: 'green LED (debug)', pkg: '0402', verified: false,
    note: 'Vf/If taken from the part string (no manufacturer part number to look up): unverified',
    units: [{ kind: 'led', vf: [[2.65, 2e-3]], pins: { K: '1', A: '2' } }] },
];

const byKey = new Map<string, DeviceDef>();
for (const d of DEVICES) byKey.set(d.mpn.toUpperCase(), d);

/** Devices from running mods (added, or official entries patched), by MPN; null = none. Looked up
 *  before the built-in library, at every solve (models are fitted then), so a change applies to the
 *  next solve. The solve worker gets the same list with each request (src/spice/solveWorker.ts). */
let overlay: Map<string, DeviceDef> | null = null;
let overlayList: DeviceDef[] = [];

export function setDeviceOverlay(defs: DeviceDef[] | null) {
  overlayList = defs ?? [];
  overlay = defs?.length ? new Map(defs.map((d) => [d.mpn.toUpperCase(), d])) : null;
}
export const deviceOverlay = (): readonly DeviceDef[] => overlayList;
const lookup = (k: string) => overlay?.get(k) ?? byKey.get(k);

/** Finds a device by part number, tolerating ordering suffixes (_SBMS001, -7, -G, T1G, TRPBF, -HF). */
export function findDevice(partNumber: string | undefined): DeviceDef | undefined {
  if (!partNumber) return undefined;
  // packing / ordering codes: Nexperia ",115", Vishay "-T1-E3" / "-T1-GE3", Apple "_SBMS001"
  // a package / reel note after the number: "WPM2015-3/TR", "1N5819S4/SOD123", "BAT54C(SOT23-3)"
  let s = partNumber.trim().toUpperCase().replace(/\s*[/(].*$/, '').replace(/_SBMS\d+$/, '').replace(/-HF$/, '').replace(/,\d{3}$/, '').replace(/(-T\d)?-G?E3$/, '');
  // JEDEC 1N types carry the maker's package code: 1N5819HW, 1N5819S4, 1N4148WS → 1N5819, 1N4148
  if (!lookup(s) && /^1N\d{4}[A-Z]{1,3}\d?(-\d+-?F?)?$/.test(s)) { const base = /^1N\d{4}/.exec(s)![0]; if (lookup(base)) return lookup(base); }
  for (let k = 0; k < 4; k++) {
    const d = lookup(s) ?? (s.length >= 8 ? lookup(s.replace(/[RX]$/, '')) : undefined); // Nexperia reel letter (PMV50EPEAR)
    if (d) return d;
    const next = s.replace(/(TRPBF|T1G|T\d?G|-\d|-G|G|PBF)$/, '');
    if (next === s) break;
    s = next;
  }
  return undefined;
}

export function allDevices(): readonly DeviceDef[] { return DEVICES; }

/** The device a board part is: by the part number in its value, else by its LCSC order code. */
export function deviceOf(c: { label?: string; lcsc?: string }): DeviceDef | undefined {
  return findDevice(c.label) ?? (c.lcsc ? [...overlayList, ...DEVICES].find((d) => d.lcsc?.includes(c.lcsc!)) : undefined);
}

// ---------------- fitting ----------------

export interface MosFit { vto: number; kp: number; lambda: number }

/** Level-1 fit from on-resistance points: 1/Rds = β(|VGS| − VT) in the linear region. */
export function fitMos(s: MosSpec): MosFit {
  const pts = [...s.rds].sort((a, b) => b[0] - a[0]);
  let vt = s.vth, beta = 1 / (pts[0][1] * Math.max(0.3, pts[0][0] - s.vth));
  if (pts.length >= 2) {
    const [v1, r1] = pts[0], [v2, r2] = pts[1];
    const g1 = 1 / r1, g2 = 1 / r2;
    const b = (g1 - g2) / (v1 - v2);
    const t = v1 - g1 / b;
    // accept the on-curve fit when it is physically consistent with the datasheet threshold
    if (b > 0 && t > 0.3 * s.vth && t < 2.5 * s.vth) { beta = b; vt = t; }
  }
  return { vto: s.kind === 'pmos' ? -vt : vt, kp: beta, lambda: 0.01 };
}

export interface DiodeFit { is: number; n: number; rs: number }

/** Shockley fit (IS, N, RS) to forward points. */
export function fitDiode(pts: [number, number][], nDefault = 1.05): DiodeFit {
  const p = [...pts].sort((a, b) => a[1] - b[1]);
  if (!p.length) return { is: 1e-14, n: 1, rs: 0 };
  if (p.length === 1) {
    const n = nDefault;
    return { is: p[0][1] / Math.exp(p[0][0] / (n * VT_300K)), n, rs: 0 };
  }
  const [v1, i1] = p[0], [v2, i2] = p[1];
  // N and IS through the first two points after the RS drop, RS through the last point;
  // iterated so all three hold together (RS alone would lift the middle point)
  let n = 1, is = 1e-14, rs = 0;
  for (let k = 0; k < (p.length >= 3 ? 40 : 1); k++) {
    n = Math.min(3, Math.max(0.9, (v2 - rs * i2 - (v1 - rs * i1)) / (VT_300K * Math.log(i2 / i1))));
    is = i1 / Math.exp((v1 - rs * i1) / (n * VT_300K));
    if (p.length < 3) break;
    const [v3, i3] = p[p.length - 1];
    rs = Math.max(0, (v3 - n * VT_300K * Math.log(i3 / is)) / i3);
  }
  return { is, n, rs };
}

// ---------------- SPICE emission ----------------

/** SPICE diode-model parameters (IS, N, RS, BV, IBV, CJO) fitted to a two-terminal unit. */
export function diodeModelParams(u: DiodeSpec): Record<string, number> {
  const f = fitDiode(u.vf, u.kind === 'led' ? 2 : u.kind === 'schottky' ? 1.05 : 1.0);
  const p: Record<string, number> = { IS: f.is, N: f.n, RS: u.kind === 'led' ? Math.max(f.rs, 10) : f.rs };
  if (u.bv) { p.BV = u.bv[0]; p.IBV = u.bv[1]; }
  if (u.cj) p.CJO = u.cj;
  return p;
}

const num = (v: number) => fmt(v);

function unitCards(u: UnitSpec, k: number, port: (pad: string) => string, models: string[]): string[] {
  const L: string[] = [];
  if (u.kind === 'nmos' || u.kind === 'pmos') {
    const f = fitMos(u);
    const m = `M${k}`;
    // with a datasheet body diode (DB below) the level-1 bulk junction is switched off (IS=0)
    models.push(`.model ${m}_${u.kind} ${u.kind.toUpperCase()}(VTO=${num(f.vto)} KP=${num(f.kp)} LAMBDA=${num(f.lambda)}${u.body ? ' IS=0' : ''})`);
    const d = port(u.pins.D), g = port(u.pins.G), s = port(u.pins.S);
    L.push(`${m} ${d} ${g} ${s} ${s} ${m}_${u.kind}`);
    // Gate bleed: a gate whose driver chip is not simulated would float, and the solver's tiny node
    // shunt to ground would then switch a P-FET fully on. 100 MΩ keeps an undriven gate at its
    // source (off, as an idle driver leaves it) and is negligible wherever the board drives the gate.
    L.push(`RGS${k} ${g} ${s} 100Meg`);
    if (u.body) {
      const bf = fitDiode([[u.body[0] - 0.12, u.body[1] / 100], [u.body[0], u.body[1]]]);
      models.push(`.model DB${k} D(IS=${num(bf.is)} N=${num(bf.n)})`);
      L.push(u.kind === 'nmos' ? `DB${k} ${s} ${d} DB${k}` : `DB${k} ${d} ${s} DB${k}`);
    }
    if (u.caps) {
      const [ciss, crss, coss] = u.caps;
      L.push(`CGS${k} ${g} ${s} ${num(Math.max(1e-15, ciss - crss))}`, `CGD${k} ${g} ${d} ${num(crss)}`, `CDS${k} ${d} ${s} ${num(Math.max(1e-15, coss - crss))}`);
    }
  } else if (u.kind === 'res') {
    L.push(`R${k} ${port(u.pins['1'])} ${port(u.pins['2'])} ${num(u.ohms)}`);
  } else if (u.kind === 'npn' || u.kind === 'pnp') {
    const is = u.vbe[1] / Math.exp(u.vbe[0] / VT_300K);
    models.push(`.model Q${k}_m ${u.kind.toUpperCase()}(IS=${num(is)} BF=${num(u.hfe)} BR=1 VAF=${num(u.vaf ?? 100)})`);
    L.push(`Q${k} ${port(u.pins.C)} ${port(u.pins.B)} ${port(u.pins.E)} Q${k}_m`);
  } else {
    const dU = u as DiodeSpec;
    const a = port(dU.pins.A), kk = port(dU.pins.K);
    if (dU.kind === 'tvs-bi') {
      // two junctions back to back: open until |V| exceeds the breakdown voltage
      const [bv, ibv] = dU.bv ?? [9, 1e-3];
      models.push(`.model DT${k} D(IS=1e-15 N=1 BV=${num(bv - 0.7)} IBV=${num(ibv)}${dU.cj ? ` CJO=${num(dU.cj * 2)}` : ''})`);
      L.push(`DT${k}a ${a} n${k} DT${k}`, `DT${k}b ${kk} n${k} DT${k}`);
    } else {
      const params = Object.entries(diodeModelParams(dU)).map(([key, v]) => `${key}=${num(v)}`).join(' ');
      models.push(`.model D${k}_m D(${params})`);
      L.push(`D${k} ${a} ${kk} D${k}_m`);
    }
  }
  return L;
}

/** PartSpec (subckt) for a device on a footprint, or undefined when a pin is missing. */
export function deviceSpec(dev: DeviceDef, padNames: string[]): PartSpec | undefined {
  const used: string[] = [];
  for (const u of dev.units) for (const p of Object.values(u.pins)) if (!used.includes(p)) used.push(p);
  if (used.some((p) => !padNames.includes(p))) return undefined;
  const port = (pad: string) => `p${used.indexOf(pad) + 1}`;
  const models: string[] = [];
  const cards = dev.units.flatMap((u, i) => unitCards(u, i + 1, port, models));
  const name = dev.mpn.toUpperCase().replace(/[^A-Z0-9]/g, '_');
  return {
    type: 'subckt',
    ports: used,
    spice: [`.subckt ${name} ${used.map(port).join(' ')}`, ...models, ...cards, '.ends'].join('\n'),
    note: `${dev.mpn}: ${dev.description}${dev.verified ? ` (datasheet-verified: ${dev.source})` : ' (estimated values, unverified)'}`,
  };
}

// ---------------- board-level pin resolution ----------------

export interface PadNets { padNames: string[]; netOf: (pad: string) => string | undefined }

const isGround = (n: string | undefined) => !!n && /^(GND|VSS|AGND|DGND|PGND|GND_[A-Z0-9_]+)$/i.test(n);

export interface DiodeConvention {
  /** Which terminal pad "1" is on this board's two-pin diode footprints. */
  pad1: 'A' | 'K';
  votesAnode: number;
  votesCathode: number;
  /** Parts whose evidence contradicts the majority (worth checking by hand). */
  conflicts: string[];
}

/**
 * Infers the board's two-pin diode footprint convention from circuit context:
 * protection / zener / catch diodes tied to ground are reverse-biased in normal operation
 * (cathode on the positive side), LEDs tied to ground conduct (cathode on ground).
 */
export function inferDiodeConvention(parts: { ref: string; kind: DiodeSpec['kind'] | 'unknown'; pads: [string | undefined, string | undefined] }[]): DiodeConvention {
  let a = 0, k = 0;
  const evidence: { ref: string; pad1: 'A' | 'K' }[] = [];
  for (const p of parts) {
    const [n1, n2] = p.pads;
    if (isGround(n1) === isGround(n2) || p.kind === 'tvs-bi') continue;
    const gndOn1 = isGround(n1);
    // LED to ground: cathode on ground. Anything else to ground: anode on ground.
    const pad1: 'A' | 'K' = p.kind === 'led' ? (gndOn1 ? 'K' : 'A') : (gndOn1 ? 'A' : 'K');
    evidence.push({ ref: p.ref, pad1 });
    if (pad1 === 'A') a++; else k++;
  }
  const pad1 = a >= k ? 'A' : 'K';
  return { pad1, votesAnode: a, votesCathode: k, conflicts: evidence.filter((e) => e.pad1 !== pad1).map((e) => e.ref) };
}

/** Pin map for a unit on a concrete footprint, honouring the board diode convention. */
function boardPins(u: UnitSpec, conv: DiodeConvention | undefined, twoPin: boolean, known?: Record<string, string>): UnitSpec {
  if (!twoPin || !('A' in u.pins)) return u;
  // the board's own anode / cathode pads (KiCad, built-in boards) beat any inferred convention
  if (known?.A !== undefined && known.K !== undefined && known.A !== known.K) return { ...u, pins: { A: known.A, K: known.K } } as UnitSpec;
  if (!conv) return u;
  return { ...u, pins: conv.pad1 === 'A' ? { A: '1', K: '2' } : { K: '1', A: '2' } } as UnitSpec;
}

/**
 * Resolves a device onto a footprint: maps pins, then checks the map against the board nets
 * (a MOSFET gate must not share a net with its own drain/source, a BJT base not with its emitter).
 * Returns the PartSpec or the reason it was rejected.
 */
export function resolveDevice(dev: DeviceDef, fp: PadNets, conv?: DiodeConvention, known?: Record<string, string>): { spec?: PartSpec; reason?: string } {
  const twoPin = fp.padNames.length === 2;
  const units = dev.units.map((u) => boardPins(u, conv, twoPin, known));
  for (const u of units) {
    if (u.kind === 'nmos' || u.kind === 'pmos') {
      const g = fp.netOf(u.pins.G), d = fp.netOf(u.pins.D), s = fp.netOf(u.pins.S);
      if (g && (g === d || g === s)) return { reason: `${dev.mpn}: gate pad ${u.pins.G} shares net ${g} with drain/source — pinout mismatch` };
      if (isGround(g)) return { reason: `${dev.mpn}: gate pad ${u.pins.G} on ground — pinout mismatch` };
    } else if (u.kind === 'npn' || u.kind === 'pnp') {
      const b = fp.netOf(u.pins.B), e = fp.netOf(u.pins.E), c = fp.netOf(u.pins.C);
      if (b && b === e) return { reason: `${dev.mpn}: base shares net with emitter — pinout mismatch` };
      if (b && b === c && dev.units.length === 1 && !/diode|sense/i.test(dev.description)) return { reason: `${dev.mpn}: base tied to collector — pinout mismatch` };
    }
  }
  const spec = deviceSpec({ ...dev, units }, fp.padNames);
  return spec ? { spec } : { reason: `${dev.mpn}: footprint lacks pads ${[...new Set(units.flatMap((u) => Object.values(u.pins)))].filter((p) => !fp.padNames.includes(p)).join(',')}` };
}
