// The soldering course's guide: what the course is, bench safety, a glossary and a quick reference.
// Loaded with the lesson text (a lazy chunk). The safety precautions are the 2M manual's (T.O.
// 00-25-259, WP 003 00) and NEETS Module 14's own (pp. 3-40 – 3-46), quoted in `original`; the
// short points, the glossary definitions and the reference rows are ours, each with its source.
import { tk } from '../i18n';
import type { DrillDiagram } from '../ui/lesson-diagrams';

export type GuideTab = 'about' | 'safety' | 'glossary' | 'reference' | 'drill' | 'review';
export type DrillVerdict = 'target' | 'acceptable' | 'defect';
export interface DrillItem { id: DrillDiagram; prompt: string; answer: DrillVerdict; why: string; src: string }

/** Visual workmanship inspection drill: Target, Acceptable, or Defect per T.O. 00-25-259. */
export const INSPECTION_DRILL: DrillItem[] = [
  { id: 'fillet-target', prompt: tk('Plated hole 100 % filled, concave fillet covers the pad, lead outline still visible.'), answer: 'target', why: tk('Target: 100 % vertical hole fill, full pad coverage and a concave fillet with the lead visible.'), src: 'T.O. 07-6.20' },
  { id: 'fillet-excess', prompt: tk('Plated hole filled, but a convex solder ball hides the lead outline.'), answer: 'defect', why: tk('Defect (excessive solder): too much solder hides the parts being joined and must be removed and resoldered.'), src: 'T.O. 05-4.2.10' },
  { id: 'fillet-icicle', prompt: tk('Concave fillet on top, sharp solder point sticking out from the bottom pad.'), answer: 'defect', why: tk('Defect (solder projection / icicle): comes from reflowing without flux or lifting the iron before the solder; reflow with flux.'), src: 'T.O. 05-4.2.12' },
  { id: 'fillet-under', prompt: tk('Plated-through hole only half filled vertically, meniscus sunk inside the barrel.'), answer: 'defect', why: tk('Defect (insufficient solder): vertical fill of a plated-through hole must be 100 %.'), src: 'T.O. 07-6.20' },
  { id: 'wire-acc', prompt: tk('Turret wire wrapped 180°, cut flush; bare wire clearance is 1.6 D (between 1 D and 2 D).'), answer: 'acceptable', why: tk('Acceptable: target clearance is 1 wire diameter, and up to 2 wire diameters is acceptable without touching the terminal.'), src: 'T.O. 08-6.4' },
  { id: 'wire-touch', prompt: tk('Turret wire wrapped 180°, cut flush; insulation touches the outside edge of the post.'), answer: 'defect', why: tk('Defect: wire insulation must never contact the terminal or solder fillet.'), src: 'T.O. 08-6.4' },
  { id: 'fp-target', prompt: tk('Flat-pack gull-wing lead rests on 65 % of its land length, toe inside the land.'), answer: 'target', why: tk('Target: flat-pack lead length on the land is 50–80 % of the land length, with the toe on the land.'), src: 'T.O. 18-6.6' },
  { id: 'fp-overhang', prompt: tk('Flat-pack gull-wing lead covers the whole land and its toe overhangs the end.'), answer: 'defect', why: tk('Defect: the toe of a flat-pack lead must never overhang the land.'), src: 'T.O. 18-6.6' },
  { id: 'clinch-iso', prompt: tk('Through-hole lead on an isolated pad (no run) bent flat to a 90° full clinch.'), answer: 'defect', why: tk('Defect: a lead terminating on an isolated pad may not be fully clinched; use a 45° semi-clinch.'), src: 'T.O. 07-6.18' },
  { id: 'clinch-semi', prompt: tk('Through-hole lead on an isolated pad bent 45° (semi-clinch), cut to one pad diameter.'), answer: 'target', why: tk('Target: a 45° semi-clinch of one pad diameter may be used on an isolated pad.'), src: 'T.O. 07-6.17' },
];

export const GUIDE_ABOUT = {
  points: [
    tk('Nineteen lessons on high-reliability soldering and board repair, after the US Navy\'s 2M training: NEETS Module 14 (1998), the 2M workmanship manual T.O. 00-25-259 (2013), the 2M certification manual (2011) and NEETS Module 4 for wiring. All are US Government works in the public domain.'),
    tk('Each lesson: a brief (what you will be able to do, the rules, the numbers, the original text), a board to repair on a realistic bench, an inspection against the manuals\' workmanship standards, and the textbook\'s review questions to check yourself.'),
    tk('A lesson counts as passed when the board works and the workmanship passes inspection. The final practical is modelled on the 2M miniature recertification test.'),
    tk('Where the 1998 textbook and the 2013 manual differ (solvents, the nick limit, the coating removal table, the 60/40 range), the lesson says so and the current manual is graded.'),
    tk('The course covers the practical repair chapters. NEETS 14\'s history of electronics and the Navy\'s maintenance administration are left out.'),
    tk('It teaches the procedures; it does not certify anyone. The textbook\'s own caution: these pages are no authorization to attempt such repairs without official 2M certification.'),
  ],
};

