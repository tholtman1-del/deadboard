// Lessons of the high-reliability soldering track, from NEETS Module 14 "Introduction to
// Microelectronics" (NAVEDTRA 14186, September 1998; Distribution Statement A: approved for
// public release, distribution unlimited; a US Government work, public domain).
//
// `original` paragraphs are quoted word for word from the module (hyphenation at line ends
// undone) and stay in English as a quote; everything else is ours and translated. Page numbers
// are the module's printed page numbers. The review questions and answers are the module's own.
import { tk } from '../i18n';
import type { FindingKind } from '../workmanship';

export interface LessonQuestion { ref: string; q: string; a: string; page: string }

export interface Lesson {
  /** The board this lesson belongs to. */
  scenario: string;
  title: string;
  source: { doc: string; pages: string; url: string };
  /** The rules in short, our words. */
  points: string[];
  /** Key numbers: label (translated) and value as printed, with °C beside °F. */
  numbers: { label: string; value: string }[];
  /** A figure from the module (public/lessons/…), caption translated. */
  figure?: { src: string; caption: string };
  /** The module's own paragraphs (English quote). */
  original: string[];
  /** What to do on this board. */
  task: string;
  /** Station setting the board starts with (Bench → Rework). */
  station: 'r350' | 'r350f' | 'r400f';
  /** Inspection rules graded on this board (the others are shown as notes). */
  grades: FindingKind[];
  questions: LessonQuestion[];
}

export const NEETS14_SOURCE = {
  doc: 'NEETS Module 14, Introduction to Microelectronics (NAVEDTRA 14186)',
  url: 'https://archive.org/details/NEETSModules',
};

