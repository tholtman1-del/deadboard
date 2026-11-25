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

export interface LessonQuestion {
  ref: string; q: string; a: string; page: string;
  /** NEETS module the question is from (default 14) */ module?: 4;
  /** `to`: a self-check of ours on the 2M manual (T.O. 00-25-259), `page` its paragraph; not the textbook's own question. */
  source?: 'to';
}

/** What a lesson teaches, loaded with the lesson dialog (the bench needs only `LessonMeta`). */
export interface LessonContent {
  scenario: string;
  source: { doc: string; pages: string; url: string };
  /** What the learner can do after the lesson (ours, short). */
  objectives: string[];
  /** The rules in short, our words. */
  points: string[];
  /** Key numbers: label (translated) and value as printed, with °C beside °F. */
  numbers: { label: string; value: string }[];
  /** A figure from the module (public/lessons/…), caption translated. */
  figure?: { src: string; caption: string; /** more views of the same figure, side by side */ more?: string[] };
  /** A coating removal table rebuilt from data: NEETS 14 Table 3-1 or the 2M manual's Table 06-3. */
  table?: 'table-3-1' | 'table-06-3';
  /** The module's own paragraphs (English quote). */
  original: string[];
  /** What to do on this board. */
  task: string;
  /** A table from the module rebuilt from data: 3-1 coating removal, 3-2 static charges. */
  table2?: 'table-3-2';
  /** The 2M manual's coating identification flowchart (Figure 06-1), rebuilt from data. */
  flow?: 'figure-06-1';
  /** A diagram of ours drawn from the lesson's numbers (src/ui/lesson-diagrams.ts). */
  diagram?: 'phase' | 'fillets' | 'shotgun' | 'patch';
  questions: LessonQuestion[];
}

export type Lesson = LessonMeta & LessonContent;

/** The 2M workmanship manual (Distribution A). */
export const TO_SOURCE = {
  doc: 'NAVAIR 01-1A-23 / T.O. 00-25-259, 2M Electronic Assembly Repair (Rev 4, 2013)',
  url: 'https://www.robins.af.mil/Portals/59/12%20April_TO%2000-25-259.pdf',
};

/** The 2M certification manual (Distribution A): its Appendix C is the miniature practical. */
export const CERT_SOURCE = {
  doc: 'NAVSEA TE000-AA-MAN-010/2M, Certification Manual for the 2M MTR Program (Rev 2, 2011)',
  url: 'https://www.navsea.navy.mil/Portals/103/Documents/MARMC/2MMTR%20Certification%20Manual%20SEP2011.pdf',
};

export const NEETS14_SOURCE = {
  doc: 'NEETS Module 14, Introduction to Microelectronics (NAVEDTRA 14186)',
  url: 'https://archive.org/details/NEETSModules',
};