export const GUIDE_SAFETY = {
  points: [
    tk('Wear safety glasses: solder spatters, clipped leads fly, alcohol splashes, and milling throws fibreglass dust.'),
    tk('A plugged-in iron is hot. Keep it in its stand when you are not using it, never swing it to shake off solder, and never hold the work in your hand: use pliers or a clamp.'),
    tk('Solder contains lead. No eating, drinking or smoking at the bench, hands away from your mouth, and wash them after soldering. Dispose of dross, used wick and wipes as hazardous waste.'),
    tk('Soldering fumes can cause occupational asthma: do not breathe them directly. Strip wire thermally only with good ventilation (the insulation\'s fumes are toxic), and ventilate when you coat or use solvents.'),
    tk('Isopropyl alcohol is flammable: let joints cool completely before you clean them, and keep it away from heat, sparks, flame and synthetic cloth. Some coatings are flammable too; never spray a warm or powered board.'),
    tk('Work on dead equipment only: de-energise it before you remove or fit a card. The ESD bench is for dead equipment; the strap that grounds you would make you part of a live circuit.'),
    tk('Wear a grounded wrist strap at the ESD bench. Its cord has 0.8–2 MΩ in series so that the current through you stays at 5 mA or less.'),
    tk('Most accidents come from not following the prescribed safe procedures.'),
  ],
  original: [
    'Electronic equipment must be de- energized during removal and installation of CCAs. Personnel are required to wear a properly grounded ESD wrist strap and cord while working in or around the Electrostatic Protected Areas (EPA). Isopropyl alcohol is flammable; do not use in the presence of sparks, heat, flame, or synthetic cloth. Soldering handpieces (e.g., soldering irons, solder extractors, hot air jets) produce extreme heat—exercise care when these tools are out of their stands. Avoid direct inhalation of fumes during a soldering operation because there is a possibility these fumes could cause occupational asthma. (T.O. 00-25-259, 03-3)',
    'The lead contained in solder is a source of lead oxide, which the human body cannot dissipate (accumulation of lead oxide in the body over a period of years can result in a serious health hazard). Contact with solder by holding in the mouth, smoking, or eating during or immediately after soldering is a potential means of ingesting trace amounts of lead oxide. Avoid oral contact with hands during or immediately after solder operations. Wash hands following any solder operation. Wear approved personal protective equipment (PPE) whenever pouring or handling molten metals or corrosive liquids and solids; and cutting, drilling, grinding, milling, chipping and other dust and debris producing operations. Use adequate ventilation during thermal wire stripping operations because wire insulation may emit toxic fumes during thermal stripping. Some conformal coating materials are flammable; do not use in the presence of open flames or sparks. Avoid inhalation of conformal coating fumes, vapors, or spray. (T.O. 00-25-259, 03-3)',
    'WARNING: USE APPROVED SAFETY EYEWEAR WHEN PERFORMING THIS PROCEDURE. COMPLY WITH ALL LOCAL REQUIREMENTS FOR PPE. (every procedure of T.O. 00-25-259) Eating, drinking, use of tobacco products, and use of personal grooming items at a 2M workstation is prohibited. (03-4.4.9) A 2M WORKSTATION SHALL NOT BE USED TO PERFORM MAINTENANCE ON ENERGIZED ELECTRONIC EQUIPMENT. (03-4.5)',
    'To avoid burns, always assume that a plugged-in soldering iron is HOT. Never rest a heated iron anywhere but in a holder provided for that purpose. Never use an excessive amount of solder. Drippings can cause serious skin or eye burns and can cause short circuits. Do not swing an iron to remove excess solder. Hold small soldering jobs with pliers or a suitable clamping device to avoid burns. Never hold the work in your hand. Do not solder electronic equipment unless the equipment is electrically disconnected from the power supply circuit. (NEETS 14, pp. 3-44 – 3-45)',
    'There must not be any energized equipment placed on the conductive ESD work surface. An ESD work area is for "dead" equipment ONLY. (NEETS 14, p. 3-42) The ESD wrist strap and cord shall have a total resistance of 800,000Ω to 2 MΩ based on limiting current for personnel to 5mA. (T.O. 00-25-259, WP 004 00)',
    'Most accidents are preventable. Accidents don\'t happen without a cause. Most accidents are the result of not following prescribed safe operating procedures. (NEETS 14, p. 3-43)',
  ],
};