export const LESSONS: Lesson[] = [
  {
    scenario: 'hr-solder-flux',
    title: tk('Solder and flux'),
    source: { ...NEETS14_SOURCE, pages: '2-19 – 2-20' },
    points: [
      tk('Solder is a tin-lead alloy; the tin share comes first (60/40 = 60 % tin). It bonds by dissolving a little of the metals it joins.'),
      tk('63/37 is eutectic: it goes from solid straight to liquid at one temperature. 60/40 passes through a plastic state, and a joint moved while it cools is damaged.'),
      tk('Oxides form fast on hot metal and stop solder from wetting. Flux removes them and keeps them off while you solder.'),
      tk('Only rosin flux is used on electronics. Chloride (acid) and organic fluxes are corrosive and must never be used.'),
      tk('Feed the solder to the joint, not to the iron. With too little heat the solder never replaces the flux and the joint is poor.'),
    ],
    numbers: [
      { label: tk('Tin melts'), value: '450 °F (232 °C)' },
      { label: tk('Lead melts'), value: '621 °F (327 °C)' },
      { label: tk('63/37 (eutectic)'), value: '361 °F (183 °C)' },
      { label: tk('60/40 (plastic range)'), value: '361–370 °F (183–188 °C)' },
      { label: tk('70/30'), value: '≈ 380 °F (193 °C)' },
    ],
    original: [
      'Solder is a metal alloy used to join two or more metals with a metallic bond. The bonding occurs when molten solder dissolves a small amount of the metals and then cools to form a solid connection. The solder most commonly used in electronic assemblies is an alloy of tin and lead. Tin-lead alloys are identified by their percentage in the solder; the tin content is given first. Solder marked 60/40 is an alloy of 60 percent tin and 40 percent lead. The two most common alloys used in electronics are 60/40 and 63/37.',
      'The melting temperature of tin-lead solder varies depending on the percentage of each metal. Lead melts at a temperature of 621 degrees Fahrenheit, and tin melts at 450 degrees Fahrenheit. Combinations of the two metals melt into a liquid at different temperatures. The 63/37 combination melts into a liquid at 361 degrees Fahrenheit. At this temperature, the alloy changes from a solid directly to a liquid with no plastic or semiliquid state. An alloy with such a sharp changing point is called a EUTECTIC ALLOY.',
      'As the percentages of tin and lead are varied, the melting temperature increases. Alloy of 60/40 melts at 370 degrees Fahrenheit, and alloy of 70/30 melts at approximately 380 degrees Fahrenheit. Alloys, other than eutectic, go through a plastic or semiliquid state in their heating and cooling stages. Solder joints that are disturbed (moved) during the plastic state will result in damaged connections. For this reason, 63/37 solder is the best alloy for electronic work. Solder with 60/40 alloy is also acceptable, but it goes into a plastic state between 361 and 370 degrees Fahrenheit. When soldering joints with 60/40 alloy, you must exercise extreme care to prevent movement of the component during cooling.',
      'Reliable solder connections can only be accomplished with clean surfaces. Using solvents and abrasives to clean the surfaces to be soldered is essential if you are to achieve good solder connections. In almost all cases, however, this cleaning process is insufficient because oxides form rapidly on heated metal surfaces. The rapid formation of oxides creates a nonmetallic film that prevents solder from contacting the metal. Good metal-to-metal contact must be obtained before good soldering joints may take place. Flux removes these surface oxides from metals to be soldered and keeps them removed during the soldering operation. Flux chemically breaks down surface oxides and causes the oxide film to loosen and break free from the metals being soldered.',
      'Soldering fluxes are divided into three classifications or groups: CHLORIDE FLUX (commonly called ACID), ORGANIC FLUX, and ROSIN FLUX. Each flux has characteristics specific to its own group. Chloride fluxes are the most active of the three groups. They are effective on all common metals except aluminum and magnesium. Chloride fluxes, however, are NOT suitable for electronic soldering because they are highly corrosive, electrically conductive, and are difficult to remove from the soldered joint.',
      'Organic fluxes are nearly as active as chloride fluxes, yet are less corrosive and easier to remove than chloride fluxes. Also, these fluxes are NOT satisfactory for electronic soldering because they must be removed completely to prevent corrosion.',
      'Rosin fluxes ARE ideally suited to electronic soldering because of their molecular structure. The most common flux used in electronic soldering is a solution of pure rosin dissolved in suitable solvent. This solution works well with the tin- or solder-dipped metals commonly used for wires, lugs, and connectors. While inert at normal temperatures, rosin fluxes break down and become highly active at soldering temperatures. In addition, rosin is nonconductive.',
      'Most electronic solder, in wire form, is made with one or more cores of rosin flux. When the joint or connection is heated and the wire solder is applied to the joint (not the iron), the flux flows onto the surface of the joint and removes the oxide. This process aids the wetting action of the solder. With enough heat the solder flows and replaces the flux. Insufficient heat results in a poor connection because the solder does not replace the flux.',
    ],
    task: tk('Three joints on the bottom are oxidised. The station starts with a dry tip and no fresh solder. Flux each joint with rosin (Rosin tool, R) or set Bench → Rework to "+ flux", then hold the iron on the joint until the solder flows.'),
    station: 'r350',
    grades: ['dull-joint', 'pad-lifted', 'part-overheated'],
    questions: [
      { ref: 'Q11', q: tk('Solder used in electronic repair is normally an alloy of what two elements?'), a: tk('Tin and lead.'), page: '2-20' },
      { ref: 'Q12', q: tk('In soldering, what alloy changes directly from a solid state to a liquid state?'), a: tk('Eutectic.'), page: '2-20' },
      { ref: 'Q13', q: tk('Flux aids in soldering by removing what from surfaces to be soldered?'), a: tk('Oxides.'), page: '2-20' },
      { ref: 'Q14', q: tk('What type(s) of flux should never be used on electronic equipment?'), a: tk('Chloride (acid) and organic.'), page: '2-20' },
    ],
  },
  {
    scenario: 'hr-heat-time',
    title: tk('Heat and time'),
    source: { ...NEETS14_SOURCE, pages: '3-23 – 3-24' },
    points: [
      tk('Wetting needs a clean, oxide-free surface: the molten solder leaves a continuous, permanent film.'),
      tk('Tip size and power must heat the joint\'s mass to the solder\'s melting point quickly. A big mass needs a bigger tip; a small one, a smaller tip.'),
      tk('Bring the joint to about 550 °F (288 °C) fast and hold it there briefly: the soldering action is done in 2 or 3 seconds.'),
      tk('Put the iron on the point of greatest mass. Melt a little solder between tip and joint first: this heat bridge makes the tip part of the joint.'),
      tk('A good joint is bright and shiny, has no cracks or pits, covers the pad and feathers to a thin edge.'),
    ],
    numbers: [
      { label: tk('Best joint temperature'), value: '≈ 550 °F (288 °C)' },
      { label: tk('Soldering action'), value: tk('2–3 s') },
    ],
    figure: { src: 'lessons/neets14/fig-3-17.png', caption: tk('Figure 3-17. Preferred solder joint (full fillet).') },
    original: [
      'SOLDERABILITY.—As the solder interacts with the base metals, a good metallurgical bond is obtained and metallic continuity is established. This continuity is good for electrical and heat conductivity as well as for strength. Solderability measures the ease with which molten solder wets the surfaces of the metals being joined. WETTING means the molten solder leaves a continuous permanent film on the metal surface. Wetting can only be done properly on a clean surface. All dirt and grease must be removed and no oxide layer must exist on the metal surface. Using abrasives and/or flux to remove these contaminants produces highly solderable surfaces.',
      'HEAT SOURCE.—The soldering process requires sufficient heat to produce alloy- or metal-solvent action. Heat sources include CONDUCTIVE, RESISTIVE, CONVECTIVE, and RADIANT types. The type of heat source most commonly used is the conductive-type soldering iron. Delicate electronic assemblies require that the thermal characteristics of a soldering iron be carefully balanced and that the iron and tip be properly matched to the job. Successful soldering depends on the combination of the iron tip temperature, the capacity of the iron to sustain temperature, the time of iron contact with the joint, and the relative mass and heat transfer characteristics of the object being soldered.',
      'SELECTION OF PROPER TIP.—The amount of heat and how it is controlled are critical factors to the soldering process. The tip of the soldering iron transfers heat from the iron to the work. The shape and size of the tip are mainly determined by the type of work to be performed. The tip size and the wattage of the element must be capable of rapidly heating the mass to the melting temperature of solder.',
      'After the proper tip is selected and attached to the iron, the operator may control the heat by using the variable-voltage control. The most efficient soldering temperature is approximately 550 degrees Fahrenheit. Ideally, the joint should be brought to this temperature rapidly and held there for a short period of time. In most cases the soldering action should be completed within 2 or 3 seconds. When soldering a small-mass connection, control the heat by decreasing the size of the tip.',
      'APPLICATION OF SOLDER AND SOLDERING IRON TIP.—Before solder is applied to the joint, the surface temperature of the parts being soldered is increased above the solder melting point. In general, the soldering iron is applied to the point of greatest mass at the connection. This increases the heat in the parts to be soldered. Solder is then applied to a clean, fluxed, and properly heated surface. When properly applied, the solder melts and flows without direct contact with the heat source and provides a smooth, even surface that feathers to a thin edge.',
      'Molten solder forms between the tip and the joint, creating a heat bridge or thermal linkage. This heat bridge causes the tip to become part of the joint and allows rapid heat transfer. A solder (heat) bridge is formed by melting a small amount of solder at the junction of the tip and the mass being soldered as the iron is applied. After the tip makes contact with the lead and the pad and after the heat bridge is established, the solder is applied with a wiping motion to form the solder bond. The completed solder joint should be bright and shiny in appearance. It should have no cracks or pits, and the solder should cover the pad. Examples of preferred solder joints are shown in figure 3-17. They are referred to as full fillet joints.',
    ],
    task: tk('Two joints are dull: one in the ground pour, one on a thin track. Make both in 2–3 s of heat each, without lifting a pad. Watch the Thermal view: if the pour joint stays below 288 °C, the station needs more heat (Bench → Rework).'),
    station: 'r350f',
    grades: ['dull-joint', 'pad-lifted', 'part-overheated'],
    questions: [
      { ref: 'Q19', q: tk('What is solderability?'), a: tk('The ease with which molten solder wets the surfaces of the metals to be joined.'), page: '3-25' },
      { ref: 'Q20', q: tk('What is the most common source of heat in electronic soldering?'), a: tk('Conductive-type soldering iron.'), page: '3-25' },
      { ref: 'Q21', q: tk('What determines the shape and size of a soldering iron tip?'), a: tk('The type of work to be done.'), page: '3-25' },
      { ref: 'Q23', q: tk('What is the appearance of a properly soldered joint?'), a: tk('Bright and shiny with no cracks or pits.'), page: '3-25' },
    ],
  },
  {
    scenario: 'hr-clean-inspect',
    title: tk('Clean and inspect'),
    source: { ...NEETS14_SOURCE, pages: '3-19 – 3-20, 3-24 – 3-25' },
    points: [
      tk('Most board damage happens while parts are taken off: always inspect the board afterwards.'),
      tk('Look for scorching, measling (light spots in the laminate), cracks, overheated or cracked parts, and nicked, lifted or delaminated pads and conductors.'),
      tk('No joint may be covered by loose or splattered solder: it can cause shorts.'),
      tk('Clean termination areas before soldering: old solder off, oxides off with a fine abrasive, then solvent and a lint-free tissue.'),
      tk('After soldering, remove all flux residue with solvent: 99.5 % ethyl alcohol, then 99.5 % isopropyl alcohol.'),
    ],
    numbers: [
      { label: tk('Cleaning solvent'), value: tk('99.5 % ethyl or isopropyl alcohol') },
    ],
    original: [
      'When desoldering is complete, the workpiece must undergo a careful physical inspection for damage to the circuit board and the remaining components. The technician should also check the board for scorching or charring caused by component failure. Sometimes MEASLING is present. Measling is the appearance of light-colored spots. It is caused by small areas of fiberglass strands that have been damaged by epoxy overcuring, heat, abrasion, or internal moisture. No cracks or breaks should be visible in the board material. None of the remaining components should be cracked, broken, or show signs of overheating. The solder joints should be of good quality and not covered by loose or splattered solder, which may cause shorts. The technician should examine the board for nicked, cracked, lifted, or delaminated conductors and lifted or delaminated pads.',
      'The termination areas on the board and the component leads are thoroughly cleaned to remove oxide, old solder, and other contaminants. Old or excess solder is removed by one of the desoldering techniques explained earlier in this topic. A fine abrasive, such as an oil-free typewriter eraser, is used to remove oxides. This is not necessary if the area has just been desoldered. All areas to be soldered are cleaned with a solvent and then dried with a lint-free tissue to remove cleaning residue.',
      'When a solder joint is completed, solvent must be used to remove all flux residue. The two most highly recommended solvents, in the order of their effectiveness, are 99.5 percent pure ethyl alcohol and 99.5 percent pure isopropyl alcohol.',
    ],
    task: tk('D1 and D2 are dark. Find the dull joint and the solder splash, repair both, then clean every reflowed joint with Isopropyl (0). The inspector rejects splattered solder and flux residue.'),
    station: 'r350f',
    grades: ['dull-joint', 'pad-lifted', 'part-overheated', 'flux-residue', 'loose-solder'],
    questions: [
      { ref: 'Q10', q: tk('When does most printed circuit board damage occur?'), a: tk('During disassembly or repair.'), page: '3-19' },
      { ref: 'Q15', q: tk('How is oxide removed from pads and component leads?'), a: tk('With a fine abrasive.'), page: '3-22' },
      { ref: 'Q28', q: tk('What are the two final steps of any repair?'), a: tk('Inspect and test.'), page: '3-31' },
    ],
  },
];

export function lessonFor(scenarioId: string): Lesson | undefined {
  return LESSONS.find((l) => l.scenario === scenarioId);
}
