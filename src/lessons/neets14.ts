// Lessons of the high-reliability soldering track, from NEETS Module 14 "Introduction to
// Microelectronics" (NAVEDTRA 14186, September 1998; Distribution Statement A: approved for
// public release, distribution unlimited; a US Government work, public domain).
//
// `original` paragraphs are quoted word for word from the module (hyphenation at line ends
// undone) and stay in English as a quote; everything else is ours and translated. Page numbers
// are the module's printed page numbers. The review questions and answers are the module's own.
import { tk } from '../i18n';
import { LESSON_META, type LessonMeta } from './track';
export type { LessonMeta } from './track';

export interface LessonQuestion { ref: string; q: string; a: string; page: string }

/** What a lesson teaches, loaded with the lesson dialog (the bench needs only `LessonMeta`). */
export interface LessonContent {
  scenario: string;
  source: { doc: string; pages: string; url: string };
  /** The rules in short, our words. */
  points: string[];
  /** Key numbers: label (translated) and value as printed, with °C beside °F. */
  numbers: { label: string; value: string }[];
  /** A figure from the module (public/lessons/…), caption translated. */
  figure?: { src: string; caption: string };
  /** A table from the module rebuilt from data (`table-3-1`: conformal coating removal techniques). */
  table?: 'table-3-1';
  /** The module's own paragraphs (English quote). */
  original: string[];
  /** What to do on this board. */
  task: string;
  /** A table from the module rebuilt from data: 3-1 coating removal, 3-2 static charges. */
  table2?: 'table-3-2';
  questions: LessonQuestion[];
}

export type Lesson = LessonMeta & LessonContent;

export const NEETS14_SOURCE = {
  doc: 'NEETS Module 14, Introduction to Microelectronics (NAVEDTRA 14186)',
  url: 'https://archive.org/details/NEETSModules',
};