export const CONTENT: LessonContent[] = [
  {
    scenario: 'hr-solder-flux',
    source: { ...NEETS14_SOURCE, pages: '2-19 – 2-20' },
    objectives: [
      tk('Tell a eutectic alloy from one with a plastic range, and why it matters while a joint cools.'),
      tk('Make an oxidised joint wet with rosin flux, and recognise the icicle a dry reflow leaves.'),
    ],
    points: [
      tk('Solder is a tin-lead alloy; the tin share comes first (60/40 = 60 % tin). It bonds by dissolving a little of the metals it joins.'),
      tk('63/37 is eutectic: it goes from solid straight to liquid at one temperature. 60/40 passes through a plastic state, and a joint moved while it cools is damaged.'),
      tk('Oxides form fast on hot metal and stop solder from wetting. Flux removes them and keeps them off while you solder.'),
      tk('Only rosin flux is used on electronics. Chloride (acid) and organic fluxes are corrosive and must never be used.'),
      tk('Reflowing a joint with no flux at all also draws the solder out into a point, an icicle: a defect that must be reflowed with flux (the Navy\'s 2M workmanship manual, T.O. 00-25-259, 05-4.2.12; "T.O." in this course always means that manual).'),
      tk('Feed the solder to the joint, not to the iron. With too little heat the solder never replaces the flux and the joint is poor.'),
      tk('This course solders tin-lead, as the Navy manuals do: 63/37 and 60/40 are the only alloys they authorise. Most electronics made today is lead-free (SAC305 melts at 217–220 °C, 423–428 °F), DEADBOARD\'s other boards too: it needs more heat.'),
      tk('Solder contains lead. Do not eat, drink or smoke at the bench, keep your hands away from your mouth, and wash them after soldering (T.O. 03-3).'),
    ],
    numbers: [
      { label: tk('Tin melts'), value: '450 °F (232 °C)' },
      { label: tk('Lead melts'), value: '621 °F (327 °C)' },
      { label: tk('63/37 (eutectic)'), value: '361 °F (183 °C)' },
      { label: tk('60/40 (plastic range)'), value: tk('361–375 °F (183–191 °C); NEETS (1998) printed 370 °F') },
      { label: tk('70/30 (plastic range)'), value: '361–380 °F (183–193 °C)' },
      { label: tk('SAC305, lead-free (other boards)'), value: '423–428 °F (217–220 °C)' },
    ],
    diagram: 'phase',
    original: [
      'Solder is a metal alloy used to join two or more metals with a metallic bond. The bonding occurs when molten solder dissolves a small amount of the metals and then cools to form a solid connection. The solder most commonly used in electronic assemblies is an alloy of tin and lead. Tin-lead alloys are identified by their percentage in the solder; the tin content is given first. Solder marked 60/40 is an alloy of 60 percent tin and 40 percent lead. The two most common alloys used in electronics are 60/40 and 63/37.',
      'The melting temperature of tin-lead solder varies depending on the percentage of each metal. Lead melts at a temperature of 621 degrees Fahrenheit, and tin melts at 450 degrees Fahrenheit. Combinations of the two metals melt into a liquid at different temperatures. The 63/37 combination melts into a liquid at 361 degrees Fahrenheit. At this temperature, the alloy changes from a solid directly to a liquid with no plastic or semiliquid state. An alloy with such a sharp changing point is called a EUTECTIC ALLOY.',
      'As the percentages of tin and lead are varied, the melting temperature increases. Alloy of 60/40 melts at 370 degrees Fahrenheit, and alloy of 70/30 melts at approximately 380 degrees Fahrenheit. Alloys, other than eutectic, go through a plastic or semiliquid state in their heating and cooling stages. Solder joints that are disturbed (moved) during the plastic state will result in damaged connections. For this reason, 63/37 solder is the best alloy for electronic work. Solder with 60/40 alloy is also acceptable, but it goes into a plastic state between 361 and 370 degrees Fahrenheit. When soldering joints with 60/40 alloy, you must exercise extreme care to prevent movement of the component during cooling.',
      'Reliable solder connections can only be accomplished with clean surfaces. Using solvents and abrasives to clean the surfaces to be soldered is essential if you are to achieve good solder connections. In almost all cases, however, this cleaning process is insufficient because oxides form rapidly on heated metal surfaces. The rapid formation of oxides creates a nonmetallic film that prevents solder from contacting the metal. Good metal-to-metal contact must be obtained before good soldering joints may take place. Flux removes these surface oxides from metals to be soldered and keeps them removed during the soldering operation. Flux chemically breaks down surface oxides and causes the oxide film to loosen and break free from the metals being soldered.',
      'Soldering fluxes are divided into three classifications or groups: CHLORIDE FLUX (commonly called ACID), ORGANIC FLUX, and ROSIN FLUX. Each flux has characteristics specific to its own group. Chloride fluxes are the most active of the three groups. They are effective on all common metals except aluminum and magnesium. Chloride fluxes, however, are NOT suitable for electronic soldering because they are highly corrosive, electrically conductive, and are difficult to remove from the soldered joint.',
      'Organic fluxes are nearly as active as chloride fluxes, yet are less corrosive and easier to remove than chloride fluxes. Also, these fluxes are NOT satisfactory for electronic soldering because they must be removed completely to prevent corrosion.',
      'Rosin fluxes ARE ideally suited to electronic soldering because of their molecular structure. The most common flux used in electronic soldering is a solution of pure rosin dissolved in suitable solvent. This solution works well with the tin- or solder-dipped metals commonly used for wires, lugs, and connectors. While inert at normal temperatures, rosin fluxes break down and become highly active at soldering temperatures. In addition, rosin is nonconductive.',
      'The solder alloy Sn63Pb37 is the eutectic composition for tin and lead, meaning it transitions from a solid to a liquid, or a liquid to a solid, at a single temperature of 361°F [183°C]. The solder alloy Sn60Pb40, is not eutectic, and transitions from a solid to a liquid between 361-375°F [183-191°C]. (T.O. 00-25-259, 05-7.1.1; SN63PB37 AND SN60PB40 ARE THE ONLY SOLDER ALLOYS AUTHORIZED FOR 2M REPAIR.)',
      'The lead contained in solder is a source of lead oxide, which the human body cannot dissipate (accumulation of lead oxide in the body over a period of years can result in a serious health hazard). Contact with solder by holding in the mouth, smoking, or eating during or immediately after soldering is a potential means of ingesting trace amounts of lead oxide. Avoid oral contact with hands during or immediately after solder operations. Wash hands following any solder operation. (T.O. 00-25-259, 03-3)',
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
    objectives: [
      tk('Tell the tip\'s temperature from the joint\'s, and set a station for tin-lead work.'),
      tk('Solder a joint in a ground pour in 2–3 s: heat bridge, preheating, the right tip.'),
    ],
    points: [
      tk('Wetting needs a clean, oxide-free surface: the molten solder leaves a continuous, permanent film.'),
      tk('Tip size and power must heat the joint\'s mass to the solder\'s melting point quickly. A big mass needs a bigger tip; a small one, a smaller tip.'),
      tk('Bring the joint to about 550 °F (288 °C) fast and hold it there briefly: the soldering action is done in 2 or 3 seconds.'),
      tk('That is the joint, not the tip. The 2M manual starts the tip at 600 °F (316 °C) for tin-lead work, at 550 °F (288 °C) for low-mass work such as surface mount; the solder should melt within two to three seconds.'),
      tk('No melt in that time: clean the tip and the joint first, then preheat the board or use a bigger tip on a heavy ground plane. Turn the tip up only after that (T.O. 05-5.3.4).'),
      tk('Look after the tip: wipe it on a damp sponge before each joint and leave it coated with solder (seasoned) when it goes back in its stand. A dry, oxidised tip does not pass heat.'),
      tk('Put the iron on the point of greatest mass. Melt a little solder between tip and joint first: this heat bridge makes the tip part of the joint.'),
      tk('A good joint is bright and shiny, has no cracks or pits, covers the pad and feathers to a thin edge.'),
    ],
    numbers: [
      { label: tk('Best joint temperature (NEETS)'), value: '≈ 550 °F (288 °C)' },
      { label: tk('Tip to start with, tin-lead (T.O.)'), value: '600 °F (316 °C)' },
      { label: tk('Tip to start with, low mass / SMT (T.O.)'), value: '550 °F (288 °C)' },
      { label: tk('Soldering action'), value: tk('2–3 s') },
    ],
    figure: { src: 'lessons/neets14/fig-3-17.png', caption: tk('Figure 3-17. Preferred solder joint (full fillet).') },
    original: [
      'SOLDERABILITY.—As the solder interacts with the base metals, a good metallurgical bond is obtained and metallic continuity is established. This continuity is good for electrical and heat conductivity as well as for strength. Solderability measures the ease with which molten solder wets the surfaces of the metals being joined. WETTING means the molten solder leaves a continuous permanent film on the metal surface. Wetting can only be done properly on a clean surface. All dirt and grease must be removed and no oxide layer must exist on the metal surface. Using abrasives and/or flux to remove these contaminants produces highly solderable surfaces.',
      'HEAT SOURCE.—The soldering process requires sufficient heat to produce alloy- or metal-solvent action. Heat sources include CONDUCTIVE, RESISTIVE, CONVECTIVE, and RADIANT types. The type of heat source most commonly used is the conductive-type soldering iron. Delicate electronic assemblies require that the thermal characteristics of a soldering iron be carefully balanced and that the iron and tip be properly matched to the job. Successful soldering depends on the combination of the iron tip temperature, the capacity of the iron to sustain temperature, the time of iron contact with the joint, and the relative mass and heat transfer characteristics of the object being soldered.',
      'SELECTION OF PROPER TIP.—The amount of heat and how it is controlled are critical factors to the soldering process. The tip of the soldering iron transfers heat from the iron to the work. The shape and size of the tip are mainly determined by the type of work to be performed. The tip size and the wattage of the element must be capable of rapidly heating the mass to the melting temperature of solder.',
      'After the proper tip is selected and attached to the iron, the operator may control the heat by using the variable-voltage control. The most efficient soldering temperature is approximately 550 degrees Fahrenheit. Ideally, the joint should be brought to this temperature rapidly and held there for a short period of time. In most cases the soldering action should be completed within 2 or 3 seconds. When soldering a small-mass connection, control the heat by decreasing the size of the tip.',
      'APPLICATION OF SOLDER AND SOLDERING IRON TIP.—Before solder is applied to the joint, the surface temperature of the parts being soldered is increased above the solder melting point. In general, the soldering iron is applied to the point of greatest mass at the connection. This increases the heat in the parts to be soldered. Solder is then applied to a clean, fluxed, and properly heated surface. When properly applied, the solder melts and flows without direct contact with the heat source and provides a smooth, even surface that feathers to a thin edge.',
      'A starting point of 600°F is recommended for general soldering procedures using tin-lead solder. A starting point of 550°F is recommended for low thermal mass soldering operations, such as surface mount soldering. Preheating the CCA will allow for lower soldering iron tip temperatures. Solder melt should occur in two to three seconds after heat is applied. IF SOLDER MELT DOES NOT OCCUR IN TWO TO THREE SECONDS AFTER HEAT IS APPLIED, ENSURE THE TIP AND SOLDER JOINT ARE CLEAN BEFORE INCREASING THE TEMPERATURE OF THE TIP. (T.O. 00-25-259, 05-5.3.4)',
      'Molten solder forms between the tip and the joint, creating a heat bridge or thermal linkage. This heat bridge causes the tip to become part of the joint and allows rapid heat transfer. A solder (heat) bridge is formed by melting a small amount of solder at the junction of the tip and the mass being soldered as the iron is applied. After the tip makes contact with the lead and the pad and after the heat bridge is established, the solder is applied with a wiping motion to form the solder bond. The completed solder joint should be bright and shiny in appearance. It should have no cracks or pits, and the solder should cover the pad. Examples of preferred solder joints are shown in figure 3-17. They are referred to as full fillet joints.',
    ],
    task: tk('Two joints are dull: one in the ground pour, one on a thin track. The station starts at 600 °F (316 °C). Make both in 2–3 s of heat each, without lifting a pad. Watch the Thermal view: the pour joint runs cooler. Put the tip on the point of greatest mass; if it is slow, preheat the board (Bench → Preheater) before you turn the tip up.'),
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
    objectives: [
      tk('Inspect a reworked board the way a 2M inspector does.'),
      tk('Clean flux residue safely: joints cool first, isopropyl alcohol, no flame nearby.'),
    ],
    points: [
      tk('Most board damage happens while parts are taken off: always inspect the board afterwards.'),
      tk('Look for scorching, measling (light spots in the laminate), cracks, overheated or cracked parts, and nicked, lifted or delaminated pads and conductors.'),
      tk('No joint may be covered by loose or splattered solder: it can cause shorts.'),
      tk('Clean termination areas before soldering: old solder off, oxides off with a fine abrasive, then solvent and a lint-free tissue.'),
      tk('After soldering, let the joints cool completely, then remove all flux residue with 99.5 % isopropyl alcohol and an acid brush, and blot dry. NEETS (1998) also named ethyl alcohol; the 2M manual authorises isopropyl alcohol only.'),
      tk('Isopropyl alcohol is flammable: never near a hot iron, sparks or a flame, and never with a synthetic cloth (T.O. 03-3).'),
      tk('Moisture in the laminate turns into measling and delamination under heat: where there is an oven, boards are baked before soldering, desoldering or coating (T.O. 05-5.2).'),
    ],
    numbers: [
      { label: tk('Cleaning solvent'), value: tk('99.5 % isopropyl alcohol (the only one the 2M manual allows)') },
      { label: tk('Clean when'), value: tk('the joint has cooled completely') },
    ],
    diagram: 'fillets',
    original: [
      'When desoldering is complete, the workpiece must undergo a careful physical inspection for damage to the circuit board and the remaining components. The technician should also check the board for scorching or charring caused by component failure. Sometimes MEASLING is present. Measling is the appearance of light-colored spots. It is caused by small areas of fiberglass strands that have been damaged by epoxy overcuring, heat, abrasion, or internal moisture. No cracks or breaks should be visible in the board material. None of the remaining components should be cracked, broken, or show signs of overheating. The solder joints should be of good quality and not covered by loose or splattered solder, which may cause shorts. The technician should examine the board for nicked, cracked, lifted, or delaminated conductors and lifted or delaminated pads.',
      'The termination areas on the board and the component leads are thoroughly cleaned to remove oxide, old solder, and other contaminants. Old or excess solder is removed by one of the desoldering techniques explained earlier in this topic. A fine abrasive, such as an oil-free typewriter eraser, is used to remove oxides. This is not necessary if the area has just been desoldered. All areas to be soldered are cleaned with a solvent and then dried with a lint-free tissue to remove cleaning residue.',
      'When a solder joint is completed, solvent must be used to remove all flux residue. The two most highly recommended solvents, in the order of their effectiveness, are 99.5 percent pure ethyl alcohol and 99.5 percent pure isopropyl alcohol.',
      'ISOPROPYL ALCOHOL IS THE ONLY CLEANING SOLVENT AUTHORIZED FOR 2M REPAIR. USE OF OTHER CLEANING SOLVENTS IS BEYOND THE SCOPE OF THIS MANUAL. (T.O. 00-25-259, 05-5.4)',
      'Allow the solder joints to cool completely before cleaning. Clean the solder joints with isopropyl alcohol using an acid brush to remove all flux residue and blot dry with a clean, lint-free tissue. (T.O. 00-25-259, 07-5.4)',
      'Isopropyl alcohol is flammable; do not use in the presence of sparks, heat, flame, or synthetic cloth. (T.O. 00-25-259, 03-3)',
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
    source: { ...NEETS14_SOURCE, pages: '3-15 – 3-22' },
    objectives: [
      tk('Choose the desoldering method for the joint: wick, plunger or continuous vacuum.'),
      tk('Form, fit and solder a replacement part the way the factory did.'),
    ],
    points: [
      tk('Most board damage happens during desoldering. First find out what kind of joint holds the part.'),
      tk('Solder wick (braid soaked in flux) is for surface joints only: it cannot beat the capillary pull of a plated-through hole.'),
      tk('A manual vacuum plunger never removes all the solder: in a plated hole the lead stays stuck to the wall by a paper-thin sweat joint, and the jolt can lift the pad.'),
      tk('Continuous (motorized) vacuum is the most reliable: heat the joint, apply vacuum when the solder melts and stir the lead so no sweat joint forms.'),
      tk('Heat-and-shake and heat-and-pull are never used: they splatter solder, damage plated holes and lift pads.'),
      tk('Form the new part\'s leads before fitting it: each bend starts at least two lead diameters from the seal (where the lead leaves the body) and is about 90°, the lead is never nicked, and no bending force reaches the body.'),
      tk('Mount it like the original: parallel to and against the board, centred between its holes, its markings readable from one point, left to right and top to bottom. If not every marking can show, the value comes first.'),
      tk('Soldering the new part: feed solder until the hole is filled and the pad covered, then take solder and tip away together. Too little leaves the hole unfilled; too much hides the lead in a convex blob (T.O. 07-6.20, 05-4.2.10). The iron\'s readout shows what the fillet looks like.'),
    ],
    numbers: [
      { label: tk('New joint'), value: tk('hole 100 % filled, pad ≥ 75 % covered, the lead still visible') },
      { label: tk('Solder wick'), value: tk('surface joints, unsupported holes') },
      { label: tk('Manual plunger'), value: tk('leaves a sweat joint in plated holes') },
      { label: tk('Continuous vacuum'), value: tk('plated holes: the hole comes out clean') },
      { label: tk('Lead bend from the seal'), value: tk('≥ 2 lead diameters, about 90°') },
    ],
    figure: { src: 'lessons/neets14/fig-3-10.png', more: ['lessons/neets14/fig-3-13.png', 'lessons/neets14/fig-3-14.png'], caption: tk('NEETS 14, figures 3-10 (solder wicking), 3-13 (the bend at least two lead diameters from the seal) and 3-14 (ideal lead formation: each bend 90°).') },
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
      'Component leads are formed before installation. Both machine- and hand-forming methods are used to form the leads. Improper lead formation causes many repairs to be unacceptable. Damage to the SEALS (point where lead enters the body of the component) occurs easily during the forming process and results in component failure. (p. 3-20)',
      'The minimum distance between the seal (where the lead enters the body of the component) and the start of the lead bend must be no less than twice the diameter of the lead, as shown in figure 3-13. Leads must be approximately 90 degrees from their major axis to ensure free movement in hole terminations, as shown in figure 3-14. In lead-forming, the lead must not be damaged by nicking. Energy from the bending action must not be transmitted into the component body. (p. 3-20)',
      'Replacement components are mounted to make all identification markings readable without disturbing the component. When components are mounted like the original, all the identification markings are readable from a single point. Component identification reads uniformly from left to right, top to bottom, unless polarity requirements determine otherwise. (p. 3-21)',
      'The heat-and-pull method uses a soldering iron or gang-heater blocks to melt individual or multiple solder joints. The component leads are pulled when the solder is melted. This method has many shortcomings because of potential damage and should NOT be attempted. Heating blocks are patterned to suit specific configurations; but when used on multiple-lead connections, the joints may not be uniformly heated. Uneven heating results in plated-through hole damage, pad delamination, or blistering. Damage can also result when lead terminations are pulled through the board.',
    ],
    task: tk('R2 burned open. Clear both of its plated holes (Solder extractor, X; Bench → Extractor), take it out, fit a new 330 Ω resistor from the Parts bin (8), solder both leads with "+ flux" (flux-cored solder), clean with Isopropyl (0).'),
    questions: [
      { ref: 'Q11', q: tk('What procedure involves the use of finely braided copper wire to remove solder?'), a: tk('Wicking.'), page: '3-19' },
      { ref: 'Q12', q: tk('What is the most effective method of solder removal?'), a: tk('Continuous vacuum.'), page: '3-19' },
      { ref: 'Q13', q: tk('When, if at all, should the heat-and-shake or the heat-and-pull methods of solder removal be used?'), a: tk('These methods should not be used.'), page: '3-19' },
      { ref: 'Q16', q: tk('Leads are formed approximately how many degrees from their major axis?'), a: tk('90 degrees.'), page: '3-22' },
      { ref: 'Q17', q: tk('When you replace components, identification marks must meet what requirements?'), a: tk('They should be readable from a single point.'), page: '3-22' },
    ],
  },
  {
    scenario: 'hr-thermal-shunt',
    source: { ...NEETS14_SOURCE, pages: '3-23' },
    objectives: [
      tk('Say which parts are heat-sensitive and why a lead carries the iron\'s heat into them.'),
      tk('Shunt every lead of a sensitive part before you heat it.'),
    ],
    points: [
      tk('Diodes, transistors and ICs are heat-sensitive: their leads carry the iron\'s heat into the body.'),
      tk('Before heat is applied, clip a thermal shunt on the lead, between the joint and the body. It conducts heat away from the part.'),
      tk('Copper is the usual shunt metal (large heat content, high conductivity); aluminium where the clip\'s weight could damage the part.'),
      tk('The most common shunt is a spring clip, like an alligator clip, that fastens onto the lead.'),
      tk('The tip is at 316 °C and the joint near 288 °C, but the transistor\'s junction must never pass 150 °C. The lead carries heat into the body; the shunt takes it off first.'),
      tk('DEADBOARD does not model the slow damage heat does to a junction: here the inspector checks that a shunt was on every lead you heated.'),
    ],
    numbers: [
      { label: tk('2N3904 junction and storage limit (onsemi datasheet)'), value: '−55 … +150 °C' },
      { label: tk('The tip, for comparison'), value: '600 °F (316 °C)' },
    ],
    figure: { src: 'lessons/neets14/fig-3-16.png', caption: tk('Figure 3-16. Thermal shunt.') },
    original: [
      'Before heat is applied to solder the joint, a thermal shunt is attached to sensitive component leads (diodes, transistors, and ICs). A thermal shunt is used to conduct heat away from the component. Because of its large heat content and high thermal conductivity, copper is usually used to make thermal shunts. Aluminum also has good conductivity but a smaller heat content; it is also used to conduct heat, especially if damage from the physical weight of the clamp is possible. Many types, shapes, and sizes of thermal shunts are available. The most commonly used is the clamp design; this is a spring clip (similar to an alligator clip) that easily fastens onto the part lead, as shown in figure 3-16.',
      'Heat sinks are applied to heat sensitive components before the application of heat. Heat sinks are placed between the heat source and the component to be protected from heat. (T.O. 00-25-259, 05-5.3.1)',
    ],
    task: tk('Q1\'s base and collector joints are dull. Clip a Thermal shunt (S) on each of those leads before you heat them, then hold the iron on each joint. The inspector checks that every transistor lead you heated had its shunt.'),
    questions: [
      { ref: 'Q22', q: tk('What term describes a device used to conduct heat away from a component?'), a: tk('A thermal shunt.'), page: '3-25' },
    ],
  },
  {
    scenario: 'hr-skipping-pattern',
    source: { ...NEETS14_SOURCE, pages: '3-26 – 3-27, 3-31' },
    objectives: [
      tk('Desolder and solder a multilead part in a skipping pattern.'),
      tk('Say why gold-plated leads are tinned twice before soldering.'),
    ],
    points: [
      tk('A DIP or any multilead part is always desoldered and soldered in a skipping pattern: never heat two pads next to each other one after the other.'),
      tk('Skipping reduces heat accumulation in one area of the board and with it the chance of damage. The 2M manual calls it a shotgun pattern.'),
      tk('Solder each joint as quickly as possible, with only as much heat as necessary.'),
      tk('Before lifting a DIP, make sure every lead is completely free. A part known to be bad may have its leads clipped first.'),
      tk('Finish every repair by inspecting the workmanship and testing the card.'),
      tk('Gold-plated leads and pads are tinned twice before soldering: gold dissolved in the joint forms brittle intermetallics (gold embrittlement). The first tinning takes most of the gold off, the second wets the base metal.'),
    ],
    numbers: [
      { label: tk('DIP pin pitch'), value: '0.1 in (2.54 mm)' },
      { label: tk('A skipping pattern for pins 1–4'), value: '2 → 4 → 1 → 3' },
      { label: tk('Gold-plated leads'), value: tk('double-tinned before soldering') },
    ],
    diagram: 'shotgun',
    original: [
      'The removal of soldered-in DIPs without conformal coatings is essentially the same as the removal of discrete components, except that a skipping pattern is always used. A skipping pattern is one that skips from pad to pad, never heating two pads next to each other. This reduces heat accumulation and reduces the chance of damage to the board. Of course, many more leads should be desoldered before the part can be removed. Special care must be exercised to make sure all leads are completely free before an attempt is made to lift the part off the board. If the part is known to be faulty or if normal removal may damage the board, then the leads should be clipped. Once this has been done, desoldering can be done from both sides of the board. After the clipped leads have been desoldered, they can be removed with tweezers or pliers.',
      'The steps for replacing a soldered-in DIP are similar to those for replacing a plug-in DIP. Once the part is in position, it is soldered using the same standard used by the manufacturer, or as close to that standard as is possible with the available equipment. The joints should be soldered as quickly as possible using only as much heat as is necessary using a skipping pattern. The repaired card should then be visually inspected for defects in workmanship, and testing of the card should take place. Once the successful repair has been accomplished, a conformal coating should be applied to the work area.',
      'Shotgun Pattern – A soldering/desoldering process for multilead components that applies heat to non-adjacent leads/pads to avoid heat buildup in the component or laminate. (T.O. 00-25-259, WP 002 00)',
      'Gold finishes shall be double-tinned before installation. Double tinning reduces the amount of gold absorbed by the solder. The first tinning operation removes most of the gold from the surface. The second application wets the base metal. Failure to double tin the surface may result in a less reliable solder joint because gold reacts with the solder to form brittle intermetallics. This condition is known as gold embrittlement. (T.O. 00-25-259, 05-7.3)',
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
    objectives: [
      tk('Judge whether a nicked conductor must be repaired.'),
      tk('Repair a cracked or nicked conductor with a clinched staple, to the 2M standard.'),
    ],
    points: [
      tk('Examine every conductor for nicks, tears and scratches that have not broken the circuit, as well as for complete breaks.'),
      tk('A nick or scratch that takes away over 20 % of the conductor\'s cross-section must be repaired: it reduces the current the conductor can carry. That is the 2M manual\'s limit (T.O. 12-6.1), graded here; NEETS (1998) said one tenth.'),
      tk('Four repairs for a crack: a solder bridge (cracks again easily, not high-reliability), a lap-soldered wire (stronger, still not highly reliable), an eyelet in a hole drilled through the crack, and the clinched staple.'),
      tk('The clinched staple is the most reliable repair and is recommended in nearly all cases.'),
      tk('The staple (T.O. 12-6.3): holes at least two conductor widths from the damage, a wire 50–80 % of the conductor width, both ends clinched 90° away from the damage and at least two conductor widths long, never past the conductor\'s edge. Sleeve it where it crosses other conductors or leads.'),
      tk('Only on single- and double-sided boards: on a multilayer board the holes would cut inner conductors. The 2M manual leaves multilayer staple repair out of its scope.'),
      tk('Board damage has causes: untrained people making improper repairs, the wrong tools, poor shipping, packaging, storage and use, and operational failures (cracking from heat, warping, overheated parts, faulty wiring).'),
    ],
    numbers: [
      { label: tk('Nick that must be repaired'), value: tk('> 20 % of the cross-section (T.O.); NEETS: > 1/10') },
      { label: tk('Staple wire'), value: tk('50–80 % of the conductor width') },
      { label: tk('Holes from the damage'), value: tk('≥ 2 conductor widths') },
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
      'Cards and boards may be damaged in any of several ways and by a number of causes. Untrained personnel making improper repairs and technicians using improper tools are two major causes of damage. Improper shipping, packaging, storage, and use are also common sources of damage. The source of damage most familiar to technicians is operational failure. Operational failures include cracking caused by heat, warping, component overheating, and faulty wiring. (p. 3-31)',
      'The holes are drilled a minimum of two conductor widths from the damaged area. The solid-wire or component lead diameter is between 50 and 80% of the conductor width. Insulation sleeving is installed on the replacement conductor that crosses other conductors or leads. The termination length of both clinched lead ends is at greater than two times the conductor width. The lead ends are clinched in the direction away from the damage. (T.O. 00-25-259, 12-6.3)',
      'Use this procedure to repair conductors on single- and double-sided CCAs if the Conductor Repair, Lap Solder Procedure (paragraph 12-5.4) is not feasible and the circuitry and conductors will not interfere with the repair. The repair of multilayer CCAs using a clinched staple is beyond the scope of this manual. (T.O. 00-25-259, 12-5.5)',
      'REPLACING DAMAGED OR MISSING CONDUCTORS.—The procedures used to replace damaged or missing conductors are essentially the same as using the clinched-staple method of conductor repair.',
    ],
    task: tk('D1\'s track is cracked through and D2\'s has a deep nick. Repair both with a Clinched staple (K): click the conductor on one side of the damage, then the other. A solder bridge or a jumper wire would make D1 light, but the inspector rejects both here.'),
    questions: [
      { ref: 'Q30', q: tk('What is the preferred method of repairing cracked runs on boards?'), a: tk('Clinched staple.'), page: '3-37' },
      { ref: 'Q29', q: tk('List three causes of damage to printed circuit boards.'), a: tk('Operational failures, repairs by untrained personnel, repair using improper tools, mishandling, improper shipping, packaging, and storage.'), page: '3-37' },
      { ref: 'Q32', q: tk('How is board damage caused by technicians?'), a: tk('Repairs by untrained personnel and technicians using improper tools.'), page: '3-37' },
    ],
  },
  {
    scenario: 'hr-conformal-coating',
    source: { ...NEETS14_SOURCE, pages: '3-2 – 3-7' },
    objectives: [
      tk('Pick the least damaging removal method for a coating from the removal table.'),
      tk('Remove a coating only where the repair needs it, and put the same type back.'),
    ],
    points: [
      tk('Conformal coatings (acrylic lacquer, epoxy, parylene, silicone, polyurethane, varnish) protect an assembly from corrosion, moisture and stress.'),
      tk('Before any work, remove the coating from all lead and pad areas of the part, down to the widest point of its body. The whole board is not stripped.'),
      tk('Identify the coating from the documentation (technical manual, drawing); otherwise by its hardness, transparency, thickness and solvent solubility.'),
      tk('Choose the removal method by coating type (Table 3-1) and always try the least damaging one first. Never use a soldering iron: it chars the coating.'),
      tk('After the repair, replace the coating with the same type that was removed.'),
      tk('This lesson grades NEETS\'s Table 3-1 (1998). The current 2M manual\'s Table 06-3 (2013) differs: isopropyl alcohol is the only solvent, parylene comes off mechanically, and hot air works on any epoxy. Lesson 9 onwards is graded by Table 06-3.'),
      tk('Coatings and their solvents can be flammable and their fumes harmful: ventilate, keep flames and sparks away, avoid skin contact, and never spray a warm or powered board (T.O. 03-3; NEETS p. 3-45).'),
    ],
    numbers: [
      { label: tk('Thin vs thick coating'), value: tk('thick = 0.025 in (0.64 mm) and more') },
      { label: tk('Solvent for thin acrylic'), value: tk('isopropyl alcohol only (2M manual). NEETS (1998) also named xylene and trichloroethane: trichloroethane is now banned (Montreal Protocol) and xylene is toxic.') },
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
      { ref: 'Q3', q: tk('What chemicals are used to remove protective material?'), a: tk('Solvents or xylene and trichloroethane. (The 1998 answer: the 2M manual now allows isopropyl alcohol only, and trichloroethane is banned.)'), page: '3-7' },
      { ref: 'Q4', q: tk('Abrasion, cutting, and peeling are examples of what type of protective material removal?'), a: tk('Mechanical.'), page: '3-7' },
      { ref: 'Q5', q: tk('Why should the coating material be replaced once the required repair has been completed?'), a: tk('To ensure protective characteristics are maintained.'), page: '3-7' },
    ],
  },
  {
    scenario: 'hr-esd',
    source: { ...NEETS14_SOURCE, pages: '3-38 – 3-42' },
    objectives: [
      tk('Say how much static it takes to damage MOS and bipolar parts, and why dry air matters.'),
      tk('Set up and keep an ESD-safe bench before you touch the card, and stay safe yourself.'),
    ],
    points: [
      tk('Static builds up whenever two materials rub or separate; you only feel a discharge from about 3,500–4,000 V. Lower voltages pass unnoticed.'),
      tk('MOS devices are the most sensitive: a MOSFET can be damaged by as little as 35 V. Bipolar transistors and diodes by less than 3,000 V.'),
      tk('Dry air makes it far worse: a worker at the bench carries about 6,000 V at 10–20 % humidity, about 100 V at 65–90 %.'),
      tk('Damage is not always immediate: a device can be degraded and fail early.'),
      tk('Ground yourself before servicing (wrist strap), keep ESD-sensitive parts in their packaging until needed, and hold them by the body, never by the leads.'),
      tk('Strap on before you touch the card, not only for the sensitive part: the inspector grades the whole work area.'),
      tk('The strap\'s cord has a resistor in series (1 MΩ in NEETS; 0.8–2 MΩ in the 2M manual): if you touch a live voltage, it keeps the current through you to 5 mA or less.'),
      tk('An ESD bench is for dead equipment only. Never work on powered equipment there: the strap that grounds you also makes you part of the circuit.'),
      tk('Also: ground a part\'s package before opening it; keep plastic bags, foam cups and synthetics off the bench; use a grounded iron tip and an antistatic solder sucker; touch the surface for a second before you pick a part up or put it down.'),
    ],
    numbers: [
      { label: tk('MOS devices damaged from'), value: '35 V' },
      { label: tk('Bipolar transistors and diodes'), value: '< 3 000 V' },
      { label: tk('You feel a discharge from'), value: '3 500 – 4 000 V' },
      { label: tk('Wrist strap and cord'), value: tk('0.8–2 MΩ (T.O. 04); 1 MΩ (NEETS)') },
      { label: tk('Current through you, at most'), value: '5 mA' },
    ],
    table2: 'table-3-2',
    figure: { src: 'lessons/neets14/fig-3-32.png', caption: tk('Figure 3-32. ESD wrist strap.') },
    original: [
      'Electrostatic discharge (ESD) can destroy or damage many electronic components including integrated circuits and discrete semiconductor devices. Certain devices are more susceptible to ESD damage than others. Because of this, warning symbols are now used to identify ESD-sensitive (ESDS) items (figure 3-31).',
      'Metal oxide semiconductor (MOS) devices are the most susceptible to damage from ESD. For example, an MOS field-effect transistor (MOSFET) can be damaged by a static voltage potential of as little as 35 volts. Commonly used discrete bipolar transistors and diodes (often used in ESD-protective circuits), although less susceptible to ESD, can be damaged by voltage potentials of less than 3,000 electrostatic volts. Damage does not always result in sudden device failure but sometimes results in device degradation and early failure. Table 3-2 clearly shows that electrostatic voltages well in excess of 3,000 volts can be easily generated, especially under low-humidity conditions.',
      '1. Before starting to service equipment, the technician should be grounded to discharge any static electric charge built up on the body. This can be accomplished with the use of a test lead (a single-wire conductor with a series resistance of 1 megohm equipped with alligator clips on each end). One clip end is connected to the grounded equipment frame, and the other clip end is touched with a bare hand. Figure 3-32 shows a more refined ground strap which frees both hands for work.',
      '2. Equipment technical manuals and packaging material should be checked for ESD warnings and instructions.',
      '3. Prior to opening an electrostatic unit package of an electrostatic sensitive device or assembly, clip the free end of the test lead to the package. This will cause any static electricity which may have built up on the package to discharge. The other end remains connected to the equipment frame or other ESD ground. Keep the unit package grounded until the replacement device or assembly is placed in the unit package.',
      '4. Minimize handling of ESDS devices and assemblies. Keep replacement devices or assemblies, with their connector shorting bars, clips, and so forth, intact in their electrostatic-free packages until needed. Place removed repairable ESD devices or assemblies with their connector shorting bars/clips installed in electrostatic-free packages as soon as they are removed from the equipment. ESDS devices or assemblies are to be transported and stored only in protective packaging.',
      '5. Always avoid unnecessary physical movement, such as scuffing the feet, when handling ESDS devices or assemblies. Such movement will generate additional charges of static electricity.',
      '6. When removing or replacing an ESDS device or assembly in the equipment, hold the device or assembly through the electrostatic-free wrap if possible. Otherwise pick up the device or assembly by its body only. Do not touch component leads, connector pins, or any other electrical connections or paths on boards, even though they are covered by conformal coating.',
      '7. Do not permit ESDS devices or assemblies to come in contact with clothing or other ungrounded materials that could have an electrostatic charge. Do not hand an ESD device or assembly to another person until the device or assembly is protectively packaged.',
      '8. When moving an ESDS device or assembly, always touch (with bare skin) the surface on which it rests for at least one second before picking it up. Before placing it on any surface, touch the surface with your free hand for at least one second.',
      '9. While servicing equipment containing ESD devices, do not handle or touch materials such as plastic, vinyl, synthetic textiles, polished wood, fiberglass, or similar items which create static charges; or, be sure to repeat the grounding action with the bare hands after contacting these materials.',
      '10. If possible, avoid repairs that require soldering at the equipment level. Soldering irons must have heater/tips assemblies that are grounded to ac electrical ground. Do not use ordinary plastic solder suckers (special antistatic solder suckers are commercially available).',
      'There must not be any energized equipment placed on the conductive ESD work surface. An ESD work area is for "dead" equipment ONLY. (p. 3-42)',
      'The ESD wrist strap and cord shall have a total resistance of 800,000Ω to 2 MΩ based on limiting current for personnel to 5mA. (T.O. 00-25-259, WP 004 00)',
      'WARNING: A 2M WORKSTATION SHALL NOT BE USED TO PERFORM MAINTENANCE ON ENERGIZED ELECTRONIC EQUIPMENT. (T.O. 00-25-259, 03-4.5)',
    ],
    task: tk('Q1 (a 2N7000 MOSFET) is missing and the air is dry. Put the wrist strap on before you touch the card (Bench → ESD protection), then fit Q1 from the Parts bin (8), solder its three leads with "+ flux" (a MOSFET is heat-sensitive too: a Thermal shunt, S, on each lead) and clean with Isopropyl (0).'),
    questions: [
      { ref: 'Q35', q: tk('What is the purpose of the wrist ground strap?'), a: tk('To discharge any static charge built up in the body.'), page: '3-46' },
      { ref: 'Q34', q: tk('List two causes of damage to ESD-sensitive electronic components.'), a: tk('ESD, improper stowage, and improper handling.'), page: '3-46' },
    ],
  },
  {
    scenario: 'hr-pad-repair',
    source: { ...NEETS14_SOURCE, pages: '3-7, 3-33 – 3-34' },
    objectives: [
      tk('Replace a lifted pad with a new pad and a flat-set eyelet.'),
      tk('Say what an interfacial connection is, and where eyelet repair is not allowed.'),
    ],
    points: [
      tk('A termination pad that has lifted or is missing is replaced, not bypassed. NEETS takes the replacement from a scrap board; the 2M manual also uses ready-made pads with an adhesive coating on the underside.'),
      tk('Clean the underside of the new pad and the area where it goes, then fasten it with epoxy.'),
      tk('Set an eyelet through the pad before the epoxy cures: it reinforces the pad mechanically and makes good electrical contact for the component.'),
      tk('When the epoxy has cured, lap-solder the new pad to the original run, overlapping it at least two conductor widths (the "2X width" in figure 3-25; T.O. 12-6.4).'),
      tk('A missing or damaged eyelet is always replaced, whatever the damage. Eyelets are roll-set, funnel-set or flat-set; only flat-set eyelets (or flattened funnelets) are allowed in 2M repair.'),
      tk('An eyelet, like a plated-through hole, is an interfacial connection: it joins the circuitry on one side of the board to the other. Eyelets are never used on a multilayer board: they could break its inner connections.'),
    ],
    numbers: [
      { label: tk('Order of work'), value: tk('clean → epoxy pad → eyelet → cure → lap-solder → solder the lead') },
      { label: tk('Lap overlap on the old conductor'), value: tk('≥ 2 conductor widths') },
      { label: tk('Eyelet flange'), value: tk('covers 50–80 % of the pad') },
    ],
    figure: { src: 'lessons/neets14/fig-3-25.png', caption: tk('Figure 3-25. Replacement of damaged termination pad. (The scan reads "2X WODTH": two times the width.)') },
    original: [
      'REPLACING THE TERMINATION PAD.—Many times the termination pad, as well as part of the conductor, is missing on the board. In these cases, a replacement pad is obtained from a scrap circuit board. Refer to figure 3-25 as you study each step.',
      'The underside of the replacement pad and the area where it will be installed is cleaned. An epoxy is used to fasten the replacement pad to the board. An eyelet is installed to reinforce the pad before the epoxy sets and cures. This ensures a good mechanical bond between the board and pad and provides good electrical contact for components. After the epoxy cures, the new pad is lap-soldered to the original run.',
      'In addition to the plated-through hole you studied earlier, EYELETS, shown in figure 3-4, view (A), view (B), and view (C), are also used in both manufacturing and repair. These hole-reinforcing devices are usually made of pure copper, but are often plated with gold, tin, or a tin-lead alloy. The copper-based eyelet is pliable; when set, it reduces the possibility of circuit board damage. Eyelets may be inserted into single-sided or double-sided boards and are of three different types - ROLL SET, FUNNEL SET, and FLAT SET. All three are types referred to as INTERFACIAL CONNECTIONS. Interfacial connections identify the procedure of connecting circuitry on one side of a board with the circuitry on the other side. (p. 3-7)',
      'The replacement conductor overlaps the original conductor two conductor widths or greater at each end. (Defect: the replacement conductor overlaps original conductor less than two conductor widths at either end.) (T.O. 00-25-259, 12-6.4)',
      'Note: Only flat-set eyelets (or flattened funnelets) are authorized for 2M repair. (T.O. 00-25-259, 12-5.9) The use of eyelets to repair plated-through holes on multilayer CCAs is prohibited due to the possibility of damaging multiple interfacial connections. (T.O. 00-25-259, 12-5.1)',
      'REPLACING EYELETS.—Eyelets have been referred to in several places in this topic. Not only are they used for through-the-board terminations, but also to reinforce some types of board repairs. As with any kind of material, eyelets are subject to damage. Eyelets may break, they may be installed improperly, or they may be missing from the equipment. When an eyelet is missing or damaged, regardless of the kind of damage, it should be replaced. The guidelines for the selection and installation of new eyelets are far too complex to explain here. However, they do comprise a large part of the 2M technician\'s training.',
    ],
    task: tk('R2 pad 2 has lifted off the board, so D2 is dark. Replace the pad with Pad repair (E), then solder R2\'s lead in the new eyelet with "+ flux" and clean with Isopropyl (0). A jumper wire around the pad is not a high-reliability repair: the inspector rejects it here.'),
    questions: [
      { ref: 'Q31', q: tk('Damaged or missing termination pads are replaced using what procedure?'), a: tk('Epoxy a replacement pad to the board, set an eyelet, and solder it.'), page: '3-37' },
      { ref: 'Q6', q: tk('What term is used to identify the procedure of connecting one side of a circuit board with the other?'), a: tk('Interfacial connections.'), page: '3-14' },
    ],
  },
  {
    scenario: 'hr-final-practical',
    source: { ...CERT_SOURCE, pages: 'Appendix C' },
    objectives: [
      tk('Plan and carry out a complete multi-repair job in the right order.'),
      tk('Leave a card that works and passes every rule of the course.'),
    ],
    points: [
      tk('Modelled on the 2M miniature recertification performance test: identify and remove a conformal coating, wire a turret (double wire), a hook, a pierced tab and a solder cup, patch burned laminate, replace a full-clinch axial part and a 16-lead DIP, replace a pad with an eyelet, repair a conductor, in an ESD-safe, orderly work area.'),
      tk('The work area is graded too (SAT/UNSAT in the real test): wrist strap on before you touch the card, and every safety precaution observed. Most accidents come from not following the prescribed safe procedures.'),
      tk('Every project is graded against the workmanship standards of the 2M manual (T.O. 00-25-259): solder acceptability and post-solder cleanliness included.'),
      tk('A repaired assembly is restored at least to the original manufacturer\'s standards. The two final steps of any repair: inspect and test.'),
      tk('Every rule of the earlier lessons is graded here.'),
    ],
    numbers: [
      { label: tk('Recertification'), value: tk('every 18 months, all projects within three days') },
      { label: tk('This card'), value: tk('coated (no drawing), DIP-16 network, a clinched resistor over a burn, four terminals, dry air') },
    ],
    table: 'table-06-3',
    original: [
      'The Miniature Electronic Repair Technician must satisfactorily complete the projects listed below. All specifications are contained in NAVAIR 01-1A-23, NAVSEA SE004-AK-TRS-010/2M (work package references are noted below). All work must comply with the workmanship standards listed in the respective work package sections.',
      'Identify four of five and remove two of the following conformal coating types: AR, ER, SR, UR, or XY',
      'Install a single wire on a pierced tab terminal',
      'Excavate, Straight Wall, Undercut, and Bevel a Surface Patch Laminate Repair',
      'Install a double wire on a turret or hook terminal',
      'Install a single wire to a solder cup',
      'Remove and replace a horizontal mount, full clinch, axial lead component on a double-sided CCA',
      'Conductor repair: pad replacement with a flat-set eyelet',
      'Remove and replace a 14/16 lead dual in-line package (DIP)',
      'During the recertification, the technician observed all safety precautions and maintained a clean, orderly, and electrostatic discharge (ESD) safe work area. [SAT/UNSAT]',
      'A technician shall satisfactorily complete all required recertification tasks within a three-day period. All recertification projects must meet minimum acceptance criteria.',
      'Most accidents are preventable. Accidents don\'t happen without a cause. Most accidents are the result of not following prescribed safe operating procedures. (NEETS Module 14, p. 3-43)',
      'CAUTION (NEETS Module 14, p. 3-1): THIS SECTION IS NOT, IN ANY WAY, TO BE USED BY YOU AS AUTHORIZATION TO ATTEMPT THESE TYPES OF REPAIRS WITHOUT OFFICIAL 2M CERTIFICATION.',
    ],
    task: tk('RN1 and R5 burned out on a coated card with no drawing, R5 charred the board under it, and the supply wires are missing. Strap on first. Identify the coating, replace RN1 (16 pins out and in, always in a skipping pattern) and R5 (clinched: free the leads, patch the laminate, refit it clinched), wire E1 to E2 and E3 and E2 to cup E4, repair what else you find, and put the same coating back. Every rule is graded; the hints give the order of work if you need it.'),
    questions: [
      { ref: 'Q14', q: tk('To what standards should a technician restore electronic assemblies?'), a: tk('Manufacturer\'s standards.'), page: '3-22' },
      { ref: 'Q36', q: tk('What is the cause of most accidents?'), a: tk('Deviation from prescribed safe operating procedures.'), page: '3-46' },
    ],
  },
  {
    scenario: 'hr-coating-id',
    source: { ...TO_SOURCE, pages: '06-4.1 – 06-5.4' },
    objectives: [
      tk('Identify an unknown coating with three tests and the flowchart.'),
      tk('Remove it with Table 06-3\'s first choice and put the same type back.'),
    ],
    points: [
      tk('The coating type must be identified before removal, so the right removal technique can be used. Documentation (manual, drawing) comes first; without it, test the coating.'),
      tk('Hardness: press it with an orangewood stick. Solubility: a small drop of isopropyl alcohol only, in the repair area. Thermal: controlled heat at or below solder melt (361 °F).'),
      tk('Acrylic dissolves in alcohol. Epoxy overcures into a white powder under heat. Silicone is rubbery and ignores alcohol and heat. Polyurethane softens to a putty under heat. Parylene reacts to neither.'),
      tk('Record the type, then remove only the coating the repair needs, and replace it with the same type afterwards.'),
      tk('From this lesson on, removal is graded by the 2M manual\'s Table 06-3: isopropyl alcohol is the only solvent, and the methods marked * also identify the coating.'),
    ],
    numbers: [
      { label: tk('Thin coating'), value: tk('0.025 in (≈1/32 in) or less') },
      { label: tk('Thermal test'), value: '≤ 361 °F (183 °C)' },
    ],
    flow: 'figure-06-1',
    table: 'table-06-3',
    original: [
      'The conformal coating type must be identified before removal so the appropriate removal technique can be used. The Conformal Coating Identification Flowchart (Figure 06-1) aids in identification decision-making and Table 06-1 lists conformal coating characteristics.',
      'Conformal coating hardness may be determined by applying pressure to the coating with an orangewood stick or spudger. Coatings may range from soft to hard.',
      'Most coatings are soluble. The solvent required to dissolve a specific coating may damage the CCA and/or components. Test coating by applying a small quantity of isopropyl alcohol in the repair area and observe reaction. (CAUTION: Unless directed by other maintenance actions, the solubility test and solvent use shall be limited to isopropyl alcohol.)',
      'Conformal coating thermal properties relate to their reaction to heat. Coatings react differently to the application of controlled heat and abrasion. The coating may have no reaction, overcure and turn to a white powder, or soften and turn gummy. Test the coating surface in the repair area at or below solder melt temperature (361°F) and observe reaction.',
      'Epoxy is a hard thick or thin coating that forms a very strong surface adhesive bond. Because of this adhesion, epoxy will not chip, peel, or crack under physical stress. The texture is smooth, glossy, and nonporous. Application of controlled heat, at or below solder melt temperature (361°F), and abrasion overcures epoxy resulting in a powdery substance.',
      'Most acrylic resins may be dissolved by isopropyl alcohol and easily blotted away. Silicone coatings are rubbery and pliable; isopropyl alcohol has no effect on these coatings, and application of heat at or below solder melt temperature has no effect on most silicone coatings. Isopropyl alcohol has no effect on polyurethanes; controlled heat and abrasion tend to soften them, making them pliable with a putty-like consistency. Paraxylylene does not react to isopropyl alcohol.',
    ],
    task: tk('The coating type is unknown. Test it (Coating test, Q; the test is set in Bench), follow the flowchart, and record your answer in Bench → Identified as before you remove anything. Then: coating off R1 with Table 06-3\'s first choice, reflow R1 pad 1 with flux, clean, and put the same coating back (J).'),
    questions: [
      { ref: 'S1', source: 'to', q: tk('Which solvent may be used for the solubility test?'), a: tk('Isopropyl alcohol only, unless other maintenance actions direct otherwise.'), page: '06-5.2' },
      { ref: 'S2', source: 'to', q: tk('Under controlled heat at or below 361 °F a coating turns to a white powder. Which coating is it?'), a: tk('Epoxy: the heat overcures it.'), page: '06-4.2' },
      { ref: 'S3', source: 'to', q: tk('Which method does Table 06-3 list first for epoxy, and does it identify the coating?'), a: tk('The hot air jet, and yes: it is marked * (identifies the type).'), page: '06-5.4' },
    ],
  },
];

// Wires on terminals: the 2M workmanship manual (WP 008 00, WP 009 00), with NEETS Module 14's
// terminal figure and Module 4's review questions (NAVEDTRA 14176, also Distribution A).
CONTENT.push(
  {
    scenario: 'hr-turret',
    source: { ...TO_SOURCE, pages: '08-5.3 – 08-6.5, 08-6.12' },
    objectives: [
      tk('Strip, tin and form a wire end to the T.O.\'s target for a turret.'),
      tk('Put two wires on one terminal and solder them together.'),
    ],
    points: [
      tk('Strip with thermal strippers, the preferred method. Mechanical strippers are not used on AWG 22 or smaller: their pull can stretch the wire.'),
      tk('Tin the stripped end before forming: tinning holds the strands so they do not birdcage, and helps the solder flow.'),
      tk('Hold the wire in anti-wicking tweezers while you tin it: they stop the solder running up the strands under the insulation (wicking). A wicked wire is stiff where it should flex; wicking that bulges or discolours the insulation is a defect (T.O. 08-6.3).'),
      tk('Thermal strippers melt the insulation, and its fumes are toxic: strip only with good ventilation (T.O. 03-3).'),
      tk('Insulation clearance: one wire diameter, insulation included, between the insulation and the terminal. Up to two is acceptable; touching the terminal, or more than two, is a defect.'),
      tk('Bend the wire 180° round the post, never overlapping itself, and cut the end flush so it touches the post (at most one bare-wire diameter beyond it).'),
      tk('Two wires on one turret: wrap the second parallel to the first, against it and as close to the base as its insulation allows. A gap between them is acceptable; crossing over or overlapping the first wire is a defect.'),
      tk('Solder at 600 °F (316 °C): melt within two seconds, solder to the cut end, and form the fillet where the wire meets the post. With two wires on one terminal, solder both before the tip leaves it. Then clean off the flux.'),
    ],
    numbers: [
      { label: tk('Wire'), value: tk('M22759/16-22: 1.32 mm over the insulation, 0.76 mm conductor') },
      { label: tk('Insulation clearance'), value: tk('target 1 diameter (1.3 mm), at most 2 (2.6 mm)') },
      { label: tk('Wrap'), value: '180°' },
      { label: tk('Cut end'), value: tk('flush; at most 0.76 mm beyond the post') },
      { label: tk('Tip'), value: tk('600 °F (316 °C), melt within 2 s') },
    ],
    figure: { src: 'lessons/neets14/fig-3-8a.png', caption: tk('NEETS 14, figure 3-8 (A). Pin and turret terminals.') },
    original: [
      'Thermal stripping is the preferred method of insulated wire stripping. Use thermal strippers whenever possible to reduce the risk of wire damage. Do not use mechanical strippers on wire sizes AWG-22 or smaller. The pulling action of the stripper may stretch the smaller-sized wires.',
      'Tinning stranded wire reduces the probability of wire damage. Tinning prevents birdcaging during the forming operation and enhances solder flow.',
      'Anti-Wicking – Preventing solder from flowing up a wire from the normal wicking action of stranded wire. (T.O. 00-25-259, WP 002 00)',
      'The wire is wicked, but wicking does not cause the insulation to bulge or become discolored. (Acceptable.) (Defect: wicking causes the insulation to bulge or become discolored.) (T.O. 00-25-259, 08-6.3)',
      'WARNING: USE THERMAL STRIPPERS ONLY IN A WELL-VENTILATED AREA TO AVOID TOXIC FUMES FROM WIRE INSULATION. (T.O. 00-25-259, 08-5.3)',
      'There is an insulation clearance of one wire diameter (including insulation) between the end of the insulation and the outside edge of the terminal. (Defect: the insulation clearance is greater than two wire diameters; the insulation contacts the terminal.)',
      'The wire contacts the terminal post for 180°. (Defect: the wire has less than 180° of contact between the wire and the terminal post or overlaps itself on the terminal.)',
      'The cut end of the wire contacts the post. (Defect: the wire end extends beyond the edge of the terminal more than one wire diameter, not including insulation.)',
      'Multiple wires are wrapped parallel with the terminal base and each other. (Defect: multiple wires crossover or overlap each other on the terminal.)',
      'On multiple wire installations, subsequent wires are mounted as close to the base as allowed by the insulation. (Acceptable: on multiple wire installations, subsequent wires are not in contact with the previously installed wire.)',
      'WHEN SOLDERING MULTIPLE WIRES, COMPLETE ALL SOLDERING BEFORE REMOVING THE SOLDERING IRON TIP FROM ITS ORIGINAL POSITION ON THE TERMINAL.',
      'Discernible solder fillet covers 100% of the wire and terminal contact area. The contour of the wire is discernible in the solder.',
    ],
    task: tk('Wire E1 to E2, and E2 to E3, with the Hook-up wire (W): click a terminal, prepare that end, then the other. Work out the strip length: clearance plus the wrap round the post. E2 takes both wires: lay the second against the first. Then solder each turret with fresh solder ("+ flux") and clean the flux off.'),
    questions: [
      { ref: 'Q1', module: 4, q: tk('What are the basic requirements for any splice or terminal connection?'), a: tk('The connection must be both mechanically and electrically as strong as the conductor or device with which it is used.'), page: '2-5' },
      { ref: 'Q22', module: 4, q: tk('What does "tinning" mean in relationship to soldering?'), a: tk('The coating of the material to be soldered with a light coat of solder.'), page: '2-26' },
    ],
  },
  {
    scenario: 'hr-hook-tab',
    source: { ...TO_SOURCE, pages: '08-6.6 – 08-6.7' },
    objectives: [
      tk('Name the five kinds of above-the-board terminal.'),
      tk('Form wires on a hook and through a pierced tab, two on one hook in alternating directions.'),
    ],
    points: [
      tk('Terminals are above-the-board terminations: the wire ends on a post above the board. Five kinds: pin and turret (one post), bifurcated or fork (two posts), hook, pierced (a hole in flat metal), and the solder cup.'),
      tk('Hook: the wire contacts the hook for 180° and sits inside the hook\'s 180° arc. Less than two wire diameters from the base, or one from the end of the hook, is a defect.'),
      tk('Two wires on one hook: neither may overlap the other; attaching them in alternating directions is the target.'),
      tk('Pierced tab: the wire passes through the eye and contacts two parallel sides (180°). At least 90° is acceptable; less, or a wire over the edge instead of through the eye, is a defect.'),
      tk('Clearance, flush cut, tinning and soldering are the same as on a turret.'),
    ],
    numbers: [
      { label: tk('Hook'), value: tk('in the arc: ≥ 2 diameters from the base, ≥ 1 from the end') },
      { label: tk('Pierced tab'), value: tk('through the eye; 180° target, 90° minimum') },
      { label: tk('Insulation clearance'), value: tk('target 1 diameter (1.3 mm), at most 2 (2.6 mm)') },
    ],
    figure: { src: 'lessons/neets14/fig-3-8b.png', more: ['lessons/neets14/fig-3-8c.png', 'lessons/neets14/fig-3-8d.png'], caption: tk('NEETS 14, figure 3-8 (B, C, D). Bifurcated, hook and pierced terminals.') },
    original: [
      'ABOVE-THE-BOARD TERMINATION.—Above-the-board termination is accomplished through the use of terminals or posts. Terminals are used for a variety of reasons. The type of terminal depends on its use. Although many configurations are used, all terminals fall into one of the five categories covered in this section. (NEETS 14, p. 3-11)',
      'BIFURCATED OR FORK TERMINALS [view (B)] are solid or hollow double-post terminals. Turret and bifurcated terminals are used for interfacial connections on printed circuit boards, terminal points for point-to-point wiring, mounting components, and as tie points for interconnecting wiring. Hook terminals are used to provide connection points on sealed devices and terminal boards. (NEETS 14, p. 3-14)',
      'HOOK TERMINALS [view (C)] are made of cylindrical stock formed in the shape of a hook or question mark. PERFORATED OR PIERCED TERMINALS [view (D)] describe a class of terminals that uses a hole pierced in flat metal for termination (e.g., terminal lugs).',
      'The wires are attached within the 180° arc of the hook. (Defect: the wire is attached less than two wire diameters, including insulation, from the base of the terminal, one wire diameter from the end of the hook, or outside the arc of the hook.)',
      'The wire contacts two parallel sides (180° bend) of the terminal. The wire passes through the eye of the terminal. (Acceptable: the wire to terminal contact is greater than or equal to 90°, provided the wire does not overlap itself.)',
      'Multiple wires are attached in alternating directions. (Defect: multiple wires overlap each other on the terminal.)',
    ],
    task: tk('Wire hook E1 to tab E2 and hook E1 to tab E3 (W). On the hook, keep the wire in the arc and bend the second wire the other way round from the first; on the tabs, through the eye. Solder E1 with both wires on it, then the tabs, and clean the flux off.'),
    questions: [
      { ref: 'Q8', q: tk('Turret, bifurcated, and hook terminals are used for what type of termination?'), a: tk('Above-the-board termination.'), page: '3-14' },
    ],
  },
  {
    scenario: 'hr-solder-cup',
    source: { ...TO_SOURCE, pages: '09-5.3 – 09-5.4, 09-6.1' },
    objectives: [
      tk('Size a wire end for a solder cup: full depth, one diameter of clearance.'),
      tk('Fill a cup the 2M way: pre-filled, wire into the molten solder, held still.'),
    ],
    points: [
      tk('The wire goes straight into the cup, along its axis, for the full depth of the cup, touching the back wall.'),
      tk('Clearance: one wire diameter between the insulation and the top edge of the cup. Up to two is acceptable; insulation in the solder fillet, or more than two, is a defect. NEETS Module 4 (1998) gave about 1/32 in; the current manual\'s rule is graded here.'),
      tk('Fill: 100 % of the cup\'s cutout is the target, at least 75 % with full wetting is acceptable. The tinning on the wire alone does not fill a cup: add solder.'),
      tk('Tip at 600 °F (316 °C), as low as possible on the back of the cup; no pressure on the cup. Burned insulation is a defect.'),
      tk('No external flux in a cup: it makes the solder spill and wick. The flux comes from the cored solder.'),
      tk('The 2M way: tin the empty cup, wick it out, and do that twice on a gold-plated cup (gold embrittlement). Then put solder in, melt it (within 2 s), slide the tinned wire into the molten solder to the back wall and the bottom, and hold it still until it sets.'),
      tk('Tightly spaced cups are soldered with resistive tweezers (T.O. 09-5.4): the current heats only the cup between the tips, and only while it flows.'),
    ],
    numbers: [
      { label: tk('Cup depth'), value: tk('2.5 mm (estimate for this cup)') },
      { label: tk('Strip length'), value: tk('cup depth + 1 wire diameter') },
      { label: tk('Fill'), value: tk('100 % target, at least 75 %') },
      { label: tk('Melt'), value: tk('within 2 s (4 s when wicking the cup out)') },
    ],
    figure: { src: 'lessons/neets14/fig-3-8e.png', caption: tk('NEETS 14, figure 3-8 (E). Solder cup.') },
    original: [
      'SOLDER CUP TERMINALS [view (E)] are a common type found on connectors.',
      'The wire contacts the back wall of the solder cup or contacts other inserted wires for the full depth of the cup. (Defect: the wire is not inserted for the full depth of the solder cup.)',
      'There is an insulation clearance of one wire diameter (including insulation) between the end of the insulation and the top edge of the solder cup where the wire first makes contact. (Defect: the wire insulation contacts the solder fillet or is greater than two wire diameters.)',
      'Solder vertical fill is 100% of the cutout section of the face of the cup, complete wetting between the wire and the cup, forming a concave fillet between the wire and the top of the solder cup. (Defect: solder vertical fill is less than 75% of the cutout section of the face of the cup or complete wetting is not evident between the wire and the solder cup.)',
      'Clean the solder cup with isopropyl alcohol. Note: The application of external flux could promote solder spillage and should not be used. (T.O. 00-25-259, 09-5.3, step 7)',
      'Repeat steps 7 through 27 once for gold plated solder cups and until the interior, the milled face, and the corners of the solder cup are clean, shiny and covered with a thin layer of solder. Note: Double tin gold plated solder cups to ensure removal of the gold plating. (09-5.3, step 28)',
      'Upon solder melt, immediately insert the tip of the wire partially into the solder cup at an angle. Hesitate momentarily to overcome the heat-sinking action. After the solder melts again, move the wire slowly to the back of the cup wall and to the bottom of the solder cup. DO NOT USE PRESSURE OR ALLOW MOVEMENT OF THE WIRE DURING THE SOLDER COOLING PROCESS. (09-5.3, steps 41–45)',
      'Use this procedure for wire installation in tightly spaced solder cups. (09-5.4, Solder Cup Wire Installation (Resistive Tweezers) Procedure)',
      'Wires to be soldered to connectors should be stripped so that when the wire is placed in the barrel, there will be a gap of approximately 1/32 inch between the end of the barrel and the end of the insulation. This is done to prevent burning the insulation during the soldering process and to allow the wire to flex easier at a stress point. (NEETS Module 4, p. 2-24)',
    ],
    task: tk('Wire turret E1 to cup E2 and to cup E3 (W). For a cup, the strip length is the whole story: deep enough to bottom out, short enough to leave one wire diameter above the rim. Fill each cup with fresh flux-cored solder ("+ flux"; no extra rosin in a cup), solder E1, and clean the flux off.'),
    questions: [
      { ref: 'Q23', module: 4, q: tk('Why should wire be stripped 1/32 inch longer than the depth of the solder barrel?'), a: tk('To prevent burning the insulation during the soldering process and to allow the wire to flex easier at a stress point.'), page: '2-26' },
      { ref: 'Q33', module: 4, q: tk('What is an advantage of using a resistance soldering iron when soldering wire to a connector?'), a: tk('The soldering tips are hot only during the brief period of soldering the connection, thus minimizing the chance of burning the wire insulation or connector inserts.'), page: '2-32' },
    ],
  },
);

// Clinched leads: NEETS Module 14 (termination styles, removal, refitting) and the 2M manual's
// procedure for freeing a clinched lead on a double-sided board and its full-clinch standard.
CONTENT.push({
  scenario: 'hr-clinched-leads',
  source: { ...TO_SOURCE, pages: '07-5.4, 07-5.11.3, 07-6.17 – 07-6.18' },
  objectives: [
    tk('Free a clinched lead on a double-sided board without damaging the barrel or the pad.'),
    tk('Refit a part with a full clinch to the 2M standard.'),
  ],
  points: [
    tk('A clinched lead is bent over its pad on the solder side: fully (90°) or semi (45°). It holds the part while it is soldered, and it holds it during rework too.'),
    tk('To free it on a double-sided board: wick the surface solder until only a sweat joint remains, break that joint by turning the lead 15° with duckbill pliers, and straighten the lead with a non-metallic tool. Never pull a lead still soldered over its pad: the pad comes off.'),
    tk('Then refill: add fresh solder until the pads on both sides are full, let it cool, clean it, and only then clear the hole with continuous vacuum. The extractor needs that solder to pull the barrel clean (T.O. 07-5.4, steps 10–23).'),
    tk('Cautions: do not break the sweat joint left in the barrel of a plated hole, take extra care on an isolated pad, and never turn a DIP\'s clinched lead.'),
    tk('Refit the replacement the way the original was fitted. A full clinch is formed in the direction of the conductor and cut to one pad diameter: at least one pad radius, at most two diameters, never past the edge of the pad or its conductor.'),
    tk('A lead on an isolated pad is not fully clinched: use a semi-clinch there. NEETS (1998) allowed no clinch past the pad at all; the current manual\'s limits are graded here.'),
  ],
  numbers: [
    { label: tk('Full clinch'), value: tk('90°; 75° at least') },
    { label: tk('Clinched length'), value: tk('1 pad diameter; ½ to 2 acceptable') },
    { label: tk('Sweat joint'), value: tk('break by turning the lead 15°') },
  ],
  figure: { src: 'lessons/neets14/fig-3-5a.png', more: ['lessons/neets14/fig-3-5b.png'], caption: tk('NEETS 14, figure 3-5. Fully clinched (left) and semiclinched (right) leads; the scan prints "(A) FULLY CLINCHED" under both.') },
  original: [
    'Both clinched-lead types, FULLY CLINCHED and SEMICLINCHED (figure 3-5), provide component stability. Like the fully clinched lead, the semi-clinched lead also provides stability during assembly. However, this termination can be easily straightened to allow removal of the solder joint should rework or repair be required. Note that the fully clinched lead is bent 90 degrees while the semiclinched lead is bent 45 degrees. (NEETS 14, p. 3-9)',
    'Working with clinched leads on uncoated boards requires that all sweat joints be removed and that the leads be unclinched before removal. (NEETS 14, p. 3-19)',
    'Use the Wicking Procedure or the Continuous Vacuum Extraction Procedure to remove surface solder until only a sweat joint remains. Break the surface sweat joint by using duckbill pliers to rotate the clinched lead 15°. Straighten the component lead using a non-metallic tool, being careful not to apply pressure to the plated-through hole. (T.O. 00-25-259, 07-5.4)',
    'CAUTION: DO NOT BREAK THE SWEAT JOINT REMAINING IN THE BARREL OF A PLATED-THROUGH HOLE. USE EXTREME CAUTION WHEN FREEING A CLINCHED LEAD FROM AN ISOLATED PAD. DO NOT ROTATE THE LEAD WHEN DESOLDERING DIP CLINCHED LEADS. (07-5.4, step 8)',
    'Add solder to fill completely the pad areas on both sides of the CCA. Remove the solder and the soldering iron tip simultaneously. ... Allow the solder joints to cool completely before cleaning. ... Remove solder using the Continuous Vacuum Extraction Procedure (paragraph 07-5.2.1). (07-5.4, steps 18–23)',
    'When clinching is required, leads on single- and double-sided boards are securely clinched in the direction of the printed wiring connected to the pad. The leads are clipped so that their minimum clinched length is equal to the radius of the pad. (NEETS 14, p. 3-22)',
    'The lead length after termination equal to one pad diameter. The clinched lead is formed in the direction of the connecting conductor. The clinch angle is 90°. (Defect: a clinched lead extends beyond the edge of the pad or the edge of a connecting conductor; a lead terminating on an isolated pad is fully clinched.) (T.O. 00-25-259, 07-6.18)',
  ],
  task: tk('R2 burned open. Free both of its clinched leads (wick, Lead pliers; refill the pads with fresh solder, then the extractor), take it out, and fit a new 330 Ω resistor with a full clinch along its runs, one pad diameter long (Bench → Lead termination). Solder, clean, and run the tests.'),
  questions: [
    { ref: 'Q7', q: tk('Name two types of through-hole termination.'), a: tk('Clinched lead, straight-through, and offset pad.'), page: '3-14' },
    { ref: 'Q18', q: tk('In what direction are component leads clinched on single- and double-sided boards?'), a: tk('In the direction of the run.'), page: '3-22' },
  ],
});

// Burned laminate: NEETS Module 14 "Burned Board Repair" and the 2M manual's surface patch.
CONTENT.push({
  scenario: 'hr-laminate',
  source: { ...TO_SOURCE, pages: '11-5.1.3, 11-5.2, 11-6.1 – 11-6.4' },
  objectives: [
    tk('Tell a surface burn from one through the board, and pick the repair.'),
    tk('Excavate, undercut, bevel, fill and finish a surface patch to the 2M standard.'),
  ],
  points: [
    tk('Burns that damage the surface of the laminate are repaired; slight discoloration is acceptable. Charred epoxy conducts, so a burn is a fault in the circuit, not just a mark.'),
    tk('A surface patch is for damage that does not go through the board. Take out the parts over it, then excavate all the damaged laminate with a ball mill in a crosshatch: at least 75 % of the thickness, so the undercut has room.'),
    tk('Straight-wall the sides, undercut them about 50 % of the thickness with a slotting saw, centred in the wall, and bevel the top edge one laminate thickness wide: the undercut and bevel hold the repair material.'),
    tk('Fill the undercut first with bubble-free epoxy, then the excavation, overfilling about 5 %. Cure it, abrade it back to the original level, and buttercoat the exposed fiber weave.'),
    tk('Round the undercut\'s corners and never let the bevel form a knife-edge at the undercut: both are defects (T.O. 11-6.2). Bubbles in the fill: none is the target; each at most 20 % of the laminate thickness and 5 % of the fill\'s volume (11-6.3).'),
    tk('NEETS (1998) mixed epoxy with powdered fiberglass; the 2M manual fills with epoxy alone. A burn through the board takes a through-the-board patch or plug instead (11-5.3, 11-5.4).'),
    tk('On a multilayer board a 75 % excavation would cut into the inner layers: multilayer repair is a separate procedure (T.O. WP 015 00), for microminiature-certified technicians.'),
  ],
  numbers: [
    { label: tk('Excavation depth'), value: tk('75 % of the laminate thickness') },
    { label: tk('Undercut'), value: tk('about 50 % of the thickness, deep and wide') },
    { label: tk('Bevel'), value: tk('one laminate thickness wide') },
    { label: tk('Overfill'), value: tk('about 5 % of the thickness, then level') },
    { label: tk('Bubbles in the fill'), value: tk('each ≤ 20 % of the thickness, ≤ 5 % of the volume in all') },
  ],
  diagram: 'patch',
  figure: { src: 'lessons/neets14/fig-3-28.png', more: ['lessons/neets14/fig-3-29.png'], caption: tk('NEETS 14, figure 3-28 (repair of surface damage: the patch stays in the surface) and figure 3-29 (grinding out the charred material; this drawing shows a burn right through the board, which takes a through-the-board repair).') },
  original: [
    'Scorched, charred, or deeply burned boards should be inspected to determine the size of the discolored area and to identify melted or blackened conductors and burned, melted, or blackened components. The depth of the damage, which may range from a slight surface discoloration to a hole burned through the circuit board, should also be determined. Damage not extending through the board may be repaired by patching (figure 3-28). (NEETS 14, p. 3-36)',
    'After all damaged board material is removed, the edge of the removed area is beveled and undercut to provide holding points for the repair material. A compound of epoxy and powdered fiberglass is mixed and used to fill the cutaway area. (NEETS 14, p. 3-37)',
    'Excavate damaged laminated material using a ball mill or other suitable tool, working across the surface in one direction, then turning the CCA 90° making a crosshatch pattern. Repeat until all damaged laminate material is removed. Note: To facilitate the undercut the excavation must be at least 75% of the thickness of the laminate. (T.O. 00-25-259, 11-5.2)',
    'Undercut the excavated area on the damaged laminate using a slotting saw. The undercut should be centered in the straight wall of the excavation. Enlarge the undercut to a depth and width of approximately 50% of the laminate thickness with a ball mill in a pin vise. Bevel the top edges of the excavated area to a width equal to the laminate thickness. (T.O. 00-25-259, 11-5.2)',
    'The corners of the undercut are rounded. (Defect: a corner of the undercut is not rounded.) The widths of the bevels are equal to one laminate thickness. (Defect: the angle of the bevel forms a knife-edge at an undercut.) (T.O. 00-25-259, 11-6.2)',
    'There are voids or air bubbles smaller than or equal to 20% of the laminate thickness in the fill area. The volume of bubbles in the fill area is equal to or less than 5% of the volume of the fill area. (Acceptable; larger is a defect.) (T.O. 00-25-259, 11-6.3)',
    'Fill the excavated area with epoxy, overfilling the repair area by about 5% of the laminate thickness and covering the entire bevel area. Restore the fill area to the original laminate level using abrasive methods. Apply a thin layer of epoxy (buttercoat) to the repair area covering and overlapping the exposed fiber weave in the repair area. (T.O. 00-25-259, 11-5.2)',
  ],
  task: tk('Take R2 out, repair the burned laminate under it with a surface patch (Laminate repair, A: excavate, then fill and finish), fit a new 330 Ω R2, solder, clean, and run the tests.'),
  questions: [
    { ref: 'Q33', q: tk('What combination of materials is used to patch or build up damaged areas of boards?'), a: tk('Epoxy and fiberglass powder. (The 2M manual fills with epoxy alone.)'), page: '3-37' },
  ],
});

// TO packages: NEETS Module 14 pp. 3-27 – 3-28.
CONTENT.push({
  scenario: 'hr-to-package',
  source: { ...NEETS14_SOURCE, pages: '1-28, 3-27 – 3-28' },
  objectives: [
    tk('Replace a TO can the way the manufacturer mounted it, tab in the right place.'),
    tk('Remove a plug-in or an embedded TO without forcing it.'),
  ],
  points: [
    tk('TO cans are plugged in (leads through the board, flush, on a spacer or over an air gap) or embedded in a cut-out. The manufacturer chose the mounting for heat dissipation, short-circuit protection or support: replace the part the same way.'),
    tk('Removing a plug-in TO is like removing a DIP or a discrete part: coating off if there is one, each lead desoldered, then the part gently lifted out.'),
    tk('If the leads are not completely free, the part is not forced out: pressure damages the board. A part known to be defective may have its leads clipped first and the stubs removed one by one.'),
    tk('Seat the new can with its reference tab where the old one was: viewed from the bottom, TO-5 leads are counted clockwise from the tab. Formed leads must not touch the case.'),
    tk('On the 2N2219A, as on most metal-can transistors, the collector is connected to the case: a can mounted flush over a trace can short to it. That is one reason for a spacer.'),
    tk('An embedded TO sits in a cut-out: mask the area, coating off, desolder each lead, then push it gently out of the board. If it does not slip out, the leads are not free: clip them and take them out after the can.'),
  ],
  numbers: [
    { label: tk('Q1'), value: tk('2N2219A, TO-39 can, on a spacer') },
    { label: tk('Lead circle'), value: tk('0.200 in (5.08 mm)') },
    { label: tk('Can'), value: tk('connected to the collector') },
  ],
  figure: { src: 'lessons/neets14/fig-3-19.png', caption: tk('NEETS 14, figure 3-19. TO mounting techniques. The figure shows a multilead TO-5 package (0.270 in lead spread); the 3-lead TO-39 here has a 0.200 in circle.') },
  original: [
    'Notice that plug-ins may either be mounted flush with the board surface or above the surface with or without a spacer. The air gap or spacer may be used by the manufacturer for a particular purpose. This type of mounting could be used for heat dissipation, short circuit protection, or to limit parasitic interaction between components. The spacer also provides additional physical support for the TO. The technician is responsible for using the same procedure as the manufacturer to replace TOs or any other components. (p. 3-27)',
    'The procedure for removal of plug-in TOs (with or without conformal coatings) is the same as that used for a similarly mounted DIP or discrete component. The conformal coating is removed if required. Leads are desoldered and gently lifted out of the board. Then board terminals and component leads are cleaned. (p. 3-28)',
    'The removal of an imbedded TO package varies only slightly from the removal of other types of mountings. First, the work area is masked and the conformal coating is removed if required. Then the desoldering handpiece is used to remove the solder from each lead. When all leads are free, the TO is pushed out of the board. If all the leads are free, the TO should slip out of the board easily. The package should not be forced out of the board. Excessive pressure may cause additional damage. If the leads are not completely free, the leads must be clipped and removed after the package is out of the board. (p. 3-28)',
    'The TO-5 can has a tab for the reference mark. When numbering the leads, you must view the TO-5 can from the bottom. Pin 1 will be the first pin in a clockwise direction from the tab. All other pins will be numbered consecutively in a clockwise direction from pin 1. (p. 1-28)',
    'When the new part or the one that was removed is installed, the leads are slipped through the spacer if required, and the part is properly positioned (reference tab in the proper location). The leads are aligned with the terminal holes and gently pressed into position. The part is soldered into place and visually inspected. Then the card is tested and the conformal coating is replaced if required. (p. 3-28)',
  ],
  task: tk('Q1, a 2N2219A on a spacer, failed. Clear its three holes, lift it out, fit a new one on a spacer (Bench → TO mounting), shunt each lead while you solder it, clean, and test with SW1.'),
  questions: [
    { ref: 'Q25', q: tk('How are imbedded TOs removed once the leads are free?'), a: tk('By pushing it gently out of the board.'), page: '3-31' },
    { ref: 'Q35', q: tk('Viewed from the bottom, TO-5 pins are counted in what direction?'), a: tk('Clockwise.'), page: '1-32' },
  ],
});

// Flat packs: NEETS Module 14 pp. 3-29 – 3-31, with the 2M manual's gull-wing removal and lead forming.
CONTENT.push({
  scenario: 'hr-flat-pack',
  source: { ...NEETS14_SOURCE, pages: '1-27, 3-14, 3-29 – 3-31' },
  objectives: [
    tk('Find pin 1 on a DIP or flat pack and count its pins.'),
    tk('Remove a flat pack lead by lead, and form, cut and lap-solder a new one.'),
  ],
  points: [
    tk('Pin 1: viewed from the top, it is the first pin counterclockwise from the reference mark (a notch, dot or tab), and the pins are numbered counterclockwise from it. Sketch the mark\'s position before you remove the part.'),
    tk('A flat pack sits on the board, its leads lap-soldered onto lands: no holes. Sketch its position before you remove it, and take off any coating.'),
    tk('Removal is lead by lead: heat a lead until its solder is completely molten, then lift it off its land with a dental pick or tweezers. Lifting before complete melt damages the land. When every lead is free, lift the part away.'),
    tk('A replacement comes in a holder with long straight leads: tin them, form them with two distinct bends (radius at least one lead thickness; NEETS asked for two), starting at least one lead width out from the body, and cut them so the lead on the land is 50–80 % of the land length, its toe never past the land.'),
    tk('A removed flat pack is not used again: the heat of removal cracks the joint between its leads and the inside of the part (T.O. 18-5.4.3). NEETS (1998) still allowed reuse with care.'),
    tk('A flat pack is an on-the-board (lap flow) termination: the lead is soldered to its pad without passing through the board.'),
    tk('Lap-solder each lead to its pretinned land in a skipping pattern: a full fillet, the lead still visible. Clean, inspect, test.'),
  ],
  numbers: [
    { label: tk('Lead pitch'), value: tk('0.050 in (1.27 mm)') },
    { label: tk('Lead on the land'), value: tk('50–80 % of the land length') },
    { label: tk('Lead out from the body before the first bend'), value: tk('≥ 1 lead width') },
    { label: tk('Tip'), value: tk('600 °F (316 °C), melt within 2 s') },
  ],
  figure: { src: 'lessons/neets14/fig-3-22a.png', more: ['lessons/neets14/fig-3-22b.png'], caption: tk('NEETS 14, figure 3-22. Properly formed flat pack leads.') },
  original: [
    'To remove the flat pack, the 2M technician carefully heats the leads and lifts them free with tweezers. If the part is to be reused, special care is taken not to damage or bend the leads. The work area around the component should then be thoroughly cleaned and prepared for the new part. (p. 3-29)',
    'Because most replacement flat packs come with leads that are longer than required, they must be trimmed before they are soldered. The removed part is used as a guide in determining lead length. (p. 3-31)',
    'Before a connection is lap-soldered, the solder pads are cleaned and pretinned and the component leads are tinned. The IC is properly positioned on the pad areas, and the soldering process is a matter of "sweating" the two conductors together. When multilead components, such as ICs, are soldered, a skipping pattern is used to prevent excessive heat buildup in a single area of the board or component. (p. 3-31)',
    'NOTE: SMDS SHOULD NOT BE REUSED AFTER REMOVAL—THE HIGH TEMPERATURES IMPOSED ON THE DEVICES DURING REMOVAL LEAD TO CRACKING AND FATIGUE OF THE CONNECTION BETWEEN THE SMD LEAD AND THE INTERIOR OF THE SMD. (T.O. 00-25-259, 18-5.4.3)',
    'LIFTING OF THE LEAD BEFORE COMPLETE SOLDER MELT MAY CAUSE THE LAND TO BE DAMAGED. FOOTPRINTS (LEAD INDENTATIONS) LEFT IN THE SOLDER ARE AN INDICATION OF LIFTING THE LEAD BEFORE COMPLETE SOLDER MELT. (T.O. 00-25-259, 18-5.4.3)',
    'The lead length is 50-80% of the land length. (Defect: the lead length is less than the lead width or the toe of the lead overhangs the land.) (T.O. 00-25-259, 18-6.6)',
    'The leads extend at least one lead width from the flat pack body before the start of the first bend. The inside bend radius of the flat pack lead is at least one lead thickness. (T.O. 00-25-259, 18-6.6)',
    'When the package is viewed from the top, pin 1 will be the first pin in the counterclockwise direction next to the reference mark. ... When the package is viewed from the top, all other pins are numbered consecutively in a counterclockwise direction from pin 1. (p. 1-27)',
    'ON-THE-BOARD TERMINATION.—On-the-board termination (figure 3-9) is also called LAP FLOW termination. In a lap flow solder termination, the component lead does not pass through the circuit board. (p. 3-14)',
  ],
  task: tk('FP1 burned out. Lift its ten leads one by one (iron on the lead until it is completely molten, then L), in a skipping pattern, and lift it away. Fit a new FP1 with formed leads cut to 50–80 % of the land (Bench → Flat pack leads), lap-solder every lead in a skipping pattern with "+ flux", clean, and test.'),
  questions: [
    { ref: 'Q26', q: tk('How is a flat pack removed from a pcb?'), a: tk('Heat each lead and lift with tweezers.'), page: '3-31' },
    { ref: 'Q32', q: tk('On DIP and flat-pack ICs viewed from the top, pin 1 is located on which side of the reference mark?'), a: tk('Left.'), page: '1-32' },
    { ref: 'Q33', q: tk('DIP and flat-pack pins are numbered consecutively in what direction?'), a: tk('Counterclockwise.'), page: '1-32' },
    { ref: 'Q9', q: tk('When a lead is soldered to a pad without passing through the board, it is known as what type of termination?'), a: tk('On-the-board termination.'), page: '3-14' },
  ],
});

/** The whole lesson (meta and content) for a board. */
export function lessonFor(scenarioId: string): Lesson | undefined {
  const m = LESSON_META.find((l) => l.scenario === scenarioId), c = CONTENT.find((l) => l.scenario === scenarioId);
  return m && c ? { ...m, ...c } : undefined;
}

export const LESSONS: Lesson[] = LESSON_META.map((m) => lessonFor(m.scenario)!);
