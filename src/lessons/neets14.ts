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
  {
    scenario: 'hr-desoldering',
    title: tk('Desoldering'),
    source: { ...NEETS14_SOURCE, pages: '3-15 – 3-19' },
    points: [
      tk('Most board damage happens during desoldering. First find out what kind of joint holds the part.'),
      tk('Solder wick (braid soaked in flux) is for surface joints only: it cannot beat the capillary pull of a plated-through hole.'),
      tk('A manual vacuum plunger never removes all the solder: in a plated hole the lead stays stuck to the wall by a paper-thin sweat joint, and the jolt can lift the pad.'),
      tk('Continuous (motorized) vacuum is the most reliable: heat the joint, apply vacuum when the solder melts and stir the lead so no sweat joint forms.'),
      tk('Heat-and-shake and heat-and-pull are never used: they splatter solder, damage plated holes and lift pads.'),
    ],
    numbers: [
      { label: tk('Solder wick'), value: tk('surface joints, unsupported holes') },
      { label: tk('Manual plunger'), value: tk('leaves a sweat joint in plated holes') },
      { label: tk('Continuous vacuum'), value: tk('plated holes: the hole comes out clean') },
    ],
    figure: { src: 'lessons/neets14/fig-3-10.png', caption: tk('Figure 3-10. Solder wicking.') },
    original: [
      'Most of the damage in printed circuit board repair occurs during disassembly or component removal. More specifically, much of this damage occurs during the desoldering process. To remove components for repair or replacement, the technician must first determine the type of joint that is used to connect the component to the board. The technician may then determine the most effective method for desoldering these connections.',
      'Three generally accepted methods of solder connection removal involve the use of SOLDER WICK, a MANUALLY CONTROLLED VACUUM PLUNGER, or a motorized solder extractor using CONTINUOUS VACUUM AND/OR PRESSURE. Of all the extraction methods currently in use, continuous vacuum is the most versatile and reliable. Desoldering becomes a routine operation and the quantity and quality of desoldering work increases with the use of this technique.',
      'SOLDER WICKING.—In this technique, finely stranded copper wire or braiding (wick) is saturated with liquid flux. Most commercial wick is impregnated with flux; the liquid flux adds to the effectiveness of the heat transfer and should be used whenever possible. The wick is then applied to a solder joint between the solder and a heated soldering iron tip, as shown in figure 3-10. The combination of heat, molten solder, and air spaced in the wick creates a capillary action and causes the solder to be drawn into the wick.',
      'This method should be used to remove surface joints only, such as those found on single-sided and double-sided boards without plated-through holes or eyelets. It can also remove excessive solder from flat surfaces and terminals. The reason is that the capillary action of the wicking is not strong enough to overcome the surface tension of the molten solder or the capillary action of the hole.',
      'MANUALLY CONTROLLED VACUUM PLUNGER.—The second method of removing solder involves a manually controlled and operated, one-shot vacuum source. This vacuum source uses a plunger mechanism with a heat resistant orifice. The vacuum is applied through this orifice. Figure 3-11 shows the latest approved, manual-type desoldering tool. This technique involves melting the solder joint and inserting the solder-extractor tip into the molten solder over the soldering iron tip. The plunger is then released, creating a short pulse of vacuum to remove the molten solder. Although this method offers a positive vacuum, rather than the capillary force of the wicking method, it still has limited application. This method will not remove 100 percent of the solder and may cause circuit pad lifting because of the extremely high vacuum generated and the jarring caused by the plunger action.',
      'Because 100 percent of the solder cannot be removed, the extraction method is not usually successful with the plated-through solder joint. The component lead in a plated-through hole joint usually rests against the side wall of the hole. Even though most of the molten solder is removed by a vacuum, the small amount of solder left between the lead and side walls causes a SWEAT JOINT to form. A sweat joint is a paper-thin solder joint formed by a minute amount of solder remaining on the conductor lead surfaces.',
      'Motorized Vacuum Method.—In the motorized vacuum method, the heated tip is applied to the solder joint. When melted solder is observed, the vacuum is activated by the technician causing the solder to be withdrawn from the joint and deposited into the chamber. If the lead is preclipped, it may also be drawn into a holding chamber. To prevent SWEATING (reforming a solder joint) to the side walls of the plated-through hole joint, the lead is "stirred" with the tip while applying the vacuum. This permits cool air to flow into and around the lead and side walls causing them to cool.',
      'The techniques that have been described represent the successful methods of desoldering components. As mentioned at the beginning of this section, the 2M technician must decide which method is best suited for the type of solder joint. Two commonly used but unacceptable methods of solder removal are heat-and-shake and heat-and-pull methods.',
      'In the heat-and-shake method, the solder joint is melted and then the molten solder is shaken from the connection. In some cases, the shaking action may include striking the assembly against a surface to shake the molten solder out of the joint. This method should NEVER be used because all the solder may not be removed and the solder may splatter over other areas of the board. In addition, striking the board against a surface can lead to broken boards, damaged components, and lifted pads or conductors.',
      'The heat-and-pull method uses a soldering iron or gang-heater blocks to melt individual or multiple solder joints. The component leads are pulled when the solder is melted. This method has many shortcomings because of potential damage and should NOT be attempted. Heating blocks are patterned to suit specific configurations; but when used on multiple-lead connections, the joints may not be uniformly heated. Uneven heating results in plated-through hole damage, pad delamination, or blistering. Damage can also result when lead terminations are pulled through the board.',
    ],
    task: tk('R2 burned open. Clear both of its plated holes (Solder extractor, X; Bench → Extractor), take it out, fit a new 330 Ω resistor from the Parts bin (8), solder both leads with "+ flux" (flux-cored solder), clean with Isopropyl (0).'),
    station: 'r350f',
    grades: ['dull-joint', 'pad-lifted', 'part-overheated', 'flux-residue', 'loose-solder'],
    questions: [
      { ref: 'Q11', q: tk('What procedure involves the use of finely braided copper wire to remove solder?'), a: tk('Wicking.'), page: '3-19' },
      { ref: 'Q12', q: tk('What is the most effective method of solder removal?'), a: tk('Continuous vacuum.'), page: '3-19' },
      { ref: 'Q13', q: tk('When, if at all, should the heat-and-shake or the heat-and-pull methods of solder removal be used?'), a: tk('These methods should not be used.'), page: '3-19' },
    ],
  },
  {
    scenario: 'hr-thermal-shunt',
    title: tk('Thermal shunt'),
    source: { ...NEETS14_SOURCE, pages: '3-23' },
    points: [
      tk('Diodes, transistors and ICs are heat-sensitive: their leads carry the iron\'s heat into the body.'),
      tk('Before heat is applied, clip a thermal shunt on the lead, between the joint and the body. It conducts heat away from the part.'),
      tk('Copper is the usual shunt metal (large heat content, high conductivity); aluminium where the clip\'s weight could damage the part.'),
      tk('The most common shunt is a spring clip, like an alligator clip, that fastens onto the lead.'),
    ],
    numbers: [
      { label: tk('2N3904 storage temperature (onsemi datasheet)'), value: '−55 … +150 °C' },
    ],
    figure: { src: 'lessons/neets14/fig-3-16.png', caption: tk('Figure 3-16. Thermal shunt.') },
    original: [
      'Before heat is applied to solder the joint, a thermal shunt is attached to sensitive component leads (diodes, transistors, and ICs). A thermal shunt is used to conduct heat away from the component. Because of its large heat content and high thermal conductivity, copper is usually used to make thermal shunts. Aluminum also has good conductivity but a smaller heat content; it is also used to conduct heat, especially if damage from the physical weight of the clamp is possible. Many types, shapes, and sizes of thermal shunts are available. The most commonly used is the clamp design; this is a spring clip (similar to an alligator clip) that easily fastens onto the part lead, as shown in figure 3-16.',
    ],
    task: tk('Q1\'s base and collector joints are dull. Clip a Thermal shunt (S) on each of those leads before you heat them, then hold the iron on each joint. The inspector checks that every transistor lead you heated had its shunt.'),
    station: 'r350f',
    grades: ['dull-joint', 'pad-lifted', 'part-overheated', 'flux-residue', 'no-shunt'],
    questions: [
      { ref: 'Q22', q: tk('What term describes a device used to conduct heat away from a component?'), a: tk('A thermal shunt.'), page: '3-25' },
    ],
  },
  {
    scenario: 'hr-skipping-pattern',
    title: tk('Skipping pattern'),
    source: { ...NEETS14_SOURCE, pages: '3-26 – 3-27, 3-30' },
    points: [
      tk('A DIP or any multilead part is always desoldered and soldered in a skipping pattern: never heat two pads next to each other one after the other.'),
      tk('Skipping reduces heat accumulation in one area of the board and with it the chance of damage.'),
      tk('Solder each joint as quickly as possible, with only as much heat as necessary.'),
      tk('Before lifting a DIP, make sure every lead is completely free. A part known to be bad may have its leads clipped first.'),
      tk('Finish every repair by inspecting the workmanship and testing the card.'),
    ],
    numbers: [
      { label: tk('DIP pin pitch'), value: '0.1 in (2.54 mm)' },
      { label: tk('A skipping pattern for pins 1–4'), value: '2 → 4 → 1 → 3' },
    ],
    original: [
      'The removal of soldered-in DIPs without conformal coatings is essentially the same as the removal of discrete components, except that a skipping pattern is always used. A skipping pattern is one that skips from pad to pad, never heating two pads next to each other. This reduces heat accumulation and reduces the chance of damage to the board. Of course, many more leads should be desoldered before the part can be removed. Special care must be exercised to make sure all leads are completely free before an attempt is made to lift the part off the board. If the part is known to be faulty or if normal removal may damage the board, then the leads should be clipped. Once this has been done, desoldering can be done from both sides of the board. After the clipped leads have been desoldered, they can be removed with tweezers or pliers.',
      'The steps for replacing a soldered-in DIP are similar to those for replacing a plug-in DIP. Once the part is in position, it is soldered using the same standard used by the manufacturer, or as close to that standard as is possible with the available equipment. The joints should be soldered as quickly as possible using only as much heat as is necessary using a skipping pattern. The repaired card should then be visually inspected for defects in workmanship, and testing of the card should take place. Once the successful repair has been accomplished, a conformal coating should be applied to the work area.',
      'LAP-SOLDERING CONNECTIONS.—Before a connection is lap-soldered, the solder pads are cleaned and pretinned and the component leads are tinned. This is particularly important if they are gold plated. The IC is properly positioned on the pad areas, and the soldering process is a matter of "sweating" the two conductors together. When multilead components, such as ICs, are soldered, a skipping pattern is used to prevent excessive heat buildup in a single area of the board or component. When soldering is completed, all solder connections are thoroughly cleaned. All joints should be inspected and tested. The standards of workmanship are more specific for flat-pack installation.',
    ],
    task: tk('RN1 pins 1, 2, 3 and 4 are dull, side by side. Remake all four in a skipping pattern (for example 2, 4, 1, 3), holding the iron until each one flows, then clean with Isopropyl (0). The inspector checks the order you heated them in.'),
    station: 'r350f',
    grades: ['dull-joint', 'pad-lifted', 'part-overheated', 'flux-residue', 'skip-pattern'],
    questions: [
      { ref: 'Q27', q: tk('How do you prevent excessive heat buildup on an area of a board when soldering multilead components?'), a: tk('Use a skipping pattern.'), page: '3-31' },
      { ref: 'Q24', q: tk('When removing the component, under what circumstances may component leads be clipped?'), a: tk('If the component is known to be defective or if the board may be damaged by normal desoldering.'), page: '3-31' },
    ],
  },
];

export function lessonFor(scenarioId: string): Lesson | undefined {
  return LESSONS.find((l) => l.scenario === scenarioId);
}