export const CONTENT: LessonContent[] = [
  {
    scenario: 'hr-solder-flux',
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
    questions: [
      { ref: 'Q11', q: tk('Solder used in electronic repair is normally an alloy of what two elements?'), a: tk('Tin and lead.'), page: '2-20' },
      { ref: 'Q12', q: tk('In soldering, what alloy changes directly from a solid state to a liquid state?'), a: tk('Eutectic.'), page: '2-20' },
      { ref: 'Q13', q: tk('Flux aids in soldering by removing what from surfaces to be soldered?'), a: tk('Oxides.'), page: '2-20' },
      { ref: 'Q14', q: tk('What type(s) of flux should never be used on electronic equipment?'), a: tk('Chloride (acid) and organic.'), page: '2-20' },
    ],
  },
  {
    scenario: 'hr-heat-time',
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
    questions: [
      { ref: 'Q19', q: tk('What is solderability?'), a: tk('The ease with which molten solder wets the surfaces of the metals to be joined.'), page: '3-25' },
      { ref: 'Q20', q: tk('What is the most common source of heat in electronic soldering?'), a: tk('Conductive-type soldering iron.'), page: '3-25' },
      { ref: 'Q21', q: tk('What determines the shape and size of a soldering iron tip?'), a: tk('The type of work to be done.'), page: '3-25' },
      { ref: 'Q23', q: tk('What is the appearance of a properly soldered joint?'), a: tk('Bright and shiny with no cracks or pits.'), page: '3-25' },
    ],
  },
  {
    scenario: 'hr-clean-inspect',
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
    questions: [
      { ref: 'Q10', q: tk('When does most printed circuit board damage occur?'), a: tk('During disassembly or repair.'), page: '3-19' },
      { ref: 'Q15', q: tk('How is oxide removed from pads and component leads?'), a: tk('With a fine abrasive.'), page: '3-22' },
      { ref: 'Q28', q: tk('What are the two final steps of any repair?'), a: tk('Inspect and test.'), page: '3-31' },
    ],
  },
  {
    scenario: 'hr-desoldering',
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
    questions: [
      { ref: 'Q11', q: tk('What procedure involves the use of finely braided copper wire to remove solder?'), a: tk('Wicking.'), page: '3-19' },
      { ref: 'Q12', q: tk('What is the most effective method of solder removal?'), a: tk('Continuous vacuum.'), page: '3-19' },
      { ref: 'Q13', q: tk('When, if at all, should the heat-and-shake or the heat-and-pull methods of solder removal be used?'), a: tk('These methods should not be used.'), page: '3-19' },
    ],
  },
  {
    scenario: 'hr-thermal-shunt',
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
    questions: [
      { ref: 'Q22', q: tk('What term describes a device used to conduct heat away from a component?'), a: tk('A thermal shunt.'), page: '3-25' },
    ],
  },
  {
    scenario: 'hr-skipping-pattern',
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
    questions: [
      { ref: 'Q27', q: tk('How do you prevent excessive heat buildup on an area of a board when soldering multilead components?'), a: tk('Use a skipping pattern.'), page: '3-31' },
      { ref: 'Q24', q: tk('When removing the component, under what circumstances may component leads be clipped?'), a: tk('If the component is known to be defective or if the board may be damaged by normal desoldering.'), page: '3-31' },
    ],
  },
  {
    scenario: 'hr-conductor-repair',
    source: { ...NEETS14_SOURCE, pages: '3-31 – 3-33' },
    points: [
      tk('Examine every conductor for nicks, tears and scratches that have not broken the circuit, as well as for complete breaks.'),
      tk('A nick or scratch over one tenth of the conductor\'s cross-section must be repaired: it reduces the current the conductor can carry.'),
      tk('Four repairs for a crack: a solder bridge (cracks again easily, not high-reliability), a lap-soldered wire (stronger, still not highly reliable), an eyelet in a hole drilled through the crack, and the clinched staple.'),
      tk('The clinched staple is the most reliable repair and is recommended in nearly all cases.'),
    ],
    numbers: [
      { label: tk('Nick that must be repaired'), value: tk('> 1/10 of the cross-section') },
      { label: tk('Staple clinch on the conductor'), value: tk('≥ 1/16 in (1.6 mm) typical') },
      { label: tk('Height over the board'), value: tk('≤ 1/8 in (3.2 mm) incl. solder') },
    ],
    figure: { src: 'lessons/neets14/fig-3-24.png', caption: tk('Figure 3-24. Clinched-staple repair of broken conductor.') },
    original: [
      'Conductor (run) and pad damage is very common. The technician must examine the board for nicks, tears, or scratches that have not broken the circuit, as well as for complete breaks, as shown in figure 3-23. Crack damage may exist as nicks or scratches in the conductor. These nicks or scratches must be repaired if over one-tenth of the cross-sectional area of the conductor is affected as current-carrying capability is reduced. Cracks may also penetrate the conductor.',
      'CRACK REPAIR.—Four techniques are used to repair cracks in printed circuit conductors. One method is to flow solder across the crack to form a solder bridge. This is not a high-reliability repair since the solder in the break will crack easily.',
      'The second method is to lap-solder a piece of wire across the crack. This method produces a stronger bond than a solder bridge; but it is not highly reliable, as the solder may crack.',
      'A third repair technique is to drill a hole through the board where the crack is located and then to install an eyelet in the hole and solder it into place.',
      'The fourth method is to use the clinched-staple method, shown in figure 3-24. It is the most reliable method and is recommended in nearly all cases.',
      'REPLACING DAMAGED OR MISSING CONDUCTORS.—The procedures used to replace damaged or missing conductors are essentially the same as using the clinched-staple method of conductor repair.',
    ],
    task: tk('D1\'s track is cracked through and D2\'s has a deep nick. Repair both with a Clinched staple (K): click the conductor on one side of the damage, then the other. A solder bridge or a jumper wire would make D1 light, but the inspector rejects both here.'),
    questions: [
      { ref: 'Q30', q: tk('What is the preferred method of repairing cracked runs on boards?'), a: tk('Clinched staple.'), page: '3-37' },
      { ref: 'Q29', q: tk('List three causes of damage to printed circuit boards.'), a: tk('Operational failures, repairs by untrained personnel, repair using improper tools, mishandling, improper shipping, packaging, and storage.'), page: '3-37' },
    ],
  },
  {
    scenario: 'hr-conformal-coating',
    source: { ...NEETS14_SOURCE, pages: '3-2 – 3-7' },
    points: [
      tk('Conformal coatings (epoxy, parylene, silicone, polyurethane, varnish, lacquer) protect an assembly from corrosion, moisture and stress.'),
      tk('Before any work, remove the coating from all lead and pad areas of the part, down to the widest point of its body. The whole board is not stripped.'),
      tk('Identify the coating from the documentation (technical manual, drawing); otherwise by its hardness, transparency, thickness and solvent solubility.'),
      tk('Choose the removal method by coating type (Table 3-1) and always try the least damaging one first. Never use a soldering iron: it chars the coating.'),
      tk('After the repair, replace the coating with the same type that was removed.'),
    ],
    numbers: [
      { label: tk('Thin vs thick coating'), value: tk('thick = 0.025 in (0.64 mm) and more') },
      { label: tk('Solvents for thin acrylic'), value: tk('isopropyl alcohol, xylene, trichloroethane') },
    ],
    table: 'table-3-1',
    figure: { src: 'lessons/neets14/fig-3-2.png', caption: tk('Figure 3-2. Hot air jet conformal coating removal.') },
    original: [
      'Conformal coatings are protective material applied to electronic assemblies to prevent damage from corrosion, moisture, and stress. These coatings include epoxy, parylene, silicone, polyurethane, varnish, and lacquer. Coatings are applied in a liquid form; when dry, they exhibit characteristics that improve reliability.',
      'Because of the characteristics that conformal coatings exhibit, they must be removed before any work can be done on printed circuit boards. The coating must be removed from all lead and pad/eyelet areas of the component. It should also be removed to or below the widest point of the component body. Complete removal of the coating from the board is not done.',
      'Methods of coating removal are thermal, mechanical, and chemical. The method of removal depends on the type of coating used. Table 3-1 shows suggested methods of removal of some types. Note that most of the methods are variations of mechanical removal.',
      'The coating material can best be identified through proper documentation; for example, technical manuals and engineering drawings. If this information is not available, the experienced technician can usually determine the type of material by testing the hardness, transparency, thickness, and solvent solubility of the coating. The thermal (heat) properties may also be tested to determine the ease of removal of the coating by heat. The methods of removal discussed here describe the basic concept, but not the step-by-step "how to" procedures.',
      'THERMAL REMOVAL.—Thermal removal consists of using controlled heat through specially shaped tips attached to a handpiece. Soldering irons should never be used for coating removal because the high temperatures will cause the coatings to char, possibly damaging the board materials. Modified tips or cutting blades heated by soldering irons also are not used; they may not have proper heat capacity or allow the hand control necessary for effective removal. Also, the thin plating of the circuit may be damaged by scraping.',
      'HOT-AIR JET REMOVAL.—In principle, the hot-air jet method of coating removal uses controlled, temperature-regulated air to soften or break down the coating, as shown in figure 3-2. By controlling the temperature, flow rate, and shape of the jet, you may remove coatings from almost any workpiece configuration without causing any damage. When you use the hot-air jet, you do not allow it to contact the workpiece surface physically. Delicate work, handled in this manner, permits you to observe the removal process.',
      'CHEMICAL REMOVAL.—Chemical removal uses solvents to break down the coatings. General application is not recommended as the solvent may cause damage to the boards by dissolving the adhesive materials that bond the circuits to the boards. These solvents may also dissolve the POTTING COMPOUNDS (insulating material that completely seals a component or assembly) used on other parts or assemblies. Only thin acrylic coatings (less than 0.025 inch) are readily removable by solvents. Mild solvents, such as ISOPROPYL ALCOHOL, XYLENE, or TRICHLOROETHANE, may be used to remove soluble coatings on a spot basis.',
      'Evaluations show that many tool and technique combinations have proven to be reliable and effective in coating removal; no single method is the best in all situations. When the technician is determining the best method of coating removal to use, the first consideration is the effect that it will have on the equipment.',
      'Once the required repairs have been completed, the conformal coating must be replaced. To ensure the same protective characteristics, you should use the same type of replacement coating as that removed.',
    ],
    task: tk('The drawing says: thin polyurethane coating. Set Bench → Coating removal to Table 3-1\'s first choice for it and take the coating off R2 (U). Reflow R2 pad 2 with flux, clean with Isopropyl (0), then set Bench → Conformal coating to polyurethane and coat R2 again (J).'),
    questions: [
      { ref: 'Q1', q: tk('What material is applied to electronic assemblies to prevent damage from corrosion, moisture, and stress?'), a: tk('Conformal coating.'), page: '3-7' },
      { ref: 'Q2', q: tk('What three methods are used to remove protective material?'), a: tk('Chemical, mechanical, and thermal.'), page: '3-7' },
      { ref: 'Q4', q: tk('Abrasion, cutting, and peeling are examples of what type of protective material removal?'), a: tk('Mechanical.'), page: '3-7' },
      { ref: 'Q5', q: tk('Why should the coating material be replaced once the required repair has been completed?'), a: tk('To ensure protective characteristics are maintained.'), page: '3-7' },
    ],
  },
  {
    scenario: 'hr-esd',
    source: { ...NEETS14_SOURCE, pages: '3-38 – 3-42' },
    points: [
      tk('Static builds up whenever two materials rub or separate; you only feel a discharge from about 3,500–4,000 V. Lower voltages pass unnoticed.'),
      tk('MOS devices are the most sensitive: a MOSFET can be damaged by as little as 35 V. Bipolar transistors and diodes by less than 3,000 V.'),
      tk('Dry air makes it far worse: a worker at the bench carries about 6,000 V at 10–20 % humidity, about 100 V at 65–90 %.'),
      tk('Damage is not always immediate: a device can be degraded and fail early.'),
      tk('Ground yourself before servicing (wrist strap), keep ESD-sensitive parts in their packaging until needed, and hold them by the body, never by the leads.'),
    ],
    numbers: [
      { label: tk('MOS devices damaged from'), value: '35 V' },
      { label: tk('Bipolar transistors and diodes'), value: '< 3 000 V' },
      { label: tk('You feel a discharge from'), value: '3 500 – 4 000 V' },
    ],
    table2: 'table-3-2',
    figure: { src: 'lessons/neets14/fig-3-32.png', caption: tk('Figure 3-32. ESD wrist strap.') },
    original: [
      'Electrostatic discharge (ESD) can destroy or damage many electronic components including integrated circuits and discrete semiconductor devices. Certain devices are more susceptible to ESD damage than others. Because of this, warning symbols are now used to identify ESD-sensitive (ESDS) items (figure 3-31).',
      'Metal oxide semiconductor (MOS) devices are the most susceptible to damage from ESD. For example, an MOS field-effect transistor (MOSFET) can be damaged by a static voltage potential of as little as 35 volts. Commonly used discrete bipolar transistors and diodes (often used in ESD-protective circuits), although less susceptible to ESD, can be damaged by voltage potentials of less than 3,000 electrostatic volts. Damage does not always result in sudden device failure but sometimes results in device degradation and early failure. Table 3-2 clearly shows that electrostatic voltages well in excess of 3,000 volts can be easily generated, especially under low-humidity conditions.',
      '1. Before starting to service equipment, the technician should be grounded to discharge any static electric charge built up on the body. This can be accomplished with the use of a test lead (a single-wire conductor with a series resistance of 1 megohm equipped with alligator clips on each end). One clip end is connected to the grounded equipment frame, and the other clip end is touched with a bare hand. Figure 3-32 shows a more refined ground strap which frees both hands for work.',
      '4. Minimize handling of ESDS devices and assemblies. Keep replacement devices or assemblies, with their connector shorting bars, clips, and so forth, intact in their electrostatic-free packages until needed. Place removed repairable ESD devices or assemblies with their connector shorting bars/clips installed in electrostatic-free packages as soon as they are removed from the equipment. ESDS devices or assemblies are to be transported and stored only in protective packaging.',
      '6. When removing or replacing an ESDS device or assembly in the equipment, hold the device or assembly through the electrostatic-free wrap if possible. Otherwise pick up the device or assembly by its body only. Do not touch component leads, connector pins, or any other electrical connections or paths on boards, even though they are covered by conformal coating.',
    ],
    task: tk('Q1 (a 2N7000 MOSFET) is missing and the air is dry. Put the wrist strap on first (Bench → ESD protection), then fit Q1 from the Parts bin (8), solder its three leads with "+ flux" and clean with Isopropyl (0).'),
    questions: [
      { ref: 'Q35', q: tk('What is the purpose of the wrist ground strap?'), a: tk('To discharge any static charge built up in the body.'), page: '3-46' },
      { ref: 'Q34', q: tk('List two causes of damage to ESD-sensitive electronic components.'), a: tk('ESD, improper stowage, and improper handling.'), page: '3-46' },
    ],
  },
  {
    scenario: 'hr-pad-repair',
    source: { ...NEETS14_SOURCE, pages: '3-33 – 3-34' },
    points: [
      tk('A termination pad that has lifted or is missing is replaced, not bypassed: a replacement pad comes from a scrap circuit board.'),
      tk('Clean the underside of the new pad and the area where it goes, then fasten it with epoxy.'),
      tk('Set an eyelet through the pad before the epoxy cures: it reinforces the pad mechanically and makes good electrical contact for the component.'),
      tk('When the epoxy has cured, lap-solder the new pad to the original run.'),
      tk('A missing or damaged eyelet is always replaced, whatever the damage.'),
    ],
    numbers: [
      { label: tk('Order of work'), value: tk('clean → epoxy pad → eyelet → cure → lap-solder → solder the lead') },
    ],
    figure: { src: 'lessons/neets14/fig-3-25.png', caption: tk('Figure 3-25. Replacement of damaged termination pad.') },
    original: [
      'REPLACING THE TERMINATION PAD.—Many times the termination pad, as well as part of the conductor, is missing on the board. In these cases, a replacement pad is obtained from a scrap circuit board. Refer to figure 3-25 as you study each step.',
      'The underside of the replacement pad and the area where it will be installed is cleaned. An epoxy is used to fasten the replacement pad to the board. An eyelet is installed to reinforce the pad before the epoxy sets and cures. This ensures a good mechanical bond between the board and pad and provides good electrical contact for components. After the epoxy cures, the new pad is lap-soldered to the original run.',
      'REPLACING EYELETS.—Eyelets have been referred to in several places in this topic. Not only are they used for through-the-board terminations, but also to reinforce some types of board repairs. As with any kind of material, eyelets are subject to damage. Eyelets may break, they may be installed improperly, or they may be missing from the equipment. When an eyelet is missing or damaged, regardless of the kind of damage, it should be replaced. The guidelines for the selection and installation of new eyelets are far too complex to explain here. However, they do comprise a large part of the 2M technician\'s training.',
    ],
    task: tk('R2 pad 2 has lifted off the board, so D2 is dark. Replace the pad with Pad repair (E), then solder R2\'s lead in the new eyelet with "+ flux" and clean with Isopropyl (0). A jumper wire around the pad is not a high-reliability repair: the inspector rejects it here.'),
    questions: [
      { ref: 'Q31', q: tk('Damaged or missing termination pads are replaced using what procedure?'), a: tk('Epoxy a replacement pad to the board, set an eyelet, and solder it.'), page: '3-37' },
      { ref: 'Q32', q: tk('How is board damage caused by technicians?'), a: tk('Repairs by untrained personnel and technicians using improper tools.'), page: '3-37' },
    ],
  },
  {
    scenario: 'hr-final-practical',
    source: { ...NEETS14_SOURCE, pages: '3-1, 3-20, 3-26 – 3-28' },
    points: [
      tk('A repaired assembly is restored at least to the original manufacturer\'s standards: parts remounted in the same position, with the same terminations.'),
      tk('Work in order: coating off where needed, desolder cleanly, fit the new part grounded, solder with shunts on sensitive leads, clean, repair the board, coating back on.'),
      tk('The two final steps of any repair: inspect and test.'),
      tk('Every rule of the earlier lessons is graded here.'),
    ],
    numbers: [
      { label: tk('Coating on this card'), value: tk('thin acrylic lacquer') },
      { label: tk('Air'), value: tk('dry (10–20 % relative humidity)') },
    ],
    original: [
      'As you progress in your training as a technician, you will find that the skill and knowledge levels required to maintain electronic systems become more demanding. The increased use of miniature and microminiature electronic circuits, circuit complexity, and new manufacturing techniques will make your job more challenging. To maintain and repair equipment effectively, you will have to duplicate with limited facilities what was accomplished in the factory with extensive facilities. Printed circuit boards that were manufactured completely by machine will have to be repaired by hand.',
      'CAUTION: THIS SECTION IS NOT, IN ANY WAY, TO BE USED BY YOU AS AUTHORIZATION TO ATTEMPT THESE TYPES OF REPAIRS WITHOUT OFFICIAL 2M CERTIFICATION.',
      'The 2M technician should restore the electronic assembly at least to the original manufacturer\'s standards. Parts should always be remounted or reassembled in the same position and with termination methods used by the original manufacturer. This approach ensures a continuation of the original reliability of the system.',
    ],
    task: tk('Q1 burned out on a card coated with thin acrylic, in dry air. Replace Q1 and repair whatever else you find, the way the course taught: every rule is graded. The hints list the order of work if you need it.'),
    questions: [
      { ref: 'Q14', q: tk('To what standards should a technician restore electronic assemblies?'), a: tk('Manufacturer\'s standards.'), page: '3-22' },
      { ref: 'Q36', q: tk('What is the cause of most accidents?'), a: tk('Deviation from prescribed safe operating procedures.'), page: '3-46' },
    ],
  },
];

/** The whole lesson (meta and content) for a board. */
export function lessonFor(scenarioId: string): Lesson | undefined {
  const m = LESSON_META.find((l) => l.scenario === scenarioId), c = CONTENT.find((l) => l.scenario === scenarioId);
  return m && c ? { ...m, ...c } : undefined;
}

export const LESSONS: Lesson[] = LESSON_META.map((m) => lessonFor(m.scenario)!);