/** The course's terms, in our words, each with where the course teaches it. */
export const GLOSSARY: { term: string; def: string; where: string }[] = [
  { term: tk('Acid brush'), def: tk('A small stiff brush used with isopropyl alcohol to scrub flux residue off a joint.'), where: 'T.O. 07-5.4' },
  { term: tk('Anti-wicking tweezers'), def: tk('Tweezers that grip a wire while it is tinned, so the solder does not run up the strands under the insulation.'), where: 'T.O. WP 002 00' },
  { term: tk('Birdcaging'), def: tk('Strands of a stranded wire spreading apart when it is formed. Tinning the end prevents it.'), where: 'T.O. 08-5.4' },
  { term: tk('Buttercoat'), def: tk('A thin layer of epoxy over the exposed fibre weave at the end of a laminate repair.'), where: 'T.O. 11-5.2' },
  { term: tk('CCA'), def: tk('Circuit card assembly: a printed board with its parts on it.'), where: 'T.O.' },
  { term: tk('Clinched lead'), def: tk('A lead bent over its pad on the solder side to hold the part: fully (90°) or semi (45°).'), where: 'NEETS 14 p. 3-9' },
  { term: tk('Conformal coating'), def: tk('A protective film over an assembly. The five main kinds: acrylic (AR), epoxy (ER), silicone (SR), polyurethane (UR), parylene (XY).'), where: 'T.O. 06-4.2' },
  { term: tk('Continuous vacuum'), def: tk('Motorised desoldering: steady suction through a heated tip, which clears a plated hole.'), where: 'NEETS 14 p. 3-18' },
  { term: tk('Eutectic alloy'), def: tk('An alloy that turns from solid to liquid at one temperature, with no plastic range: 63/37 tin-lead at 183 °C.'), where: 'NEETS 14 p. 2-19' },
  { term: tk('ESD, ESDS'), def: tk('Electrostatic discharge; an ESD-sensitive device or assembly.'), where: 'NEETS 14 p. 3-38' },
  { term: tk('Eyelet'), def: tk('A copper tube set in a hole to reinforce it or a repair. Roll-, funnel- or flat-set; flat-set in 2M work.'), where: 'NEETS 14 p. 3-7' },
  { term: tk('Fillet'), def: tk('The solder between a lead and its pad or terminal. The target is concave, with the lead\'s outline still visible.'), where: 'T.O. 05-6.1' },
  { term: tk('Flux'), def: tk('A chemical that removes oxides and keeps them off while you solder. Only rosin flux is used on electronics.'), where: 'NEETS 14 p. 2-20' },
  { term: tk('Gold embrittlement'), def: tk('Gold dissolved into the solder, making the joint brittle. Gold-plated parts are tinned twice to prevent it.'), where: 'T.O. 05-7.3' },
  { term: tk('Heat bridge'), def: tk('A little molten solder between the tip and the joint that carries the heat across.'), where: 'NEETS 14 p. 3-24' },
  { term: tk('Interfacial connection'), def: tk('A connection between the circuitry on one side of a board and the other: a plated-through hole, an eyelet, a turret.'), where: 'NEETS 14 p. 3-7' },
  { term: tk('Isolated pad'), def: tk('A pad with no conductor leading from it. Its lead gets a semi-clinch, not a full one.'), where: 'T.O. 07-6.18' },
  { term: tk('Land'), def: tk('The flat pad a surface-mount lead is lap-soldered to.'), where: 'T.O. 18-5.4.3' },
  { term: tk('Lap solder'), def: tk('Joining two flat conductors by overlapping them and sweating them together.'), where: 'NEETS 14 p. 3-31' },
  { term: tk('Measling'), def: tk('Light spots in the laminate where glass fibres have separated from the resin: from heat, abrasion or moisture.'), where: 'NEETS 14 p. 3-19' },
  { term: tk('Multilayer board'), def: tk('A board with conductor layers inside it. Staple, eyelet and pad repairs are not done on one in miniature (2M) work.'), where: 'T.O. 12-5.5' },
  { term: tk('Plastic range'), def: tk('The temperatures at which an alloy is part solid, part liquid. A joint moved then is damaged.'), where: 'NEETS 14 p. 2-20' },
  { term: tk('Plated-through hole'), def: tk('A hole with copper plated on its wall, joining both sides of the board.'), where: 'NEETS 14 p. 1-37' },
  { term: tk('Potting compound'), def: tk('Insulating material that completely seals a part or an assembly.'), where: 'NEETS 14 p. 3-6' },
  { term: tk('Seal'), def: tk('Where a lead leaves the part\'s body. A bend starts at least two lead diameters from it.'), where: 'NEETS 14 p. 3-20' },
  { term: tk('Shotgun or skipping pattern'), def: tk('Heating the pins of a multilead part in an order that never takes two neighbours in a row.'), where: 'NEETS 14 p. 3-26; T.O. WP 002 00' },
  { term: tk('Sweat joint'), def: tk('A paper-thin film of solder left between a lead and the wall of its hole after desoldering.'), where: 'NEETS 14 p. 3-17' },
  { term: tk('Thermal shunt'), def: tk('A metal clip on a lead that draws heat off before it reaches a sensitive part\'s body.'), where: 'NEETS 14 p. 3-23' },
  { term: tk('Terminals'), def: tk('Above-the-board terminations: pin and turret, bifurcated (fork), hook, pierced (tab) and solder cup.'), where: 'NEETS 14 p. 3-11' },
  { term: tk('Wetting'), def: tk('Molten solder spreading as a continuous, permanent film on clean metal.'), where: 'NEETS 14 p. 3-23' },
  { term: tk('Wicking'), def: tk('Solder drawn along stranded wire under the insulation by capillary action. Desoldering wick uses the same effect on purpose.'), where: 'T.O. WP 002 00' },
];

