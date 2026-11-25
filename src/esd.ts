// Electrostatic discharge (NEETS Module 14 pp. 3-38 – 3-42). Static builds up on a technician
// (Table 3-2: far more in dry air); touching a sensitive device's leads without a ground strap
// discharges it through the device. MOS devices are damaged from 35 V, bipolar transistors and
// diodes below 3,000 V; the damage may be immediate or latent (degradation, early failure).
import { tk } from './i18n';
import type { Component } from './types';
import { findDevice } from './spice/devicelib';
import { isHeatSensitive } from './rework';

export type Humidity = 'low' | 'high';

/** Table 3-2: typical measured static charges (volts) at low (10–20 %) and high (65–90 %) relative humidity. */
export const TABLE_3_2: { item: string; low: number; high: number }[] = [
  { item: tk('Walking across carpet'), low: 35000, high: 1500 },
  { item: tk('Walking over vinyl floor'), low: 12000, high: 250 },
  { item: tk('Worker at bench'), low: 6000, high: 100 },
  { item: tk('Vinyl envelopes for work instructions'), low: 7000, high: 600 },
  { item: tk('Poly bag picked up from bench'), low: 20000, high: 1200 },
  { item: tk('Work chair padded with urethane foam'), low: 18000, high: 1500 },
];

/** The charge on a technician working at the bench, by humidity (Table 3-2, "worker at bench"). */
export const benchCharge = (h: Humidity) => (h === 'low' ? 6000 : 100);

/** MOS devices: damaged from 35 V (p. 3-39). */
export const MOS_ESD_V = 35;
/** Bipolar transistors and diodes: damaged by "less than 3,000 electrostatic volts" (p. 3-39). */
export const BIPOLAR_ESD_V = 3000;
/**
 * A MOS gate ruptured by a discharge leaks to its source. The textbook gives no value: this
 * resistance is an estimate (low enough to hold the gate off through a 1 kΩ drive).
 */
export const GATE_RUPTURE_OHMS = 100;

/** The voltage that damages this part, or null when it is not ESD-sensitive. */
export function esdThreshold(c: Component): { volts: number; mos: boolean; gate?: string; source?: string } | null {
  const dev = findDevice(c.label ?? c.lcsc);
  const mos = dev?.units.find((u) => u.kind === 'nmos' || u.kind === 'pmos');
  if (mos && 'G' in mos.pins) return { volts: MOS_ESD_V, mos: true, gate: mos.pins.G, source: mos.pins.S };
  if (isHeatSensitive(c)) return { volts: BIPOLAR_ESD_V, mos: false };
  return null;
}

export type EsdOutcome = 'not-sensitive' | 'protected' | 'safe' | 'gate-ruptured' | 'latent';

/**
 * A sensitive part handled (fitted) by a technician: grounded, nothing happens; otherwise the
 * bench charge discharges through it. Over the threshold a MOS gate ruptures (leaks to the source);
 * a bipolar part is degraded without a visible effect. Marks the part for the inspector.
 */
export function handle(c: Component, grounded: boolean, humidity: Humidity): EsdOutcome {
  const th = esdThreshold(c);
  if (!th) return 'not-sensitive';
  if (grounded) return 'protected';
  c.state.esdHandled = true;
  if (benchCharge(humidity) < th.volts) return 'safe';
  c.state.esdDamaged = true;
  if (th.mos && th.gate && th.source) {
    c.state.leak = { ohms: GATE_RUPTURE_OHMS, a: th.gate, b: th.source };
    return 'gate-ruptured';
  }
  return 'latent';
}
