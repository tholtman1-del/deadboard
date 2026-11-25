// Flat packs (NEETS Module 14 pp. 3-29 – 3-31; T.O. 00-25-259 18-5.4.3, 18-5.7, 18-6.5, 18-6.6):
// planar parts whose ribbon leads are lap-soldered onto lands. Removal is point to point: each lead
// is heated until its solder is completely molten and lifted off its land (lifting before complete
// melt damages the land). A replacement comes with straight leads in a holder: they are tinned,
// formed (two distinct bends) and cut to length before it is fitted. Universal: any part with the
// `flatpack` body.
import { t } from './i18n';
import type { Component } from './types';

export const isFlatPack = (c: Component) => c.body.shape === 'flatpack';

/** Land length and lead width (mm): typical for a 0.050 in pitch flat pack (estimates). */
export const FP_GEOM = { land: 2.0, leadW: 0.4 } as const;

/** Solder already on a fresh flat-pack joint before any is fed: the pretinned land and tinned lead (ideal fills, estimate). */
export const FP_PRETIN = 0.3;

/** How a fitted flat pack's leads were prepared: formed with two bends, length on the land (share of its length). */
export interface LeadForm { formed: boolean; len: number }

/** Lifts one lead off its land: freed if its solder was completely molten, else the land tears off with it. */
export function liftLead(c: Component, pi: number, molten: boolean): 'lifted' | 'damaged' | 'already' {
  if (c.state.leadsLifted?.includes(pi)) return 'already';
  c.state.leadsLifted = [...(c.state.leadsLifted ?? []), pi].sort((a, b) => a - b);
  if (!c.state.cold.includes(pi)) c.state.cold = [...c.state.cold, pi].sort((a, b) => a - b);
  if (molten) return 'lifted';
  if (!c.state.lifted?.includes(pi)) c.state.lifted = [...(c.state.lifted ?? []), pi].sort((a, b) => a - b);
  return 'damaged';
}

/** Every lead is off its land: the part comes away with tweezers. */
export const allLifted = (c: Component) => c.pads.every((_, i) => c.state.leadsLifted?.includes(i));

export type Verdict = 'target' | 'acceptable' | 'defect';
/** The T.O.'s flat-pack lead forming and termination checks (18-6.6). */
export function judgeLeadForm(f: LeadForm): { verdict: Verdict; what: string }[] {
  if (!f.formed) return [{ verdict: 'defect', what: t('Leads not formed: no two distinct bends, the leads do not lie on the lands') }];
  const out: { verdict: Verdict; what: string }[] = [{ verdict: 'target', what: t('Leads formed with two distinct bends') }];
  out.push(f.len > 1 ? { verdict: 'defect', what: t('The toe of the lead overhangs the land') }
    : f.len < FP_GEOM.leadW / FP_GEOM.land ? { verdict: 'defect', what: t('Lead on the land shorter than the lead width') }
    : f.len >= 0.5 && f.len <= 0.8 ? { verdict: 'target', what: t('Lead length 50–80 % of the land length') }
    : { verdict: 'acceptable', what: t('Lead length outside 50–80 % of the land, toe on the land') });
  return out;
}