/** The numbers the course uses most, grouped, with sources. */
export const REFERENCE: { title: string; rows: { label: string; value: string; src: string }[] }[] = [
  {
    title: tk('Solder alloys'),
    rows: [
      { label: tk('63/37 (eutectic)'), value: '361 °F (183 °C)', src: 'T.O. 05-7.1.1' },
      { label: tk('60/40 (plastic range)'), value: '361–375 °F (183–191 °C)', src: 'T.O. 05-7.1.1' },
      { label: tk('SAC305, lead-free'), value: '423–428 °F (217–220 °C)', src: tk('datasheets') },
    ],
  },
  {
    title: tk('Heat'),
    rows: [
      { label: tk('Tip to start with, tin-lead'), value: '600 °F (316 °C)', src: 'T.O. 05-5.3.4' },
      { label: tk('Tip to start with, low mass / SMT'), value: '550 °F (288 °C)', src: 'T.O. 05-5.3.4' },
      { label: tk('Solder melts within'), value: tk('2–3 s (cups: 2 s, 4 s when wicking out)'), src: 'T.O. 05-5.3.4, 09-5.3' },
      { label: tk('Best joint temperature'), value: '≈ 550 °F (288 °C)', src: 'NEETS 14 p. 3-23' },
    ],
  },
  {
    title: tk('Static'),
    rows: [
      { label: tk('MOS devices damaged from'), value: '35 V', src: 'NEETS 14 p. 3-39' },
      { label: tk('Bipolar transistors and diodes'), value: '< 3 000 V', src: 'NEETS 14 p. 3-39' },
      { label: tk('Worker at the bench, dry / humid air'), value: '6 000 / 100 V', src: tk('NEETS 14 Table 3-2') },
      { label: tk('Wrist strap and cord'), value: tk('0.8–2 MΩ, ≤ 5 mA'), src: 'T.O. WP 004 00' },
    ],
  },
  {
    title: tk('Wires on terminals'),
    rows: [
      { label: tk('Insulation clearance'), value: tk('1 wire diameter; up to 2'), src: 'T.O. 08-6.4' },
      { label: tk('Wrap (turret, hook)'), value: tk('180°; never overlapping itself'), src: 'T.O. 08-6.5' },
      { label: tk('Pierced tab'), value: tk('through the eye, ≥ 90°'), src: 'T.O. 08-6.7' },
      { label: tk('Cut end beyond the terminal'), value: tk('≤ 1 conductor diameter'), src: 'T.O. 08-6.5' },
      { label: tk('Solder cup fill'), value: tk('100 %; at least 75 %'), src: 'T.O. 09-6.1' },
    ],
  },
  {
    title: tk('Repairs'),
    rows: [
      { label: tk('Nick that must be repaired'), value: tk('> 20 % of the cross-section'), src: 'T.O. 12-6.1' },
      { label: tk('Staple wire, hole distance'), value: tk('50–80 % of the width; ≥ 2 widths from the damage'), src: 'T.O. 12-6.3' },
      { label: tk('Lap overlap'), value: tk('≥ 2 conductor widths'), src: 'T.O. 12-6.4' },
      { label: tk('Surface patch'), value: tk('75 % deep, 50 % undercut, bevel 1 thickness, 5 % overfill'), src: 'T.O. 11-5.2' },
      { label: tk('Full clinch'), value: tk('90°, 1 pad diameter, along the conductor'), src: 'T.O. 07-6.18' },
      { label: tk('Flat pack lead on the land'), value: tk('50–80 % of the land; ≥ 1 lead width out before the first bend'), src: 'T.O. 18-6.6' },
      { label: tk('Lead bend from the seal'), value: tk('≥ 2 lead diameters, about 90°'), src: 'NEETS 14 p. 3-20' },
    ],
  },
];
