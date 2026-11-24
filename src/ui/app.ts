import type { Board, Component, LedColor, Objective, Scenario, Side, V2 } from '../types';
import { clearFault, injectFault, listFaults, rng, setFaultRangeOverlay, severityHint, type FaultClass } from '../faults';
import { buildFaultRegistry, faultTypesFor, injectFaultType, type FaultRegistry } from '../mods/faulttypes';
import { FAULT_CLASSES } from '../mods/puzzles';
import { OFFICIAL_METER, buildMeterRegistry, type MeterRegistry } from '../mods/meters';
import { buildRuleSet, type RuleSet } from '../mods/rules';
import type { Candidate } from '../mods/rules-engine';
import { dist, transform4 } from '../geom';
import { buildConnectivity, netsNear, type Conn } from '../connectivity';
import { BAND_RGB, GOLD_RGB, KIND_NAMES, LED_COLORS, e12Values, fmtOhm, fmtSI, marking, padWorld, parseValue, resistorBands } from '../model';
import { addBlob, addJumper, cutTrace, installPart, removeBlob, removeJumper, removePart, toggleCold } from '../ops';
import { LED_ON_I, measureDiode, measureOhms, type Sim } from '../sim';
import { measureDiodeSpice, measureOhmsSpice } from '../spice/adapter';
import { AMMETER_SHUNT, activeDmm, setActiveDmm, contactResistance, displayAmps, displayVolts, measureCapDmm, measureDiodeDmm, measureOhmsDmm, placementRng, type Reading } from '../spice/dmm';
import { boardToCircuit } from '../spice/board';
import { writeSpice } from '../spice/netlist';
import { netAt, pickAt, type PickHit } from '../pick';
import { objectiveLabel, runSolver, verifyScenario, type Solver, type VerifyResult } from '../verify';
import { lockFlag, packText, topology, unpackText } from '../crypto';
import { serializeScenario } from '../io/format';
import { importScenarioOrPcb } from '../io/kicad';
import { MOD_FORMAT, itemAddress, type LoadedMod, type ModBoard, type ModManifest } from '../mods/mods';
import { OFFICIAL_MODS, officialBoardAddress } from '../mods/official';
import { applyBoardPatches, boardView, writeBoardView, type BoardView, type PatchEntry, type PatchResult } from '../mods/patches';
import { buildPuzzle, puzzleScenarioId, type PuzzleSpec } from '../mods/puzzles';
import { staleEntries, type Confidence, type KnowledgePack } from '../mods/knowledge';
import { referenceBoard } from '../scenarios/reference';
import { allDevices, deviceOverlay, setDeviceOverlay } from '../spice/devicelib';
import { buildDeviceOverlay, type DeviceOverlay } from '../mods/devices';
import { SOLVERS } from '../mods/solvers';
import type { BenchContext, BenchReport } from '../mods/benchcheck';
import type { ModRequest } from '../mods/api/host';
import { NO_CODE_HOST, type CodeHostLike } from '../mods/api/nohost';
import type { PanelNode } from '../mods/api/types';
import { buildNetlist, simFromResult } from '../mods/api/netlist';
import { ModioError, downloadMod, forgetModioInstall, listMods, modioConfig, modioState, rememberModioInstall, type ModioMod, type ModioSort } from '../mods/modio';
import { desktop, emptyModResult, installMod, loadAllMods, modsFolderPath, removeInstalled, type ModLoadResult } from '../mods/sources';
import type { CommunityUi } from './community-ui';
import { MY_MODS, OFFICIAL, bootBegin, bootDone, bootModsRunning, deleteLoadout, isModOn, newLoadout, readLoadouts, safeMode, setModOn, switchLoadout, writeLoadouts, type LoadoutStore } from '../mods/loadouts';
import type { ModNeed } from '../mods/resolve';
import { writeZip } from '../mods/zip';
import { builtinScenarios } from '../scenarios/builtin';
import { generateProblem } from '../scenarios/generate';
import { Builder } from '../scenarios/builder';
import { dailyKey, dailyPlan, dailyLevel, makeDaily, msToNextDaily } from '../scenarios/daily';
import { BOARD_INFO, LEVEL_BANDS, PATH_ORDER, SKILLS, SKILL_GROUPS, boardLevel, levelFromPlayers, shownLevel, learnedSkills, levelBand, newSkillsFor, skillLabel, splitTitle, todayPicks, type BandId, type PickReason, type SkillKey } from '../scenarios/catalog';
import { BOTH_GAP, Camera } from '../render/camera';
import { EMISSIVITY, ThermalModel, apparentTemp } from '../thermal';
import { FlexField, settleIntermittents, updateIntermittents } from '../intermittent';
import { BootController, requiredRails, type RequiredRail } from '../boot';
import { cleanFluxWithIpa, cleanWithIpa, fluxResidueNear, residueNear } from '../residue';
import { discoverPowerTree, railVoltage, type PowerTree } from '../spice/powertree';
import { fmtHz, sampleSignal, signalOn, type ScopeSignal } from '../scope';
import type { PowerStateName } from '../spice/sequencer';
import { HOTAIR_H, IRON_G, PREHEAT_H, ReworkMonitor, limitsFor, type ReworkEvent, type ReworkHistory } from '../rework';
import { inspect, type Inspection } from '../workmanship';
import { lessonFor } from '../lessons/neets14';
import { SOLDERING_TRACK_IDS } from '../scenarios/soldering';
import { debriefHtml, lessonAccepted, lessonBriefHtml } from './lesson-ui';
import { Renderer, type RendererKind, type VizMode } from '../render/renderer';
import { NoAdapterError, gpuDiagnosis, webGlInfo } from '../render/gpuprobe';
import { gpuHelp } from './gpuhelp';
import { setSoundEnabled, sfxBeep, sfxBlow, sfxClick, sfxCut, sfxSolder, sfxWin, soundEnabled } from './audio';
import { icon } from './icons';
import { chromeIntentUrl, inAppBrowser } from './inapp';
import { LANGUAGES, lang, saveLanguage, t, t as translate, tk } from '../i18n';
import { onFirstHide, secondsBucket, trackEvent, visibleClock } from '../analytics';
import { APP_BUILD, mountFeedbackForm, type FeedbackContext } from './feedback';
import { AttemptTracker, browserSender, daysSinceFirstPlay, setStatsSwitch, startActiveClock, statsSwitchOn, type PuzzleInfo } from '../attempts/client';
import { shortHash } from '../attempts/record';
import { attemptScore, loadSkill, saveSkill, setFittedLevels, update as updateSkill, type Skill } from '../scenarios/adaptive';
import { boardDiff, encodeSnapshot, type BenchSnapshot } from '../snapshot';
import { BRAND, markSvg } from './logo';
import { beginnerPrimerHtml, CHALLENGE_TRACK_IDS, lessonDock, TUTORIAL_SCENARIO_IDS, TUTORIAL_TOPICS, getTutorialSteps, isTutorialScenario, nextTutorialScenarioId, type TutorialStep } from './tutorial';
import { TOOL_SHORT, TOOL_TIP_PHONE, TouchGestures, splitLead, touchCopy, wantsMobileLayout } from './touch';
import { cursorStops, describeAt, stepToward } from './boardcursor';

type ToolId = 'inspect' | 'dmm' | 'iron' | 'wick' | 'flip180' | 'jumper' | 'knife' | 'replace' | 'freeze' | 'ipa' | 'press' | 'hotair' | 'scope' | 'rosin';
type PanelTab = 'mission' | 'inspect' | 'studio' | 'mods';
type DmmMode = 'V' | 'OHM' | 'DIODE' | 'CAP' | 'AMP';

interface ProbePin {
  pos: V2;
  side: Side;
  net: number;
  label: string;
}

const TOOLS: { id: ToolId; key: string; ico: string; lbl: string; tip: string }[] = [
  { id: 'inspect', key: '1', ico: 'pointer', lbl: tk('Select'), tip: tk('Select parts and nets, press switches') },
  { id: 'dmm', key: '2', ico: 'meter', lbl: tk('Multimeter'), tip: tk('Left-click places red probe, right-click or Shift+click places black probe, Esc clears them') },
  { id: 'iron', key: '3', ico: 'iron', lbl: tk('Soldering iron'), tip: tk('Reflow joints, bridge gaps, solder parts') },
  { id: 'wick', key: '4', ico: 'eraser', lbl: tk('Desolder wick'), tip: tk('Remove solder bridges, jumpers or parts') },
  { id: 'flip180', key: '5', ico: 'rotate', lbl: tk('Rotate 180°'), tip: tk('Reverse part orientation') },
  { id: 'jumper', key: '6', ico: 'wire', lbl: tk('Jumper wire'), tip: tk('Click start then end point; works across sides') },
  { id: 'knife', key: '7', ico: 'scissors', lbl: tk('Trace cutter'), tip: tk('Cut a copper trace') },
  { id: 'replace', key: '8', ico: 'box', lbl: tk('Parts bin'), tip: tk('Replace or change a component') },
  { id: 'freeze', key: '9', ico: 'snow', lbl: tk('Freeze spray'), tip: tk('Frost an area: on a powered board the hot part defrosts first (Thermal view shows temperatures)') },
  { id: 'ipa', key: '0', ico: 'drop', lbl: tk('Isopropyl'), tip: tk('Wet / scrub an area with IPA: evaporates first on the hottest part; dissolves liquid-damage residue') },
  { id: 'hotair', key: 'h', ico: 'wind', lbl: tk('Hot air'), tip: tk('Realistic rework: 3 s of hot air (400 °C) over the spot; melt every joint of a part before lifting it with the wick') },
  { id: 'rosin', key: 'r', ico: 'rosin', lbl: tk('Rosin'), tip: tk('Rosin method: coat an area white with rosin; on a powered board it melts clear first on the hottest part') },
  { id: 'scope', key: 'o', ico: 'scope', lbl: tk('Oscilloscope'), tip: tk('Clip the scope probe (CH1) on a net: rail ramps and boot loops (Roll), switching nodes, ripple and clocks (Auto)') },
  { id: 'press', key: 'b', ico: 'hand', lbl: tk('Press / flex'), tip: tk('Press on the board for 2.5 s: reveals cracked joints that open or close under flex') },
];

/** Board kinds in the picker's Type filter. */
type BoardKind = 'tutorial' | 'track' | 'handmade' | 'open' | 'mod' | 'custom';
const KIND_LABEL: Record<BoardKind, string> = {
  tutorial: tk('Tutorial'), track: tk('Soldering track'), handmade: tk('Hand-made'), open: tk('Open hardware'), mod: tk('Mod'), custom: tk('Imported or your own'),
};

const LED_COLOR_NAMES: Record<LedColor, string> = {
  red: tk('red'), orange: tk('orange'), yellow: tk('yellow'), green: tk('green'), blue: tk('blue'), white: tk('white'),
};

/** Visible time without a bench after which the player is told and offered a way out. */
const SLOW_START_MS = 10_000;
const fmtDur = (s: number) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`;

function cloneBoard(b: Board): Board {
  return structuredClone(b);
}

function makeStarterBoard(): Scenario {
  const k = new Builder(60, 36);
  const bt = k.coin('BT1', 3, [15, 18]);
  const r1 = k.resistor('R1', 100, [36, 24]);
  const d1 = k.led('D1', 'green', [50, 18]);
  k.track('F', [k.pad(bt, '1'), [15, 24], k.pad(r1, '1')], 0.8, '+3V');
  k.track('F', [k.pad(r1, '2'), [50, 24], k.pad(d1, '2')], 0.8, 'LED_A');
  k.track('F', [k.pad(d1, '1'), [50, 8], [27, 8], k.pad(bt, '2')], 0.8, 'GND');
  k.text([34, 3.2], 'CUSTOM SANDBOX', 1.4);
  return {
    format: 'pcbfix/1',
    id: 'custom-' + Date.now().toString(36),
    meta: {
      title: tk('Custom Sandbox Board'),
      author: tk('You'),
      difficulty: 1,
      description: tk('A clean, working board. In the Author tab: lock a flag, break the board, then export or share the challenge.'),
      hints: [],
      par: 1,
    },
    board: k.b,
    objectives: [{ type: 'led', ref: 'D1', on: true }],
  };
}

function readInvertOrbitPref(): boolean {
  try {
    return localStorage.getItem('pcbfix_invert_orbit') === '1';
  } catch {
    return false;
  }
}

function readSolverPref(): Solver {
  try {
    const v = localStorage.getItem('pcbfix_solver');
    return v === 'spice' || v === 'spice-power' ? v : 'fast';
  } catch {
    return 'fast';
  }
}

export class PcbApp {
  private renderer!: Renderer;
  private camera = Object.assign(new Camera(), { invertOrbit: readInvertOrbitPref() });
  private canvas!: HTMLCanvasElement;

  private scenarios: Scenario[] = [];
  private activeScenario!: Scenario;
  private board!: Board;
  private conn!: Conn;
  private sim: Sim | null = null;

  private undoStack: Board[] = [];
  private redoStack: Board[] = [];
  private moves = 0;
  private solvedIds = new Set<string>(JSON.parse(localStorage.getItem('pcbfix_solved') ?? '[]'));
  /** Boards that ship with the game (analytics names only these; imports and mods are "custom"). */
  private shippedIds = new Set<string>();
  /** The bench is up: boards opened from here on are the player's choice (for analytics). */
  private started = false;
  /** Boards whose fix was already counted this page load. */
  private trackedFixes = new Set<string>();
  /** First-board diagnostics already sent this page load (each event at most once per key). */
  private trackedOnce = new Set<string>();

  private activeTool: ToolId = 'inspect';
  private activeTab: PanelTab = 'mission';
  private panelOpen = true;
  private powerOn = true;
  private ocpAmps = 0; // 0 = unlimited, 0.1 = 100mA, 0.5 = 500mA bench limit
  private solver: Solver = readSolverPref();
  /** Live thermal model of the current board (temperatures, frost, IPA film). */
  private thermal: ThermalModel | null = null;
  private thermalBoard: Board | null = null;
  /** PSU mode: normal board supply, or voltage injection onto the red probe's net. */
  private psuInject: { volts: number; amps: number } | null = null;
  private flex = new FlexField();
  /** Emulated power controller: steps the board through its power states (SPICE + PWR). */
  private boot = new BootController();
  /** Whether the current power-up follows the board's power states (else: plain supply). */
  private bootSequenced = false;
  private railCache: { conn: Conn; tree: PowerTree; byState: Map<PowerStateName, RequiredRail[]>; sequenced: boolean } | null = null;
  private psuClock = 0;
  private psuBoxEl!: HTMLElement;
  private scopeBoxEl!: HTMLElement;
  /** Oscilloscope CH1 probe, its roll-mode record (real simulated data) and display mode. */
  private scopeProbe: ProbePin | null = null;
  private scopeRoll: { t: number; v: number }[] = [];
  private scopeMode: 'auto' | 'roll' = 'auto';
  private scopeSample = 0;
  /** Parts under a rosin coat (rosin method), checked for melting / smoke. */
  private rosinParts = new Set<Component>();
  private rework: ReworkMonitor | null = null;
  /** Rework: 'instant' (puzzle mode) or a physical process with iron temperature and flux. */
  private reworkMode: { realistic: boolean; ironTemp: number; flux: boolean } = { realistic: false, ironTemp: 350, flux: true };
  /** The player's own rework setting while a lesson board sets the station (restored after). */
  private savedRework: { realistic: boolean; ironTemp: number; flux: boolean } | null = null;
  /** Everything rework did on this board (kept across undo, which swaps the board object). */
  private workHistory: ReworkHistory = { episodes: [], log: [] };
  /** The iron held on a joint (realistic rework): released on pointer / key up. */
  private ironHold: { src: { until: number }; start: number; where: string; el: HTMLElement | null; comp: Component; pad: number } | null = null;
  /** Soldering-track lesson dialog: before the repair, or the inspection after it. */
  private showLesson: 'brief' | 'debrief' | null = null;
  private lastInspection: Inspection | null = null;
  /** Soldering-track boards whose work passed inspection. */
  private trackAccepted = new Set<string>(((): string[] => { try { return JSON.parse(localStorage.getItem('pcbfix_track_accepted') ?? '[]'); } catch { return []; } })());
  private preheatTemp = 0;
  private intermittentClock = 0;
  private vizMode: VizMode = 'realistic';
  private dmmMode: DmmMode = 'V';
  private diodeLitIds: string[] = [];
  private hintsShown = 0;

  private selectedNet = -1;
  private selectedCompId: string | null = null;
  private hovered: PickHit | null = null;
  private cursorWorld: V2 | null = null;
  private cursorSide: Side = 'F';
  /** Keyboard board cursor (docs: DESIGN.md → Board cursor); shown while the board view has keyboard focus. */
  private kbCursor: { pt: V2; side: Side } | null = null;
  private kbActive = false;
  /** The lesson step's target while the step is not done: a label pointing at it on the board. */
  private tutPointer: { pos: V2; side: Side; radius: number; label: string } | null = null;
  private kbUsed = false;

  private probeRed: ProbePin | null = null;
  private probeBlack: ProbePin | null = null;
  private jumperStart: { a: V2; la: Side } | null = null;

  private lastVerify: VerifyResult | null = null;
  private revealedFlag: string | null = null;
  /** Faults the next generated problem gets (1–3), and whether one is being generated. */
  private genFaults = 1;
  private generating = false;
  private compSearch = '';
  private showHelp = false;
  private showFeedback = false;
  private showBoards = false;
  /** Board picker state: tab, Library filters, the board shown in details, open menus. */
  private bpTab: 'today' | 'library' = 'today';
  private bpBand: 'all' | BandId = 'all';
  private bpKind: 'all' | BoardKind = 'all';
  private bpSkill: 'all' | SkillKey = 'all';
  private bpHideSolved = false;
  private bpSel: Scenario | null = null;
  private bpMenu = false;
  private bpFilters = false;
  private bpAllSkills = false;
  private bpMoreOpen = false;
  /** Today's daily repair once built (src/scenarios/daily.ts), and while it is being built. */
  private dailyScenario: Scenario | null = null;
  private dailyBusy = false;
  private showMods = false;
  /** Mods window tab, and the mod.io browser's state (set up at build time, see src/mods/modio.ts). */
  private modsView: 'installed' | 'community' | 'browse' = 'installed';
  /** Community tab + Submit form (src/ui/community-ui.ts), loaded when first opened. */
  private communityUi: CommunityUi | null = null;
  private communityUiLoad: Promise<CommunityUi> | null = null;
  private readonly modio = modioConfig();
  private modioQ = '';
  private modioSort: ModioSort = 'downloads';
  private modioList: ModioMod[] = [];
  private modioTotal = 0;
  private modioNext = 0;
  private modioLoading = false;
  private modioError: string | null = null;
  private modioBusy = new Set<number>();
  private modioReq: AbortController | null = null;
  /** Ids of the boards that ship with DEADBOARD (built-ins + demos): an author's copy needs its own id. */
  private bundledIds = new Set<string>();
  /** Board fields as shipped, before any patch: patches re-apply from these, so turning a mod off undoes them. */
  private pristine = new WeakMap<Scenario, BoardView>();
  /** Running mods' board patches by target address, in load order. */
  private patchEntries = new Map<string, PatchEntry[]>();
  /** What the patches did, by board / device address (shown in the Mods window). */
  private patchLog = new Map<string, { title: string; res: PatchResult }>();
  /** Running mods' devices (added or patched), used by every solve. */
  private devices: DeviceOverlay | null = null;
  /** Running mods' fault types and patched fault ranges. */
  private faults: FaultRegistry | null = null;
  /** Diagnostic rules (official + running mods) and the last «Where to look?» answer. */
  private rules: RuleSet = buildRuleSet([]);
  /** «Where to look?» for the latest test run: null candidates while the comparison runs. */
  private lookHere: { forVerify: VerifyResult; candidates: Candidate[] | null } | null = null;
  private lookWorker: Worker | null | undefined;
  private lookSeq = 0;
  private lookPending = new Map<number, (r: { candidates?: Candidate[]; error?: string } | null) => void>();
  /** Meters (official, patched, from mods) and the one in use (address, remembered). */
  private meters: MeterRegistry | null = null;
  private meterChoice = (() => { try { return localStorage.getItem('deadboard_meter') ?? OFFICIAL_METER; } catch { return OFFICIAL_METER; } })();
  /** Bench check results by mod id, and the one running now (src/mods/benchcheck.ts). */
  private benchReports = new Map<string, BenchReport>();
  private benchRunning: string | null = null;
  /** Code mods (src/mods/api): experimental, off unless the player turns them on; not in the iOS app. */
  private codeModsOn = (() => { try { return localStorage.getItem('deadboard_code_mods') === '1'; } catch { return false; } })();
  private readonly codeModsSupported = !(globalThis as { webkit?: { messageHandlers?: { console?: unknown } } }).webkit?.messageHandlers?.console;
  /** The code-mod host: a stand-in until code mods run; the real one (and the sandbox) load then. */
  private codeHost: CodeHostLike = NO_CODE_HOST;
  /** What the player typed into mod panels (kept across redraws), by mod|panel|input. */
  private panelInputs = new Map<string, string>();
  private lastSay = new Map<string, number>();
  private solvedTimer: ReturnType<typeof setTimeout> | null = null;
  private lastProbeKey = '';
  /** Code mods started, by id → "id@version" (restart when the version changes). */
  private runningCode = new Map<string, string>();
  /** A solver mod in use instead of the official solver (its address), or null. */
  private modSolver: string | null = null;
  private modSolveSeq = 0;
  /** The current `sim` came from a solver mod. */
  private simFromMod = false;
  /** Which solver mod the last test run used (shown with the results). */
  private lastVerifyBy: string | null = null;
  private lastMeasureKey = '';
  /** For bug reports: the last messages and errors the player saw, and the meter's display. */
  private recentToasts: string[] = [];
  private recentErrors: string[] = [];
  private dmmShown = '';
  /** Mod boards in the list (stub before first open, full scenario after) → their mod. */
  private modBoards = new Map<Scenario, ModBoard>();
  private modResult: ModLoadResult = emptyModResult();
  /** Which mods are on (src/mods/loadouts.ts); ?safe runs this visit without any mod. */
  private loadouts: LoadoutStore = readLoadouts();
  private safeMode = safeMode();
  /** Safe mode was switched on because the last start with mods didn't finish. */
  private autoSafe = false;
  private schematicUrls = new Map<ModBoard, string>();
  private boardSearch = '';
  private lastBeepKey = '';
  private tutorialOpen = localStorage.getItem('pcbfix_tut_dismissed') !== '1';
  private tutorialStep = 0;

  // Author Studio state
  private studioFlagInput = 'PCB{my_custom_pcb_ctf}';
  private authorMode = false;
  /** Fault class last chosen in the inspector's injection card. */
  /** Author tab: the fault type picked (address: official-faults/faultTypes/<class> or a mod's). */
  private faultClass = 'official-faults/faultTypes/cold-joint';
  private refLockedHash = '';

  // Pointer drag state
  private dragMode: 'none' | 'pan' | 'orbit' | 'iron' = 'none';
  /** The touch pointer holding the iron on a joint. */
  private touchIron: number | null = null;
  private dragMoved = false;
  private lastPx = 0;
  private lastPy = 0;
  private downPx = 0;
  private downPy = 0;
  private spaceHeld = false;
  private lastSaidReading = '';
  private announceTimer: ReturnType<typeof setTimeout> | undefined;
  /** Single-character keyboard shortcuts (1–9, F, C, P, V…); Settings can turn them off. */
  private keyShortcuts = (() => { try { return localStorage.getItem('pcbfix_key_shortcuts') !== '0'; } catch { return true; } })();

  // Floating window & sidepanel drag state
  private tutPos: V2 = [0, 0];
  private dmmPos: V2 = [0, 0];
  private modalPos: V2 = [0, 0];
  private sidepanelW = 340;
  private suppressModalBgClose = false;
  private winDrag: {
    target: 'tut' | 'dmm' | 'modal' | 'sidepanel';
    startX: number;
    startY: number;
    origX: number;
    origY: number;
  } | null = null;

  // Touch / mobile (src/ui/touch.ts). The desktop layout is untouched unless `mobile`.
  /** Touch-only device: phone layout (tool strip, bottom sheets, stacked instruments) and touch wording. */
  private mobile = wantsMobileLayout();
  /** Touch gestures on the board (any layout): tap = tool, one finger pans (orbits in 3D), pinch zooms. */
  private gestures = new TouchGestures({
    tap: (x, y) => this.touchTap(x, y),
    pan: (dx, dy) => { this.autoFramed = ''; this.camera.panScreen(dx, dy, Math.max(1, this.canvas.clientHeight)); },
    orbit: (dx, dy) => { this.autoFramed = ''; this.orbitBy(dx, dy); },
    zoom: (f, x, y) => {
      this.autoFramed = '';
      const r = this.canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.camera.zoomAt(f, (x - r.left) * dpr, (y - r.top) * dpr, Math.max(1, r.width * dpr), Math.max(1, r.height * dpr), this.board.thickness);
    },
  }, () => (this.camera.mode === '3d' ? 'orbit' : 'pan'));
  /** Probe a touch tap places (no right-click on touch); auto = chosen by the meter, not the player. */
  private activeProbe: 'red' | 'black' = 'red';
  private activeProbeAuto = false;
  private tutCollapsed = false;
  private dmmSubFull = false;
  /** Panel notes (callouts) the player opened on the phone, by heading; they start folded. */
  private openNotes = new Set<string>();
  /** Tutorial step (scenario:index) whose explanation is open on the phone card. */
  private tutWhy = '';
  /** Canvas aspect the board was last fitted to (mobile: refit on first layout and on rotation). */
  private fitAspect = 0;
  /**
   * The free area (clearView) the whole board was last fitted into automatically; '' once the
   * player moves the camera. While set, the fit follows the overlays as they appear or resize,
   * and the canvas as it changes shape.
   */
  private autoFramed = '';
  /** The camera right after that fit: any other camera means the player moved it (mouse, keys, Locate, search). */
  private autoFrameCam = '';
  private autoFrameCheck = 0;
  private psuExpanded = false;
  private toolTipsShown = new Set<ToolId>();

  private lastFrameMs = performance.now();
  private rafId = 0;

  // DOM refs
  private layoutEl!: HTMLElement;
  private sideBodyEl!: HTMLElement;
  private dmmBoxEl!: HTMLElement;
  private tutBoxEl!: HTMLElement;
  private hudTopEl!: HTMLElement;
  private toastEl!: HTMLElement;
  private modalRootEl!: HTMLElement;
  private dropOverlayEl!: HTMLElement;
  private fileInputEl!: HTMLInputElement;

  constructor(private mount: HTMLElement) {}

  /** Start-up step, for the slow-start notice and its report: boards → mods → ui → graphics. */
  private startStage = 'boards';
  /** The bench is up, or a screen already says why it is not. */
  private startDone = false;
  /** The bench is up and drawing (analytics: how far an early leaver got). */
  private benchUp = false;
  /** Furthest First Light tutorial step shown (1-based; 0 = none). */
  private tutMax = 0;
  /** DEADBOARD's own puzzle statistics (src/attempts/): null wherever they are off (apps, dev, Do Not Track). */
  private attempts: AttemptTracker | null = null;
  /** The puzzle-stats switch is shown only where stats can be sent at all (the website). */
  private statsAvailable = browserSender() !== null;
  private firstPlayDays = 0;
  private puzzleVersions = new WeakMap<Scenario, string>();
  /** "More tools" pressed once: the full dock from then on (also after all lessons are solved). */
  private allTools = (() => { try { return localStorage.getItem('pcbfix_all_tools') === '1'; } catch { return false; } })();
  /** The hidden difficulty estimate (src/scenarios/adaptive.ts): on this device only, never shown. */
  private skill: Skill = loadSkill();
  /** The attempt the hidden estimate will learn from (any build: website and apps alike). */
  private rated: { level: number; weight: number; tests: number; notes: number; solution: boolean; activeSec: number; moves: number; done: boolean } | null = null;

  /** How far this page load got, for "bench left early". */
  private reachedSoFar(): string {
    if (!this.startDone) return 'loading';
    if (!this.benchUp) return 'failed';
    if (this.trackedFixes.size) return 'fixed';
    if ([...this.trackedOnce].some((k) => k.startsWith('tests:'))) return 'tests';
    if (this.trackedOnce.has('tool')) return 'tool';
    return 'bench';
  }

  /**
   * "bench left early": the page was first hidden within its first visible minute (later leavers
   * show up in the active-minute events). Says how far the visit got: still loading, failed, the
   * bench, a tool, tests, a fix, and the furthest tutorial step. A tab switch and back also counts.
   */
  private trackEarlyLeave() {
    const visible = visibleClock();
    onFirstHide(() => {
      const sec = visible();
      if (sec >= 60) return;
      trackEvent('bench left early', { visible: secondsBucket(sec), reached: this.reachedSoFar(), step: this.tutMax, layout: this.mobile ? 'phone' : 'desktop' });
    });
  }

  /** "bench error" (once per page load, after the bench is up): the error's kind and what was in use, never its text. */
  private trackBenchError(err: unknown) {
    if (!this.benchUp || !(err instanceof Error)) return;
    this.trackOnce('error', 'bench error', { kind: err.name || 'Error', tool: this.activeTool, board: this.analyticsId(this.activeScenario) });
  }

  /**
   * After SLOW_START_MS of visible time without a bench (a GPU or browser that never answers, a
   * very slow device), say so and offer a way out instead of an empty page, and record the step it
   * hangs at. A background tab's time does not count: it may simply not have been looked at yet.
   */
  private startWatchdog() {
    let visibleMs = 0;
    let last = performance.now();
    const tick = setInterval(() => {
      const now = performance.now();
      if (!document.hidden) visibleMs += now - last;
      last = now;
      if (this.startDone) { clearInterval(tick); return; }
      if (visibleMs < SLOW_START_MS) return;
      clearInterval(tick);
      trackEvent('bench failed', { reason: 'slow start', stage: this.startStage, layout: this.mobile ? 'phone' : 'desktop' });
      this.showSlowStart();
    }, 500);
  }

  private showSlowStart() {
    const el = document.createElement('div');
    el.className = 'slow-start';
    el.setAttribute('role', 'status');
    const gl = this.startStage === 'graphics' && webGlInfo() !== null && !/[?&]renderer=webgl2/.test(location.search);
    el.innerHTML = `
      <div class="slow-start-t">${t('The bench is taking a long time to start.')}</div>
      <div class="slow-start-d">${this.startStage === 'graphics' ? t('Your browser\'s 3D graphics are not answering.') : t('This device may be busy, or the connection slow.')}</div>
      <div class="row wrap">
        ${gl ? `<button class="btn primary sm" id="slow-gl">${t('Start with simpler graphics')}</button>` : ''}
        <button class="btn sm${gl ? '' : ' primary'}" id="slow-reload">${t('Reload')}</button>
      </div>`;
    document.body.appendChild(el);
    el.querySelector('#slow-reload')?.addEventListener('click', () => location.reload());
    el.querySelector('#slow-gl')?.addEventListener('click', () => {
      const u = new URL(location.href);
      u.searchParams.set('renderer', 'webgl2');
      location.href = u.toString();
    });
    const gone = setInterval(() => { if (this.startDone) { el.remove(); clearInterval(gone); } }, 500);
  }

  /** init() threw before the bench was up: say so (a reload starts without mods, see bootBegin). */
  startFailed(err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('DEADBOARD could not start:', err);
    if (this.startDone) return; // the bench is up; the error is in the console and the bug report
    this.startDone = true;
    trackEvent('bench failed', { reason: 'start error', stage: this.startStage, layout: this.mobile ? 'phone' : 'desktop' });
    this.mount.innerHTML = `
      <div class="webgpu-err">
        <div class="card">
          <div class="card-title lg">${t('The bench could not start')}</div>
          <p class="text-2" style="margin:0">${t('Reloading usually helps. If you installed mods, the next start skips them.')}</p>
          <p class="muted" style="margin:0">${t('Technical detail: {error}', { error: this.esc(msg.slice(0, 300)) })}</p>
          <div class="row wrap"><button class="btn primary" id="start-reload">${t('Reload')}</button></div>
        </div>
        <div class="card">
          <div class="card-title">${t('Still stuck? Tell us')}</div>
          <div id="fb-host"></div>
        </div>
      </div>`;
    this.mount.querySelector('#start-reload')?.addEventListener('click', () => location.reload());
    const host = this.mount.querySelector<HTMLElement>('#fb-host');
    if (host) mountFeedbackForm(host, () => ({ error: msg, view: `start error (${this.startStage}), no bench` }), { kind: 'bug' });
  }

  async init() {
    this.startWatchdog();
    this.trackEarlyLeave();
    const keepError = (m: string) => { this.recentErrors = [...this.recentErrors, m.slice(0, 300)].slice(-8); };
    window.addEventListener('error', (e) => {
      keepError(`${e.message} @ ${String(e.filename).replace(/^.*\//, '')}:${e.lineno}`);
      if (!e.filename || e.filename.startsWith(location.origin)) this.trackBenchError(e.error); // not a browser extension's
    });
    window.addEventListener('unhandledrejection', (e) => {
      keepError(`unhandled: ${e.reason instanceof Error ? e.reason.message : String(e.reason)}`);
      this.trackBenchError(e.reason);
    });
    this.scenarios = await builtinScenarios();
    await this.addDemoStubs();
    this.bundledIds = new Set(this.scenarios.map((s) => s.id));
    if (bootBegin() && !this.safeMode) this.safeMode = this.autoSafe = true;
    this.startStage = 'mods';
    await this.loadMods();
    if (this.modResult.active.length) bootModsRunning();
    this.startStage = 'ui';
    this.buildDom();
    this.startStage = 'graphics';

    try {
      // ?renderer=webgl2 / webgpu forces one GPU interface (testing the fallback)
      const force = new URLSearchParams(location.search).get('renderer');
      this.renderer = await Renderer.create(this.canvas, force === 'webgl2' || force === 'webgpu' ? force as RendererKind : undefined);
    } catch (err) {
      this.startDone = true;
      trackEvent('bench failed', { reason: err instanceof NoAdapterError ? 'no adapter' : 'error', layout: this.mobile ? 'phone' : 'desktop' });
      this.showWebGpuError(err instanceof Error ? err.message : String(err), err instanceof NoAdapterError ? err.tried : []);
      bootDone(); // a GPU problem, not a mod's
      return;
    }
    this.startDone = true;
    this.benchUp = true;
    trackEvent('bench ready', { renderer: this.renderer.kind, layout: this.mobile ? 'phone' : 'desktop' });

    const params = new URLSearchParams(window.location.search);
    if (params.has('tutorial')) {
      localStorage.removeItem('pcbfix_tut_dismissed');
      this.tutorialOpen = true;
    }
    if (params.has('boards')) {
      this.showBoards = true;
    }
    if (params.has('feedback')) this.showFeedback = true;

    this.shippedIds = new Set(this.scenarios.map((s) => s.id));
    this.startAttempts();
    // Load from URL hash if present (#s=...)
    const loadedHash = await this.tryLoadFromHash();
    if (!loadedHash) {
      // after a language switch: the board that was open (when it ships with the app)
      let reopen = -1;
      try {
        const id = sessionStorage.getItem('deadboard_reopen');
        sessionStorage.removeItem('deadboard_reopen');
        reopen = id ? this.scenarios.findIndex((s) => s.id === id) : -1;
      } catch { /* storage unavailable */ }
      const qBoard = params.get('board');
      const want = reopen >= 0 ? reopen : qBoard ? this.scenarios.findIndex((s) => s.id === qBoard) : -1;
      this.loadScenario(this.scenarios[0]);
      if (want > 0) await this.openScenario(want);
    }

    this.bindEvents();
    this.started = true;
    bootDone();
    if (this.autoSafe) this.toast(t("DEADBOARD didn't finish starting last time, so mods are off for this visit. To try again: Mods → Leave safe mode."), 'info');
    if (this.showBoards || this.showFeedback) this.renderModal();
    void this.loadVideoIndex();
    if (params.has('automation')) this.exposeAutomation();
    this.rafId = requestAnimationFrame(this.loop);
  }

  private async tryLoadFromHash(): Promise<boolean> {
    const h = window.location.hash;
    if (!h.startsWith('#s=')) return false;
    try {
      const json = await unpackText(h.slice(3));
      const sc = importScenarioOrPcb('shared.pcbfix.json', json);
      this.scenarios.push(sc);
      this.refreshScenarioSelect();
      this.loadScenario(sc);
      this.toast(t('Loaded shared puzzle: {title}', { title: t(sc.meta.title) }), 'success');
      return true;
    } catch (e) {
      this.toast(t('Failed to decode shared URL: {error}', { error: e instanceof Error ? e.message : String(e) }), 'danger');
      return false;
    }
  }

  private showWebGpuError(msg: string, tried: string[] = []) {
    const gl = webGlInfo();
    const app = inAppBrowser(navigator.userAgent);
    const android = /Android/.test(navigator.userAgent);
    // a social app's built-in browser: the fix is another browser, so say that first and offer it
    const inApp = app === null ? '' : `
        <div class="card">
          <div class="card-title lg">${t('Open DEADBOARD in your browser')}</div>
          <p class="text-2" style="margin:0">${app ? t('You opened this page inside the {app} app. Its built-in browser can\'t start the 3D bench.', { app }) : t('You opened this page inside an app. Its built-in browser can\'t start the 3D bench.')}</p>
          <p class="muted" style="margin:0">${android ? t('Tap «Open in Chrome», or use the app\'s menu (⋮) → «Open in browser».') : t('Use the app\'s menu (⋯ or the share button) → «Open in browser» / «Open in Safari», or copy the link into your browser.')}</p>
          <div class="row wrap">
            ${android ? `<a class="btn primary" id="open-chrome" href="${this.esc(chromeIntentUrl(location.href))}">${icon('link', 14)}<span>${t('Open in Chrome')}</span></a>` : ''}
            <button class="btn" id="copy-link">${icon('copy', 14)}<span>${t('Copy link')}</span></button>
          </div>
        </div>`;
    this.mount.innerHTML = `
      <div class="webgpu-err">${inApp}
        <div class="card">
          <div class="card-title lg">${t('3D graphics aren\'t available')}</div>
          ${app === null ? `<p class="text-2" style="margin:0">${this.esc(gpuHelp(navigator.userAgent, gl, navigator.maxTouchPoints))}</p>` : ''}
          <p class="muted" style="margin:0">${t('Technical detail: {error}', { error: this.esc(t(msg)) })}</p>
        </div>
        <div class="card">
          <div class="card-title">${t('Still stuck? Tell us')}</div>
          <div id="fb-host"></div>
        </div>
      </div>`;
    this.mount.querySelector('#copy-link')?.addEventListener('click', async (e) => {
      const b = e.currentTarget as HTMLButtonElement;
      try { await navigator.clipboard.writeText(location.href); b.querySelector('span')!.textContent = t('Link copied'); }
      catch { prompt(t('Copy this link:'), location.href); }
    });
    const host = this.mount.querySelector<HTMLElement>('#fb-host');
    // no bench to snapshot here: the report says what this browser offers instead
    const gpu = `${gpuDiagnosis(tried, gl)}${app === null ? '' : `; in-app browser: ${app || 'Android WebView'}`}`;
    if (host) mountFeedbackForm(host, () => ({ error: msg, gpu, view: 'WebGPU error screen (no bench, no snapshot)' }), { kind: 'bug' });
  }

  private openFeedback(open = true) {
    this.showFeedback = open;
    if (open) { this.showHelp = false; this.showBoards = false; this.showMods = false; }
    this.modalPos = [0, 0];
    this.renderModal();
  }

  /** What a bug report needs to know about the current bench (no personal data). */
  private feedbackContext(): FeedbackContext {
    const sc = this.activeScenario;
    const cam = this.camera;
    return {
      // an imported board's title is its file name: it stays on the device like the board itself
      board: sc ? (this.bundledIds.has(sc.id) ? `${sc.meta.title} (${sc.id})` : `imported board (${sc.meta.author})`) : undefined,
      view: `${cam.mode.toUpperCase()}, ${cam.bothSides ? 'both sides' : cam.side === 'F' ? 'top' : 'bottom'}, ${this.vizMode}${this.powerOn ? ', power on' : ''}`,
      solver: this.solver,
      gpu: this.renderer?.adapterDescription,
      error: this.recentErrors[this.recentErrors.length - 1],
      snapshotNote: this.bundledIds.has(sc?.id ?? '')
        ? t('Bench snapshot: your changes to this board ({n} move), readings, last messages|Bench snapshot: your changes to this board ({n} moves), readings, last messages', { n: this.moves })
        : t('Bench snapshot: readings and last messages (your imported board itself is not sent)'),
      snapshot: () => this.benchSnapshot(),
    };
  }

  /** Everything needed to rebuild this bench elsewhere, as one code for the feedback email. */
  private async benchSnapshot(): Promise<string> {
    const sc = this.activeScenario, b = this.board, cam = this.camera;
    const shipped = this.bundledIds.has(sc.id);
    const supply = this.supplyReading();
    const lit = this.sim ? b.components.filter((c) => c.kind === 'led' && (this.sim!.comps.get(c.id)?.i ?? 0) > LED_ON_I).map((c) => c.ref) : [];
    const v = this.lastVerify;
    const snap: BenchSnapshot = {
      v: 1,
      build: APP_BUILD,
      at: new Date().toISOString(),
      scenario: {
        id: shipped ? sc.id : 'imported',
        title: shipped ? sc.meta.title : '',
        shipped,
        ...(!shipped && { format: sc.meta.author }),
        parts: b.components.length, traces: b.traces.length, vias: b.vias.length,
      },
      ...(shipped && { diff: boardDiff(sc.board, b) }),
      bench: {
        power: this.powerOn,
        solver: this.solver,
        ocpAmps: this.ocpAmps,
        inject: this.psuInject,
        ...(this.bootSequenced && { boot: this.boot.state }),
        view: `${cam.mode}, ${cam.bothSides ? 'both' : cam.side === 'F' ? 'top' : 'bottom'}, ${this.vizMode}`,
        tool: this.activeTool,
        ...(this.selectedCompId && { selected: b.components.find((c) => c.id === this.selectedCompId)?.ref }),
        dmm: { mode: this.dmmMode, red: this.probeRed?.label, black: this.probeBlack?.label, reading: this.dmmShown || undefined },
      },
      seen: {
        volts: +supply.volts.toFixed(4), amps: +supply.amps.toFixed(6), cc: supply.cc, lit,
        ...(v && { tests: `${v.results.filter((r) => r.passed).length}/${v.results.length} passed${v.flag ? ', flag revealed' : ''}` }),
      },
      toasts: this.recentToasts,
      errors: this.recentErrors,
      moves: this.moves,
    };
    return encodeSnapshot(snap);
  }

  private renderFeedbackModal() {
    this.modalRootEl.innerHTML = `
      <div class="modal-backdrop" id="fb-close-bg">
        <div class="modal" style="transform: translate3d(${this.modalPos[0]}px, ${this.modalPos[1]}px, 0)">
          <div class="modal-head" title="${t('Drag to move window')}">
            <h2>${t('Feedback')}</h2>
            <button class="btn ghost icon sm" id="fb-close" title="${t('Close')}">${icon('x', 14)}</button>
          </div>
          <div class="card"><div id="fb-host"></div></div>
        </div>
      </div>`;
    mountFeedbackForm(this.modalRootEl.querySelector<HTMLElement>('#fb-host')!, () => this.feedbackContext());
    this.modalRootEl.querySelector('#fb-close')?.addEventListener('click', () => this.openFeedback(false));
    this.modalRootEl.querySelector('#fb-close-bg')?.addEventListener('click', (e) => {
      if (this.suppressModalBgClose) { this.suppressModalBgClose = false; return; }
      if ((e.target as HTMLElement).id === 'fb-close-bg') this.openFeedback(false);
    });
  }

  private buildDom() {
    const m = this.mobile;
    document.title = t('DEADBOARD — board-level repair trainer');
    if (m) {
      document.body.classList.add('is-mobile');
      this.panelOpen = false;
      // installable to the home screen (full screen, no browser bars); desktop browsers get no install prompt
      if (!document.querySelector('link[rel="manifest"]')) {
        const l = document.createElement('link');
        l.rel = 'manifest';
        l.href = './app.webmanifest';
        document.head.append(l);
      }
    }
    this.mount.innerHTML = `
      ${m ? '' : `<a class="skip-board" href="#gpu-canvas">${t('Skip to the board')}</a>`}
      <div class="layout${m ? ' mobile panel-collapsed' : ''}" id="layout">
        <header class="topbar">
          <div class="topbar-group">
            <a class="brand" href="./" title="${t('{name} — home', { name: BRAND.name })}">${markSvg(22)}</a>
            <span class="brand-name" title="${t(BRAND.descriptor)}">${BRAND.name}</span>
            <span class="topbar-divider"></span>
            <button class="board-picker-btn" id="btn-boards" title="${t('Browse all boards & tutorials')}">
              ${icon('grid', 14)}
              <span class="bp-badge" id="bp-badge"></span>
              <span class="bp-title" id="bp-title"></span>
              <span class="bp-check" id="bp-check" hidden>${icon('check', 12)}</span>
              ${icon('chevronDown', 13)}
            </button>
            <select id="sc-select" title="${t('Scenario')}" hidden></select>
            <button class="btn ghost icon" id="btn-new-board" title="${t('New blank board')}" hidden>${icon('plus')}</button>
            <button class="btn ghost icon" id="btn-import" title="${t('Import .brd, .tvw, .kicad_pcb, .pcbfix.json, or a mod .zip')}" hidden>${icon('upload')}</button>
            <input type="file" id="file-input" accept=".brd,.tvw,.json,.pcbfix.json,.kicad_pcb,.zip" hidden />
          </div>
          <div class="topbar-group">
            <div class="seg" id="seg-view" role="group" aria-label="${t('Camera')}" title="${t('Camera (V)')}">
              <button data-view="2d">2D</button>
              <button data-view="3d">3D</button>
            </div>
            <div class="seg" id="seg-side" role="group" aria-label="${t('Board side')}" title="${t('Board side (F)')}">
              <button data-side="F">${t('Top')}</button>
              <button data-side="both">${t('Both')}</button>
              <button data-side="B">${t('Bottom')}</button>
            </div>
            <button class="btn ghost icon" id="btn-fit" title="${t('Fit to view (C)')}">${icon('fit')}</button>
            <span class="topbar-divider"></span>
            <select id="viz-select" title="${t('Display mode')}" aria-label="${t('Display mode')}">
              <option value="realistic">${t('Realistic')}</option>
              <option value="heatmap">${t('Voltage map')}</option>
              <option value="thermal">${t('Thermal')}</option>
              <option value="xray">${t('X-ray')}</option>
            </select>
            <div class="bench-wrap">
              <button class="btn ghost" id="btn-bench" title="${t('Bench setup: solver, supply, rework')}">${icon('meter', 14)}<span>${t('Bench')}</span></button>
              <div class="bench-pop" id="bench-pop" hidden>
            <label class="bench-row"><span>${t('Rework')}</span><select id="rework-mode" title="${t('Rework: instant (puzzle) or physical process')}">
              <option value="instant">${t('Rework: instant')}</option>
              <option value="r350f">${t('Iron 350 °C + flux')}</option>
              <option value="r350">${t('Iron 350 °C, dry')}</option>
              <option value="r400f">${t('Iron 400 °C + flux')}</option>
            </select></label>
            <label class="bench-row"><span>${t('Preheater')}</span><select id="preheat" title="${t('Bottom preheater')}">
              <option value="0">${t('No preheat')}</option>
              <option value="120">${t('Preheat {deg}°', { deg: 120 })}</option>
              <option value="150">${t('Preheat {deg}°', { deg: 150 })}</option>
            </select></label>
            <label class="bench-row"><span>${t('Supply')}</span><select id="psu-mode" title="${t('Bench supply: board supply, or voltage injection onto the red probe\'s net (board supply removed)')}">
              <option value="board">${t('Board PSU')}</option>
              <option value="inject1">${t('Inject {v}·{a}', { v: '1 V', a: '3 A' })}</option>
              <option value="inject3">${t('Inject {v}·{a}', { v: '3.3 V', a: '1 A' })}</option>
            </select></label>
            <label class="bench-row"><span>${t('Current limit')}</span><select id="ocp-select" title="${t('Bench supply current limit (OCP)')}">
              <option value="0">${t('No limit')}</option>
              <option value="0.1">100 mA</option>
              <option value="0.5">500 mA</option>
            </select></label>
            <label class="bench-row"><span>${t('Solver')}</span><select id="solver-select" title="${t('Circuit solver: fast piecewise-linear DC · SPICE (real device physics, realistic meter) · SPICE + PWR (adds the board\'s regulators from its power tree)')}">
              <option value="fast">${t('Fast DC')}</option>
              <option value="spice">SPICE</option>
              <option value="spice-power">SPICE + PWR</option>
            </select></label>
            <label class="bench-row" hidden><span>${t('Meter')}</span><select id="meter-select" title="${t('Multimeter profile: the official one, or one a mod adds')}"></select></label>
            <button class="btn sm" id="btn-spice-export" title="${t('Export SPICE netlist (.cir, ngspice compatible)')}">${icon('download', 13)}<span>${t('Export SPICE netlist (.cir)')}</span></button>
              </div>
            </div>
            <button class="power" id="btn-power" title="${t('Bench supply (P)')}"><span class="dot"></span>${icon('power', 15)}<span class="lbl">${t('Power')}</span></button>
            <span class="topbar-divider"></span>
            <button class="btn primary" id="btn-verify" title="${t('Run test bench')}">${icon('play', 14)}<span>${t('Run tests')}</span></button>
            <button class="btn ghost" id="btn-tutorial" title="${t('Interactive beginner tutorial')}">${icon('book', 14)}<span>${t('Tutorial')}</span></button>
            <button class="btn ghost icon" id="btn-feedback" title="${t('Report a bug or suggest an idea')}">${icon('message')}</button>
            <button class="btn ghost icon" id="btn-help" title="${t('Help')}">${icon('help')}</button>
            <div class="bench-wrap settings-wrap">
              <button class="btn ghost icon" id="btn-settings" title="${t('Settings')}">${icon('settings')}</button>
              <div class="bench-pop settings-pop" id="settings-pop" hidden>
                <div class="bench-row"><span>${t('Sound')}</span><button class="btn sm" id="btn-sound"></button></div>
                <div class="bench-row"><span>${t('3D orbit')}</span><button class="btn sm" id="btn-invert-orbit"></button></div>
                ${this.statsAvailable ? `<div class="bench-row"><span>${t('Puzzle stats')}</span><button class="btn sm" id="btn-stats"></button></div>` : ''}
                <div class="bench-row"><span>${t('Key shortcuts')}</span><button class="btn sm" id="btn-keys"></button></div>
                <label class="bench-row"><span>${lang() === 'en' ? 'Language' : `${t('Language')} · Language`}</span>${this.langPickerHtml('full')}</label>
              </div>
            </div>
            <button class="btn ghost icon" id="btn-panel-toggle" title="${m ? t('Mission, inspector and author') : t('Toggle panel')}">${icon(m ? 'flag' : 'sidebar')}</button>
            ${m ? `<button class="btn ghost icon" id="btn-more" title="${t('View, bench and settings')}">${icon('more', 18)}</button>` : ''}
          </div>
        </header>

        ${m ? this.mobileDockHtml() : `<aside class="tooldock" id="tooldock">
          ${TOOLS.map((tl) => `
            <button class="tool-btn ${tl.id === this.activeTool ? 'active' : ''}" data-tool="${tl.id}" data-tip="${this.esc(t(tl.lbl))} · ${tl.key}" aria-label="${this.esc(t(tl.lbl))}" aria-description="${this.esc(t(tl.tip))}" aria-keyshortcuts="${tl.key.toUpperCase()}" aria-pressed="${tl.id === this.activeTool}">
              ${icon(tl.ico, 18)}
              <span class="key">${tl.key}</span>
            </button>
          `).join('')}
          <button class="tool-btn more-tools" id="btn-more-tools" data-tip="${t('More tools')}" aria-label="${t('More tools')}" hidden>${icon('plus', 18)}</button>
          <div class="dock-spacer"></div>
          <div class="dock-sep"></div>
          <button class="tool-btn" id="btn-undo" data-tip="${t('Undo')} · ⌘Z" aria-label="${t('Undo')}" aria-keyshortcuts="Control+Z Meta+Z">${icon('undo', 18)}</button>
          <button class="tool-btn" id="btn-redo" data-tip="${t('Redo')} · ⇧⌘Z" aria-label="${t('Redo')}" aria-keyshortcuts="Control+Shift+Z Meta+Shift+Z">${icon('redo', 18)}</button>
          <button class="tool-btn" id="btn-reset" data-tip="${t('Reset board')}" aria-label="${t('Reset board')}">${icon('reset', 18)}</button>
        </aside>`}

        <main class="viewport" id="viewport">
          <canvas id="gpu-canvas" tabindex="0" role="application" aria-roledescription="${t('board')}" aria-describedby="board-keys"></canvas>
          <div class="sr-only" id="board-keys">${t('Arrow keys move the board cursor between pads, traces and parts; Shift+arrows move in small steps. Enter uses the current tool there; with the multimeter, Shift+Enter places the black probe. Escape cancels a jumper.')}</div>
          <div class="tut-pointer" id="tut-pointer" hidden aria-hidden="true"></div>
          <div class="hud-top-left"><div id="tut-box"></div></div>
          ${m ? `
          <div class="m-viewctl">
            <button class="m-vbtn" id="m-fit" title="${t('Fit board')}">${icon('fit', 18)}</button>
            <button class="m-vbtn" id="m-mode" title="2D / 3D"></button>
            <button class="m-vbtn" id="m-flip" title="${t('Top / Bottom side')}"></button>
          </div>
          <div class="m-hud">${this.rotateHintHtml()}<div id="scope-box"></div><div id="psu-box"></div><div id="dmm-box"></div></div>` : `
          <div class="hud-bottom-left"><div id="dmm-box"></div></div>
          <div class="hud-bottom-right"><div id="scope-box"></div><div id="psu-box"></div></div>`}
          <div class="toast-stack" id="toasts" role="status" aria-live="polite"></div>
          <div class="sr-only" id="sr-live" role="status" aria-live="polite" aria-atomic="true"></div>
        </main>

        <aside class="sidepanel" id="sidepanel">
          <div class="sidepanel-resizer" id="sidepanel-resizer" title="${t('Drag to resize panel')}"></div>
          <div class="tabs" role="tablist" aria-label="${t('Panel')}">
            <button class="tab active" role="tab" aria-selected="true" aria-controls="side-body" id="tab-mission" data-tab="mission">${t('Overview')}</button>
            <button class="tab" role="tab" aria-selected="false" aria-controls="side-body" id="tab-inspect" data-tab="inspect">${t('Inspector')}</button>
            <button class="tab" role="tab" aria-selected="false" aria-controls="side-body" id="tab-studio" data-tab="studio">${t('Author')}</button>
            <button class="tab" role="tab" aria-selected="false" aria-controls="side-body" id="tab-mods" data-tab="mods" hidden>${t('Mods')}</button>
            ${m ? `<button class="btn ghost icon m-sheet-close" id="m-panel-close" title="${t('Close')}">${icon('x', 16)}</button>` : ''}
          </div>
          <div class="panel-body" id="side-body" role="tabpanel"></div>
        </aside>

        <footer class="statusbar">
          <div class="sb-left" id="hud-top"></div>
          <div class="sb-right">
            <span class="sb-item"><span class="kbd">LMB</span>${t('Tool / Drag Pan')}</span>
            <span class="sb-item"><span class="kbd">RMB</span>${t('Orbit')}</span>
            <span class="sb-item"><span class="kbd">MMB</span>${t('Pan')}</span>
            <span class="sb-item"><span class="kbd">F</span>${t('Flip')}</span>
            <span class="sb-item"><span class="kbd">V</span>2D/3D</span>
          </div>
        </footer>
      </div>
      <div id="modal-root"></div>
      ${m ? this.mobileMoreHtml() : ''}
      <div class="drop-overlay" id="drop-overlay" style="display:none">${t('Drop a .brd, .tvw, .kicad_pcb, .pcbfix.json, or mod .zip to import')}</div>
    `;

    this.layoutEl = this.mount.querySelector('#layout')!;
    this.canvas = this.mount.querySelector('#gpu-canvas')!;
    this.sideBodyEl = this.mount.querySelector('#side-body')!;
    this.dmmBoxEl = this.mount.querySelector('#dmm-box')!;
    this.psuBoxEl = this.mount.querySelector('#psu-box')!;
    this.scopeBoxEl = this.mount.querySelector('#scope-box')!;
    this.tutBoxEl = this.mount.querySelector('#tut-box')!;
    this.hudTopEl = this.mount.querySelector('#hud-top')!;
    this.toastEl = this.mount.querySelector('#toasts')!;
    this.modalRootEl = this.mount.querySelector('#modal-root')!;
    this.dropOverlayEl = this.mount.querySelector('#drop-overlay')!;
    this.fileInputEl = this.mount.querySelector('#file-input')!;
    this.wireModalA11y();
    this.sideBodyEl.addEventListener('click', (e) => this.onPadProbeClick(e));
    this.wireBoardCursor();
    if (m) this.fillMobileMore();
    this.refreshScenarioSelect();
  }

  /**
   * The four modals (boards, mods, help, feedback) are re-rendered as HTML on every state change.
   * After each render this gives the window dialog semantics, moves focus into it when it opens,
   * keeps focus on the same control across re-renders, holds Tab inside it, and hands focus back
   * to whatever opened it when it closes.
   */
  private wireModalA11y() {
    const root = this.modalRootEl;
    let opener: HTMLElement | null = null;
    let lastKey = '';
    const keyOf = (el: Element) => el.id ? `#${el.id}` : [...el.attributes].filter((a) => a.name.startsWith('data-')).map((a) => `[${a.name}="${a.value}"]`).join('');
    const focusables = (box: Element) => [...box.querySelectorAll<HTMLElement>('button, a[href], input:not([type="hidden"]), select, textarea, summary, [tabindex]:not([tabindex="-1"])')]
      .filter((el) => !el.hidden && !(el as HTMLButtonElement).disabled && el.getClientRects().length > 0);
    root.addEventListener('focusin', (e) => { const k = keyOf(e.target as Element); if (k) lastKey = k; });
    root.addEventListener('keydown', (e) => {
      if (e.key !== 'Tab') return;
      const box = root.querySelector<HTMLElement>('.modal');
      if (!box) return;
      const list = focusables(box);
      if (!list.length) { e.preventDefault(); box.focus(); return; }
      const first = list[0], last = list[list.length - 1];
      if (e.shiftKey && (document.activeElement === first || document.activeElement === box)) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
    new MutationObserver(() => {
      const box = root.querySelector<HTMLElement>('.modal');
      if (!box) {
        // closed: back to the control that opened it
        if (opener?.isConnected && (!document.activeElement || document.activeElement === document.body)) opener.focus({ preventScroll: true });
        opener = null;
        lastKey = '';
        return;
      }
      if (!box.hasAttribute('role')) {
        box.setAttribute('role', 'dialog');
        box.setAttribute('aria-modal', 'true');
        box.tabIndex = -1;
        const h = box.querySelector<HTMLElement>('.modal-head h2');
        if (h) { h.id ||= 'modal-title'; box.setAttribute('aria-labelledby', h.id); }
      }
      if (box.contains(document.activeElement)) return;
      if (!opener) {
        // just opened
        const a = document.activeElement as HTMLElement | null;
        opener = a && a !== document.body ? a : null;
        // the window itself (its title is read; no phone keyboard pops up for a search field)
        box.focus({ preventScroll: true });
        return;
      }
      // re-rendered while open: the same control again, or the window
      let same: HTMLElement | null = null;
      try { same = lastKey ? box.querySelector<HTMLElement>(lastKey) : null; } catch { same = null; }
      (same ?? box).focus({ preventScroll: true });
    }).observe(root, { childList: true });
  }

  /** A quick action that only picks a tool is noise when that tool is already in hand. */
  private quickShown(step: TutorialStep): boolean {
    const qa = step.quickAction;
    if (!qa) return false;
    return !(qa.id.startsWith('tool-') && this.activeTool === qa.id.slice(5));
  }

  /** Keeps the lesson's on-board label over its target (CSS px inside the viewport); hidden when off screen. */
  private placeTutPointer() {
    const el = this.mount.querySelector<HTMLElement>('#tut-pointer');
    if (!el) return;
    const tp = this.tutPointer;
    const both = this.camera.bothSides;
    if (!tp || (!both && tp.side !== this.camera.side)) { el.hidden = true; return; }
    const p = this.boardToScreen(tp.pos, tp.side);
    const r = this.canvas.getBoundingClientRect();
    const { w, h } = this.canvasDims();
    if (!p || p.sx < 0 || p.sy < 0 || p.sx > w || p.sy > h) { el.hidden = true; return; }
    const k = r.width / w; // device px → CSS px
    const ringPx = tp.radius * this.camera.pxPerMm(h) * k;
    if (el.textContent !== tp.label) el.textContent = tp.label;
    el.style.transform = `translate3d(${(p.sx * k).toFixed(1)}px, ${(p.sy * k - ringPx - 10).toFixed(1)}px, 0) translate(-50%, -100%)`;
    el.hidden = false;
  }

  /** Canvas size in device pixels (as the camera and the pointer handlers use it). */
  private canvasDims(): { w: number; h: number } {
    const r = this.canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    return { w: Math.max(1, r.width * dpr), h: Math.max(1, r.height * dpr) };
  }

  /** A board point on screen (device px), the inverse of `screenToBoard` + `resolveBoardPt`. */
  private boardToScreen(pt: V2, side: Side): { sx: number; sy: number } | null {
    const { w, h } = this.canvasDims();
    const { viewProj } = this.camera.matrices(w, h);
    const both = this.camera.bothSides;
    const x = both && side === 'B' ? this.board.w * 2 + BOTH_GAP - pt[0] : pt[0];
    const z = ((both || side === 'F') ? 1 : -1) * this.board.thickness / 2;
    const c = transform4(viewProj, x, pt[1], z, 1);
    if (Math.abs(c[3]) < 1e-7) return null;
    return { sx: (c[0] / c[3] * 0.5 + 0.5) * w, sy: (0.5 - c[1] / c[3] * 0.5) * h };
  }

  /**
   * Keyboard board cursor: the board view is one Tab stop. Arrow keys jump between pads, vias,
   * parts, blobs, jumper ends and points along traces (in the direction they point on screen);
   * Shift+arrows move 0.5 mm; Enter uses the current tool there, like a click (Shift+Enter: the
   * meter's black probe); Escape cancels a jumper. It says only what the board shows.
   */
  private wireBoardCursor() {
    this.mount.querySelector('.skip-board')?.addEventListener('click', (e) => { e.preventDefault(); this.canvas.focus(); this.kbEnter(); });
    const dirs: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
    this.canvas.addEventListener('focus', () => { if (this.canvas.matches(':focus-visible')) this.kbEnter(); });
    this.canvas.addEventListener('blur', () => { this.kbActive = false; this.endIronHold(); });
    this.canvas.addEventListener('keyup', (e) => { if (e.key === 'Enter') this.endIronHold(); });
    this.canvas.addEventListener('keydown', (e) => {
      const d = dirs[e.key];
      if (d) {
        e.preventDefault();
        e.stopPropagation();
        if (!this.kbActive) this.kbEnter();
        this.kbMove(d, e.shiftKey);
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        if (!this.kbActive) { this.kbEnter(); return; }
        // realistic iron: Enter held = tip held on the joint
        if (this.activeTool === 'iron' && this.reworkMode.realistic && this.kbCursor) {
          if (e.repeat || this.ironHold) return;
          if (this.beginIronHold(this.kbCursor.pt, this.kbCursor.side)) return;
        }
        this.kbApply(e.shiftKey);
        return;
      }
      if (e.key === 'Escape' && this.jumperStart) {
        e.stopPropagation();
        this.jumperStart = null;
        this.announce(t('Jumper cancelled.'));
      }
    });
  }

  private kbEnter() {
    const side = this.camera.bothSides ? (this.kbCursor?.side ?? 'F') : this.camera.side;
    if (!this.kbCursor || (!this.camera.bothSides && this.kbCursor.side !== side)) {
      const sel = this.board.components.find((c) => c.id === this.selectedCompId);
      if (sel && (this.camera.bothSides || sel.side === side)) this.kbCursor = { pt: sel.at, side: sel.side };
      else {
        // the stop nearest the middle of the board
        const mid: V2 = [this.board.w / 2, this.board.h / 2];
        let best: V2 = mid, bd = Infinity;
        for (const p of cursorStops(this.board, side)) { const d = Math.hypot(p[0] - mid[0], p[1] - mid[1]); if (d < bd) { bd = d; best = p; } }
        this.kbCursor = { pt: best, side };
      }
    }
    this.kbActive = true;
    const first = !this.kbUsed;
    this.kbUsed = true;
    const tool = TOOLS.find((x) => x.id === this.activeTool);
    const summary = t('{board}: {n} parts, {side}. Tool: {tool}.', {
      board: t(this.activeScenario.meta.title),
      n: this.board.components.length,
      side: this.camera.bothSides ? t('both sides') : side === 'F' ? t('top side') : t('bottom side'),
      tool: tool ? t(tool.lbl) : '',
    });
    this.kbAfterMove(false, summary);
    if (first) this.renderTutorial(); // the lesson card adds its keyboard line
  }

  private kbMove(dir: [number, number], fine: boolean) {
    const cur = this.kbCursor;
    if (!cur) return;
    if (fine) {
      const from = this.boardToScreen(cur.pt, cur.side);
      if (!from) return;
      const { w, h } = this.canvasDims();
      const px = 0.5 * this.camera.pxPerMm(h);
      const res = this.resolveBoardPt(this.camera.screenToBoard(from.sx + dir[0] * px, from.sy + dir[1] * px, w, h, this.board.thickness));
      if (!res) return;
      this.kbCursor = { pt: res.pt, side: res.side };
      this.kbAfterMove(true);
      return;
    }
    const from = this.boardToScreen(cur.pt, cur.side);
    if (!from) return;
    const sides: Side[] = this.camera.bothSides ? ['F', 'B'] : [cur.side];
    const stops: { item: { pt: V2; side: Side }; sx: number; sy: number }[] = [];
    for (const side of sides) {
      for (const pt of cursorStops(this.board, side)) {
        const s = this.boardToScreen(pt, side);
        if (s) stops.push({ item: { pt, side }, sx: s.sx, sy: s.sy });
      }
    }
    const next = stepToward(stops, from, dir);
    if (!next) { this.announce(t('Edge of the board.')); return; }
    this.kbCursor = next;
    this.kbAfterMove(false);
  }

  /** After the cursor moved: keep it on screen, drive the hover / reticle like the mouse, say where it is. */
  private kbAfterMove(withCoords: boolean, lead = '') {
    const c = this.kbCursor;
    if (!c) return;
    const p = this.boardToScreen(c.pt, c.side);
    const { w, h } = this.canvasDims();
    if (p && (p.sx < w * 0.15 || p.sx > w * 0.85 || p.sy < h * 0.15 || p.sy > h * 0.85)) this.camera.panScreen(w / 2 - p.sx, h / 2 - p.sy, h);
    this.cursorWorld = c.pt;
    this.cursorSide = c.side;
    this.hovered = pickAt(this.board, c.pt, c.side, this.vizMode === 'xray');
    this.renderTopHud();
    const said = describeAt(this.board, this.conn, c.pt, c.side) + (withCoords ? ` (${c.pt[0].toFixed(1)}, ${c.pt[1].toFixed(1)} mm)` : '');
    this.announce(lead ? `${lead} ${said}` : said);
  }

  /** Enter on the board: the current tool at the cursor, exactly as a click there. */
  private kbApply(black: boolean) {
    const c = this.kbCursor;
    if (!c) return;
    this.cursorWorld = c.pt;
    this.cursorSide = c.side;
    if (this.activeTool === 'dmm') { this.placeProbe(black ? 'black' : 'red', c.pt, c.side); return; } // the meter announces its reading
    this.applyToolAt(c.pt, c.side);
    // say what is there now (a pressed switch, a removed blob, an empty footprint); toasts speak for themselves
    setTimeout(() => { if (this.kbCursor === c) this.announce(describeAt(this.board, this.conn, c.pt, c.side)); }, 200);
  }

  /**
   * The component's pads with their nets, each with a red and a black probe button: the meter
   * without a pointer (keyboard, screen reader), and on a phone a sure hit on pads too small to tap.
   */
  private padsCardHtml(c: Component): string {
    if (!c.pads.length) return '';
    const MAX = 64;
    const rows = c.pads.slice(0, MAX).map((p, i) => {
      const { at } = padWorld(c, p);
      const side: Side = p.layers === 'B' ? 'B' : p.layers === 'F' ? 'F' : c.side;
      const hit = netAt(this.board, this.conn, at, side, false);
      const net = hit && hit.net >= 0 ? this.conn.netNames[hit.net] : t('Open / No copper');
      const where = `${c.ref}.${p.name} (${net})`;
      const on = (which: 'red' | 'black') => {
        const pr = which === 'red' ? this.probeRed : this.probeBlack;
        return !!pr && pr.side === side && Math.hypot(pr.pos[0] - at[0], pr.pos[1] - at[1]) < 0.05;
      };
      return `
        <div class="pad-row">
          <span class="pad-name"><b>${this.esc(p.name)}</b><span>${this.esc(net)}</span></span>
          <span class="pad-probes">
            <button class="btn sm pad-probe red${on('red') ? ' active' : ''}" data-probe-pad="${i}" data-probe="red" aria-pressed="${on('red')}" aria-label="${this.esc(t('{probe} on {pad}', { probe: t('Red probe'), pad: where }))}"><i></i>${t('Red')}</button>
            <button class="btn sm pad-probe blk${on('black') ? ' active' : ''}" data-probe-pad="${i}" data-probe="black" aria-pressed="${on('black')}" aria-label="${this.esc(t('{probe} on {pad}', { probe: t('Black probe'), pad: where }))}"><i></i>${t('Black')}</button>
          </span>
        </div>`;
    }).join('');
    const more = c.pads.length > MAX ? `<div class="muted">${t('Showing {shown} of {n} pads; probe the rest on the board.', { shown: MAX, n: c.pads.length })}</div>` : '';
    return `
      <div class="card">
        <div class="card-title">${t('Pads')} (${c.pads.length})</div>
        <div class="stack pad-list">${rows}</div>${more}
      </div>`;
  }

  /** Probe buttons in the Pads card (one delegated listener: the panel is re-rendered as HTML). */
  private onPadProbeClick(e: MouseEvent) {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-probe-pad]');
    if (!b) return;
    const c = this.board.components.find((x) => x.id === this.selectedCompId);
    const p = c?.pads[Number(b.dataset.probePad)];
    if (!c || !p) return;
    const { at } = padWorld(c, p);
    const side: Side = p.layers === 'B' ? 'B' : p.layers === 'F' ? 'F' : c.side;
    if (this.activeTool !== 'dmm') this.setTool('dmm');
    this.placeProbe(b.dataset.probe === 'black' ? 'black' : 'red', at, side);
    // mark which pad holds which probe without rebuilding the panel (focus stays on the button)
    this.sideBodyEl.querySelectorAll<HTMLButtonElement>(`.pad-probe.${b.dataset.probe === 'black' ? 'blk' : 'red'}`).forEach((x) => {
      const mine = x === b;
      x.classList.toggle('active', mine);
      x.setAttribute('aria-pressed', String(mine));
    });
  }

  /** Mobile tool strip: scrolling tools with labels, undo / redo pinned at the end (reset is in More). */
  private mobileDockHtml(): string {
    return `
        <aside class="tooldock" id="tooldock">
          <div class="tool-scroll">
            ${TOOLS.map((tl) => `
              <button class="tool-btn ${tl.id === this.activeTool ? 'active' : ''}" data-tool="${tl.id}" aria-label="${this.esc(t(tl.lbl))}" aria-pressed="${tl.id === this.activeTool}">
                ${icon(tl.ico, 20)}
                <span class="tool-lbl">${t(TOOL_SHORT[tl.id] ?? tl.lbl)}</span>
              </button>
            `).join('')}
            <button class="tool-btn more-tools" id="btn-more-tools" aria-label="${t('More tools')}" hidden>${icon('plus', 20)}<span class="tool-lbl">${t('More')}</span></button>
          </div>
          <div class="tool-pinned">
            <button class="tool-btn" id="btn-undo" aria-label="${t('Undo')}">${icon('undo', 20)}<span class="tool-lbl">${t('Undo')}</span></button>
            <button class="tool-btn" id="btn-redo" aria-label="${t('Redo')}">${icon('redo', 20)}<span class="tool-lbl">${t('Redo')}</span></button>
          </div>
        </aside>`;
  }

  /** Mobile "More" sheet: view, display and bench controls that live in the desktop top bar. */
  private mobileMoreHtml(): string {
    const row = (id: string, ico: string, label: string) => `<button class="m-row" data-proxy="${id}">${icon(ico, 16)}<span>${label}</span></button>`;
    return `
      <div class="m-more-bg" id="m-more" hidden>
        <div class="m-more" role="dialog" aria-label="${t('View, bench and settings')}">
          <div class="m-more-head"><span>${t('View & bench')}</span><button class="btn ghost icon" id="m-more-close" title="${t('Close')}">${icon('x', 16)}</button></div>
          <div class="m-more-body">
            <div class="m-sec"><div class="m-sec-t">${t('View')}</div><div class="m-ctl" id="m-slot-view"></div><div class="m-ctl" id="m-slot-side"></div>
              <button class="m-row" data-proxy="#btn-invert-orbit">${icon('rotate', 16)}<span id="m-invert-lbl"></span></button></div>
            <div class="m-sec"><div class="m-sec-t">${t('Display')}</div><div class="m-ctl" id="m-slot-viz"></div></div>
            <div class="m-sec"><div class="m-sec-t">${t('Bench')}</div><div class="m-bench" id="m-slot-bench"></div></div>
            <div class="m-sec"><div class="m-sec-t">${t('Board')}</div>
              ${row('#btn-tutorial', 'book', t('Tutorial'))}
              ${row('#btn-reset', 'reset', t('Reset board'))}
              ${row('#btn-new-board', 'plus', t('New blank board'))}
              ${row('#btn-import', 'upload', t('Import a board or mod'))}
            </div>
            <div class="m-sec"><div class="m-sec-t">${t('App')}</div>
              ${this.langPickerHtml('row')}
              <button class="m-row" data-proxy="#btn-sound"><span id="m-sound-ico"></span><span id="m-sound-lbl"></span></button>
              ${this.statsAvailable ? '<button class="m-row" data-proxy="#btn-stats"><span id="m-stats-ico"></span><span id="m-stats-lbl"></span></button>' : ''}
              ${row('#btn-feedback', 'message', t('Feedback'))}
              ${row('#btn-help', 'help', t('Help'))}
            </div>
          </div>
        </div>
      </div>`;
  }

  /**
   * Phone in portrait: a small dismissible hint to turn sideways, at the top of the bench readouts
   * (shown by CSS only in portrait on a phone-sized screen, so rotating hides it). It never covers
   * the board: a full-screen prompt here was the first thing new phone visitors saw, and many left.
   * Closing it is remembered; otherwise it fades out on its own after a while.
   */
  private rotateHintHtml(): string {
    let ok = false;
    try { ok = localStorage.getItem('pcbfix_portrait_ok') === '1'; } catch { /* storage unavailable */ }
    if (ok) return '';
    return `
            <div class="m-rotate" id="m-rotate" role="status">
              <span class="m-rotate-ico">${icon('phone', 16)}</span>
              <span class="m-rotate-t">${t('Turn sideways for more room')}</span>
              <button class="m-rotate-x" id="m-rotate-keep" title="${t('Keep portrait')}" aria-label="${t('Keep portrait')}">${icon('x', 14)}</button>
            </div>`;
  }

  /** Moves the desktop top-bar controls into the More sheet (their listeners move with them). */
  private fillMobileMore() {
    const q = (sel: string) => this.mount.querySelector<HTMLElement>(sel);
    q('#m-slot-view')?.append(q('#seg-view')!);
    q('#m-slot-side')?.append(q('#seg-side')!);
    q('#m-slot-viz')?.append(q('#viz-select')!);
    const pop = q('#bench-pop');
    if (pop) q('#m-slot-bench')?.append(...Array.from(pop.children));
    // the reset button lives in the More sheet on mobile; a hidden one keeps the proxy simple
    if (!q('#btn-reset')) {
      const b = document.createElement('button');
      b.id = 'btn-reset';
      b.hidden = true;
      q('#tooldock')?.append(b);
    }
  }

  /** Walkthrough videos per scenario id (videos/index.json, rendered by scripts/videos/record.ts). */
  private videos: Record<string, Record<'approach' | 'solution', { file: string; captions: string; poster: string; seconds: number }>> = {};

  private async loadVideoIndex() {
    try {
      const res = await fetch('./videos/index.json');
      if (res.ok) { this.videos = await res.json(); this.renderUI(); }
    } catch { /* videos are optional */ }
  }

  private playVideo(id: string, kind: 'approach' | 'solution') {
    const v = this.videos[id]?.[kind];
    if (!v) return;
    if (id === this.activeScenario.id) this.attempts?.video(kind);
    if (id === this.activeScenario.id && kind === 'solution' && this.rated) this.rated.solution = true;
    const box = document.createElement('div');
    box.className = 'video-backdrop';
    box.innerHTML = `
      <div class="video-panel" role="dialog" aria-label="${kind === 'approach' ? t('How to approach') : t('Solution')}">
        <div class="video-head">
          <span>${this.esc(t(this.activeScenario.meta.title))} · ${kind === 'approach' ? t('How to approach') : t('Solution')}</span>
          <button class="btn ghost icon sm" data-close title="${t('Close (Esc)')}">${icon('x', 14)}</button>
        </div>
        <video controls autoplay playsinline preload="metadata" poster="./videos/${v.poster}">
          <source src="./videos/${v.file}" type="video/mp4" />
          <track kind="captions" src="./videos/${v.captions}" srclang="en" label="English" />
        </video>
      </div>`;
    const close = () => { box.remove(); window.removeEventListener('keydown', onKey, true); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); close(); } };
    box.addEventListener('click', (e) => { if (e.target === box || (e.target as HTMLElement).closest('[data-close]')) close(); });
    window.addEventListener('keydown', onKey, true);
    document.body.appendChild(box);
  }

  /**
   * A mod board's schematic in a floating, movable, resizable window over the bench, so it can be read
   * while probing. PDFs use the browser's own viewer (zoom, search); images scroll and zoom on click.
   */
  private async openSchematic(s: Scenario) {
    const mb = this.modBoards.get(s);
    if (!mb?.schematic) return;
    document.querySelector('.schem-win')?.remove();
    let url = this.schematicUrls.get(mb);
    if (!url) {
      try {
        url = URL.createObjectURL(new Blob([(await mb.schematic.read()) as BlobPart], { type: mb.schematic.mime }));
        this.schematicUrls.set(mb, url);
      } catch (e) {
        this.toast(t('Could not open the schematic: {error}', { error: e instanceof Error ? e.message : String(e) }), 'danger');
        return;
      }
    }
    const pdf = mb.schematic.mime === 'application/pdf';
    const win = document.createElement('div');
    win.className = 'schem-win';
    win.setAttribute('role', 'dialog');
    win.innerHTML = `
      <div class="schem-head" title="${t('Drag to move')}">
        <span>${icon('book', 13)} ${this.esc(t(s.meta.title))} · ${t('schematic')}</span>
        <button class="btn ghost icon sm" data-close title="${t('Close')}">${icon('x', 14)}</button>
      </div>
      <div class="schem-body">${pdf
        ? `<iframe src="${url}" title="${t('Schematic')}"></iframe>`
        : `<img src="${url}" alt="${this.esc(t('Schematic of {title}', { title: s.meta.title }))}" title="${t('Click to zoom')}" draggable="false" />`}</div>`;
    document.body.appendChild(win);
    win.querySelector('[data-close]')!.addEventListener('click', () => win.remove());
    const img = win.querySelector('img');
    img?.addEventListener('click', () => img.classList.toggle('zoom'));
    const head = win.querySelector<HTMLElement>('.schem-head')!;
    head.addEventListener('pointerdown', (e) => {
      if ((e.target as HTMLElement).closest('button')) return;
      const r = win.getBoundingClientRect();
      const dx = e.clientX - r.left, dy = e.clientY - r.top;
      win.classList.add('dragging');
      head.setPointerCapture(e.pointerId);
      const move = (ev: PointerEvent) => {
        win.style.left = `${Math.min(window.innerWidth - 80, Math.max(0, ev.clientX - dx))}px`;
        win.style.top = `${Math.min(window.innerHeight - 40, Math.max(0, ev.clientY - dy))}px`;
      };
      const up = () => { win.classList.remove('dragging'); head.removeEventListener('pointermove', move); head.removeEventListener('pointerup', up); };
      head.addEventListener('pointermove', move);
      head.addEventListener('pointerup', up);
    });
  }

  /** Test / recording hook (only with ?automation): board geometry ↔ screen, camera control. */
  private exposeAutomation() {
    const find = (ref: string) => this.board.components.find((c) => c.ref === ref);
    (window as unknown as { deadboard: unknown }).deadboard = {
      ready: () => !!this.renderer && !!this.board,
      scenario: () => this.activeScenario.id,
      open: async (id: string) => { const i = this.scenarios.findIndex((x) => x.id === id); if (i < 0) return false; await this.openScenario(i); this.refreshScenarioSelect(); return true; },
      pads: (ref: string) => find(ref)?.pads.map((p) => ({ name: p.name, net: p.net ?? '' })) ?? [],
      part: (ref: string) => { const c = find(ref); return c && { x: c.at[0], y: c.at[1], side: c.side }; },
      pad: (ref: string, name: string) => {
        const c = find(ref), p = c?.pads.find((q) => q.name === name);
        if (!c || !p) return null;
        const w = padWorld(c, p).at;
        return { x: w[0], y: w[1], side: p.layers === 'B' ? 'B' : p.layers === 'F' ? 'F' : c.side };
      },
      focus: (x: number, y: number, halfH = 10, side?: Side) => { this.camera.bothSides = false; this.camera.focusAt(x, y, halfH, side); this.renderUI(); },
      fit: () => this.camera.fitBoard(this.board.w, this.board.h),
      /** The bug-report snapshot code, without sending anything. */
      snapshot: () => this.benchSnapshot(),
      side: () => this.camera.side,
      /** Rework state of a joint: its temperature, the thermal clock, and the part's joint faults. */
      joint: (ref: string, name: string) => {
        const c = find(ref), pi = c ? c.pads.findIndex((p) => p.name === name) : -1;
        if (!c || pi < 0) return null;
        return { temp: this.thermal?.jointTemp(c, pi) ?? null, time: this.thermal?.time ?? null, cold: c.state.cold.includes(pi), residue: !!c.state.fluxResidue?.includes(pi), lifted: !!c.state.lifted?.includes(pi), sameBoard: this.thermalBoard === this.board };
      },
      /** Board point (mm) → page pixel (CSS px), on the given side's copper surface. */
      toScreen: (x: number, y: number, side: Side = this.camera.side) => {
        const r = this.canvas.getBoundingClientRect();
        const { viewProj } = this.camera.matrices(this.canvas.width, this.canvas.height);
        const z = (side === 'F' ? 1 : -1) * this.board.thickness / 2;
        const [cx, cy, , cw] = transform4(viewProj, x, y, z, 1);
        return { x: r.left + ((cx / cw + 1) / 2) * r.width, y: r.top + ((1 - cy / cw) / 2) * r.height };
      },
    };
  }

  /** Demo boards listed in demos/index.json: shown in the list, fetched when opened. */
  private demoUrls = new Map<Scenario, string>();

  private async addDemoStubs() {
    try {
      const res = await fetch('./demos/index.json');
      if (!res.ok) return;
      const list = (await res.json()) as { id: string; file: string; title: string; difficulty: number; description: string; credits?: string; license?: string; source?: string }[];
      for (const d of list) {
        const stub: Scenario = {
          format: 'pcbfix/1', id: d.id, solver: 'spice-power', objectives: [],
          meta: { title: d.title, author: 'DEADBOARD', difficulty: d.difficulty, description: d.description, hints: [], credits: d.credits, license: d.license, source: d.source },
          board: new Builder(10, 10).b,
        };
        this.demoUrls.set(stub, `./demos/${d.file}`);
        this.scenarios.push(stub);
      }
    } catch { /* demos are optional */ }
  }

  /** Loads mods (desktop mods folder + installed .zips) and lists their boards. Never fails startup. */
  private async loadMods() {
    // drop the boards of a previous load (after install / remove), keeping any that is open
    const active = this.activeScenario;
    this.scenarios = this.scenarios.filter((s) => !this.modBoards.has(s) || s === active);
    for (const s of [...this.modBoards.keys()]) if (s !== active) this.modBoards.delete(s);
    for (const url of this.schematicUrls.values()) URL.revokeObjectURL(url);
    this.schematicUrls.clear();
    if (this.safeMode) { this.modResult = emptyModResult(true); setDeviceOverlay(null); this.devices = null; setFaultRangeOverlay(null); this.faults = null; setActiveDmm(null); this.meters = null; return; }
    try {
      const builtin = new Set(this.scenarios.filter((s) => !this.modBoards.has(s)).map((s) => s.id));
      this.modResult = await loadAllMods((id) => builtin.has(id), (id) => isModOn(this.loadouts, id));
    } catch (e) {
      this.modResult = { ...emptyModResult(), failed: [{ name: 'mods', origin: '', error: e instanceof Error ? e.message : String(e) }] };
    }
    for (const mod of this.modResult.active) {
      for (const b of mod.boards) {
        if (active && this.modBoards.has(active) && active.id === b.stub.id) { this.modBoards.set(active, b); continue; }
        this.modBoards.set(b.stub, b);
        this.scenarios.push(b.stub);
      }
    }
    // puzzles: listed now, built on their board when opened
    for (const mod of this.modResult.active) {
      for (const pz of mod.manifest.puzzles) {
        const mb = this.puzzleEntry(mod, pz);
        if (!mb) continue;
        mod.boards.push(mb);
        if (active && this.modBoards.has(active) && active.id === mb.stub.id) { this.modBoards.set(active, mb); continue; }
        this.modBoards.set(mb.stub, mb);
        this.scenarios.push(mb.stub);
      }
    }
    this.patchBoards();
    // devices: added and patched models, for every solve from now on (the worker gets them per request)
    this.devices = buildDeviceOverlay(this.modResult.active);
    setDeviceOverlay(this.devices.overlay);
    for (const [addr, l] of this.devices.log) this.patchLog.set(addr, l);
    this.faults = buildFaultRegistry(this.modResult.active, FAULT_CLASSES);
    setFaultRangeOverlay(this.faults.ranges);
    for (const [addr, l] of this.faults.log) this.patchLog.set(addr, l);
    this.rules = buildRuleSet(this.modResult.active);
    for (const [addr, l] of this.rules.log) this.patchLog.set(addr, l);
    this.lookHere = null;
    this.meters = buildMeterRegistry(this.modResult.active);
    for (const [addr, l] of this.meters.log) this.patchLog.set(addr, l);
    this.applyMeter();
    void this.syncCodeMods();
  }

  /** A code mod asks the app for something; the host has already checked its permission. */
  private async answerModRequest(modId: string, req: ModRequest): Promise<unknown> {
    switch (req.op) {
      case 'ui.zoomTo': {
        if (!this.board.components.some((c) => c.ref === req.ref)) return false;
        this.gotoRef(req.ref);
        return true;
      }
      case 'ui.highlight': {
        // by id, or by name (an empty name would match the unnamed nets)
        const net = typeof req.net === 'number' ? (req.net >= 0 && req.net < this.conn.netCount ? req.net : -1) : req.net ? this.conn.netNames.indexOf(req.net) : -1;
        if (net < 0) return false;
        this.gotoNet(net);
        return true;
      }
      case 'board.netsNear': {
        const c = this.board.components.find((x) => x.ref === req.ref);
        if (!c) return [];
        return netsNear(this.conn, c, req.mm).slice(0, 100).map((x) => ({ net: this.conn.netNames[x.net] || x.net, mm: Math.round(x.mm * 100) / 100, pad: x.pad }));
      }
      case 'ui.say': {
        const now = Date.now();
        if (now - (this.lastSay.get(modId) ?? 0) < 1000) return null; // one a second
        this.lastSay.set(modId, now);
        this.toast(`${modId}: ${req.text}`, 'info');
        return null;
      }
      case 'storage.get': case 'storage.set': {
        const key = `deadboard_modstore_${modId}`;
        let store: Record<string, string> = {};
        try { store = JSON.parse(localStorage.getItem(key) ?? '{}') as Record<string, string>; } catch { /* empty */ }
        if (req.op === 'storage.get') return store[req.key] ?? null;
        if (req.value === null) delete store[req.key]; else store[req.key] = req.value;
        const text = JSON.stringify(store);
        if (text.length > 64 * 1024) throw new Error('storage is full (64 KB per mod)');
        try { localStorage.setItem(key, text); } catch { throw new Error('storage unavailable'); }
        return null;
      }
    }
  }

  private onModPanels() {
    if (!this.started) return;
    const tab = this.mount.querySelector<HTMLButtonElement>('.tab[data-tab="mods"]');
    const has = this.codeHost.panels().length > 0;
    if (tab && tab.hidden === has) { this.renderUI(); return; }
    if (this.activeTab === 'mods') this.renderModPanelsTab();
  }

  /** Tells code mods what the bench just solved (at most four times a second). */
  private emitSolved() {
    if (!this.runningCode.size || this.solvedTimer) return;
    this.solvedTimer = setTimeout(() => {
      this.solvedTimer = null;
      if (!this.sim?.source || !this.powerOn) return;
      const parts: Record<string, { i: number; v: number; p: number; on: boolean }> = {};
      for (const c of this.board.components) { const r = this.sim.comps.get(c.id); if (r) parts[c.ref] = { i: r.i, v: r.v, p: r.p, on: r.on }; }
      this.codeHost.emit('bench:solved', { nets: this.netVoltsByName(), parts });
    }, 250);
  }

  /** The side panel's Mods tab: panels from running code mods, drawn by the app. */
  private renderModPanelsTab() {
    const refs = new Set(this.board.components.map((c) => c.ref));
    const linkRefs = (text: string) => this.esc(text).replace(/\b([A-Z]{1,4}\d{1,4}[A-Z]?)\b/g, (m) => (refs.has(m) ? `<button class="kn-ref mono" data-kn-ref="${m}">${m}</button>` : m));
    const key = (modId: string, panel: string, id: string) => `${modId}|${panel}|${id}`;
    const node = (modId: string, panel: string, n: PanelNode): string => {
      switch (n.type) {
        case 'heading': return `<div class="card-title">${this.esc(n.text)}</div>`;
        case 'text': return `<div class="mp-text ${n.tone ?? ''}">${n.linkRefs ? linkRefs(n.text) : this.esc(n.text)}</div>`;
        case 'ref': return refs.has(n.ref) ? `<button class="kn-ref mono" data-kn-ref="${this.esc(n.ref)}">${this.esc(n.label ?? n.ref)}</button>` : `<span class="kn-stale-item">${this.esc(n.label ?? n.ref)}</span>`;
        case 'list': return `<ul class="mp-list">${n.items.map((x) => `<li>${n.linkRefs ? linkRefs(x) : this.esc(x)}</li>`).join('')}</ul>`;
        case 'row': return `<div class="row wrap">${n.children.map((c) => node(modId, panel, c)).join('')}</div>`;
        case 'button': return `<button class="btn sm" data-mp-btn="${this.esc(key(modId, panel, n.id))}">${this.esc(n.label)}</button>`;
        case 'input': {
          const k = key(modId, panel, n.id);
          const v = this.panelInputs.get(k) ?? n.value ?? '';
          const field = n.multiline
            ? `<textarea data-mp-input="${this.esc(k)}" rows="3" placeholder="${this.esc(n.placeholder ?? '')}">${this.esc(v)}</textarea>`
            : `<input type="text" data-mp-input="${this.esc(k)}" placeholder="${this.esc(n.placeholder ?? '')}" value="${this.esc(v)}" />`;
          return `<div class="field mp-input">${n.label ? `<label>${this.esc(n.label)}</label>` : ''}${field}<button class="btn sm primary" data-mp-submit="${this.esc(k)}">${this.esc(n.submit)}</button></div>`;
        }
        case 'divider': return '<hr class="mp-hr" />';
      }
    };
    const panels = this.codeHost.panels();
    this.sideBodyEl.innerHTML = panels.map((p) => `
      <div class="card mod-panel">
        <div class="card-title"><span>${this.esc(p.title)}</span><span class="badge info" title="${t('From a code mod, running in the sandbox')}">${this.esc(p.modId)}</span></div>
        ${p.content.map((n) => node(p.modId, p.id, n)).join('')}
      </div>`).join('') || `<div class="muted" style="padding:16px">${t('No mod panels.')}</div>`;
    const act = (k: string, value?: string) => {
      const [modId, panel, id] = k.split('|');
      this.codeHost.emitTo(modId, 'panel:action', { panel, id, ...(value !== undefined && { value }) });
    };
    this.sideBodyEl.querySelectorAll<HTMLElement>('[data-mp-input]').forEach((el) => {
      el.addEventListener('input', () => this.panelInputs.set(el.dataset.mpInput!, (el as HTMLInputElement).value));
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && (el.tagName === 'INPUT' || (e as KeyboardEvent).metaKey || (e as KeyboardEvent).ctrlKey)) { e.preventDefault(); act(el.dataset.mpInput!, (el as HTMLInputElement).value); }
      });
    });
    this.sideBodyEl.querySelectorAll<HTMLButtonElement>('[data-mp-submit]').forEach((b) => b.addEventListener('click', () => act(b.dataset.mpSubmit!, this.panelInputs.get(b.dataset.mpSubmit!) ?? (this.sideBodyEl.querySelector<HTMLInputElement>(`[data-mp-input="${CSS.escape(b.dataset.mpSubmit!)}"]`)?.value ?? ''))));
    this.sideBodyEl.querySelectorAll<HTMLButtonElement>('[data-mp-btn]').forEach((b) => b.addEventListener('click', () => act(b.dataset.mpBtn!)));
    this.sideBodyEl.querySelectorAll<HTMLButtonElement>('[data-kn-ref]').forEach((b) => b.addEventListener('click', () => this.gotoRef(b.dataset.knRef!)));
  }

  private meterOptionsKey = '';
  /** Uses the chosen meter (the official one when the choice is gone). */
  private applyMeter() {
    const m = this.meters?.meters.find((x) => x.address === this.meterChoice) ?? this.meters?.meters.find((x) => x.address === OFFICIAL_METER);
    setActiveDmm(m?.profile ?? null);
    const sel = this.mount.querySelector<HTMLSelectElement>('#meter-select');
    if (!sel) return;
    const list = this.meters?.meters ?? [];
    const key = list.map((x) => `${x.address}=${x.profile.name}`).join('|');
    if (key === this.meterOptionsKey && sel.options.length) { sel.value = m?.address ?? OFFICIAL_METER; return; }
    this.meterOptionsKey = key;
    sel.innerHTML = list.map((x) => `<option value="${this.esc(x.address)}">${this.esc(x.address === OFFICIAL_METER ? t('Generic 6000-count') : `${x.profile.name} · ${x.modId}`)}</option>`).join('');
    sel.value = m?.address ?? OFFICIAL_METER;
    const row = sel.closest<HTMLElement>('.bench-row');
    if (row) row.hidden = list.length < 2;
  }

  /** Loads the real code-mod host and the sandbox (first time code mods run). */
  private async ensureCodeHost() {
    if (this.codeHost !== NO_CODE_HOST) return;
    const [{ CodeModHost }, { sandboxTransport }] = await Promise.all([import('../mods/api/host'), import('../mods/api/sandbox')]);
    if (this.codeHost !== NO_CODE_HOST) return;
    this.codeHost = new CodeModHost(sandboxTransport, {
      onLog: (id, text) => console.info(`[mod ${id}] ${text}`),
      onCrash: (id, error) => this.onCodeModCrash(id, error),
      onRequest: (id, req) => this.answerModRequest(id, req),
      onPanels: () => this.onModPanels(),
    });
  }

  /** Starts the running code mods (when code mods are on) and stops the others. */
  private async syncCodeMods() {
    const want = this.codeModsOn && this.codeModsSupported && !this.safeMode ? this.modResult.active.filter((m) => m.manifest.code) : [];
    if (want.length) {
      try { await this.ensureCodeHost(); } catch (e) { this.toast(t('Could not start code mods: {error}', { error: e instanceof Error ? e.message : String(e) }), 'danger'); return; }
    }
    const ids = new Set(want.map((m) => m.manifest.id));
    for (const id of [...this.runningCode.keys()]) if (!ids.has(id)) { this.codeHost.stop(id); this.runningCode.delete(id); }
    let started = false;
    for (const m of want) {
      const key = `${m.manifest.id}@${m.manifest.version}`;
      if (this.runningCode.get(m.manifest.id) === key) continue;
      this.runningCode.set(m.manifest.id, key);
      if (this.started && this.showMods) this.renderModsModal();
      try { await this.codeHost.start(m); started = true; } catch { /* the card shows why */ }
    }
    if (this.modSolver && !this.codeHost.solvers().some((x) => x.address === this.modSolver)) this.modSolver = null;
    if (started) this.emitBoardLoaded();
    if (!this.started) return;
    if (!this.modSolver && this.activeScenario.modSolver) this.useBoardSolver(this.activeScenario, false);
    this.refreshSolverSelect();
    if (this.showMods) this.renderModsModal();
  }

  private onCodeModCrash(modId: string, error: string) {
    this.runningCode.delete(modId);
    if (this.modSolver?.startsWith(`${modId}/`)) {
      this.modSolver = null;
      this.simFromMod = false;
      if (this.started) { this.recompute(true); this.renderUI(); }
    }
    if (this.started) {
      this.toast(t('The mod «{mod}» stopped: {error}', { mod: modId, error }), 'danger');
      this.refreshSolverSelect();
      if (this.showMods) this.renderModsModal();
    }
  }

  /** A board made for a solver mod: use it when it runs, else say what it needs. */
  private useBoardSolver(sc: Scenario, explain = true) {
    const want = sc.modSolver;
    if (!want) return;
    const s = this.codeHost.solvers().find((x) => x.address === want);
    if (s) {
      this.modSolver = s.address;
      if (explain) this.toast(t('This board runs on the solver «{name}» from the mod «{mod}».', { name: s.name, mod: s.modId }), 'info');
    } else if (explain) {
      this.toast(t('This board is made for the solver {solver}, which isn\'t running (Mods: install it and turn on code mods). Using {official}.', { solver: want, official: t(SOLVERS.find((x) => x.id === this.solver)?.name ?? this.solver) }), 'warn');
    }
  }

  /** Sends the open board to running code mods. */
  private emitBoardLoaded() {
    if (!this.runningCode.size || !this.board) return;
    this.codeHost.emit('board:loaded', { title: this.activeScenario.meta.title, netlist: buildNetlist(this.board, buildConnectivity(this.board), this.activeScenario.meta.title) });
  }

  /** Volts by net name from the current solve (for events). */
  private netVoltsByName(): Record<string, number> {
    const out: Record<string, number> = {};
    if (!this.sim?.source || !this.conn) return out;
    this.conn.netNames.forEach((name, i) => { const k = this.sim!.nodeOfNet.get(i); if (name && k !== undefined) out[name] = this.sim!.V[k]; });
    return out;
  }

  /** The solver menu: the official solvers, then solvers from running code mods. */
  private solverOptionsKey = '';
  private refreshSolverSelect() {
    const sel = this.mount.querySelector<HTMLSelectElement>('#solver-select');
    if (!sel) return;
    const mods = this.codeHost.solvers();
    // rebuilt only when the list changes (this runs on every render)
    const key = mods.map((m) => `${m.address}=${m.name}`).join('|');
    if (key === this.solverOptionsKey && sel.options.length) { sel.value = this.modSolver ?? this.solver; return; }
    this.solverOptionsKey = key;
    sel.innerHTML = SOLVERS.map((x) => `<option value="${x.id}">${t(x.name)}</option>`).join('')
      + (mods.length ? `<optgroup label="${t('Solver mods')}">${mods.map((m) => `<option value="${this.esc(m.address)}" title="${this.esc(m.description ?? '')}">${this.esc(m.name)}</option>`).join('')}</optgroup>` : '');
    sel.value = this.modSolver ?? this.solver;
  }

  /** Solves with the solver mod in use; the result replaces `sim` when it lands. */
  private requestModSolve(meters: [number, number][]) {
    const addr = this.modSolver!;
    const id = ++this.modSolveSeq;
    const board = this.board, conn = this.conn;
    const input = { netlist: buildNetlist(board, conn, this.activeScenario.meta.title), meters, ...(this.ocpAmps > 0 && { currentLimit: this.ocpAmps }) };
    this.codeHost.solve(addr, input).then((res) => {
      if (id !== this.modSolveSeq || conn !== this.conn || !this.powerOn || this.modSolver !== addr) return;
      this.sim = simFromResult(board, conn, res);
      this.simFromMod = true;
      this.applySim(false);
      this.refreshProbes();
      this.updateThermalPower();
      this.renderTopHud();
      this.renderDmm();
      this.emitSolved();
    }, (err: Error) => {
      if (this.modSolver !== addr) return;
      this.modSolver = null;
      this.simFromMod = false;
      this.toast(t('The solver {solver} failed ({error}); back to {official}.', { solver: addr, error: err.message, official: t(SOLVERS.find((x) => x.id === this.solver)?.name ?? this.solver) }), 'danger');
      this.refreshSolverSelect();
      this.recompute(true);
      this.renderUI();
    });
  }

  /** Item address of a listed board: a mod's, or a shipped one (official-boards). */
  private addressOf(sc: Scenario): string | null {
    const mb = this.modBoards.get(sc);
    if (mb) return mb.address;
    return this.bundledIds.has(sc.id) && !sc.generated ? officialBoardAddress(sc.id) : null;
  }

  /** Applies the running mods' board patches to every listed board, starting from the boards as shipped. */
  private patchBoards() {
    this.patchEntries = new Map();
    this.patchLog.clear();
    for (const mod of this.modResult.active) {
      for (const patch of mod.manifest.patches) {
        const l = this.patchEntries.get(patch.target) ?? [];
        l.push({ modId: mod.manifest.id, modName: mod.manifest.name, patch });
        this.patchEntries.set(patch.target, l);
      }
    }
    for (const sc of this.scenarios) this.patchOne(sc);
  }

  private patchOne(sc: Scenario) {
    const addr = this.addressOf(sc);
    if (!addr) return;
    const before = this.pristine.get(sc);
    if (before) writeBoardView(sc, before);
    const entries = this.patchEntries.get(addr);
    if (!entries?.length) return;
    if (!before) this.pristine.set(sc, boardView(sc));
    this.patchLog.set(addr, { title: this.pristine.get(sc)!.title, res: applyBoardPatches(sc, entries) });
  }

  /** A puzzle in the board list; the board is built (faults planted on a working board) when opened. */
  private puzzleEntry(mod: LoadedMod, pz: PuzzleSpec): ModBoard | null {
    const mf = mod.manifest;
    const id = puzzleScenarioId(mf.id, pz.id);
    if (this.scenarios.some((s) => s.id === id)) {
      mod.warnings.push(`puzzle "${pz.id}": a board with id "${id}" is already loaded (skipped)`);
      return null;
    }
    const target = [...this.modBoards.values()].find((b) => b.address === pz.board);
    let built: Scenario | null = null;
    return {
      mod: mf, spec: { id: pz.id, file: `puzzles/${pz.id}` }, address: itemAddress(mf.id, 'puzzles', pz.id), basedOn: pz.board,
      stub: {
        format: 'pcbfix/1', id, objectives: [], board: new Builder(10, 10).b,
        meta: { title: pz.title, author: mf.author, difficulty: pz.difficulty, description: pz.description, hints: [], license: mf.license },
      },
      load: async () => built ?? (built = await this.buildPuzzleScenario(mf, pz)),
      ...(target?.schematic && { schematic: target.schematic }),
    };
  }

  private async buildPuzzleScenario(mf: ModManifest, pz: PuzzleSpec): Promise<Scenario> {
    const idx = this.scenarios.findIndex((s) => this.addressOf(s) === pz.board);
    if (idx < 0) throw new Error(`it needs the board ${pz.board}, which isn't loaded (is its mod on?)`);
    const base = await this.ensureLoaded(idx);
    if (!base) throw new Error(`could not load the board ${pz.board}`);
    const ref = referenceBoard(base);
    if (!ref) throw new Error(`${pz.board} is a challenge whose repair isn't known; a puzzle needs a working board`);
    return buildPuzzle(pz, mf, base, ref, this.faults?.defs);
  }

  /** Knowledge packs for the open board (Overview tab): rails, where they come from, power-up order,
   *  what to expect where, each with how sure it is. Folded on phones. */
  private knowledgeHtml(sc: Scenario): string {
    const conf = (c: Confidence) => `<span class="badge kn-conf ${c}" title="${t('How sure this is')}">${t(c)}</span>`;
    return this.knowledgeFor(sc).map(({ mod, pack, stale }) => {
      const badRef = new Set(stale.refs), badNet = new Set(stale.nets);
      const ref = (r: string) => badRef.has(r)
        ? `<span class="kn-stale-item" title="${t('Not on this board')}">${this.esc(r)}</span>`
        : `<button class="kn-ref mono" data-kn-ref="${this.esc(r)}" title="${t('Show on the board')}">${this.esc(r)}</button>`;
      const net = (n: string) => `<span class="mono${badNet.has(n) ? ' kn-stale-item' : ''}"${badNet.has(n) ? ` title="${t('Not on this board')}"` : ''}>${this.esc(n)}</span>`;
      const rails = pack.rails.map((r) => `
        <div class="kn-rail">
          <div class="kn-rail-head">
            ${net(r.net)}${r.nominal !== undefined ? ` <b>${+r.nominal.toPrecision(4)} V</b>` : ''}${r.domain ? ` <span class="muted">${this.esc(r.domain)}</span>` : ''}
            ${r.source ? `<span class="muted">· ${t('from')}</span> ${ref(r.source.ref)}${r.source.kind ? ` <span class="muted">${this.esc(r.source.kind)}</span>` : ''}` : ''}
            ${r.provenance.confidence !== pack.provenance.confidence ? conf(r.provenance.confidence) : ''}
          </div>
          ${r.checks.length ? `<ul class="kn-checks">${r.checks.map((c) => `<li>${ref(c.at)}${c.pin ? ` <span class="muted">${t('pin {pin}', { pin: this.esc(c.pin) })}</span>` : ''}: <b>${this.esc(c.expect)}</b>${c.readsLowIf ? `<div class="muted">${t('Reads low if: {why}', { why: this.esc(c.readsLowIf) })}</div>` : ''}</li>`).join('')}</ul>` : ''}
          ${r.notes ? `<div class="text-2">${this.esc(r.notes)}</div>` : ''}
          ${r.provenance.where && r.provenance.where !== pack.provenance.where ? `<div class="muted kn-src">${this.esc(r.provenance.where)}</div>` : ''}
        </div>`).join('');
      return `
        <details class="card kn-card" ${this.mobile ? '' : 'open'}>
          <summary class="card-title"><span>${t('Board knowledge')}${pack.title ? ` · ${this.esc(pack.title)}` : ''}</span>${conf(pack.provenance.confidence)}</summary>
          <div class="muted">${t('from the mod «{name}»', { name: this.esc(mod.name) })}${pack.provenance.where ? ` · ${this.esc(pack.provenance.where)}` : ''}</div>
          ${pack.powerUp.length ? `<div class="kn-power"><span class="muted">${t('Power-up order')}:</span> ${pack.powerUp.map(net).join(' <span class="muted">→</span> ')}</div>` : ''}
          ${rails}
          ${pack.notes.map((n) => `<div class="hint-item">${this.esc(n)}</div>`).join('')}
          ${stale.refs.length || stale.nets.length ? `<div class="kn-stale">${t('Not on this board: {list}', { list: this.esc([...stale.refs, ...stale.nets].join(', ')) })}</div>` : ''}
        </details>`;
    }).join('');
  }

  /** «Where to look?»: after failed tests on a board whose working version is known (src/mods/rules.ts). */
  private lookHereHtml(sc: Scenario): string {
    const v = this.lastVerify;
    const ref = referenceBoard(sc);
    if (!v || v.allPassed || !ref) return '';
    const mine = this.lookHere?.forVerify === v ? this.lookHere : null;
    const got = mine?.candidates ?? null;
    const busy = !!mine && !got;
    return `
      <div class="card look-card">
        <div class="card-title"><span>${t('Where to look?')}</span>${got ? '' : `<button class="btn sm" id="btn-look-here" ${busy ? 'disabled' : ''}>${t('Suggest')}</button>`}</div>
        ${got ? (got.length ? got.slice(0, 3).map((c, i) => `
          <div class="look-cand">
            <div><b>${i + 1}.</b> <button class="kn-ref mono" data-kn-ref="${this.esc(c.ref)}" title="${t('Show on the board')}">${this.esc(c.ref)}</button> <span class="muted">· ${this.esc(c.reasons[0].observation)}</span></div>
            <div class="text-2">${this.esc(c.reasons.slice().sort((a, b) => b.confirm.length - a.confirm.length)[0].confirm)}</div>
            ${c.reasons.length > 1 ? `<details class="mod-changes"><summary>${t('Why ({n} rules)', { n: c.reasons.length })}</summary><ul>${c.reasons.map((r) => `<li><span class="mono">${this.esc(r.rule)}</span>: ${this.esc(r.observation)}</li>`).join('')}</ul></details>` : ''}
          </div>`).join('') : `<div class="muted">${t('No suggestion: what the bench shows doesn\'t match any rule. Measure the rails and compare with the notes.')}</div>`)
        : busy ? `<div class="muted">${t('Comparing with the working board…')}</div>`
        : `<div class="muted">${t('Compares what the bench shows with the working board and ranks the parts worth measuring first. It can give the fault away.')}${this.board.components.length > 200 ? ` ${t('On a board this size it takes a few seconds.')}` : ''}</div>`}
      </div>`;
  }

  private async suggestWhereToLook() {
    const sc = this.activeScenario, v = this.lastVerify;
    const ref = referenceBoard(sc);
    if (!ref || !v) return;
    this.attempts?.look();
    this.lookHere = { forVerify: v, candidates: null };
    this.renderMissionTab();
    try {
      const candidates = await this.rankWhereToLook(this.board, ref, sc.objectives, sc.solver ?? 'spice');
      if (this.lastVerify !== v || this.lookHere?.forVerify !== v) return; // tests ran again (or the rules changed) meanwhile
      this.lookHere = { forVerify: v, candidates };
    } catch (e) {
      if (this.lookHere?.forVerify === v) this.lookHere = null;
      this.toast(t('Could not compare with the working board: {error}', { error: e instanceof Error ? e.message : String(e) }), 'danger');
    }
    this.renderMissionTab();
  }

  /** Observe + rank in a worker (seconds on a big board); on the main thread where workers fail. */
  private async rankWhereToLook(board: Board, reference: Board, objectives: Objective[], solver: Solver): Promise<Candidate[]> {
    const local = async () => {
      const { observe, rankCandidates } = await import('../mods/rules-engine');
      return rankCandidates(observe(structuredClone(board), reference, objectives, solver), board, this.rules.rules);
    };
    if (this.lookWorker === undefined) {
      try {
        const w = new Worker(new URL('../mods/lookWorker.ts', import.meta.url), { type: 'module' });
        w.onmessage = (e: MessageEvent<{ id: number; candidates?: Candidate[]; error?: string }>) => { this.lookPending.get(e.data.id)?.(e.data); this.lookPending.delete(e.data.id); };
        w.onerror = () => { // the worker didn't load: what's waiting runs on the main thread
          this.lookWorker = null;
          for (const r of this.lookPending.values()) r(null);
          this.lookPending.clear();
        };
        this.lookWorker = w;
      } catch { this.lookWorker = null; }
    }
    const w = this.lookWorker;
    if (!w) return local();
    const id = ++this.lookSeq;
    const got = await new Promise<{ candidates?: Candidate[]; error?: string } | null>((resolve) => {
      this.lookPending.set(id, resolve);
      w.postMessage({ id, board, reference, objectives, solver, rules: this.rules.rules, devices: [...deviceOverlay()], dmm: activeDmm() });
    });
    if (!got) return local();
    if (got.error) throw new Error(got.error);
    return got.candidates!;
  }

  /** Selects a part by ref and frames it (Inspect tab). */
  private gotoRef(ref: string) {
    const c = this.board.components.find((x) => x.ref === ref);
    if (!c) return;
    this.selectedCompId = c.id;
    this.activeTab = 'inspect';
    if (this.camera.bothSides) this.camera.focusAt(c.side === 'B' ? this.board.w * 2 + BOTH_GAP - c.at[0] : c.at[0], c.at[1], 10);
    else this.camera.focusAt(c.at[0], c.at[1], 10, c.side);
    this.renderUI();
  }

  /** Selects a net and frames its copper (pads and traces; a pour only when that's all it has). */
  private gotoNet(net: number) {
    const items = this.conn.netItems[net] ?? [];
    const solid = items.filter((i) => this.conn.items[i].kind !== 'zone');
    const use = solid.length ? solid : items;
    if (!use.length) return;
    const bb = [Infinity, Infinity, -Infinity, -Infinity];
    let front = 0;
    for (const i of use) {
      const it = this.conn.items[i], b = it.shape.bb;
      bb[0] = Math.min(bb[0], b[0]); bb[1] = Math.min(bb[1], b[1]); bb[2] = Math.max(bb[2], b[2]); bb[3] = Math.max(bb[3], b[3]);
      front += it.layers & 1 ? 1 : -1;
    }
    const side: Side = front >= 0 ? 'F' : 'B';
    const x = (bb[0] + bb[2]) / 2, y = (bb[1] + bb[3]) / 2, half = Math.max(4, (bb[3] - bb[1]) / 2 + 2, (bb[2] - bb[0]) / 3 + 2);
    this.selectedNet = net;
    this.selectedCompId = null;
    this.activeTab = 'inspect';
    if (this.camera.bothSides) this.camera.focusAt(side === 'B' ? this.board.w * 2 + BOTH_GAP - x : x, y, half);
    else this.camera.focusAt(x, y, half, side);
    this.renderUI();
  }

  /** Knowledge packs of running mods for this board (or, for a puzzle, the board it's built on). */
  private knowledgeFor(sc: Scenario): { mod: ModManifest; pack: KnowledgePack; stale: { refs: string[]; nets: string[] } }[] {
    const addrs = new Set([this.addressOf(sc), this.modBoards.get(sc)?.basedOn].filter((a): a is string => !!a));
    if (!addrs.size) return [];
    return this.modResult.active.flatMap((m) => m.manifest.knowledge
      .filter((k) => addrs.has(k.board))
      .map((pack) => ({ mod: m.manifest, pack, stale: staleEntries(pack, this.board) })));
  }

  /** Installs a mod .zip (web: kept in browser storage; desktop: in the app's storage too). */
  /** Returns the number of warnings, or -1 when the mod was not installed. */
  private async installModFile(f: File): Promise<number> {
    const mod = await this.installModBytes(new Uint8Array(await f.arrayBuffer()), f.name);
    return mod ? mod.warnings.length + (this.modActive(mod.manifest.id) ? 0 : 1) : -1;
  }

  /** Something in the Mods window needs the player: a mod failed to load or can't run. */
  private modsNeedAttention() {
    return this.modResult.failed.length > 0 || [...this.modResult.status.values()].some((st) => st.state === 'blocked');
  }

  private modActive(id: string) { return this.modResult.status.get(id)?.state === 'active'; }

  private setLoadouts(s: LoadoutStore) {
    this.loadouts = s;
    writeLoadouts(s);
  }

  /** After a loadout change: reload which mods run and refresh the board list and the Mods window. */
  private async applyLoadouts(s: LoadoutStore) {
    this.setLoadouts(s);
    await this.loadMods();
    this.refreshScenarioSelect();
    if (this.started) { this.recompute(true); this.renderUI(); }
    if (this.showMods) this.renderModsModal();
  }

  /** Checks and installs a mod .zip, lists its boards and opens the first. Null when refused (toast says why). */
  private async installModBytes(bytes: Uint8Array, file: string): Promise<LoadedMod | null> {
    try {
      const builtin = new Set(this.scenarios.filter((s) => !this.modBoards.has(s)).map((s) => s.id));
      const mod = await installMod(bytes, file, (id) => builtin.has(id));
      if (mod.manifest.code) {
        const perms = mod.manifest.code.permissions.length ? mod.manifest.code.permissions.join(', ') : t('none');
        if (!confirm(t('«{name}» contains code. It runs in a sandbox, and only while code mods are on (Mods window). Permissions it asks for: {perms}. Install it?', { name: mod.manifest.name, perms }))) {
          await removeInstalled(mod.manifest.id);
          return null;
        }
      }
      if (this.safeMode) {
        this.toast(t('Installed mod «{name}». Safe mode is on: leave it to use the mod.', { name: mod.manifest.name }), 'info');
        return mod;
      }
      // installing means "I want this": turn it on (leaving Official for My mods if needed)
      if (!isModOn(this.loadouts, mod.manifest.id)) this.setLoadouts(setModOn(this.loadouts, mod.manifest.id, true));
      await this.loadMods();
      this.refreshScenarioSelect();
      // the open board may have gained notes, patches or part models: redraw it (as turning a mod on does)
      if (this.started) { this.recompute(true); this.renderUI(); }
      const st = this.modResult.status.get(mod.manifest.id);
      if (st?.state === 'blocked') {
        this.toast(t('Installed mod «{name}», but it needs: {needs}. See Mods.', { name: mod.manifest.name, needs: st.needs.map((n) => `${n.id} ${n.range}`).concat(st.conflicts.map((c) => t('not {mod}', { mod: c }))).join(', ') }), 'info');
        return mod;
      }
      const warn = mod.warnings.length ? ' ' + t('({n} warning: see Mods)|({n} warnings: see Mods)', { n: mod.warnings.length }) : '';
      this.toast(t('Installed mod «{name}» v{version}: {n} board|Installed mod «{name}» v{version}: {n} boards', { name: mod.manifest.name, version: mod.manifest.version, n: mod.boards.length }) + warn, mod.warnings.length ? 'info' : 'success');
      const first = this.scenarios.findIndex((s) => this.modBoards.get(s)?.mod.id === mod.manifest.id);
      if (first >= 0) await this.openScenario(first);
      return mod;
    } catch (err) {
      this.toast(t('Mod not installed: {error}', { error: err instanceof Error ? err.message : String(err) }), 'danger');
      return null;
    }
  }

  /** Opens a scenario, fetching a demo board on first use. */
  private async openScenario(idx: number) {
    const sc = await this.ensureLoaded(idx);
    if (!sc) return;
    this.loadScenario(sc);
  }

  /** The full scenario at `idx`: a demo is fetched and a mod board loaded on first use (patches
   *  applied). Null when that fails; a toast says why. */
  private async ensureLoaded(idx: number, quiet = false): Promise<Scenario | null> {
    let sc = this.scenarios[idx];
    const mb = this.modBoards.get(sc);
    if (mb && sc === mb.stub && !mb.stub.board.components.length) {
      if (!quiet) this.toast(t('Loading {title}…', { title: t(sc.meta.title) }), 'info');
      try {
        const full = await mb.load();
        this.modBoards.delete(sc);
        this.modBoards.set(full, mb);
        this.scenarios[idx] = sc = full;
        this.patchOne(full);
      } catch (err) {
        this.toast(t('Could not load {title} (mod «{mod}»): {error}', { title: sc.meta.title, mod: mb.mod.name, error: err instanceof Error ? err.message : String(err) }), 'danger');
        return null;
      }
    }
    const url = this.demoUrls.get(sc);
    if (url) {
      if (!quiet) this.toast(t('Loading {title}…', { title: t(sc.meta.title) }), 'info');
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const full = importScenarioOrPcb('demo.pcbfix.json', await res.text());
        this.demoUrls.delete(sc);
        this.scenarios[idx] = sc = full;
        this.patchOne(full);
      } catch (err) {
        this.toast(t('Could not load the demo board: {error}', { error: err instanceof Error ? err.message : String(err) }), 'danger');
        this.refreshScenarioSelect();
        return null;
      }
    }
    return sc;
  }

  private analyticsId(sc: Scenario): string {
    return this.shippedIds.has(sc.id) ? sc.id : sc.generated ? 'generated' : 'custom';
  }

  /**
   * The moment a board is fixed: a short banner over the board ("Board fixed", active time and
   * moves, the flag on a challenge) that leaves on its own after a few seconds; the Overview panel
   * opens on the next repair meanwhile. Nothing to dismiss; no motion when the system asks for less.
   */
  private celebrate(flag: string | null) {
    const vp = this.mount.querySelector<HTMLElement>('#viewport');
    if (!vp) { this.toast(flag ? t('Flag captured: {flag}', { flag }) : t('All checks green. The board is alive.'), 'success'); return; }
    vp.querySelector('.win-banner')?.remove();
    this.mount.querySelectorAll('.toast-stack .toast').forEach((x) => x.remove()); // old hints ("jumper start set") would sit under the banner
    const sec = Math.round(this.rated?.activeSec ?? 0);
    const facts = [
      sec >= 15 ? t('fixed in {time}', { time: `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}` }) : '',
      this.moves > 0 ? t('{n} move|{n} moves', { n: this.moves }) : '',
    ].filter(Boolean).join(' · ');
    const el = document.createElement('div');
    el.className = 'win-banner';
    this.announce([t('Board fixed'), facts, flag ? t('Flag captured: {flag}', { flag }) : ''].filter(Boolean).join('. '));
    el.innerHTML = `<span class="win-ico">${icon('check', 22)}</span><span class="win-body"><b>${t('Board fixed')}</b>${facts ? `<span>${this.esc(facts)}</span>` : ''}${flag ? `<code>${this.esc(flag)}</code>` : ''}</span>`;
    vp.appendChild(el);
    setTimeout(() => el.classList.add('out'), 3200);
    setTimeout(() => el.remove(), 3700);
  }

  /**
   * Help ladder: the solution video waits until the player has really tried (tests run after a
   * minute of work, or three minutes on the board), or solved it before. The board, the notes and
   * "How to approach" come first.
   */
  private triedEnough(s: Scenario): boolean {
    if (this.solvedIds.has(s.id)) return true;
    const a = s === this.activeScenario ? this.rated : null;
    return !!a && ((a.tests > 0 && a.activeSec >= 60) || a.activeSec >= 180);
  }

  /**
   * Right after a fix: the next board, one tap away. The hidden difficulty system picks it (the
   * same pick as Today in the board picker); the player never sees why.
   */
  private nextRepairHtml(): string {
    const v = this.lastVerify;
    const fixed = !!this.revealedFlag || (!!v?.allPassed && !v.topologyMismatch && !this.activeScenario.lock && this.activeScenario.objectives.length > 0);
    if (!fixed || lessonFor(this.activeScenario.id)) return ''; // a soldering lesson's next step is in its track card
    const index = new Map(this.scenarios.map((sc, i) => [sc.id, i]));
    const solved = new Set(this.solvedIds);
    solved.add(this.activeScenario.id);
    const pick = todayPicks(new Set(index.keys()), solved, undefined, this.skill)[0];
    if (!pick || pick.id === this.activeScenario.id) return '';
    const i = index.get(pick.id)!, s = this.scenarios[i], n = this.boardNames(s);
    return `
      <div class="card next-card">
        <div class="card-title"><span class="row">${icon('play', 14)}<span>${t('Next repair')}</span></span></div>
        <button class="next-pick" data-next-board="${i}">
          ${this.boardThumb(s, { done: false })}
          <span class="next-body"><span class="next-t">${this.esc(n.name)}</span><span class="muted">${this.esc(n.symptom)}</span></span>
        </button>
        <button class="btn primary" data-next-board="${i}">${icon('play', 13)}<span>${t('Start next repair')}</span></button>
      </div>`;
  }

  /** The board passes every check and is the reference design: it can be broken again. */
  private canGenerate(): boolean {
    const v = this.lastVerify;
    return !!v?.allPassed && !v.topologyMismatch && (!!this.revealedFlag || !this.activeScenario.lock) && this.activeScenario.objectives.length > 0;
  }

  /** A new problem on the board just fixed: fresh random faults, same checks (src/scenarios/generate.ts). */
  private async generateNext() {
    if (this.generating) return;
    const parent = this.activeScenario;
    const big = this.board.components.length > 80;
    this.generating = true;
    this.renderMissionTab();
    if (big) this.toast(t('Generating a new problem. On a board this big it can take up to half a minute…'), 'info');
    let res: Awaited<ReturnType<typeof generateProblem>> = null;
    try {
      res = await generateProblem(parent, this.board, {
        solver: this.solver,
        faults: this.genFaults,
        budgetMs: big ? 30000 : 8000,
        yieldFn: () => new Promise((r) => setTimeout(r, 0)), // keep the bench drawing between solves
      });
    } catch (err) {
      this.toast(t('Could not generate a problem: {error}', { error: err instanceof Error ? err.message : String(err) }), 'danger');
    }
    this.generating = false;
    if (this.activeScenario !== parent) return; // the player moved on meanwhile
    if (!res) {
      this.toast(t('No fault found that shows on the bench of this board. Run the tests again, then retry.'), 'warn');
      this.renderMissionTab();
      return;
    }
    const sc = res.scenario, n = res.faults.length;
    // one generated problem per board in the list: the newest replaces the last
    const prev = this.scenarios.findIndex((s) => s.generated?.from === sc.generated!.from);
    if (prev >= 0) this.scenarios[prev] = sc;
    else this.scenarios.push(sc);
    this.loadScenario(sc);
    this.toast(n < this.genFaults
      ? t('New problem: only {n} fault could be hidden so that it shows on the bench.|New problem: only {n} faults could be hidden so that they show on the bench.', { n })
      : t('New problem: {n} fault is hidden on the board.|New problem: {n} faults are hidden on the board.', { n }), n < this.genFaults ? 'info' : 'success');
  }

  private refreshScenarioSelect() {
    const sel = this.mount.querySelector<HTMLSelectElement>('#sc-select')!;
    const renderOpt = (s: Scenario, i: number) => {
      const solved = this.solvedIds.has(s.id) ? ` — ${t('solved')}` : '';
      return `<option value="${i}">${this.esc(t(s.meta.title))} · ${this.fmtLevel(shownLevel(s))}${solved}</option>`;
    };
    const tuts: string[] = [];
    const main: string[] = [];
    this.scenarios.forEach((s, i) => {
      (isTutorialScenario(s.id) ? tuts : main).push(renderOpt(s, i));
    });
    sel.innerHTML =
      (tuts.length ? `<optgroup label="${t('Beginner Tutorials')}">${tuts.join('')}</optgroup>` : '') +
      (main.length ? `<optgroup label="${t('Repair Challenges')}">${main.join('')}</optgroup>` : '');
    const idx = this.scenarios.indexOf(this.activeScenario);
    if (idx >= 0) sel.value = String(idx);

    const s = this.activeScenario;
    const badge = this.mount.querySelector<HTMLElement>('#bp-badge');
    const title = this.mount.querySelector<HTMLElement>('#bp-title');
    const chk = this.mount.querySelector<HTMLElement>('#bp-check');
    if (s && badge && title && chk) {
      const tutIdx = TUTORIAL_SCENARIO_IDS.indexOf(s.id as (typeof TUTORIAL_SCENARIO_IDS)[number]);
      badge.textContent = tutIdx >= 0 ? `T${tutIdx + 1}` : this.fmtLevel(shownLevel(s));
      badge.title = tutIdx >= 0 ? t('Tutorial {n}', { n: tutIdx + 1 }) : (levelFromPlayers(s) ? t('Level {n} of 10 · {band} (from players\' results)', { n: this.fmtLevel(shownLevel(s)), band: t(levelBand(shownLevel(s)).name) }) : t('Level {n} of 10 · {band} (estimate)', { n: this.fmtLevel(shownLevel(s)), band: t(levelBand(shownLevel(s)).name) }));
      badge.classList.toggle('tut', tutIdx >= 0);
      title.textContent = t(s.meta.title);
      chk.hidden = !this.solvedIds.has(s.id);
    }
    if (this.showBoards) this.renderModal();
  }

  private loadScenario(sc: Scenario) {
    this.activeScenario = sc;
    this.beginAttempt(sc);
    this.board = cloneBoard(sc.board);
    this.undoStack = [];
    this.redoStack = [];
    this.moves = 0;
    this.hintsShown = 0;
    this.selectedNet = -1;
    this.selectedCompId = null;
    this.probeRed = null;
    this.probeBlack = null;
    this.jumperStart = null;
    this.lastVerify = null;
    this.revealedFlag = null;
    this.compSearch = '';
    this.powerOn = true;
    this.boot.powerOff(); // a new board powers up from scratch
    if (sc.solver && sc.solver !== this.solver) {
      this.solver = sc.solver; // for this board only: the saved preference is left alone
      if (sc.solver === 'spice-power' && !sc.modSolver) this.toast(t('This board runs on Solver: SPICE + PWR (regulator models and power states).'), 'info');
    }
    this.simFromMod = false;
    this.lastVerifyBy = null;
    if (sc.modSolver) this.useBoardSolver(sc);
    this.emitBoardLoaded();
    this.authorMode = false;
    this.tutorialStep = 0;
    this.workHistory = { episodes: [], log: [] };
    this.endIronHold();
    this.thermalBoard = null; // a fresh thermal model and rework monitor for the new board (its alloy, its history)
    this.applyLesson(sc);
    if (isTutorialScenario(sc.id)) {
      if (localStorage.getItem('pcbfix_tut_dismissed') !== '1') this.tutorialOpen = true;
    } else {
      this.tutorialOpen = false;
    }
    if (this.mobile) {
      // phone: a new board opens on its mission, unless the tutorial card is there to guide
      this.activeTab = 'mission';
      this.panelOpen = !this.tutorialOpen;
      this.tutCollapsed = false;
      this.activeProbe = 'red';
      this.activeProbeAuto = false;
    }
    this.camera.setSide('F');
    this.camera.bothSides = this.board.components.length > 500;
    this.cursorWorld = null;
    this.kbCursor = null;
    this.cursorSide = 'F';
    // the camera learns the canvas shape only when it renders: give it the current one first, or
    // the fit frames the board for its default aspect and crops it on a narrower canvas
    if (this.canvas.clientWidth > 1 && this.canvas.clientHeight > 1) this.camera.matrices(this.canvas.clientWidth, this.canvas.clientHeight);
    this.camera.fitBoard(this.board.w, this.board.h);
    this.recompute(true);
    this.refreshScenarioSelect();
    this.renderUI();
    if (this.showLesson && !this.showBoards && !this.showMods) this.renderModal();
    // the lesson card (and on phones the readouts) are on screen only now; on phones
    // refitOnShapeChange follows them as they settle
    this.fitBoardInView();
  }

  /** Rework setting from its select value ('instant', 'r350', 'r350f', 'r400f'). */
  private setRework(v: string) {
    this.reworkMode = v === 'instant' ? { ...this.reworkMode, realistic: false } : { realistic: true, ironTemp: v.startsWith('r400') ? 400 : 350, flux: v.endsWith('f') };
    const sel = this.mount.querySelector<HTMLSelectElement>('#rework-mode');
    if (sel) sel.value = this.reworkValue();
  }

  private reworkValue(): string {
    const m = this.reworkMode;
    return !m.realistic ? 'instant' : `r${m.ironTemp}${m.flux ? 'f' : ''}`;
  }

  /** A soldering-track board sets its station and opens its lesson; leaving one restores the player's setting. */
  private applyLesson(sc: Scenario) {
    const lesson = lessonFor(sc.id);
    this.lastInspection = null;
    if (lesson) {
      if (!this.savedRework) this.savedRework = { ...this.reworkMode };
      this.setRework(lesson.station);
      this.showLesson = 'brief';
    } else {
      if (this.savedRework) { this.reworkMode = this.savedRework; this.savedRework = null; this.setRework(this.reworkValue()); }
      if (this.showLesson) this.showLesson = null;
    }
  }

  /** The inspection of the work on this board so far. */
  private inspectWork(): Inspection {
    return inspect(this.board, referenceBoard(this.activeScenario) ?? undefined, this.workHistory.episodes, this.workHistory.log);
  }

  /** Opens the interactive step-by-step guide when the active board is a tutorial scenario. */
  private startTutorial() {
    if (!isTutorialScenario(this.activeScenario.id)) return; // never swap the user's board
    localStorage.removeItem('pcbfix_tut_dismissed');
    this.tutorialOpen = true;
    this.tutorialStep = 0;
    this.renderUI();
  }

  private pushUndo() {
    this.undoStack.push(cloneBoard(this.board));
    if (this.undoStack.length > 60) this.undoStack.shift();
    this.redoStack.length = 0;
    this.moves++;
    this.attempts?.move();
    if (this.rated) this.rated.moves++;
  }

  private undo() {
    const prev = this.undoStack.pop();
    if (!prev) return;
    this.redoStack.push(cloneBoard(this.board));
    this.board = prev;
    this.jumperStart = null;
    this.recompute(false);
    this.renderUI();
  }

  private redo() {
    const next = this.redoStack.pop();
    if (!next) return;
    this.undoStack.push(cloneBoard(this.board));
    this.board = next;
    this.jumperStart = null;
    this.recompute(false);
    this.renderUI();
  }

  private recompute(silentOverloads = false) {
    if (this.thermalBoard !== this.board) settleIntermittents(this.board); // resting state for a newly loaded board
    this.conn = buildConnectivity(this.board);
    this.refreshProbes(); // probe nets must be current before the SPICE meter load is placed
    if (this.powerOn && this.boot.state === 'OFF') this.startBoot();
    if (this.powerOn) {
      this.sim = this.solve();
      this.applySim(silentOverloads);
    } else {
      this.sim = null;
    }
    this.refreshProbes();
    this.updateThermalPower();
    this.emitSolved();
  }

  /** Consequences of a fresh solve: parts that overloaded burn out (then re-solve). */
  private applySim(silentOverloads: boolean) {
    if (!this.sim) return;
    {
      let anyBlew = false;
      for (const c of this.board.components) {
        const r = this.sim.comps.get(c.id);
        if (r?.over && !c.state.burnt) {
          c.state.burnt = true;
          anyBlew = true;
          this.renderer?.spawnSmoke(c.at[0], c.at[1], c.side, this.board.thickness, 'burn');
          if (!silentOverloads) {
            this.toast(`${c.ref} ${r.overMsg ?? t('overloaded and burned out!')}`, 'danger');
          }
        } else if (!silentOverloads && c.kind === 'battery' && r && r.i > 5) {
          this.toast(t('Short circuit on {ref} ({amps} A)! Turn Power OFF or enable PSU OCP 100 mA.', { ref: c.ref, amps: r.i.toFixed(1) }), 'danger');
        }
      }
      if (anyBlew) {
        if (!silentOverloads) sfxBlow();
        this.sim = this.solve();
      }
    }
  }

  private solveWorker: Worker | null | undefined;
  /** Id of the background solve in flight (0 = none). */
  private pendingSolve = 0;
  private solveSeq = 0;

  /**
   * Re-solves in a worker (power-up transitions); the controller pauses until it lands.
   * Falls back to a synchronous solve where workers are unavailable.
   */
  private recomputeAsync() {
    if (this.solveWorker === undefined) {
      try {
        this.solveWorker = new Worker(new URL('../spice/solveWorker.ts', import.meta.url), { type: 'module' });
        this.solveWorker.onmessage = (e: MessageEvent<{ id: number; sim?: Sim; error?: string }>) => this.onWorkerSolve(e.data);
        this.solveWorker.onerror = () => { this.solveWorker = null; if (this.pendingSolve) { this.pendingSolve = 0; this.recompute(true); } };
      } catch { this.solveWorker = null; }
    }
    if (!this.solveWorker || this.psuInject || this.modSolver) { this.recompute(true); return; }
    const id = ++this.solveSeq;
    this.pendingSolve = id;
    const opts = {
      ...(this.ocpAmps > 0 && { currentLimit: this.ocpAmps }),
      ...(this.bootSequenced && this.boot.state !== 'OFF' && { powerState: this.boot.state, loadScale: this.activeScenario.calibration?.loadScale }),
      meters: this.dmmMode === 'V' && this.probeRed && this.probeRed.net >= 0 ? [[this.probeRed.net, this.probeBlack?.net ?? -1] as [number, number]] : [],
    };
    this.solveWorker.postMessage({ id, board: this.board, solver: this.solver, opts, devices: [...deviceOverlay()], dmm: activeDmm() });
    this.solveFor = this.conn;
  }
  private solveFor: Conn | null = null;

  private onWorkerSolve(d: { id: number; sim?: Sim; error?: string }) {
    if (d.id !== this.pendingSolve) return; // superseded
    this.pendingSolve = 0;
    // the board changed meanwhile (a synchronous solve already ran): result is stale
    if (this.solveFor !== this.conn || !this.powerOn) return;
    if (!d.sim) { this.recompute(true); return; }
    this.sim = d.sim;
    this.applySim(true);
    this.refreshProbes();
    this.updateThermalPower();
    this.renderTopHud();
    this.renderDmm();
    this.emitSolved();
  }

  private onReworkEvents(evs: ReworkEvent[]) {
    let changed = false;
    for (const e of evs) {
      if (e.kind === 'molten') continue;
      changed = true;
      const bad = e.kind === 'pad-lifted' || e.kind === 'part-overheated' || e.kind === 'mlcc-cracked' || e.kind === 'part-displaced' || e.kind === 'dull-joint';
      this.toast(e.detail, bad ? 'danger' : 'success');
      if (e.kind === 'reflowed') sfxSolder();
    }
    if (changed) { this.recompute(true); this.renderUI(); }
  }

  private updateThermalPower() {
    if (this.thermalBoard !== this.board || !this.thermal) {
      this.thermal = new ThermalModel(this.board);
      this.thermalBoard = this.board;
      this.rework = new ReworkMonitor(this.board, this.thermal, limitsFor(this.activeScenario.alloy), this.workHistory);
    }
    const p = new Map<string, number>();
    if (this.powerOn && this.sim?.source) for (const c of this.board.components) {
      const cs = this.sim.comps.get(c.id);
      if (cs && cs.p > 0 && c.kind !== 'battery') p.set(c.id, cs.p);
    }
    this.thermal.setPower(p);
  }

  /** Runs the selected solver. The DMM's 10 MΩ input loads the probed net (both solvers). */
  private solve(): Sim {
    const meters: [number, number][] =
      this.dmmMode === 'V' && this.probeRed && this.probeRed.net >= 0
        ? [[this.probeRed.net, this.probeBlack?.net ?? -1]]
        : [];
    if (this.modSolver && !this.psuInject) {
      // a solver mod answers asynchronously: keep its last answer meanwhile (never burn on a stand-in)
      this.requestModSolve(meters);
      if (this.simFromMod && this.sim) return this.sim;
      return { nodeOfNet: new Map(), V: new Float64Array(0), ground: -1, comps: new Map(), source: false };
    }
    this.simFromMod = false;
    if (this.psuInject && this.probeRed && this.probeRed.net >= 0) {
      // injection replaces the board supply; always a SPICE solve (needs current limiting)
      return runSolver(this.solver === 'fast' ? 'spice' : this.solver, this.board, this.conn, {
        inject: { net: this.probeRed.net, volts: this.psuInject.volts, amps: this.psuInject.amps },
      } as Parameters<typeof runSolver>[3]);
    }
    return runSolver(this.solver, this.board, this.conn, {
      ...(this.ocpAmps > 0 && { currentLimit: this.ocpAmps }),
      ...(this.bootSequenced && this.boot.state !== 'OFF' && { powerState: this.boot.state, loadScale: this.activeScenario.calibration?.loadScale }),
      meters,
    });
  }

  // ---------- Bench power supply & power-up sequence ----------

  /** Rails the controller waits for, per state (cached per connectivity snapshot). */
  private rails(): { conn: Conn; tree: PowerTree; byState: Map<PowerStateName, RequiredRail[]>; sequenced: boolean } {
    if (this.railCache?.conn !== this.conn) {
      const tree = discoverPowerTree(this.board, this.conn);
      const byState = new Map<PowerStateName, RequiredRail[]>();
      for (const s of ['G3H', 'S5', 'S4', 'S3', 'S0', 'S0SW'] as PowerStateName[]) byState.set(s, requiredRails(tree, s));
      this.railCache = { conn: this.conn, tree, byState, sequenced: tree.sources.some((s) => ['buck', 'boost', 'ldo', 'load-switch'].includes(s.kind)) };
    }
    return this.railCache;
  }

  private startBoot() {
    // Power states only mean something with regulator models and a board that has a power tree.
    this.bootSequenced = this.solver === 'spice-power' && !this.psuInject && this.rails().sequenced;
    this.boot = this.bootSequenced ? new BootController() : new BootController(['G3H']);
    this.boot.powerOn();
  }

  /** Required rails of `state` that are not within 10 % of their voltage in the present solve. */
  private missingRails(state: PowerStateName): string[] {
    const sim = this.sim;
    if (!sim?.source) return ['supply'];
    const out: string[] = [];
    for (const r of this.rails().byState.get(state) ?? []) {
      const k = sim.nodeOfNet.get(this.conn.netNames.indexOf(r.rail));
      const v = k === undefined ? 0 : sim.V[k];
      if (Math.abs(v - r.v) > 0.1 * r.v) out.push(r.rail);
    }
    return out;
  }

  /** Bench-supply output: set voltage and the current it delivers. */
  private supplyReading(): { volts: number; amps: number; cc: boolean } {
    const sim = this.sim;
    if (!this.powerOn || !sim?.source) return { volts: 0, amps: 0, cc: false };
    const inj = (sim as { injected?: { v: number; i: number } }).injected;
    if (inj) return { volts: inj.v, amps: Math.max(0, inj.i), cc: !!sim.ccLimited };
    let amps = 0, volts = 0;
    for (const c of this.board.components) {
      if (c.kind !== 'battery') continue;
      const r = sim.comps.get(c.id);
      amps += Math.max(0, r?.i ?? 0);
      volts = Math.max(volts, r?.v ?? 0);
    }
    return { volts, amps, cc: !!sim.ccLimited };
  }

  private renderPsu() {
    if (!this.powerOn && !this.boot.history.length) { this.psuBoxEl.innerHTML = ''; return; }
    if (!this.psuBoxEl.querySelector('.psu-card')) {
      this.psuBoxEl.innerHTML = `
        <div class="psu-card">
          <div class="psu-head"><span>${t('Bench supply')}</span><span class="muted" id="psu-mode"></span></div>
          <div class="psu-lcd">
            <div class="v" id="psu-v"></div><div class="a" id="psu-a"></div>
            <div class="l">VOLTS</div><div class="l r">AMPS</div>
          </div>
          <canvas class="psu-chart" id="psu-chart" width="528" height="128" aria-hidden="true"></canvas>
          <div class="psu-state" id="psu-state"></div>
        </div>`;
      // the current chart folds away (click the header); boards with power states show it
      this.psuBoxEl.querySelector('.psu-head')?.addEventListener('click', () => {
        this.psuExpanded = !this.psuExpanded;
        this.psuBoxEl.classList.toggle('expanded', this.psuExpanded);
      });
    }
    this.psuBoxEl.classList.toggle('expanded', this.psuExpanded || (!this.mobile && this.bootSequenced));
    const rd = this.supplyReading();
    const amps = this.powerOn ? this.boot.amps : 0;
    const q = (id: string) => this.psuBoxEl.querySelector<HTMLElement>(id)!;
    q('#psu-v').textContent = `${rd.volts.toFixed(2)} V`;
    q('#psu-a').textContent = amps >= 1 ? `${amps.toFixed(3)} A` : `${(amps * 1000).toFixed(1)} mA`;
    q('#psu-mode').textContent = this.psuInject ? t('injection') : rd.cc ? t('CC limit') : this.ocpAmps > 0 ? `OCP ${this.ocpAmps} A` : 'CV';
    const st = q('#psu-state');
    const b = this.boot;
    let txt = '', warn = false;
    if (!this.powerOn) txt = t('Output off');
    // the power-up hint only matters on boards that have regulators to sequence
    else if (!this.bootSequenced) txt = !this.rails().sequenced ? t('Board powered') : this.solver === 'spice-power' ? t('No power states found on this board') : t('Board powered (power-up sequence needs Solver: SPICE + PWR)');
    else if (b.state === 'S0SW') txt = [...this.rails().byState.values()].some((r) => r.length)
      ? t('Running (S0) — all sequenced rails up')
      : t('Running (S0) — rail names carry no power states: the controller enables everything, check the rails yourself');
    else if (b.failures > 0) { warn = true; txt = t('Boot loop: attempt {n} · stuck in {state}', { n: b.failures + 1, state: b.state }) + (b.blockedBy.length ? ' · ' + t('waiting for {rails}', { rails: b.blockedBy.slice(0, 2).join(', ') + (b.blockedBy.length > 2 ? '…' : '') }) : ''); }
    else txt = b.state === 'G3H' ? t('Standby (G3H) — always-on rails only') : t('Powering up: {state}', { state: b.state });
    st.textContent = this.mobile && !this.psuExpanded && !warn ? txt.split(/ — | \(/)[0] : txt;
    st.classList.toggle('warn', warn);
    this.drawPsuChart(q('#psu-chart') as unknown as HTMLCanvasElement);
  }

  /** Solved voltage at the scope probe (undefined: no contact or no supply). */
  private probedVolts(): number | undefined {
    const p = this.scopeProbe;
    if (!p || p.net < 0 || !this.powerOn || !this.sim?.source) return this.powerOn ? undefined : 0;
    const k = this.sim.nodeOfNet.get(p.net);
    return k === undefined ? undefined : this.sim.V[k];
  }

  /** Highest powered supply rail of any chip on `net` (a clock only runs while its driver has power). */
  private clockSupplyFor(net: number): number {
    const sim = this.sim;
    if (!sim?.source || net < 0) return 0;
    let best = 0;
    for (const i of this.conn.netItems[net] ?? []) {
      const it = this.conn.items[i];
      if (it.kind !== 'pad' || it.comp?.kind !== 'ic') continue;
      const idx = this.conn.padItem.get(it.comp) ?? [];
      it.comp.pads.forEach((p, pi) => {
        const nom = p.net ? railVoltage(p.net) : null;
        if (!nom || nom > 5.5) return;
        const k = sim.nodeOfNet.get(this.conn.net[idx[pi]]);
        const v = k === undefined ? 0 : sim.V[k];
        if (Math.abs(v - nom) <= 0.15 * nom) best = Math.max(best, nom);
      });
    }
    return best;
  }

  private scopeSignal(): ScopeSignal | null {
    const p = this.scopeProbe;
    if (!p || p.net < 0) return null;
    const v = this.probedVolts();
    if (v === undefined) return null;
    const tree = this.solver === 'spice-power' ? this.rails().tree : null;
    const volt = (name: string) => {
      const n = this.conn.netNames.indexOf(name);
      const k = n >= 0 ? this.sim?.nodeOfNet.get(n) : undefined;
      return k === undefined ? undefined : this.sim!.V[k];
    };
    return signalOn(this.conn.netNames[p.net], v, tree, volt, this.clockSupplyFor(p.net));
  }

  private renderScope() {
    if (!this.scopeProbe) { this.scopeBoxEl.innerHTML = ''; return; }
    if (!this.scopeBoxEl.querySelector('.psu-card')) {
      this.scopeBoxEl.innerHTML = `
        <div class="psu-card scope-card">
          <div class="psu-head">
            <span>${t('Oscilloscope')} · CH1</span>
            <div class="row">
              <div class="seg"><button id="sc-auto">Auto</button><button id="sc-roll">Roll</button></div>
              <button class="btn ghost icon" id="sc-close" title="${t('Remove probe')}">${icon('x', 14)}</button>
            </div>
          </div>
          <canvas class="scope-screen" id="sc-canvas" width="528" height="240" role="img" aria-label="${t('Oscilloscope screen')}"></canvas>
          <div class="psu-state" id="sc-meas"></div>
          <div class="psu-state muted" id="sc-note"></div>
        </div>`;
      this.scopeBoxEl.querySelector('#sc-auto')!.addEventListener('click', () => { this.scopeMode = 'auto'; this.renderScope(); });
      this.scopeBoxEl.querySelector('#sc-roll')!.addEventListener('click', () => { this.scopeMode = 'roll'; this.renderScope(); });
      this.scopeBoxEl.querySelector('#sc-close')!.addEventListener('click', () => { this.scopeProbe = null; this.renderScope(); });
    }
    this.scopeBoxEl.querySelector('#sc-auto')!.classList.toggle('on', this.scopeMode === 'auto');
    this.scopeBoxEl.querySelector('#sc-roll')!.classList.toggle('on', this.scopeMode === 'roll');
    const cv = this.scopeBoxEl.querySelector<HTMLCanvasElement>('#sc-canvas')!;
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    const W = cv.width, H = cv.height;
    ctx.fillStyle = '#0b0f0c';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(120,200,140,0.14)';
    ctx.lineWidth = 1;
    for (let k = 1; k < 10; k++) { const x = (W * k) / 10; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let k = 1; k < 8; k++) { const y = (H * k) / 8; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

    const sig = this.scopeSignal();
    const meas = this.scopeBoxEl.querySelector<HTMLElement>('#sc-meas')!;
    const note = this.scopeBoxEl.querySelector<HTMLElement>('#sc-note')!;
    const label = this.scopeProbe.label;
    let ys: Float64Array, timeDiv: string;
    if (this.scopeMode === 'roll' || !sig || sig.kind === 'dc') {
      // roll: the probed net over the last 10 s, from successive solves (real simulated data)
      const t1 = performance.now() / 1000;
      const pts = this.scopeRoll.filter((s) => s.t >= t1 - 10);
      ys = Float64Array.from(pts.map((s) => s.v));
      timeDiv = '1 s/div · roll';
      note.textContent = sig ? `${sig.note}${this.scopeMode === 'auto' && sig.kind === 'dc' ? ` — ${t('showing the last 10 s')}` : ''}` : this.powerOn ? t('{label}: probe not on a powered net', { label }) : t('Supply off');
      this.drawTrace(ctx, W, H, ys, pts.map((s) => (s.t - (t1 - 10)) / 10));
    } else {
      const span = 3 / sig.freq;
      ys = sampleSignal(sig, (performance.now() / 1000) % 1e-3, span, 600, Math.floor(performance.now() / 100));
      const perDiv = span / 10;
      timeDiv = `${perDiv >= 1e-3 ? `${+(perDiv * 1e3).toPrecision(3)} ms` : perDiv >= 1e-6 ? `${+(perDiv * 1e6).toPrecision(3)} µs` : `${+(perDiv * 1e9).toPrecision(3)} ns`}/div`;
      note.textContent = sig.note;
      this.drawTrace(ctx, W, H, ys, null);
    }
    let lo = Infinity, hi = -Infinity, sum = 0;
    for (const y of ys) { lo = Math.min(lo, y); hi = Math.max(hi, y); sum += y; }
    const avg = ys.length ? sum / ys.length : 0;
    meas.textContent = ys.length
      ? `${label} · ${timeDiv} · avg ${avg.toFixed(3)} V · p-p ${(hi - lo).toFixed(3)} V${sig && sig.freq && this.scopeMode === 'auto' ? ` · f ${fmtHz(sig.freq)}` : ''}`
      : `${label} · ${timeDiv}`;
  }

  /** Auto-ranged trace: picks a V/div from a 1-2-5 sequence so the signal fills the screen. */
  private drawTrace(ctx: CanvasRenderingContext2D, W: number, H: number, ys: Float64Array, xs: number[] | null) {
    if (ys.length < 2) return;
    let lo = Infinity, hi = -Infinity;
    for (const y of ys) { lo = Math.min(lo, y); hi = Math.max(hi, y); }
    const steps = [0.001, 0.002, 0.005, 0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10];
    const span = Math.max(hi - lo, Math.abs(hi) * 0.05, 0.004);
    const vdiv = steps.find((s) => s * 7 >= span) ?? 10;
    const mid = (hi + lo) / 2;
    const yOf = (v: number) => H / 2 - ((v - mid) / (vdiv * 8)) * H;
    ctx.strokeStyle = '#f5d547';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ys.forEach((v, i) => {
      const x = (xs ? xs[i] : i / (ys.length - 1)) * W, y = yOf(v);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.fillStyle = 'rgba(245,213,71,0.8)';
    ctx.font = '18px ui-monospace, monospace';
    ctx.fillText(`${vdiv >= 1 ? `${vdiv} V` : `${vdiv * 1000} mV`}/div`, 8, 22);
    ctx.fillText(`${mid.toFixed(3)} V`, W - 110, 22);
  }

  /** Current vs time, last 10 s; the y range follows the data (auto-ranging like a scope). */
  private drawPsuChart(cv: HTMLCanvasElement) {
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    const W = cv.width, H = cv.height, h = this.boot.history;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(255,255,255,0.03)';
    ctx.fillRect(0, 0, W, H);
    if (h.length < 2) return;
    const t1 = h[h.length - 1].t, t0 = t1 - 10;
    const peak = Math.max(0.01, ...h.filter((s) => s.t >= t0).map((s) => s.amps));
    // full scale: next 1-2-5 step above the peak (any magnitude)
    const want = peak * 1.1, mag = 10 ** Math.floor(Math.log10(want));
    const top = [1, 2, 5, 10].map((m) => m * mag).find((v) => v >= want)!;
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    for (let k = 1; k < 4; k++) { const y = (H * k) / 4; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.font = '18px ui-monospace, monospace';
    ctx.fillText(top >= 1 ? `${+top.toPrecision(3)} A` : `${+(top * 1000).toPrecision(3)} mA`, 8, 20);
    ctx.fillText('−10 s', 8, H - 8);
    ctx.strokeStyle = '#ffa657';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    let started = false;
    for (const s of h) {
      if (s.t < t0) continue;
      const x = ((s.t - t0) / 10) * W, y = H - (s.amps / top) * (H - 6) - 3;
      if (!started) { ctx.moveTo(x, y); started = true; } else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  private meterCache = new WeakMap<Conn, Map<string, Reading>>();
  /** Realistic meter reading (SPICE solvers), memoised per connectivity snapshot and probe pair. */
  private meter(mode: 'OHM' | 'DIODE' | 'CAP', a: number, b: number): Reading {
    let m = this.meterCache.get(this.conn);
    if (!m) this.meterCache.set(this.conn, (m = new Map()));
    const pr = this.probeRed?.pos, pb = this.probeBlack?.pos;
    const seed = `${a}-${b}-${pr?.map((v) => v.toFixed(1))}-${pb?.map((v) => v.toFixed(1))}`;
    const key = `${mode}|${seed}`;
    let r = m.get(key);
    if (!r) {
      r = mode === 'OHM' ? measureOhmsDmm(this.board, this.conn, a, b, { seed }) : mode === 'CAP' ? measureCapDmm(this.board, this.conn, a, b, { seed }) : measureDiodeDmm(this.board, this.conn, a, b, { seed });
      m.set(key, r);
    }
    return r;
  }

  /** Whether this board's capacitor values are importer placeholders (boardviews carry none). */
  private capValuesGuessed(): boolean {
    return this.board.components.some((c) => c.kind === 'capacitor' && c.valueGuessed);
  }

  /** Meter in series between the probes: a SPICE solve with the 10 A shunt in place (memoised). */
  private ammeterReading(a: number, b: number): Reading {
    let m = this.meterCache.get(this.conn);
    if (!m) this.meterCache.set(this.conn, (m = new Map()));
    const key = `AMP|${a}|${b}|${this.boot.state}|${this.ocpAmps}`;
    let r = m.get(key);
    if (!r) {
      const rnd = placementRng('amp', a, b);
      const dmm = activeDmm();
      const ohms = AMMETER_SHUNT + dmm.leadOhms + contactResistance(dmm, rnd) + contactResistance(dmm, rnd);
      const s = runSolver(this.solver === 'fast' ? 'spice' : this.solver, this.board, this.conn, {
        ...(this.ocpAmps > 0 && { currentLimit: this.ocpAmps }),
        ...(this.bootSequenced && this.boot.state !== 'OFF' && { powerState: this.boot.state, loadScale: this.activeScenario.calibration?.loadScale }),
        ammeter: { a, b, ohms },
      }) as Sim & { ammeterAmps?: number };
      r = s.source ? displayAmps(s.ammeterAmps ?? 0, activeDmm(), rnd) : { text: '0.0 mA', value: 0, sub: t('no supply') };
      m.set(key, r);
    }
    return r;
  }

  private ohms(a: number, b: number): number {
    return this.solver !== 'fast' ? measureOhmsSpice(this.board, this.conn, a, b) : measureOhms(this.board, this.conn, a, b);
  }

  private diodeTest(a: number, b: number) {
    return this.solver !== 'fast' ? measureDiodeSpice(this.board, this.conn, a, b) : measureDiode(this.board, this.conn, a, b);
  }

  private exportSpice() {
    const conn = buildConnectivity(this.board);
    const title = this.activeScenario.meta.title;
    const nl = boardToCircuit(this.board, conn, {
      title,
      infer: this.activeScenario.meta.author.startsWith('Boardview'),
      comments: [`Exported from DEADBOARD scenario "${title}" with its current faults and repairs.`],
    });
    const blob = new Blob([writeSpice(nl.circuit)], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'board'}.cir`;
    a.click();
    URL.revokeObjectURL(url);
    const stubs = nl.report.filter((r) => r.source === 'stub').length;
    this.toast(t('Exported SPICE netlist: {n} elements', { n: nl.circuit.elements.length }) + (stubs ? ', ' + t('{n} unmodelled parts as hi-Z stubs', { n: stubs }) : '') + '.', 'success');
  }

  private refreshProbes() {
    // Re-resolve net indices on probe positions after board edits
    for (const p of [this.probeRed, this.probeBlack, this.scopeProbe]) {
      if (!p) continue;
      const hit = netAt(this.board, this.conn, p.pos, p.side, true);
      if (hit) {
        p.net = hit.net;
        p.label = hit.label;
      } else {
        p.net = -1;
        p.label = t('No contact');
      }
    }
  }

  /** Analytics: one event per key per page load (where the first minutes on the bench go). */
  private trackOnce(key: string, name: string, data?: Record<string, string | number>) {
    if (this.trackedOnce.has(key)) return;
    this.trackedOnce.add(key);
    trackEvent(name, data);
  }

  /** How far this page load got (for "bench left early"), without an event of its own: per-board
   *  tools, tests and fixes are in DEADBOARD's own puzzle statistics, not in Umami. */
  private noteOnce(key: string) {
    this.trackedOnce.add(key);
  }

  /**
   * A calmer first screen: the Author tab (the board editor) waits until the player has finished the
   * beginner lessons or solved any other board. On an imported, mod or blank board it is always
   * there, since editing is the point; the author mode, once on, keeps it.
   */
  private authorShown(): boolean {
    const sc = this.activeScenario;
    if (this.authorMode || !sc || !this.shippedIds.has(sc.id) || sc.generated) return true;
    if (TUTORIAL_SCENARIO_IDS.every((id) => this.solvedIds.has(id))) return true;
    return [...this.solvedIds].some((id) => !(TUTORIAL_SCENARIO_IDS as readonly string[]).includes(id));
  }

  /** Puzzle statistics: one anonymous record per attempt (src/attempts/client.ts), website only. */
  private startAttempts() {
    // active play time feeds both the hidden estimate (everywhere) and the puzzle stats (website)
    startActiveClock((sec) => { this.attempts?.active(sec); if (this.rated) this.rated.activeSec += sec; });
    void fetch('./fitted-levels.json').then((r) => (r.ok ? r.json() : null)).then((d) => {
      setFittedLevels(d);
      this.refreshScenarioSelect();
      this.renderUI();
    }).catch(() => {});
    const send = browserSender();
    if (!send) return;
    this.attempts = new AttemptTracker(send, APP_BUILD);
    this.firstPlayDays = daysSinceFirstPlay();
    const hide = () => this.attempts?.hidden();
    document.addEventListener('visibilitychange', () => { if (document.hidden) hide(); });
    addEventListener('pagehide', hide);
  }

  /** What an attempt record says about the puzzle: shipped boards by id, everything else "custom". */
  private puzzleInfo(sc: Scenario): PuzzleInfo {
    const shipped = (id: string) => this.shippedIds.has(id) && /^(builtin|demo)-/.test(id);
    let pv = this.puzzleVersions.get(sc);
    if (!pv) { pv = shortHash(JSON.stringify(sc.board)); this.puzzleVersions.set(sc, pv); }
    const level = Math.min(10, Math.max(0, boardLevel(sc)));
    if (sc.generated) {
      const from = sc.generated.from;
      if (!shipped(from)) return { puzzle: 'custom', kind: 'custom', from: '', pv, level, faults: 0 };
      const kind = sc === this.dailyScenario ? 'daily' : 'generated';
      return { puzzle: kind, kind, from, pv, level, faults: Math.min(9, Math.max(1, Math.round(sc.meta.par ?? 1))) };
    }
    if (!shipped(sc.id)) return { puzzle: 'custom', kind: 'custom', from: '', pv, level, faults: 0 };
    const kind = isTutorialScenario(sc.id) ? 'tutorial' : sc.id.startsWith('demo-') ? 'real' : 'challenge';
    return { puzzle: sc.id, kind, from: '', pv, level, faults: 0 };
  }

  /**
   * The hidden estimate learns from the attempt that just ended: a fix, or giving up on a board
   * after really trying it (another board opened). Leaving the page says nothing.
   */
  private rateAttempt(fixed: boolean) {
    const a = this.rated;
    if (!a || a.done) return;
    // giving up counts only after real work: a minute of active play with tests run or changes made
    // (First Light asks for an early test run, and players browse boards: neither is a failure)
    const engaged = a.activeSec >= 60 && (a.tests > 0 || a.moves > 0);
    const score = attemptScore({ fixed, notes: a.notes, solution: a.solution, engaged });
    if (fixed) a.done = true;
    if (score === null) return;
    a.done = true;
    this.skill = updateSkill(this.skill, a.level, score, a.weight);
    saveSkill(this.skill);
  }

  private beginRated(sc: Scenario) {
    this.rateAttempt(false);
    const shipped = (id: string) => this.shippedIds.has(id) && /^(builtin|demo)-/.test(id);
    if (!(shipped(sc.id) || (sc.generated && shipped(sc.generated.from)))) { this.rated = null; return; }
    const level = shownLevel(sc);
    this.rated = { level, weight: isTutorialScenario(sc.id) ? 0.5 : 1, tests: 0, notes: 0, solution: false, activeSec: 0, moves: 0, done: false };
  }

  private beginAttempt(sc: Scenario) {
    if (this.shippedIds.size) this.beginRated(sc);
    if (!this.attempts || !this.shippedIds.size) return;
    const l = lang();
    this.attempts.begin(this.puzzleInfo(sc), {
      layout: this.mobile ? 'phone' : 'desktop',
      lang: l === 'en' || l === 'ru' ? l : 'other',
      solvedBefore: this.solvedIds.size,
      daysSinceFirst: this.firstPlayDays,
    });
  }

  /** A board fixed in this page load (for "bench left early": how far the visit got). */
  private trackFix() {
    this.trackedFixes.add(this.activeScenario.id);
  }

  private async runVerify() {
    this.recompute(false);
    const addr = this.modSolver;
    let res: VerifyResult;
    try {
      res = await verifyScenario(this.activeScenario, this.board, this.solver, addr
        ? async (o, board, conn) => simFromResult(board, conn, await this.codeHost.solve(addr, { netlist: buildNetlist(board, conn, this.activeScenario.meta.title, o.switches), meters: o.meters }))
        : undefined);
      this.lastVerifyBy = addr;
    } catch (err) {
      // the solver mod failed mid-test: test on the official solver instead
      this.toast(t('The solver {solver} failed ({error}); back to {official}.', { solver: addr ?? '', error: err instanceof Error ? err.message : String(err), official: t(SOLVERS.find((x) => x.id === this.solver)?.name ?? this.solver) }), 'danger');
      this.modSolver = null;
      this.lastVerifyBy = null;
      this.refreshSolverSelect();
      res = await verifyScenario(this.activeScenario, this.board, this.solver);
    }
    this.lastVerify = res;
    this.noteOnce(`tests:${this.activeScenario.id}`);
    const fixed = !!res.flag || (res.allPassed && !res.topologyMismatch && !this.activeScenario.lock);
    this.attempts?.tests(!!res.flag || (res.allPassed && !res.topologyMismatch), fixed);
    if (this.rated) this.rated.tests++;
    if (fixed) this.rateAttempt(true);
    if (fixed) this.trackFix();
    if (this.runningCode.size) {
      this.codeHost.emit('tests:run', { passed: res.allPassed && !res.topologyMismatch, results: res.results.map((r) => ({ label: r.label, passed: r.passed, detail: r.detail })) });
      if (res.flag) this.codeHost.emit('flag:unlocked', { title: this.activeScenario.meta.title });
    }
    if (res.flag) {
      this.revealedFlag = res.flag;
      if (!this.activeScenario.generated) {
        this.solvedIds.add(this.activeScenario.id);
        localStorage.setItem('pcbfix_solved', JSON.stringify([...this.solvedIds]));
      }
      this.refreshScenarioSelect();
      sfxWin();
      this.celebrate(res.flag);
    } else if (res.allPassed && res.topologyMismatch) {
      this.toast(t('Checks pass, but the circuit is not the reference design — a fault is still hiding in there.'), 'warn');
    } else if (res.allPassed && !this.activeScenario.lock) {
      sfxWin();
      this.celebrate(null);
    } else {
      sfxClick();
      this.toast(t('Bench checks failed — details in the Overview tab.'), 'warn');
    }
    const lesson = lessonFor(this.activeScenario.id);
    if (lesson && fixed) {
      // the board works: now the inspector looks at how the work was done
      this.lastInspection = this.inspectWork();
      if (lessonAccepted(lesson, this.lastInspection)) {
        this.trackAccepted.add(this.activeScenario.id);
        localStorage.setItem('pcbfix_track_accepted', JSON.stringify([...this.trackAccepted]));
      }
      this.showLesson = 'debrief';
      setTimeout(() => { if (this.showLesson === 'debrief' && !this.showBoards) this.renderModal(); }, 1200); // after the "Board fixed" banner has been seen
    }
    this.activeTab = 'mission';
    this.panelOpen = true;
    this.renderUI();
  }

  private bindEvents() {
    const q = (id: string) => this.mount.querySelector(id)!;

    q('#btn-boards').addEventListener('click', () => {
      this.showBoards = !this.showBoards;
      if (this.showBoards) { this.showHelp = false; this.showFeedback = false; }
      this.modalPos = [0, 0];
      this.renderModal();
    });

    q('#sc-select').addEventListener('change', (e) => {
      const idx = Number((e.target as HTMLSelectElement).value);
      if (this.scenarios[idx]) void this.openScenario(idx);
    });

    q('#btn-new-board').addEventListener('click', () => this.createBlankBoard());

    q('#btn-import').addEventListener('click', () => this.fileInputEl.click());
    this.fileInputEl.addEventListener('change', async () => {
      const f = this.fileInputEl.files?.[0];
      if (f) await this.handleFile(f);
      this.fileInputEl.value = '';
    });

    this.mount.querySelectorAll<HTMLButtonElement>('#seg-view button').forEach((b) => {
      b.addEventListener('click', () => {
        const nextMode = b.dataset.view as '2d' | '3d';
        this.camera.setMode(nextMode);
        this.renderUI();
      });
    });
    this.mount.querySelectorAll<HTMLButtonElement>('#seg-side button').forEach((b) => {
      b.addEventListener('click', () => {
        const s = b.dataset.side!;
        const wasBoth = this.camera.bothSides;
        if (s === 'both') {
          if (this.camera.mode === '3d') this.camera.setMode('2d'); // side-by-side is a 2D boardview layout
          this.camera.setSide('F');
          this.camera.bothSides = true;
          this.camera.fitBoard(this.board.w, this.board.h);
        } else {
          this.camera.bothSides = false;
          this.camera.setSide(s as Side);
          if (wasBoth) this.camera.fitBoard(this.board.w, this.board.h);
        }
        this.renderUI();
      });
    });
    q('#btn-fit').addEventListener('click', () => this.fitBoardInView());
    q('#viz-select').addEventListener('change', (e) => {
      this.vizMode = (e.target as HTMLSelectElement).value as VizMode;
      this.renderUI();
    });
    // top-bar dropdowns (bench setup, settings): one open at a time, closed by a click elsewhere
    const pops: [string, string][] = [['#btn-bench', '#bench-pop'], ['#btn-settings', '#settings-pop']];
    for (const [btn, sel] of pops) {
      q(btn).addEventListener('click', (e) => {
        e.stopPropagation();
        const pop = q(sel) as HTMLElement;
        const open = pop.hidden;
        for (const [b2, s2] of pops) { (q(s2) as HTMLElement).hidden = true; q(b2).classList.remove('active'); }
        pop.hidden = !open;
        q(btn).classList.toggle('active', open);
      });
    }
    document.addEventListener('pointerdown', (e) => {
      if ((e.target as HTMLElement).closest('.bench-wrap')) return;
      for (const [btn, sel] of pops) {
        const pop = this.mount.querySelector(sel) as HTMLElement | null;
        if (pop && !pop.hidden) { pop.hidden = true; q(btn).classList.remove('active'); }
      }
    });
    q('#rework-mode').addEventListener('change', (e) => {
      const sel = e.target as HTMLSelectElement;
      if (sel.value === 'instant' && lessonFor(this.activeScenario.id)) {
        // a soldering lesson is about the real process: the inspector needs the heat you applied
        sel.value = this.reworkValue();
        this.toast(t('This lesson needs realistic rework: the inspection measures the heat you apply.'), 'info');
        return;
      }
      this.setRework(sel.value);
      if (this.reworkMode.realistic) this.toast(t('Realistic rework: joints melt, pads lift and parts crack from the actual heat you apply. Watch the Thermal view.'), 'info');
    });
    q('#preheat').addEventListener('change', (e) => {
      this.preheatTemp = Number((e.target as HTMLSelectElement).value) || 0;
      if (!this.preheatTemp && this.thermal) this.thermal.sources = this.thermal.sources.filter((x) => x.kind !== 'preheat');
    });
    q('#psu-mode').addEventListener('change', (e) => {
      const v = (e.target as HTMLSelectElement).value;
      this.psuInject = v === 'inject1' ? { volts: 1, amps: 3 } : v === 'inject3' ? { volts: 3.3, amps: 1 } : null;
      if (this.psuInject) this.toast(t('Voltage injection: place the red probe on the shorted rail, then power on. The faulty part heats up — use Thermal view, freeze spray or IPA.'), 'info');
      this.recompute(true);
      this.renderUI();
    });
    q('#ocp-select').addEventListener('change', (e) => {
      this.ocpAmps = Number((e.target as HTMLSelectElement).value) || 0;
      this.recompute(false);
      this.renderUI();
    });
    q('#solver-select').addEventListener('change', (e) => {
      const v = (e.target as HTMLSelectElement).value;
      if (v.includes('/')) {
        this.modSolver = v; // a solver mod; measurements it doesn't do (Ω, diode, injection) stay on the official solver
      } else {
        this.modSolver = null;
        this.solver = v === 'spice' || v === 'spice-power' ? v : 'fast';
        try { localStorage.setItem('pcbfix_solver', this.solver); } catch { /* storage unavailable */ }
      }
      this.simFromMod = false;
      this.boot.powerOff(); // power up again under the new model
      this.recompute(false);
      this.renderUI();
    });
    q('#meter-select').addEventListener('change', (e) => {
      this.meterChoice = (e.target as HTMLSelectElement).value;
      try { localStorage.setItem('deadboard_meter', this.meterChoice); } catch { /* storage unavailable */ }
      this.applyMeter();
      this.recompute(false);
      this.renderUI();
    });
    q('#btn-spice-export').addEventListener('click', () => this.exportSpice());
    q('#btn-power').addEventListener('click', () => this.togglePower());
    q('#btn-verify').addEventListener('click', () => void this.runVerify());
    q('#btn-tutorial').addEventListener('click', () => {
      if (this.tutorialOpen && isTutorialScenario(this.activeScenario.id)) {
        this.tutorialOpen = false;
        localStorage.setItem('pcbfix_tut_dismissed', '1');
        this.renderUI();
      } else {
        this.startTutorial();
      }
    });
    q('#btn-invert-orbit').addEventListener('click', () => {
      this.camera.invertOrbit = !this.camera.invertOrbit;
      try { localStorage.setItem('pcbfix_invert_orbit', this.camera.invertOrbit ? '1' : '0'); } catch { /* storage unavailable */ }
      this.updateTopButtons();
    });
    q('#btn-sound').addEventListener('click', () => {
      setSoundEnabled(!soundEnabled);
      this.renderUI();
    });
    this.mount.querySelector('#btn-stats')?.addEventListener('click', () => {
      setStatsSwitch(!statsSwitchOn());
      this.updateTopButtons();
    });
    this.mount.querySelector('#btn-keys')?.addEventListener('click', () => {
      this.keyShortcuts = !this.keyShortcuts;
      try { localStorage.setItem('pcbfix_key_shortcuts', this.keyShortcuts ? '1' : '0'); } catch { /* storage unavailable */ }
      this.updateTopButtons();
    });
    q('#btn-feedback').addEventListener('click', () => this.openFeedback(!this.showFeedback));
    this.mount.querySelectorAll<HTMLSelectElement>('.lang-select').forEach((sel) => sel.addEventListener('change', () => this.switchLanguage(sel.value, sel)));
    q('#btn-help').addEventListener('click', () => {
      this.showHelp = !this.showHelp;
      if (this.showHelp) { this.showBoards = false; this.showFeedback = false; }
      this.modalPos = [0, 0];
      this.renderModal();
    });
    q('#btn-panel-toggle').addEventListener('click', () => {
      this.panelOpen = !this.panelOpen;
      this.layoutEl.classList.toggle('panel-collapsed', !this.panelOpen);
    });

    this.mount.querySelectorAll<HTMLButtonElement>('.tool-btn[data-tool]').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.setTool(btn.dataset.tool as ToolId);
        if (this.mobile && this.panelOpen) this.setPanel(false); // back to the board
      });
    });
    this.mount.querySelector('#btn-more-tools')?.addEventListener('click', () => {
      try { localStorage.setItem('pcbfix_all_tools', '1'); } catch { /* private mode: for this visit only */ }
      this.allTools = true;
      this.updateToolDock();
    });
    if (this.mobile) this.bindMobile();

    q('#btn-undo').addEventListener('click', () => this.undo());
    q('#btn-redo').addEventListener('click', () => this.redo());
    q('#btn-reset').addEventListener('click', () => this.loadScenario(this.activeScenario));

    this.mount.querySelectorAll<HTMLButtonElement>('.tab[data-tab]').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.activeTab = btn.dataset.tab as PanelTab;
        this.renderUI();
      });
      // tab pattern: arrows / Home / End move between the panel's tabs
      btn.addEventListener('keydown', (e) => {
        const tabs = [...this.mount.querySelectorAll<HTMLButtonElement>('.tab[data-tab]')].filter((b) => !b.hidden);
        const i = tabs.indexOf(btn);
        const next = e.key === 'ArrowRight' ? tabs[(i + 1) % tabs.length]
          : e.key === 'ArrowLeft' ? tabs[(i - 1 + tabs.length) % tabs.length]
            : e.key === 'Home' ? tabs[0] : e.key === 'End' ? tabs[tabs.length - 1] : null;
        if (!next) return;
        e.preventDefault();
        this.activeTab = next.dataset.tab as PanelTab;
        this.renderUI();
        next.focus();
      });
    });

    // Pointer controls (canvas + draggable floating windows & panel resizer)
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    this.mount.addEventListener('pointerdown', (e) => this.onPointerDown(e));
    window.addEventListener('pointermove', (e) => this.onPointerMove(e));
    window.addEventListener('pointerup', (e) => this.onPointerUp(e));
    window.addEventListener('pointercancel', (e) => {
      if (this.touchIron === e.pointerId) { this.touchIron = null; this.endIronHold(); }
      if (this.gestures.has(e.pointerId)) this.gestures.cancel(e.pointerId);
    });
    window.addEventListener('blur', () => { if (this.dragMode === 'iron') this.dragMode = 'none'; this.touchIron = null; this.endIronHold(); });
    this.canvas.addEventListener('wheel', (e) => this.onWheel(e), { passive: false });

    // Keyboard shortcuts
    window.addEventListener('keydown', (e) => this.onKeyDown(e));
    window.addEventListener('keyup', (e) => {
      if (e.code === 'Space') this.spaceHeld = false;
    });

    // Drag-and-drop file upload
    window.addEventListener('dragover', (e) => {
      e.preventDefault();
      this.dropOverlayEl.style.display = 'flex';
    });
    window.addEventListener('dragleave', (e) => {
      if (e.relatedTarget === null) this.dropOverlayEl.style.display = 'none';
    });
    window.addEventListener('drop', async (e) => {
      e.preventDefault();
      this.dropOverlayEl.style.display = 'none';
      const f = e.dataTransfer?.files?.[0];
      if (f) await this.handleFile(f);
    });
  }

  /** Mobile-only controls: More sheet, floating view buttons, sheet close. */
  private bindMobile() {
    const q = (sel: string) => this.mount.querySelector<HTMLElement>(sel);
    const more = q('#m-more')!;
    q('#btn-more')?.addEventListener('click', () => { more.hidden = !more.hidden; this.updateTopButtons(); });
    q('#m-more-close')?.addEventListener('click', () => { more.hidden = true; });
    more.addEventListener('click', (e) => { if (e.target === more) more.hidden = true; });
    more.querySelectorAll<HTMLButtonElement>('[data-proxy]').forEach((b) => b.addEventListener('click', () => {
      const sel = b.dataset.proxy!;
      // these open something else (a modal, a file picker, a fresh board): close the sheet first
      if (sel !== '#btn-sound' && sel !== '#btn-invert-orbit' && sel !== '#btn-stats') more.hidden = true;
      q(sel)?.click();
      this.updateTopButtons();
    }));
    q('#m-fit')?.addEventListener('click', () => this.fitBoardInView());
    q('#m-mode')?.addEventListener('click', () => {
      this.camera.setMode(this.camera.mode === '2d' ? '3d' : '2d');
      this.renderUI();
    });
    q('#m-flip')?.addEventListener('click', () => this.flipSide());
    q('#m-panel-close')?.addEventListener('click', () => this.setPanel(false));
    // panel notes fold to their heading; a tap opens / closes one (remembered across re-renders)
    this.sideBodyEl.addEventListener('click', (e) => {
      const c = (e.target as HTMLElement).closest<HTMLElement>('.callout');
      const h = c?.querySelector('.h')?.textContent;
      if (!c || !h || (e.target as HTMLElement).closest('a, button, input, select, textarea')) return;
      if (this.openNotes.has(h)) this.openNotes.delete(h); else this.openNotes.add(h);
      c.classList.toggle('open', this.openNotes.has(h));
    });
    q('#m-rotate-keep')?.addEventListener('click', () => {
      try { localStorage.setItem('pcbfix_portrait_ok', '1'); } catch { /* storage unavailable */ }
      q('#m-rotate')?.remove();
    });
    setTimeout(() => {
      const r = q('#m-rotate');
      if (!r) return;
      r.classList.add('fade');
      setTimeout(() => r.remove(), 400);
    }, 20_000);
    // iOS Safari zooms the page on a pinch outside the canvas: the board has its own pinch zoom
    document.addEventListener('gesturestart', (e) => e.preventDefault());
  }

  /**
   * Phones change shape (first layout, rotation): the camera only learns the canvas aspect when it
   * renders, so a fit made before that frames a portrait screen as if it were landscape.
   */
  private camSig(): string {
    const c = this.camera;
    return [c.tx, c.ty, c.orthoHalfH, c.dist, c.mode, c.side, c.bothSides].join();
  }

  private refitOnShapeChange() {
    if (this.autoFramed && this.camSig() !== this.autoFrameCam) this.autoFramed = '';
    const w = this.canvas.clientWidth, h = this.canvas.clientHeight;
    if (w < 2 || h < 2) return;
    const a = w / h;
    if (this.fitAspect && Math.abs(a / this.fitAspect - 1) < 0.08) {
      // the overlays settle a few frames after a board opens: keep the untouched fit clear of them
      const now = performance.now();
      if (this.autoFramed && now - this.autoFrameCheck > 250) {
        this.autoFrameCheck = now;
        if (JSON.stringify(this.clearView()) !== this.autoFramed) this.fitBoardInView();
      }
      return;
    }
    this.fitAspect = a;
    this.camera.matrices(w, h); // updates the aspect the fit uses
    this.fitBoardInView();
  }

  /**
   * The part of the canvas (client px, from its top-left) that the overlays leave uncovered, or
   * null when nothing covers much of it. Phone: the lesson card and the readouts, each cut away
   * from the side that keeps the most room (portrait: card on top, readouts below; landscape:
   * card on the left). Desktop: the tutorial card and the readouts, each cut from the side that
   * leaves the board biggest; a readout that would shrink the board below 60 % stays over it.
   */
  private clearView(): { x: number; y: number; w: number; h: number } | null {
    const c = this.canvas.getBoundingClientRect();
    if (c.width < 2 || c.height < 2) return null;
    let x0 = c.left, y0 = c.top, x1 = c.right, y1 = c.bottom;
    const bw = Math.max(1, this.board.w), bh = Math.max(1, this.board.h);
    // desktop: how big the board fits in a w × h box (phones keep their area rule)
    const room = (w: number, h: number) => (this.mobile ? w * h : Math.min(w / bw, h / bh));
    const full = room(x1 - x0, y1 - y0);
    for (const el of this.mount.querySelectorAll<HTMLElement>(this.mobile ? '#tut-box .tut-card, .m-hud' : '#tut-box .tut-card, #dmm-box > *, #scope-box > *, #psu-box > *')) {
      const r = el.getBoundingClientRect();
      if (r.width < 1 || r.height < 1 || r.right <= x0 || r.left >= x1 || r.bottom <= y0 || r.top >= y1) continue;
      const keep = { x0, y0, x1, y1 };
      const cuts = [
        { a: room(x1 - x0, y1 - Math.max(y0, r.bottom)), f: () => { y0 = Math.max(y0, r.bottom); } },
        { a: room(x1 - x0, Math.min(y1, r.top) - y0), f: () => { y1 = Math.min(y1, r.top); } },
        { a: room(x1 - Math.max(x0, r.right), y1 - y0), f: () => { x0 = Math.max(x0, r.right); } },
        { a: room(Math.min(x1, r.left) - x0, y1 - y0), f: () => { x1 = Math.min(x1, r.left); } },
      ];
      cuts.reduce((best, k) => (k.a > best.a ? k : best)).f();
      if (!this.mobile && !el.closest('#tut-box') && room(x1 - x0, y1 - y0) < 0.6 * full) ({ x0, y0, x1, y1 } = keep);
    }
    const w = x1 - x0, h = y1 - y0;
    if (w < 120 || h < 90 || w * h > 0.9 * c.width * c.height) return null; // nothing to dodge, or no room left
    return { x: x0 - c.left, y: y0 - c.top, w, h };
  }

  /** Whole board in view, in the part of the canvas the overlays leave free (clearView). */
  private fitBoardInView() {
    const v = this.camera.bothSides ? null : this.clearView();
    this.autoFramed = JSON.stringify(v);
    this.camera.fitBoard(this.board.w, this.board.h); // remembers the board size for later fits
    if (v) {
      const m = 1.12; // the margin fitBoard leaves
      this.camera.frameIn(this.board.w / 2, this.board.h / 2, (this.board.w / 2) * m, (this.board.h / 2) * m, v, this.canvas.clientWidth, this.canvas.clientHeight);
    }
    this.autoFrameCam = this.camSig();
  }

  /** A tutorial step's target in view (Locate): on a phone, clear of the lesson card. */
  private focusTarget(target: { pos: [number, number]; side: Side; zoomHalfH: number }) {
    this.autoFramed = '';
    const v = this.camera.bothSides ? null : this.clearView();
    if (v) this.camera.frameIn(target.pos[0], target.pos[1], target.zoomHalfH, target.zoomHalfH, v, this.canvas.clientWidth, this.canvas.clientHeight, target.side);
    else this.camera.focusAt(target.pos[0], target.pos[1], target.zoomHalfH, target.side);
  }

  /** Opens / closes the side panel (the bottom sheet on mobile). */
  private setPanel(open: boolean) {
    this.panelOpen = open;
    this.layoutEl.classList.toggle('panel-collapsed', !open);
  }

  /** F key / mobile flip button: the other face (leaving the side-by-side view for the bottom). */
  private flipSide() {
    if (this.camera.bothSides) {
      this.camera.bothSides = false;
      this.camera.setSide('B');
      this.camera.fitBoard(this.board.w, this.board.h);
    } else {
      this.camera.flip();
    }
    this.renderUI();
  }

  /** Language picker by native names: a select (Settings menu, help window) or a phone More-sheet row. */
  private langPickerHtml(kind: 'row' | 'full' = 'full'): string {
    const opts = LANGUAGES.map((l) => `<option value="${l.code}"${l.code === lang() ? ' selected' : ''}>${l.name}</option>`).join('');
    if (kind === 'row') return `<label class="m-row m-lang">${icon('globe', 16)}<span>${t('Language')}</span><select class="lang-select" aria-label="Language">${opts}</select></label>`;
    return `<select class="lang-select" aria-label="Language">${opts}</select>`;
  }

  /** Reloads in another language, reopening the same board (unsaved changes to it are lost). */
  private switchLanguage(code: string, sel: HTMLSelectElement) {
    if (code === lang()) return;
    if (this.moves > 0 && !confirm(t('Switching the language reloads the bench: your changes to this board will be lost. Continue?'))) { sel.value = lang(); return; }
    saveLanguage(code);
    try { sessionStorage.setItem('deadboard_reopen', this.activeScenario.id); } catch { /* storage unavailable */ }
    const u = new URL(location.href);
    u.searchParams.delete('lang');
    location.replace(u.toString());
  }

  /** Mouse wording → touch wording on the mobile layout. */
  private txt(s: string): string {
    // the English text is rewritten for touch; translations are worded for both mouse and touch
    return this.mobile && lang() === 'en' ? touchCopy(s) : s;
  }

  private async handleFile(f: File) {
    if (/\.zip$/i.test(f.name)) { await this.installModFile(f); return; }
    try {
      const bytes = new Uint8Array(await f.arrayBuffer());
      // file types the app knows go to its importers first; a mod importer takes the others,
      // and a known type the official importer refuses (e.g. another program's .brd)
      const lower = f.name.toLowerCase();
      const imp = this.codeHost.importers().find((x) => x.extensions.some((e) => lower.endsWith(e)));
      const viaMod = async () => {
        this.toast(t('Opening {file} with the importer «{name}» (mod «{mod}»)…', { file: f.name, name: imp!.name, mod: imp!.modId }), 'info');
        const { scenarioFromImport } = await import('../mods/api/importing');
        return scenarioFromImport(await this.codeHost.importFile(imp!.address, { name: f.name, bytes }), f.name, imp!.modId);
      };
      let sc: Scenario;
      if (imp && !/\.(kicad_pcb|brd|tvw|json)$/.test(lower)) sc = await viaMod();
      else {
        try { sc = importScenarioOrPcb(f.name, bytes); } catch (err) { if (!imp) throw err; sc = await viaMod(); }
      }
      this.scenarios.push(sc);
      this.loadScenario(sc);
      this.toast(t('Loaded {title} ({parts} parts, {traces} traces)', { title: t(sc.meta.title), parts: sc.board.components.length, traces: sc.board.traces.length }), 'success');
      for (const w of sc.importWarnings ?? []) this.toast(t('Import check: {warning}', { warning: w }), 'warn');
    } catch (err) {
      this.toast(t('Import error: {error}', { error: err instanceof Error ? err.message : String(err) }), 'danger');
    }
  }

  private setTool(t: ToolId) {
    const tr = (s: string) => translate(s);
    if (this.mobile && t !== this.activeTool && !this.toolTipsShown.has(t)) {
      this.toolTipsShown.add(t);
      const tool = TOOLS.find((x) => x.id === t);
      if (tool && t !== 'inspect') this.toast(`${tr(tool.lbl)}: ${tr(TOOL_TIP_PHONE[t] ?? tool.tip)}`, 'info');
    }
    this.activeTool = t;
    if (t !== 'jumper') this.jumperStart = null;
    this.mount.querySelectorAll<HTMLButtonElement>('.tool-btn[data-tool]').forEach((b) => {
      b.classList.toggle('active', b.dataset.tool === t);
      b.setAttribute('aria-pressed', String(b.dataset.tool === t));
    });
    this.renderDmm();
    this.renderTopHud();
    this.renderTutorial();
  }

  private togglePower() {
    this.powerOn = !this.powerOn;
    if (!this.powerOn) this.boot.powerOff();
    sfxClick();
    this.recompute(false);
    this.renderUI();
    if (this.runningCode.size) this.codeHost.emit('power:changed', { on: this.powerOn, nets: this.powerOn ? this.netVoltsByName() : {} });
  }

  private canvasPt(e: PointerEvent | WheelEvent): { sx: number; sy: number; w: number; h: number } {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    return {
      sx: (e.clientX - rect.left) * dpr,
      sy: (e.clientY - rect.top) * dpr,
      w: Math.max(1, rect.width * dpr),
      h: Math.max(1, rect.height * dpr),
    };
  }

  private onPointerDown(e: PointerEvent) {
    if (e.pointerType === 'touch' && e.target === this.canvas) {
      e.preventDefault();
      this.hovered = null;
      // realistic iron: a finger on a joint holds the tip there until it lifts
      if (!this.gestures.active && this.touchIron === null && this.activeTool === 'iron' && this.reworkMode.realistic) {
        const at = this.clientToBoard(e.clientX, e.clientY);
        if (at && this.beginIronHold(at.pt, at.side)) { this.touchIron = e.pointerId; return; }
      }
      this.gestures.down(e.pointerId, e.clientX, e.clientY);
      return;
    }
    if (e.button === 0) {
      const target = e.target as HTMLElement | null;
      if (target && !this.mobile) { // the mobile layout has fixed windows
        if (target.closest('#sidepanel-resizer')) {
          this.winDrag = { target: 'sidepanel', startX: e.clientX, startY: e.clientY, origX: this.sidepanelW, origY: 0 };
          document.body.classList.add('resizing-panel');
          e.preventDefault();
          return;
        }
        if (!target.closest('button, select, input, a')) {
          if (target.closest('.tut-head')) {
            this.winDrag = { target: 'tut', startX: e.clientX, startY: e.clientY, origX: this.tutPos[0], origY: this.tutPos[1] };
            document.body.classList.add('dragging-win');
            e.preventDefault();
            return;
          }
          if (target.closest('.dmm-head')) {
            this.winDrag = { target: 'dmm', startX: e.clientX, startY: e.clientY, origX: this.dmmPos[0], origY: this.dmmPos[1] };
            document.body.classList.add('dragging-win');
            e.preventDefault();
            return;
          }
          if (target.closest('.modal-head')) {
            this.winDrag = { target: 'modal', startX: e.clientX, startY: e.clientY, origX: this.modalPos[0], origY: this.modalPos[1] };
            this.suppressModalBgClose = false;
            document.body.classList.add('dragging-win');
            e.preventDefault();
            return;
          }
        }
      }
    }

    if (e.target !== this.canvas) return;
    const { sx, sy, w, h } = this.canvasPt(e);
    if (e.button === 0 && !this.spaceHeld && this.activeTool === 'iron' && this.reworkMode.realistic) {
      const at = this.resolveBoardPt(this.camera.screenToBoard(sx, sy, w, h, this.board.thickness));
      if (at && this.beginIronHold(at.pt, at.side)) { this.dragMode = 'iron'; return; }
    }
    this.downPx = e.clientX;
    this.downPy = e.clientY;
    this.lastPx = e.clientX;
    this.lastPy = e.clientY;
    this.dragMoved = false;

    if (e.button === 0 || e.button === 1) {
      this.dragMode = 'pan';
      return;
    }
    if (e.button === 2) {
      this.dragMode = 'orbit';
      return;
    }

    void sx; void sy; void w; void h;
  }

  private onPointerMove(e: PointerEvent) {
    if (e.pointerType === 'touch' && this.gestures.has(e.pointerId)) {
      this.gestures.move(e.pointerId, e.clientX, e.clientY);
      return;
    }
    if (this.winDrag) {
      const dx = e.clientX - this.winDrag.startX;
      const dy = e.clientY - this.winDrag.startY;
      if (this.winDrag.target === 'sidepanel') {
        this.sidepanelW = Math.max(240, Math.min(640, this.winDrag.origX - dx));
        this.layoutEl.style.setProperty('--sidepanel-w', `${this.sidepanelW}px`);
      } else {
        const nx = Math.round(this.winDrag.origX + dx);
        const ny = Math.round(this.winDrag.origY + dy);
        if (this.winDrag.target === 'tut') {
          this.tutPos = [nx, ny];
          const card = this.tutBoxEl.querySelector<HTMLElement>('.tut-card');
          if (card) card.style.transform = `translate3d(${nx}px, ${ny}px, 0)`;
        } else if (this.winDrag.target === 'dmm') {
          this.dmmPos = [nx, ny];
          const card = this.dmmBoxEl.querySelector<HTMLElement>('.dmm-card');
          if (card) card.style.transform = `translate3d(${nx}px, ${ny}px, 0)`;
        } else if (this.winDrag.target === 'modal') {
          if (Math.hypot(dx, dy) > 4) this.suppressModalBgClose = true;
          this.modalPos = [nx, ny];
          const modal = this.modalRootEl.querySelector<HTMLElement>('.modal');
          if (modal) modal.style.transform = `translate3d(${nx}px, ${ny}px, 0)`;
        }
      }
      return;
    }

    if (this.dragMode === 'iron') return; // the tip stays on its joint
    if (this.dragMode !== 'none') {
      const dx = e.clientX - this.lastPx;
      const dy = e.clientY - this.lastPy;
      if (Math.hypot(e.clientX - this.downPx, e.clientY - this.downPy) > 4) this.dragMoved = true;
      this.lastPx = e.clientX;
      this.lastPy = e.clientY;

      if (this.dragMode === 'pan') {
        if (this.dragMoved) {
          this.canvas.classList.add('panning');
          this.camera.panScreen(dx, dy, Math.max(1, this.canvas.clientHeight));
        }
      } else if (this.dragMode === 'orbit') {
        if (this.dragMoved) this.orbitBy(dx, dy);
      }
      return;
    }

    if (e.target !== this.canvas) return;
    const { sx, sy, w, h } = this.canvasPt(e);
    const resolved = this.resolveBoardPt(this.camera.screenToBoard(sx, sy, w, h, this.board.thickness));
    this.cursorWorld = resolved?.pt ?? null;
    this.cursorSide = resolved?.side ?? this.camera.side;
    this.hovered = resolved ? pickAt(this.board, resolved.pt, resolved.side, this.vizMode === 'xray') : null;
    this.renderTopHud();
  }

  private orbitBy(dx: number, dy: number) {
    const prevMode = this.camera.mode, prevSide = this.camera.side;
    this.camera.orbit(dx, dy);
    this.updateTopButtons();
    if (this.camera.side !== prevSide) this.renderTopHud(); // orbited over to the other face
    if (this.camera.mode !== prevMode) this.renderTutorial();
  }

  /** A client-pixel point on the board, if it lands on it. */
  private clientToBoard(x: number, y: number): { pt: V2; side: Side } | null {
    const r = this.canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    return this.resolveBoardPt(this.camera.screenToBoard((x - r.left) * dpr, (y - r.top) * dpr, Math.max(1, r.width * dpr), Math.max(1, r.height * dpr), this.board.thickness));
  }

  /**
   * Realistic rework: the tip goes on a joint and stays there while the button, finger or Enter
   * is held, as long as a real hand holds it (cut off after 30 s). The joint heats from the thermal
   * model; the rework monitor decides what the solder does. False when the point is not a joint.
   */
  private beginIronHold(pt: V2, side: Side): boolean {
    if (this.activeTool !== 'iron' || !this.reworkMode.realistic) return false;
    const hit = pickAt(this.board, pt, side, this.vizMode === 'xray');
    if (hit?.kind !== 'pad' || !hit.comp.state.populated) return false;
    this.endIronHold();
    this.noteOnce('tool');
    this.attempts?.tool('iron');
    if (!this.thermal) this.updateThermalPower();
    this.pushUndo();
    if (this.reworkMode.flux) this.rework!.applyFlux(hit.pos[0], hit.pos[1], 2);
    // fluxed (fresh flux-cored solder, or rosin put on the joint): the tip wets and transfers heat; dry it barely does
    const wet = this.reworkMode.flux || !!this.rework?.hasFlux(hit.comp);
    const src = { kind: 'iron' as const, x: hit.pos[0], y: hit.pos[1], temp: this.reworkMode.ironTemp, g: wet ? IRON_G.flux : IRON_G.dry, pmax: 60, until: this.thermal!.time + 30, partId: hit.comp.id, pad: hit.padIndex };
    this.thermal!.addSource(src);
    this.renderer.spawnSmoke(hit.pos[0], hit.pos[1], side, this.board.thickness, 'flux');
    const vp = this.mount.querySelector<HTMLElement>('#viewport');
    const el = vp ? document.createElement('div') : null;
    if (el && vp) { el.className = 'iron-hud mono'; el.setAttribute('aria-hidden', 'true'); vp.appendChild(el); }
    this.ironHold = { src, start: performance.now(), where: `${hit.comp.ref}.${hit.comp.pads[hit.padIndex].name}`, el, comp: hit.comp, pad: hit.padIndex };
    this.updateIronHud();
    return true;
  }

  /** Lifts the iron. A tap that never held it says how it is used. */
  private endIronHold() {
    const h = this.ironHold;
    if (!h) return;
    this.ironHold = null;
    if (this.thermal) h.src.until = Math.min(h.src.until, this.thermal.time);
    h.el?.remove();
    const sec = (performance.now() - h.start) / 1000;
    if (sec < 0.3) this.toast(t('Hold the iron on the joint: a joint takes about 2–3 s of heat.'), 'info');
    else this.announce(t('Iron off {joint} after {s} s', { joint: h.where, s: sec.toFixed(1) }));
  }

  /** The held iron's readout: which joint, for how long, and whether its solder is molten (what you would see). */
  private updateIronHud() {
    const h = this.ironHold;
    if (!h?.el) return;
    const sec = (performance.now() - h.start) / 1000;
    const molten = !!this.thermal && !!this.rework && this.thermal.jointTemp(h.comp, h.pad) >= this.rework.limits.alloy.liquidus;
    h.el.textContent = `${h.where} · ${sec.toFixed(1)} s${molten ? ` · ${t('molten')}` : ''}`;
    h.el.classList.toggle('molten', molten);
  }

  /** A touch tap on the board: the active tool at that point (the meter places the active probe). */
  private touchTap(x: number, y: number) {
    const r = this.canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const raw = this.camera.screenToBoard((x - r.left) * dpr, (y - r.top) * dpr, Math.max(1, r.width * dpr), Math.max(1, r.height * dpr), this.board.thickness);
    const resolved = this.resolveBoardPt(raw);
    if (!resolved) return;
    this.cursorWorld = resolved.pt;
    this.cursorSide = resolved.side;
    if (this.activeTool !== 'dmm') { this.applyToolAt(resolved.pt, resolved.side); return; }
    const which = this.activeProbe;
    if (this.mobile) {
      // two-probe modes: after the red probe the meter offers the black one, then back to red
      if (which === 'red' && this.dmmMode !== 'V' && !this.probeBlack) { this.activeProbe = 'black'; this.activeProbeAuto = true; }
      else if (which === 'black' && this.activeProbeAuto) { this.activeProbe = 'red'; this.activeProbeAuto = false; }
    }
    this.placeProbe(which, resolved.pt, resolved.side);
  }

  private onPointerUp(e: PointerEvent) {
    if (this.touchIron === e.pointerId) { this.touchIron = null; this.endIronHold(); return; }
    if (this.dragMode === 'iron') { this.dragMode = 'none'; this.endIronHold(); return; }
    if (e.pointerType === 'touch' && this.gestures.has(e.pointerId)) {
      this.gestures.up(e.pointerId, e.clientX, e.clientY);
      return;
    }
    if (this.winDrag) {
      this.winDrag = null;
      document.body.classList.remove('dragging-win', 'resizing-panel');
      return;
    }

    const wasDrag = this.dragMoved;
    const mode = this.dragMode;
    this.dragMode = 'none';
    this.dragMoved = false;
    this.canvas.classList.remove('panning');

    if (e.target !== this.canvas) return;
    const { sx, sy, w, h } = this.canvasPt(e);
    const resolved = this.resolveBoardPt(this.camera.screenToBoard(sx, sy, w, h, this.board.thickness));
    if (!resolved) return;
    const { pt, side } = resolved;

    // Quick right-click in DMM places black probe
    if (e.button === 2 && mode === 'orbit' && !wasDrag) {
      if (this.activeTool === 'dmm') {
        this.placeProbe('black', pt, side);
      }
      return;
    }

    if (e.button === 0 && !wasDrag && !this.spaceHeld && (mode === 'none' || mode === 'pan')) {
      if (this.activeTool === 'dmm' && e.shiftKey) {
        this.placeProbe('black', pt, side);
      } else {
        this.applyToolAt(pt, side);
      }
    }
  }

  private onWheel(e: WheelEvent) {
    e.preventDefault();
    const { sx, sy, w, h } = this.canvasPt(e);
    const factor = Math.pow(1.0015, e.deltaY);
    this.camera.zoomAt(factor, sx, sy, w, h, this.board.thickness);
  }

  private onKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape' && this.showBoards && (this.bpMenu || this.bpFilters || this.bpSel)) {
      // the picker's menu, filters or details close first, then the picker
      if (this.bpMenu) this.bpMenu = false; else if (this.bpFilters) this.bpFilters = false; else this.bpSel = null;
      this.renderBoardsModal();
      return;
    }
    if (e.key === 'Escape' && (this.showBoards || this.showHelp || this.showFeedback || this.showMods || this.showLesson)) {
      this.showLesson = null;
      this.showBoards = false;
      this.bpSel = null;
      this.showHelp = false;
      this.showFeedback = false;
      this.showMods = false;
      this.renderModal();
      return;
    }
    const target = e.target as HTMLElement | null;
    const tag = target?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target?.isContentEditable) return;
    // Tab always moves focus (it used to switch 2D/3D, which locked keyboard users out of the bench)
    if (e.key === 'Tab') return;
    // a keyboard-focused control or an open dialog keeps its keys: Space / Enter press the control,
    // letters are not board shortcuts there (a mouse click does not set :focus-visible, so a clicked
    // button still lets Space pan and the letters work)
    const inDialog = !!target?.closest?.('[role="dialog"], .modal-backdrop');
    const kbFocus = !!target?.matches?.('button, a[href], summary, [role="button"], [role="tab"], [role="menuitem"]') && target.matches(':focus-visible');
    if ((inDialog || kbFocus) && e.key !== 'Escape') return;
    // single-character shortcuts can be turned off (Settings), for speech input and screen readers (WCAG 2.1.4)
    const charKey = e.key.length === 1 && e.code !== 'Space' && !e.metaKey && !e.ctrlKey && !e.altKey;
    if (charKey && !this.keyShortcuts) return;

    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
      e.preventDefault();
      if (e.shiftKey) this.redo();
      else this.undo();
      return;
    }
    if (e.code === 'Space') {
      if (!e.repeat) {
        this.spaceHeld = true;
        e.preventDefault();
      }
      return;
    }
    if (e.key === 'Escape' && this.activeTool === 'dmm' && (this.probeRed || this.probeBlack)) {
      this.clearProbes();
      return;
    }
    const k = e.key.toLowerCase();
    if (k === 'f') {
      this.flipSide();
      return;
    }
    if (k === 'c') { this.fitBoardInView(); return; }
    if (k === 'p') { this.togglePower(); return; }
    if (k === 'v') {
      const nextMode = this.camera.mode === '2d' ? '3d' : '2d';
      this.camera.setMode(nextMode);
      this.renderUI();
      return;
    }
    const tool = TOOLS.find((x) => x.key === e.key);
    if (tool) this.setTool(tool.id);
  }

  private resolveBoardPt(raw: V2 | null): { pt: V2; side: Side } | null {
    if (!raw) return null;
    if (this.camera.bothSides) {
      if (raw[0] > this.board.w + BOTH_GAP * 0.5) {
        return {
          pt: [this.board.w * 2 + BOTH_GAP - raw[0], raw[1]],
          side: 'B',
        };
      }
      return { pt: raw, side: 'F' };
    }
    return { pt: raw, side: this.camera.side };
  }

  private placeProbe(which: 'red' | 'black', pt: V2, side: Side) {
    this.noteOnce('tool');
    this.attempts?.tool('dmm');
    this.attempts?.probe();
    const hit = netAt(this.board, this.conn, pt, side, this.vizMode === 'xray');
    const pin: ProbePin = hit
      ? { pos: hit.snap, side, net: hit.net, label: hit.label }
      : { pos: pt, side, net: -1, label: t('Open / No copper') };
    if (which === 'red') this.probeRed = pin;
    else this.probeBlack = pin;
    if (this.powerOn && (this.psuInject || (this.solver !== 'fast' && this.dmmMode === 'V'))) { this.sim = this.solve(); this.updateThermalPower(); }
    sfxClick();
    this.checkContinuityBeep();
    this.renderDmm();
    this.renderTutorial();
  }

  private checkContinuityBeep() {
    if (this.dmmMode !== 'OHM' || !this.probeRed || !this.probeBlack) return;
    if (this.probeRed.net < 0 || this.probeBlack.net < 0) return;
    const real = this.solver !== 'fast';
    const r = real ? this.meter('OHM', this.probeRed.net, this.probeBlack.net).value ?? Infinity : this.ohms(this.probeRed.net, this.probeBlack.net);
    const key = `${this.probeRed.net}-${this.probeBlack.net}-${r.toFixed(1)}`;
    if (r < (real ? 30 : 5) && key !== this.lastBeepKey) {
      this.lastBeepKey = key;
      sfxBeep();
    }
  }

  private applyToolAt(pt: V2, side: Side) {
    if (this.activeTool !== 'inspect') this.noteOnce('tool');
    if (this.activeTool !== 'inspect') this.attempts?.tool(this.activeTool);
    const xray = this.vizMode === 'xray';
    const hit = pickAt(this.board, pt, side, xray);

    if (this.activeTool === 'dmm') {
      this.placeProbe('red', pt, side);
      return;
    }
    if (this.activeTool === 'rosin') {
      if (!this.thermal) this.updateThermalPower();
      this.thermal!.applyRosin(pt[0], pt[1], 6);
      for (const c of this.board.components) if (Math.hypot(c.at[0] - pt[0], c.at[1] - pt[1]) <= 6 + Math.max(c.body.w, c.body.h) / 2) this.rosinParts.add(c);
      sfxClick();
      if (this.reworkMode.realistic) {
        // rosin is also the flux: the joints it covers wet when they are next melted
        this.rework?.applyFlux(pt[0], pt[1], 6);
        this.toast(t('Rosin flux on the joints here: they wet when you next melt them. On a powered board the film also melts clear first where a part runs hot.'), 'info');
      } else this.toast(t('Rosin film applied — on a powered board it melts clear first where a part runs hot.'), 'info');
      return;
    }
    if (this.activeTool === 'scope') {
      const hit = netAt(this.board, this.conn, pt, side, this.vizMode === 'xray');
      this.scopeProbe = { pos: [pt[0], pt[1]], side, net: hit?.net ?? -1, label: hit?.label ?? t('No contact') };
      this.scopeRoll = [];
      sfxClick();
      this.renderScope();
      return;
    }
    if (this.activeTool === 'press') {
      this.flex.press(pt[0], pt[1], { duration: 2.5 });
      sfxClick();
      this.toast(t('Pressing on the board…'), 'info');
      return;
    }
    if (this.activeTool === 'freeze' || this.activeTool === 'ipa') {
      if (!this.thermal) this.updateThermalPower();
      if (this.activeTool === 'freeze') {
        this.thermal!.freezeSpray(pt[0], pt[1], 5);
        sfxClick();
        this.toast(t('Freeze spray applied — watch which part defrosts first.'), 'info');
        return;
      }
      this.thermal!.applyIpa(pt[0], pt[1], 6);
      sfxClick();
      // scrubbing with IPA also dissolves liquid-damage residue (and the leak it forms)
      if (residueNear(this.board, pt[0], pt[1], 3) || fluxResidueNear(this.board, pt[0], pt[1], 3)) this.pushUndo();
      const fluxOff = cleanFluxWithIpa(this.board, pt[0], pt[1], 3);
      const { cleaned, cleared } = cleanWithIpa(this.board, pt[0], pt[1], 3);
      if (fluxOff.length && !cleaned.length) {
        this.renderUI();
        this.toast(t('Flux residue washed off {pads}.', { pads: fluxOff.join(', ') }), 'success');
      } else if (cleaned.length) {
        this.recompute(true);
        this.renderUI();
        this.toast(cleared.length ? t('Residue scrubbed off {refs} — the board is clean there.', { refs: cleared.join(', ') }) : t('Scrubbing residue on {refs}… it is thinning, keep cleaning.', { refs: cleaned.join(', ') }), cleared.length ? 'success' : 'info');
      } else this.toast(t('Isopropyl applied — the hottest part dries first.'), 'info');
      return;
    }

    if (this.activeTool === 'inspect') {
      if (!hit) {
        this.selectedNet = -1;
        this.selectedCompId = null;
        this.renderUI();
        return;
      }
      if (hit.kind === 'comp' || hit.kind === 'pad') {
        const c = hit.comp;
        this.selectedCompId = c.id;
        // Toggle tactile switch directly on body click
        if (hit.kind === 'comp' && c.kind === 'switch') {
          c.state.closed = !c.state.closed;
          sfxClick();
          this.recompute(false);
          this.renderUI();
          return;
        }
        if (hit.kind === 'pad') {
          const idx = this.conn.padItem.get(c)?.[hit.padIndex];
          this.selectedNet = idx !== undefined ? this.conn.net[idx] : -1;
        }
        this.activeTab = 'inspect';
        if (this.mobile) this.panelOpen = true; // no hover on touch: the inspector says what was tapped
        this.renderUI();
        return;
      }
      const n = netAt(this.board, this.conn, pt, side, xray);
      this.selectedNet = n ? n.net : -1;
      this.selectedCompId = null;
      this.renderUI();
      return;
    }

    if (this.activeTool === 'iron' && this.reworkMode.realistic && hit?.kind === 'pad' && hit.comp.state.populated) {
      // physical process: 1.5 s of tip contact; the monitor decides what the joint does
      if (!this.thermal) this.updateThermalPower();
      this.pushUndo();
      const g = this.reworkMode.flux ? IRON_G.flux : IRON_G.dry;
      if (this.reworkMode.flux) this.rework!.applyFlux(hit.pos[0], hit.pos[1], 2);
      this.thermal!.addSource({ kind: 'iron', x: hit.pos[0], y: hit.pos[1], temp: this.reworkMode.ironTemp, g, pmax: 60, until: this.thermal!.time + 1.5, partId: hit.comp.id });
      this.renderer.spawnSmoke(hit.pos[0], hit.pos[1], side, this.board.thickness, 'flux');
      return;
    }
    if (this.activeTool === 'hotair') {
      if (!this.thermal) this.updateThermalPower();
      this.thermal!.addSource({ kind: 'hotair', x: pt[0], y: pt[1], r: 4, temp: 400, h: HOTAIR_H.normal, until: this.thermal!.time + 3 });
      sfxClick();
      return;
    }
    if (this.activeTool === 'iron') {
      if (hit?.kind === 'pad') {
        const c = hit.comp;
        if (!c.state.populated) {
          this.selectedCompId = c.id;
          this.activeTab = 'inspect';
          if (this.mobile) this.panelOpen = true;
          this.toast(t('{ref} footprint is empty — pick a replacement in Inspector!', { ref: c.ref }), 'info');
          this.renderUI();
          return;
        }
        // a cold joint, or a cracked one (intermittent) even while it happens to conduct
        if (c.state.cold.includes(hit.padIndex) || c.state.intermittent?.some((f) => f.pad === hit.padIndex && f.kind !== 'thermal-leak')) {
          this.pushUndo();
          toggleCold(c, hit.padIndex);
          this.renderer.spawnSmoke(hit.pos[0], hit.pos[1], side, this.board.thickness, 'flux');
          sfxSolder();
          this.recompute(false);
          this.toast(t('Reflowed cold solder joint on {ref} pad {pad}', { ref: c.ref, pad: c.pads[hit.padIndex].name }), 'success');
          this.renderUI();
          return;
        }
      }
      if (hit?.kind === 'comp') {
        const c = hit.comp;
        if (!c.state.populated || c.state.burnt) {
          this.pushUndo();
          installPart(c, {
            value: c.value > 0 ? c.value : c.kind === 'resistor' ? 1000 : c.kind === 'fuse' ? 0.5 : c.value,
          });
          this.renderer.spawnSmoke(c.at[0], c.at[1], side, this.board.thickness, 'flux');
          sfxSolder();
          this.recompute(false);
          this.toast(t('Soldered fresh {ref} ({marking})', { ref: c.ref, marking: marking(c) }), 'success');
          this.renderUI();
          return;
        }
        if (c.state.cold.length > 0) {
          this.pushUndo();
          c.state.cold = [];
          this.renderer.spawnSmoke(c.at[0], c.at[1], side, this.board.thickness, 'flux');
          sfxSolder();
          this.recompute(false);
          this.toast(t('Reflowed all cold joints on {ref}', { ref: c.ref }), 'success');
          this.renderUI();
          return;
        }
      }
      // Drop a solder blob at pt (bridges small trace cuts / adjacent pads!)
      this.pushUndo();
      addBlob(this.board, pt, side, 0.75);
      this.renderer.spawnSmoke(pt[0], pt[1], side, this.board.thickness, 'flux');
      sfxSolder();
      this.recompute(false);
      this.renderUI();
      return;
    }

    if (this.activeTool === 'wick') {
      if (hit?.kind === 'blob') {
        this.pushUndo();
        removeBlob(this.board, hit.blob);
        this.renderer.spawnSmoke(hit.pos[0], hit.pos[1], side, this.board.thickness, 'flux');
        sfxSolder();
        this.recompute(false);
        this.toast(t('Wicked away solder bridge'), 'success');
        this.renderUI();
        return;
      }
      if (hit?.kind === 'jumper') {
        this.pushUndo();
        removeJumper(this.board, hit.jumper);
        sfxCut();
        this.recompute(false);
        this.toast(t('Removed jumper wire'), 'info');
        this.renderUI();
        return;
      }
      if (hit?.kind === 'comp' || hit?.kind === 'pad') {
        const c = hit.comp;
        if (c.state.populated && this.reworkMode.realistic && !this.rework?.isMolten(c)) {
          this.toast(t('{ref}: joints are not molten — heat the part with hot air first (preheat helps on plane-heavy boards).', { ref: c.ref }), 'info');
          return;
        }
        if (c.state.populated) {
          this.pushUndo();
          removePart(c);
          sfxSolder();
          this.recompute(false);
          this.toast(t('Desoldered {ref}', { ref: c.ref }), 'info');
          this.renderUI();
        }
      }
      return;
    }

    if (this.activeTool === 'flip180') {
      const c = hit?.kind === 'comp' || hit?.kind === 'pad' ? hit.comp : null;
      if (c && c.state.populated) {
        this.pushUndo();
        c.state.reversed = !c.state.reversed;
        sfxClick();
        this.recompute(false);
        this.toast(t('Flipped {ref} 180°', { ref: c.ref }), 'info');
        this.renderUI();
      }
      return;
    }

    if (this.activeTool === 'jumper') {
      const n = netAt(this.board, this.conn, pt, side, xray);
      const snap = n ? n.snap : pt;
      if (!this.jumperStart) {
        this.jumperStart = { a: snap, la: side };
        sfxClick();
        this.toast(t('Jumper start set: now pick the end point (you can flip the board with F first).'), 'info');
        return;
      }
      if (dist(this.jumperStart.a, snap) < 0.3 && this.jumperStart.la === side) {
        this.jumperStart = null;
        return;
      }
      this.pushUndo();
      addJumper(this.board, this.jumperStart.a, this.jumperStart.la, snap, side);
      this.jumperStart = null;
      sfxSolder();
      this.recompute(false);
      this.renderUI();
      return;
    }

    if (this.activeTool === 'knife') {
      if (hit?.kind === 'trace') {
        this.pushUndo();
        cutTrace(this.board, hit.trace, pt, 0.7);
        sfxCut();
        this.recompute(false);
        this.toast(t('Cut copper trace'), 'info');
        this.renderUI();
      } else if (hit?.kind === 'blob') {
        this.pushUndo();
        removeBlob(this.board, hit.blob);
        sfxCut();
        this.recompute(false);
        this.renderUI();
      } else if (hit?.kind === 'jumper') {
        this.pushUndo();
        removeJumper(this.board, hit.jumper);
        sfxCut();
        this.recompute(false);
        this.renderUI();
      }
      return;
    }

    if (this.activeTool === 'replace') {
      const c = hit?.kind === 'comp' || hit?.kind === 'pad' ? hit.comp : null;
      if (c) {
        this.selectedCompId = c.id;
        this.activeTab = 'inspect';
        this.panelOpen = true;
        this.layoutEl.classList.remove('panel-collapsed');
        this.renderUI();
      }
    }
  }

  /** Polite screen-reader announcement (a persistent live region, so re-rendered HTML cannot drop it). */
  private announce(text: string) {
    const el = this.mount.querySelector<HTMLElement>('#sr-live');
    if (!el) return;
    clearTimeout(this.announceTimer);
    el.textContent = '';
    // a short gap so the same text twice in a row is still read
    this.announceTimer = setTimeout(() => { el.textContent = text; }, 60);
  }

  private toast(msg: string, kind: 'info' | 'success' | 'warn' | 'danger' = 'info') {
    this.recentToasts = [...this.recentToasts, `${kind}: ${msg}`].slice(-8);
    const el = document.createElement('div');
    el.className = `toast ${kind}`;
    const text = this.txt(msg);
    const { lead, rest } = this.mobile ? splitLead(text) : { lead: text, rest: '' };
    if (!rest) el.textContent = text;
    else {
      // phone: the first sentence; "More" shows the rest and keeps the toast up longer
      const span = document.createElement('span');
      span.className = 'toast-txt';
      span.textContent = lead;
      const more = document.createElement('button');
      more.className = 'toast-more';
      more.textContent = t('More');
      more.addEventListener('click', () => { span.textContent = text; more.remove(); clearTimeout(timer); timer = setTimeout(() => el.remove(), 9000); });
      el.classList.add('has-more');
      el.append(span, more);
    }
    this.toastEl.appendChild(el);
    let timer = setTimeout(() => el.remove(), rest ? 6000 : 4500);
  }

  /**
   * Tools appear as they are needed: on a beginner lesson, while the lessons are not all solved, the
   * dock shows Select and the tools of this lesson and the ones before it (its new ones marked), plus
   * a "More tools" button. Every other board, and every player who finished the lessons or pressed
   * "More tools", gets the full dock. Keyboard shortcuts always work; a tool in use is always shown.
   */
  private updateToolDock() {
    const lessonsDone = TUTORIAL_SCENARIO_IDS.every((id) => this.solvedIds.has(id));
    const dock = this.allTools || lessonsDone ? null : lessonDock(this.activeScenario.id);
    this.mount.querySelectorAll<HTMLButtonElement>('.tool-btn[data-tool]').forEach((b) => {
      const id = b.dataset.tool!;
      b.hidden = !!dock && !dock.tools.has(id) && id !== this.activeTool;
      b.classList.toggle('fresh', !!dock?.fresh.has(id));
    });
    const more = this.mount.querySelector<HTMLButtonElement>('#btn-more-tools');
    if (more) more.hidden = !dock;
  }

  private updateTopButtons() {
    this.updateToolDock();
    this.mount.querySelectorAll<HTMLButtonElement>('#seg-view button').forEach((b) => {
      const on = b.dataset.view === this.camera.mode;
      b.classList.toggle('on', on);
      b.setAttribute('aria-pressed', String(on));
    });
    this.mount.querySelectorAll<HTMLButtonElement>('#seg-side button').forEach((b) => {
      const activeKey = this.camera.bothSides ? 'both' : this.camera.side;
      const on = b.dataset.side === activeKey;
      b.classList.toggle('on', on);
      b.setAttribute('aria-pressed', String(on));
    });

    const pBtn = this.mount.querySelector('#btn-power')!;
    pBtn.classList.toggle('on', this.powerOn);
    pBtn.querySelector('.lbl')!.textContent = this.powerOn ? t('Power on') : t('Power off');

    const oBtn = this.mount.querySelector<HTMLElement>('#btn-invert-orbit')!;
    oBtn.innerHTML = `${icon('rotate', 13)}<span>${this.camera.invertOrbit ? t('Inverted') : t('Grab and turn')}</span>`;
    oBtn.title = this.camera.invertOrbit
      ? t('3D orbit: inverted (drag moves the camera). Click for grab-and-turn.')
      : t('3D orbit: grab-and-turn (board follows the drag). Click to invert.');

    const sBtn = this.mount.querySelector('#btn-sound')!;
    sBtn.innerHTML = `${icon(soundEnabled ? 'volume' : 'mute', 13)}<span>${soundEnabled ? t('On') : t('Off')}</span>`;
    sBtn.setAttribute('aria-pressed', String(soundEnabled));
    sBtn.setAttribute('aria-label', t('Sound'));
    const kBtn = this.mount.querySelector<HTMLElement>('#btn-keys');
    if (kBtn) {
      kBtn.innerHTML = `${icon(this.keyShortcuts ? 'check' : 'x', 13)}<span>${this.keyShortcuts ? t('On') : t('Off')}</span>`;
      kBtn.setAttribute('aria-pressed', String(this.keyShortcuts));
      kBtn.setAttribute('aria-label', t('Key shortcuts'));
      kBtn.title = this.keyShortcuts
        ? t('Single keys (1–9, F, C, P, V…) pick tools and change the view. Click to turn them off, for example with speech input.')
        : t('Single-key shortcuts are off; use the buttons, or Ctrl/⌘ + Z for undo. Click to turn them on.');
    }
    const statsOn = statsSwitchOn();
    const stBtn = this.mount.querySelector<HTMLElement>('#btn-stats');
    if (stBtn) {
      stBtn.setAttribute('aria-pressed', String(statsOn));
      stBtn.setAttribute('aria-label', t('Puzzle stats'));
      stBtn.innerHTML = `${icon(statsOn ? 'check' : 'x', 13)}<span>${statsOn ? t('On') : t('Off')}</span>`;
      stBtn.title = statsOn
        ? t('Sends anonymous puzzle results (no IDs, no cookies) to make the puzzles better. Click to turn off.')
        : t('Puzzle stats are off: nothing about your repairs is sent. Click to turn on.');
    }

    const tBtn = this.mount.querySelector('#btn-tutorial')!;
    const tutBoard = isTutorialScenario(this.activeScenario.id);
    (tBtn as HTMLElement).hidden = !tutBoard; // shown only on tutorial boards
    tBtn.classList.toggle('active', this.tutorialOpen && tutBoard);
    tBtn.setAttribute('aria-pressed', String(this.tutorialOpen && tutBoard));
    this.canvas?.setAttribute('aria-label', t('Board view: {board}, {side}, {mode}', {
      board: t(this.activeScenario.meta.title),
      side: this.camera.bothSides ? t('both sides') : this.camera.side === 'F' ? t('top side') : t('bottom side'),
      mode: this.camera.mode.toUpperCase(),
    }));

    if (this.mobile) {
      const set = (sel: string, html: string) => { const el = this.mount.querySelector<HTMLElement>(sel); if (el) el.innerHTML = html; };
      set('#m-mode', `<b>${this.camera.mode.toUpperCase()}</b>`);
      set('#m-flip', `${icon('layers', 16)}<b>${this.camera.bothSides ? t('BOTH') : this.camera.side === 'F' ? t('TOP') : t('BOT')}</b>`);
      set('#m-invert-lbl', this.camera.invertOrbit ? t('3D drag moves the camera (tap: board follows)') : t('3D drag turns the board (tap: camera moves)'));
      set('#m-sound-ico', icon(soundEnabled ? 'volume' : 'mute', 16));
      set('#m-sound-lbl', soundEnabled ? t('Sound on') : t('Sound off'));
      set('#m-stats-ico', icon(statsOn ? 'check' : 'x', 16));
      set('#m-stats-lbl', statsOn ? t('Puzzle stats on') : t('Puzzle stats off'));
      const tutRow = this.mount.querySelector<HTMLElement>('[data-proxy="#btn-tutorial"]');
      if (tutRow) tutRow.hidden = !tutBoard;
    }
    (this.mount.querySelector('#viz-select') as HTMLSelectElement).value = this.vizMode;
    (this.mount.querySelector('#ocp-select') as HTMLSelectElement).value = String(this.ocpAmps);
    this.refreshSolverSelect();
    this.applyMeter();
  }

  private renderTopHud() {
    const coord = this.cursorWorld ? `${this.cursorWorld[0].toFixed(2)}, ${this.cursorWorld[1].toFixed(2)}` : '—';

    let psuItem = '';
    if (this.powerOn && this.sim?.source) {
      let totalI = 0;
      for (const c of this.board.components) {
        if (c.kind === 'battery') totalI += Math.max(0, this.sim.comps.get(c.id)?.i ?? 0);
      }
      const iStr = totalI >= 1 ? `${totalI.toFixed(2)} A` : `${(totalI * 1000).toFixed(1)} mA`;
      const cc = !!this.sim.ccLimited;
      psuItem = `<span class="sb-item ${cc ? 'warn' : ''}">${t('Supply')} <span class="v">${iStr}${cc ? ' · CC' : ''}</span></span>`;
    }

    let hoverTxt = '';
    if (this.hovered) {
      if (this.hovered.kind === 'pad') {
        const c = this.hovered.comp;
        const p = c.pads[this.hovered.padIndex];
        const cold = c.state.cold.includes(this.hovered.padIndex) ? ` · ${t('cold joint')}` : '';
        // IR spot reading off bare metal: low emissivity, reads near room temperature
        const tc = this.vizMode === 'thermal' ? this.thermal?.partTemp(c.id) : undefined;
        const ir = tc !== undefined ? ` · IR ${apparentTemp(tc, EMISSIVITY.metal).toFixed(0)} °C (${t('bare metal')}, ε ${EMISSIVITY.metal})` : '';
        hoverTxt = `${c.ref}.${p.name}${cold}${ir}`;
      } else if (this.hovered.kind === 'comp') {
        const c = this.hovered.comp;
        const cSim = this.powerOn && this.sim ? this.sim.comps.get(c.id) : undefined;
        const temp = this.thermal?.partTemp(c.id) ?? 25 + (cSim ? cSim.p * (c.kind === 'resistor' ? 185 : c.kind === 'fuse' ? 240 : 130) : 0);
        const eps = c.kind === 'connector' ? EMISSIVITY.shell : EMISSIVITY.package;
        const tempStr = this.vizMode === 'thermal' ? ` · IR ${apparentTemp(temp, eps).toFixed(0)} °C` : '';
        hoverTxt = `${c.ref} · ${marking(c)}${tempStr}`;
      } else if (this.hovered.kind === 'trace') {
        hoverTxt = `${t('Trace')} · ${this.hovered.trace.net ?? t('unnamed net')}`;
      } else if (this.hovered.kind === 'blob') {
        hoverTxt = t('Solder blob');
      } else if (this.hovered.kind === 'via') {
        hoverTxt = `${t('Via')} · ${this.hovered.via.net ?? t('unnamed net')}`;
      } else if (this.hovered.kind === 'jumper') {
        hoverTxt = t('Jumper wire');
      }
    }
    const sideLabel = this.camera.bothSides
      ? `${t('Both')} (${this.cursorSide === 'F' ? t('Top') : t('Bottom')})`
      : this.camera.side === 'F' ? t('Top') : t('Bottom');
    let pinCount = 0;
    for (const c of this.board.components) pinCount += c.pads.length;
    this.hudTopEl.innerHTML = `
      <span class="sb-item"><span class="sb-dot ${this.powerOn ? 'ok' : ''}"></span>${this.powerOn ? t('Powered') : t('Unpowered')}</span>
      ${psuItem}
      <span class="sb-item"><span class="v">${t('{parts} Comp · {pins} Pins · {nets} Nets', { parts: this.board.components.length, pins: pinCount, nets: this.conn.netCount })}</span></span>
      <span class="sb-item">${t('Side')} <span class="v">${sideLabel}</span></span>
      <span class="sb-item">${t('Cursor')} <span class="v">${coord} mm</span></span>
      ${hoverTxt ? `<span class="sb-item"><span class="v">${this.esc(hoverTxt)}</span></span>` : ''}
      ${this.authorMode ? `<span class="sb-item warn"><span class="sb-dot warn"></span>${t('Author mode')}</span>` : ''}
    `;
  }

  private renderDmm() {
    const visible = this.activeTool === 'dmm' || this.probeRed !== null || this.probeBlack !== null;
    this.diodeLitIds = [];
    if (!visible) {
      this.dmmBoxEl.innerHTML = '';
      return;
    }
    let reading = '— . —';
    let sub = t('Place Red (+) and Black (−) probes');

    if (this.dmmMode === 'V') {
      if (!this.powerOn) {
        reading = '0.000 V';
        sub = t('Supply off — enable power to measure DC voltage');
      } else if (this.probeRed && this.probeRed.net >= 0 && this.sim?.source) {
        const niA = this.sim.nodeOfNet.get(this.probeRed.net);
        const va = niA !== undefined ? this.sim.V[niA] : null;
        let vb: number | null = 0;
        if (this.probeBlack) {
          if (this.probeBlack.net < 0) vb = null;
          else {
            const niB = this.sim.nodeOfNet.get(this.probeBlack.net);
            vb = niB !== undefined ? this.sim.V[niB] : null;
          }
        }
        if (va !== null && vb !== null) {
          const dv = va - vb;
          if (this.solver !== 'fast') {
            const pr = this.probeRed.pos, pb = this.probeBlack?.pos;
            const d = displayVolts(dv, undefined, placementRng('V', pr[0].toFixed(1), pr[1].toFixed(1), pb?.[0].toFixed(1) ?? '', pb?.[1].toFixed(1) ?? ''));
            reading = `${(d.value ?? 0) >= 0 && d.text !== 'OL' ? '+' : ''}${d.text}`;
          } else reading = `${dv >= 0 ? '+' : ''}${dv.toFixed(3)} V`;
          sub = this.probeBlack ? t('Differential (Red − Black)') : t('Referenced to supply GND');
        } else {
          reading = 'FLOAT';
          sub = t('Floating node (open circuit)');
        }
      }
    } else if (this.dmmMode === 'CAP') {
      if (this.powerOn) {
        reading = 'ERR';
        sub = t('Disable power before measuring capacitance');
      } else if (this.probeRed && this.probeBlack) {
        const rd = this.meter('CAP', this.probeRed.net, this.probeBlack.net);
        reading = rd.text;
        sub = rd.sub ?? (rd.value !== null ? t('Capacitance across the probes') + (this.capValuesGuessed() ? ` ${t('(board data has no cap values: placeholder values)')}` : '') : '');
      } else {
        reading = '0.000 nF';
        sub = t('Place both probes across the part (power off)');
      }
    } else if (this.dmmMode === 'AMP') {
      if (!this.powerOn) {
        reading = '0.0 mA';
        sub = t('Supply off — the meter reads current only while powered');
      } else if (this.probeRed && this.probeBlack && this.probeRed.net >= 0 && this.probeBlack.net >= 0) {
        const rd = this.ammeterReading(this.probeRed.net, this.probeBlack.net);
        reading = rd.text;
        sub = rd.sub ?? (this.probeRed.net === this.probeBlack.net ? t('Probes on one net: the copper carries the current, not the meter') : t('Meter in series (10 A input): lift a fuse / link and probe its pads to read the branch current'));
      } else {
        reading = '0.0 mA';
        sub = t('Put the meter in series: probes on both pads of a removed fuse / 0 Ω link');
      }
    } else if (this.dmmMode === 'OHM') {
      if (this.powerOn) {
        reading = 'ERR';
        sub = t('Disable power before measuring resistance');
      } else if (this.probeRed && this.probeBlack) {
        if (this.probeRed.net < 0 || this.probeBlack.net < 0) {
          reading = 'OL';
          sub = t('Open circuit (probe not on copper)');
        } else {
          const rd = this.solver !== 'fast' ? this.meter('OHM', this.probeRed.net, this.probeBlack.net) : null;
          const r = rd ? rd.value ?? Infinity : this.ohms(this.probeRed.net, this.probeBlack.net);
          if (rd) {
            reading = rd.text;
            sub = rd.value === null ? (rd.sub ?? t('Open circuit (OL)')) : rd.beep ? t('Continuity beep (< 30 Ω) · {range} range', { range: rd.range ?? '' }) : t('In-circuit resistance · {range} range', { range: rd.range ?? '' });
          } else if (!Number.isFinite(r)) {
            reading = 'OL';
            sub = t('Open circuit (no continuity)');
          } else {
            reading = r < 0.05 ? '0.0 Ω' : fmtOhm(r);
            sub = r < 5 ? t('Continuity (< 5 Ω)') : t('In-circuit resistance');
          }
        }
      }
    } else {
      // DIODE TEST MODE
      if (this.powerOn) {
        reading = 'ERR';
        sub = t('Disable power before diode test');
      } else if (this.probeRed && this.probeBlack) {
        if (this.probeRed.net < 0 || this.probeBlack.net < 0) {
          reading = 'OL';
          sub = t('Open or reverse-biased (OL)');
        } else {
          const res = this.diodeTest(this.probeRed.net, this.probeBlack.net);
          this.diodeLitIds = res.litIds;
          const dd = this.solver !== 'fast' ? this.meter('DIODE', this.probeRed.net, this.probeBlack.net) : null;
          if (dd) {
            reading = dd.text;
            sub = dd.value === null ? t('Open or reverse-biased (OL)') : dd.value < 0.05 ? t('Shorted junction') : dd.value < 0.3 ? t('Low drop: Schottky / partial short') : t('Forward junction drop (ESD / body diode / PN)');
          } else if (!Number.isFinite(res.volts)) {
            reading = 'OL';
            sub = t('Open or reverse-biased (OL)');
          } else if (res.volts < 0.05) {
            reading = `${res.volts.toFixed(3)} V`;
            sub = t('Shorted junction');
          } else {
            reading = `${res.volts.toFixed(3)} V`;
            sub = res.litIds.length > 0 ? t('Forward drop (LED illuminated)') : t('Forward junction drop');
          }
        }
      }
    }

    // screen readers hear each new reading once (with what the probes touch), not every re-render
    if (this.probeRed || this.probeBlack) {
      const said = `${reading}. ${this.probeRed?.label ?? ''}${this.probeBlack ? ` / ${this.probeBlack.label}` : ''}`;
      if (said !== this.lastSaidReading) { this.lastSaidReading = said; this.announce(said); }
    } else this.lastSaidReading = '';

    if (this.runningCode.size) {
      const name0 = (p: { net: number } | null) => (p && p.net >= 0 ? this.conn?.netNames[p.net] || `#${p.net}` : null);
      const pk = `${name0(this.probeRed)}|${name0(this.probeBlack)}`;
      if (pk !== this.lastProbeKey) { this.lastProbeKey = pk; this.codeHost.emit('probe:placed', { red: name0(this.probeRed), black: name0(this.probeBlack) }); }
    }
    if (this.runningCode.size && (this.probeRed || this.probeBlack)) {
      const name = (p: { net: number } | null) => (p && p.net >= 0 ? this.conn?.netNames[p.net] || `#${p.net}` : null);
      const key = `${this.dmmMode}|${name(this.probeRed)}|${name(this.probeBlack)}|${reading}`;
      if (key !== this.lastMeasureKey) {
        this.lastMeasureKey = key;
        this.codeHost.emit('measure:taken', { mode: this.dmmMode, red: name(this.probeRed), black: name(this.probeBlack), text: reading });
      }
    }
    this.dmmBoxEl.innerHTML = `
      <div class="dmm-card${this.mobile && this.dmmSubFull ? ' full' : ''}" style="transform: translate3d(${this.dmmPos[0]}px, ${this.dmmPos[1]}px, 0)">
        <div class="dmm-head" title="${t('Drag to move window')}">
          <span>${t('Multimeter')}</span>
          <div class="row">
            <div class="seg">
              <button class="${this.dmmMode === 'V' ? 'on' : ''}" id="dmm-v" title="${t('DC voltage')}" aria-label="${t('DC voltage')}" aria-pressed="${this.dmmMode === 'V'}">V⎓</button>
              <button class="${this.dmmMode === 'OHM' ? 'on' : ''}" id="dmm-ohm" title="${t('Resistance / continuity')}" aria-label="${t('Resistance / continuity')}" aria-pressed="${this.dmmMode === 'OHM'}">Ω</button>
              <button class="${this.dmmMode === 'DIODE' ? 'on' : ''}" id="dmm-diode" title="${t('Diode test')}" aria-label="${t('Diode test')}" aria-pressed="${this.dmmMode === 'DIODE'}">${t('Diode')}</button>
              <button class="${this.dmmMode === 'CAP' ? 'on' : ''}" id="dmm-cap" title="${t('Capacitance (power off)')}" aria-label="${t('Capacitance (power off)')}" aria-pressed="${this.dmmMode === 'CAP'}">F</button>
              <button class="${this.dmmMode === 'AMP' ? 'on' : ''}" id="dmm-amp" title="${t('Current, 10 A input (meter in series)')}" aria-label="${t('Current, 10 A input (meter in series)')}" aria-pressed="${this.dmmMode === 'AMP'}">A</button>
            </div>
            <button class="btn ghost icon" id="dmm-clr" title="${t('Clear probes (Esc)')}">${icon('x', 14)}</button>
          </div>
        </div>
        <div class="dmm-lcd">
          <div class="dmm-val">${this.esc((this.dmmShown = reading))}</div>
          <div class="dmm-sub">${this.esc(sub)}</div>
        </div>
        ${this.mobile ? `
        <div class="dmm-probes m-probes">
          <button class="probe-tag red ${this.activeProbe === 'red' ? 'armed' : ''}" id="probe-red">${this.esc(this.probeRed?.label ?? (this.activeProbe === 'red' ? t('Tap the board') : t('Red probe')))}</button>
          <button class="probe-tag blk ${this.activeProbe === 'black' ? 'armed' : ''}" id="probe-blk">${this.esc(this.probeBlack?.label ?? (this.activeProbe === 'black' ? t('Tap the board') : this.dmmMode === 'V' ? t('Supply GND') : t('Black probe')))}</button>
        </div>` : `
        <div class="dmm-probes">
          <div class="probe-tag red" title="${this.esc(this.probeRed?.label ?? '')}">${this.esc(this.probeRed?.label ?? t('Click to place'))}</div>
          <div class="probe-tag blk" title="${this.esc(this.probeBlack?.label ?? '')}">${this.esc(this.probeBlack?.label ?? (this.dmmMode === 'V' ? t('Supply GND') : t('Right-click')))}</div>
        </div>`}
      </div>
    `;

    this.dmmBoxEl.querySelector('#dmm-v')!.addEventListener('click', () => {
      this.dmmMode = 'V';
      this.renderDmm();
      this.renderTutorial();
    });
    this.dmmBoxEl.querySelector('#dmm-ohm')!.addEventListener('click', () => {
      this.dmmMode = 'OHM';
      this.checkContinuityBeep();
      this.renderDmm();
      this.renderTutorial();
    });
    this.dmmBoxEl.querySelector('#dmm-diode')!.addEventListener('click', () => {
      this.dmmMode = 'DIODE';
      this.renderDmm();
      this.renderTutorial();
    });
    for (const [id, mode] of [['#dmm-cap', 'CAP'], ['#dmm-amp', 'AMP']] as const) {
      this.dmmBoxEl.querySelector(id)!.addEventListener('click', () => { this.dmmMode = mode; this.renderDmm(); this.renderTutorial(); });
    }
    if (this.mobile) this.dmmBoxEl.querySelector('.dmm-lcd')?.addEventListener('click', () => { this.dmmSubFull = !this.dmmSubFull; this.renderDmm(); });
    for (const [id, which] of [['#probe-red', 'red'], ['#probe-blk', 'black']] as const) {
      this.dmmBoxEl.querySelector(id)?.addEventListener('click', () => {
        this.activeProbe = which;
        this.activeProbeAuto = false;
        this.renderDmm();
      });
    }
    this.dmmBoxEl.querySelector('#dmm-clr')!.addEventListener('click', () => this.clearProbes());
  }

  private clearProbes() {
    this.probeRed = null;
    this.probeBlack = null;
    this.activeProbe = 'red';
    this.activeProbeAuto = false;
    this.renderDmm();
    this.renderTutorial();
  }

  private renderUI() {
    if (this.mobile) this.layoutEl.classList.toggle('panel-collapsed', !this.panelOpen);
    this.updateTopButtons();
    this.renderTopHud();
    this.renderDmm();
    this.renderTutorial();
    const hasPanels = this.codeHost.panels().length > 0;
    if (!hasPanels && this.activeTab === 'mods') this.activeTab = 'mission';
    const author = this.authorShown();
    if (!author && this.activeTab === 'studio') this.activeTab = 'mission';
    this.mount.querySelectorAll<HTMLButtonElement>('.tab[data-tab]').forEach((b) => {
      b.classList.toggle('active', b.dataset.tab === this.activeTab);
      b.setAttribute('aria-selected', String(b.dataset.tab === this.activeTab));
      b.tabIndex = b.dataset.tab === this.activeTab ? 0 : -1;
      if (b.dataset.tab === this.activeTab) this.sideBodyEl?.setAttribute('aria-labelledby', b.id);
      if (b.dataset.tab === 'mods') b.hidden = !hasPanels;
      if (b.dataset.tab === 'studio') b.hidden = !author;
    });
    this.renderSideBody();
  }

  /**
   * Tutorial card on a phone: the step title and a short task (`TutorialStep.phone`) first; the
   * explanation waits behind "Why?" so the card leaves the board visible.
   */
  private phoneTutorialHtml(step: TutorialStep, idx: number, total: number, tutIdx: number, done: boolean, pct: number, isLast: boolean, nextPrimary: boolean, nextId: string | null): string {
    const why = this.tutWhy === `${this.activeScenario.id}:${idx}`;
    const task = step.phone ? t(step.phone) : this.txt(t(step.task));
    return `
      <div class="tut-card m-tut${this.tutCollapsed ? ' collapsed' : ''}">
        <div class="tut-head" title="${t('Tap to fold / unfold')}">
          <span class="tut-step">${icon(this.tutCollapsed ? 'chevronDown' : 'book', 13)}<span>${tutIdx >= 0 ? `${t('Lesson {n}', { n: tutIdx + 1 })} · ` : ''}${idx + 1}/${total}${this.tutCollapsed ? ` · ${this.esc(t(step.title))}` : ''}</span></span>
          <button class="btn ghost icon sm" id="tut-close" title="${t('Close tutorial')}">${icon('x', 13)}</button>
        </div>
        <div class="tut-prog"><i style="width:${pct}%"></i></div>
        <div class="tut-body">
          <div class="tut-title"><span>${this.esc(t(step.title))}</span><span class="row">${done ? `<span class="badge pass">${icon('check', 11)}<span>${t('Done')}</span></span>` : ''}<button class="btn sm ghost ${why ? 'active' : ''}" id="tut-why">${icon('help', 12)}<span>${why ? t('Hide') : t('Why?')}</span></button></span></div>
          ${why ? `<div class="tut-concept">${this.esc(this.txt(t(step.concept)))}</div>` : ''}
          <div class="tut-goal ${done ? 'done' : ''}"><div class="tut-goal-txt">${this.esc(task)}</div></div>
          ${step.target || this.quickShown(step) ? `<div class="row wrap">
            ${step.target ? `<button class="btn sm" id="tut-focus">${icon('target', 12)}<span>${t('Locate')}</span></button>` : ''}
            ${this.quickShown(step) ? `<button class="btn sm" id="tut-quick">${this.esc(this.txt(t(step.quickAction!.label)))}</button>` : ''}
          </div>` : ''}
        </div>
        <div class="tut-foot">
          <button class="btn sm ghost" id="tut-prev" ${idx === 0 ? 'disabled' : ''}>${icon('chevronLeft', 13)}<span>${t('Back')}</span></button>
          <div class="row">
            <button class="btn sm ${nextPrimary ? 'primary' : ''}" id="tut-next"><span>${isLast ? (done ? t('Finish') : t('Done')) : t('Next')}</span>${isLast ? '' : icon('chevronRight', 13)}</button>
            ${isLast && done && nextId ? `<button class="btn sm primary" id="tut-next-board"><span>${t('Next lesson')}</span>${icon('chevronRight', 13)}</button>` : ''}
          </div>
        </div>
      </div>`;
  }

  private renderTutorial() {
    const steps = getTutorialSteps(this.activeScenario.id);
    if (!this.tutorialOpen || !steps) {
      this.tutBoxEl.innerHTML = '';
      this.tutPointer = null;
      return;
    }
    const total = steps.length;
    const idx = Math.max(0, Math.min(total - 1, this.tutorialStep));
    const step = steps[idx];
    this.attempts?.tutStep(idx + 1);
    if (this.activeScenario.id === TUTORIAL_SCENARIO_IDS[0]) {
      this.tutMax = Math.max(this.tutMax, idx + 1);
    }
    const done = step.isDone({
      scenarioId: this.activeScenario.id,
      board: this.board,
      conn: this.conn,
      cameraMode: this.camera.mode,
      cameraSide: this.camera.side,
      vizMode: this.vizMode,
      powerOn: this.powerOn,
      activeTool: this.activeTool,
      selectedCompId: this.selectedCompId,
      dmmMode: this.dmmMode,
      probeRed: this.probeRed,
      probeBlack: this.probeBlack,
      revealedFlag: this.revealedFlag,
    });
    this.tutPointer = step.target && !done && step.target.label
      ? { pos: step.target.pos, side: step.target.side, radius: step.target.radius ?? 3, label: t(step.target.label) }
      : null;
    const pct = Math.round(((idx + 1) / total) * 100);
    const isLast = idx === total - 1;
    const tutIdx = TUTORIAL_SCENARIO_IDS.indexOf(this.activeScenario.id as (typeof TUTORIAL_SCENARIO_IDS)[number]);
    const nextId = nextTutorialScenarioId(this.activeScenario.id);
    const nextPrimary = isLast ? !(done && nextId) : done;

    this.tutBoxEl.innerHTML = this.mobile ? this.phoneTutorialHtml(step, idx, total, tutIdx, done, pct, isLast, nextPrimary, nextId) : `
      <div class="tut-card${this.mobile && this.tutCollapsed ? ' collapsed' : ''}" style="transform: translate3d(${this.tutPos[0]}px, ${this.tutPos[1]}px, 0)">
        <div class="tut-head" title="${this.mobile ? t('Tap to fold / unfold') : t('Drag to move window')}">
          <span class="tut-step">${icon(this.mobile ? (this.tutCollapsed ? 'chevronDown' : 'book') : 'book', 13)}<span>${tutIdx >= 0 ? `${t('Tutorial {n}/{total}', { n: tutIdx + 1, total: TUTORIAL_SCENARIO_IDS.length })} · ` : `${t('Tutorial')} · `}${t('Step {n} / {total}', { n: idx + 1, total })}${this.mobile && this.tutCollapsed ? ` · ${this.esc(t(step.title))}` : ''}</span></span>
          <button class="btn ghost icon sm" id="tut-close" title="${t('Close tutorial')}">${icon('x', 13)}</button>
        </div>
        <div class="tut-prog"><i style="width:${pct}%"></i></div>
        <div class="tut-body">
          <div class="tut-title"><span>${this.esc(this.txt(t(step.title)))}</span><button class="btn sm ghost ${this.tutWhy === `${this.activeScenario.id}:${idx}` ? 'active' : ''}" id="tut-why">${icon('help', 12)}<span>${this.tutWhy === `${this.activeScenario.id}:${idx}` ? t('Hide') : t('Why?')}</span></button></div>
          ${this.tutWhy === `${this.activeScenario.id}:${idx}` ? `<div class="tut-concept">${this.esc(this.txt(t(step.concept)))}</div>` : ''}
          <div class="tut-goal ${done ? 'done' : ''}">
            <div class="tut-goal-head">
              <span>${done ? t('Step complete') : t('Your turn')}</span>
              ${done ? `<span class="badge pass">${icon('check', 11)}<span>${t('Done')}</span></span>` : ''}
            </div>
            <div class="tut-goal-txt">${this.esc(this.txt(t(step.task)))}</div>
            ${this.kbUsed ? `<div class="tut-kb">${t('Keyboard: on the board, arrow keys move the cursor and Enter uses the tool (Shift+Enter: black probe).')}</div>` : ''}
            ${step.target || step.quickAction ? `
              <div class="row wrap" style="margin-top:2px">
                ${step.target ? `<button class="btn sm" id="tut-focus">${icon('target', 12)}<span>${t('Locate on board')}</span></button>` : ''}
                ${this.quickShown(step) ? `<button class="btn sm" id="tut-quick">${this.esc(this.txt(t(step.quickAction!.label)))}</button>` : ''}
              </div>
            ` : ''}
          </div>
        </div>
        <div class="tut-foot">
          <button class="btn sm ghost" id="tut-prev" ${idx === 0 ? 'disabled' : ''}>${icon('chevronLeft', 13)}<span>${t('Back')}</span></button>
          <div class="row">
            <button class="btn sm ${nextPrimary ? 'primary' : ''}" id="tut-next">
              <span>${isLast ? (done ? t('Finish') : t('Done')) : t('Next step')}</span>${isLast ? '' : icon('chevronRight', 13)}
            </button>
            ${isLast && done && nextId ? `
              <button class="btn sm primary" id="tut-next-board">
                <span>${t('Next tutorial')}</span>${icon('chevronRight', 13)}
              </button>
            ` : ''}
          </div>
        </div>
      </div>
    `;

    this.tutBoxEl.querySelector('#tut-why')?.addEventListener('click', () => {
      const key = `${this.activeScenario.id}:${idx}`;
      this.tutWhy = this.tutWhy === key ? '' : key;
      this.renderTutorial();
    });
    if (this.mobile) {
      this.tutBoxEl.querySelector('.tut-head')?.addEventListener('click', (e) => {
        if ((e.target as HTMLElement).closest('button')) return;
        this.tutCollapsed = !this.tutCollapsed;
        this.renderTutorial();
      });
    }
    this.tutBoxEl.querySelector('#tut-close')?.addEventListener('click', () => {
      this.tutorialOpen = false;
      localStorage.setItem('pcbfix_tut_dismissed', '1');
      this.renderUI();
    });
    // phone: the card changes height with each step; keep the whole board in the part it leaves free
    const showStep = () => {
      this.renderTutorial();
      if (this.mobile) this.fitBoardInView();
    };
    this.tutBoxEl.querySelector('#tut-prev')?.addEventListener('click', () => {
      this.tutorialStep = Math.max(0, idx - 1);
      showStep();
    });
    this.tutBoxEl.querySelector('#tut-next')?.addEventListener('click', () => {
      if (isLast) {
        this.tutorialOpen = false;
        localStorage.setItem('pcbfix_tut_dismissed', '1');
        this.renderUI();
      } else {
        this.tutorialStep = Math.min(total - 1, idx + 1);
        showStep();
      }
    });
    this.tutBoxEl.querySelector('#tut-next-board')?.addEventListener('click', () => {
      if (!nextId) return;
      const nextIdx = this.scenarios.findIndex((s) => s.id === nextId);
      if (nextIdx >= 0) {
        localStorage.removeItem('pcbfix_tut_dismissed');
        this.tutorialOpen = true;
        this.tutorialStep = 0;
        void this.openScenario(nextIdx);
      }
    });
    this.tutBoxEl.querySelector('#tut-focus')?.addEventListener('click', () => {
      if (!step.target) return;
      this.focusTarget(step.target);
      this.kbCursor = { pt: step.target.pos, side: step.target.side };
      this.updateTopButtons();
      this.renderTopHud();
    });
    this.tutBoxEl.querySelector('#tut-quick')?.addEventListener('click', () => {
      const qa = step.quickAction?.id;
      if (!qa) return;
      const setDmm = (powerOn: boolean, dmmMode: DmmMode) => {
        this.powerOn = powerOn;
        this.dmmMode = dmmMode;
        this.setTool('dmm');
        this.recompute(false);
        this.renderUI();
      };
      const flipTo = (side: Side) => {
        this.camera.bothSides = false;
        this.camera.setSide(side);
        this.renderUI();
      };
      const actions: Record<string, () => void> = {
        'view-3d': () => { this.camera.setMode('3d'); this.renderUI(); },
        'viz-heatmap': () => { this.vizMode = 'heatmap'; this.renderUI(); },
        'flip-bottom': () => flipTo('B'),
        'flip-top': () => flipTo('F'),
        'tool-inspect': () => this.setTool('inspect'),
        'tool-dmm': () => this.setTool('dmm'),
        'tool-iron': () => this.setTool('iron'),
        'tool-wick': () => this.setTool('wick'),
        'tool-flip180': () => this.setTool('flip180'),
        'tool-replace': () => this.setTool('replace'),
        'prep-ohm': () => setDmm(false, 'OHM'),
        'prep-diode': () => setDmm(false, 'DIODE'),
        'prep-volt': () => setDmm(true, 'V'),
        'power-on': () => { if (!this.powerOn) this.togglePower(); },
        'run-verify': () => { void this.runVerify(); },
      };
      actions[qa]?.();
    });
  }

  private renderSideBody() {
    if (this.activeTab === 'mission') this.renderMissionTab();
    else if (this.activeTab === 'inspect') this.renderInspectTab();
    else if (this.activeTab === 'mods') this.renderModPanelsTab();
    else this.renderStudioTab();
    if (this.mobile) {
      this.sideBodyEl.querySelectorAll<HTMLElement>('.callout').forEach((c) => {
        c.classList.toggle('open', this.openNotes.has(c.querySelector('.h')?.textContent ?? ''));
      });
    }
  }

  /** Numbered rows of a track (tutorials, challenges): the open board marked, solved ones ticked. */
  private trackRowsHtml(ids: readonly string[], current: string, done: ReadonlySet<string> = this.solvedIds): string {
    return ids.map((id, idx) => {
      const scIdx = this.scenarios.findIndex((x) => x.id === id);
      const sc = scIdx >= 0 ? this.scenarios[scIdx] : null;
      if (!sc) return '';
      const isCur = id === current;
      const level = this.levelPill(sc);
      return `
        <button class="list-btn" data-open-sc="${scIdx}" style="${isCur ? 'background:var(--accent-weak);border:1px solid var(--accent-line)' : ''}">
          <span><b>${idx + 1}.</b> ${this.esc(t(sc.meta.title))}</span>
          ${done.has(id) ? `<span class="badge pass">${t('Done')}</span>` : isCur ? `<span class="badge info">${t('Active')}</span>` : `<span class="sub">${level}</span>`}
        </button>`;
    }).join('');
  }

  /** The step after the tutorials: repair challenges, then the real (open-hardware) boards. */
  private challengeTrackHtml(current: string, fromTutorials: boolean): string {
    const ids = CHALLENGE_TRACK_IDS as readonly string[];
    const done = ids.filter((id) => this.solvedIds.has(id)).length;
    const onReal = current.startsWith('demo-');
    const notesOn = this.modResult.mods.some((m) => m.manifest.id === 'board-notes');
    const tip = onReal
      ? (notesOn ? '' : `
        <div class="row wrap">
          <span class="muted">${this.mobile ? t('Rail-by-rail notes for real boards:') : t('For real boards, «Board notes» explains each rail: where it comes from, what to measure, what a low reading means.')}</span>
          <button class="btn sm" id="btn-get-notes">${icon('users', 12)}<span>${t('Get board notes')}</span></button>
        </div>`)
      : `<div class="muted">${this.mobile ? t('Stuck? Run the tests, then «Where to look?».') : t('Small boards with more than one fault, then real open-hardware boards with hundreds of parts. Stuck? Run the tests: «Where to look?» suggests what to measure.')}</div>`;
    return `
      <div class="card">
        <div class="card-title">
          <span>${fromTutorials ? t('Next: repair challenges') : t('Repair challenges')}</span>
          <span class="badge info">${done}/${ids.length}</span>
        </div>
        ${tip}
        <div class="stack">${this.trackRowsHtml(ids, current)}</div>
      </div>`;
  }

  private renderMissionTab() {
    const s = this.activeScenario;
    const hints = s.meta.hints;
    const v = this.lastVerify;
    const inTutTrack = isTutorialScenario(s.id);
    const lesson = lessonFor(s.id);
    // after the tutorials (all solved, or on the last one), and on the challenge boards themselves
    const showChallenges = (CHALLENGE_TRACK_IDS as readonly string[]).includes(s.id)
      || (inTutTrack && (TUTORIAL_SCENARIO_IDS.every((id) => this.solvedIds.has(id)) || s.id === TUTORIAL_SCENARIO_IDS[TUTORIAL_SCENARIO_IDS.length - 1]));

    this.sideBodyEl.innerHTML = `
      ${this.nextRepairHtml()}
      <div class="card">
        <div class="card-title lg">
          <span>${this.esc(t(s.meta.title))}</span>
          <span class="badge info"${s.meta.par ? ` title="${this.esc(t('Your moves / par: the fewest moves that fix this board'))}"` : ''}>${t('{moves} moves', { moves: `${this.moves}${s.meta.par ? ` / ${s.meta.par}` : ''}` })}</span>
        </div>
        <div class="row" style="justify-content:space-between">
          <span class="muted">${t('By {author}', { author: this.esc(t(s.meta.author)) })}</span>
          ${this.levelPill(s, { named: true })}
        </div>
        <div class="text-2">${this.esc(this.txt(t(s.meta.description)))}</div>
        ${s.meta.credits ? `
          <div class="credits">
            <span>${this.esc(s.meta.credits)}</span>
            <span class="mono">${s.meta.license ? `${t('Licence')}: ${this.esc(s.meta.license)}` : ''}${s.meta.source ? ` · <a href="${this.esc(s.meta.source.split(' @ ')[0])}" target="_blank" rel="noopener">${t('source')}${s.meta.source.includes(' @ ') ? ` @ ${this.esc(s.meta.source.split(' @ ')[1])}` : ''}</a>` : ''}</span>
          </div>
        ` : ''}
        ${this.modBoards.get(s)?.schematic ? `
          <div class="row wrap" style="margin-top:8px">
            <button class="btn sm" id="open-schematic">${icon('book', 12)}<span>${t('Schematic')}</span></button>
            <span class="muted">${t('from the mod «{name}»', { name: this.esc(this.modBoards.get(s)!.mod.name) })}</span>
          </div>
        ` : ''}
        ${this.videos[s.id] ? `
          <div class="walkthrough">
            <span class="walk-title">${t('Walkthrough')}</span>
            <div class="row wrap">
              <button class="btn sm" id="vid-approach">${icon('play', 12)}<span>${t('How to approach')} · ${fmtDur(this.videos[s.id].approach.seconds)}</span></button>
              ${this.triedEnough(s) ? `<button class="btn sm" id="vid-solution">${t('Show solution')}</button>` : ''}
            </div>
          </div>
        ` : ''}
        ${!this.tutorialOpen && inTutTrack ? `
          <button class="btn sm block" id="btn-start-tut">${icon('book', 13)}<span>${t('Start interactive beginner tutorial')}</span></button>
        ` : ''}
      </div>

      ${lesson ? this.lessonCardHtml(lesson.title) : ''}
      ${inTutTrack ? `
        <div class="card">
          <div class="card-title">
            <span>${t('Beginner tutorial track')}</span>
            <div class="row">
              <span class="badge info">${TUTORIAL_SCENARIO_IDS.filter((id) => this.solvedIds.has(id)).length}/${TUTORIAL_SCENARIO_IDS.length}</span>
              <button class="btn sm" id="btn-open-catalog">${t('All boards')}</button>
            </div>
          </div>
          <div class="stack">${this.trackRowsHtml(TUTORIAL_SCENARIO_IDS, s.id)}</div>
        </div>
      ` : ''}
      ${showChallenges ? this.challengeTrackHtml(s.id, inTutTrack) : ''}

      ${this.revealedFlag ? `
        <div class="flag-box">
          <div class="card-title" style="color:var(--accent)">
            <span class="row">${icon('flag', 14)}<span>${t('Flag unlocked')}</span></span>
            <button class="btn sm" id="btn-copy-flag">${icon('copy', 13)}<span>${t('Copy')}</span></button>
          </div>
          <div class="flag-code" id="flag-txt">${this.esc(this.revealedFlag)}</div>
        </div>
      ` : ''}

      ${this.canGenerate() ? `
        <div class="card gen-card">
          <div class="card-title"><span class="row">${icon('target', 14)}<span>${t('Next problem on this board')}</span></span></div>
          <div class="muted">${this.mobile ? t('Fresh random faults, same checks.') : t('Break this board again with fresh random faults. Same parts, same checks: find the faults and repair it.')}</div>
          <div class="gen-row">
            <span class="sub">${t('Faults')}</span>
            <div class="seg" id="gen-count">
              ${[1, 2, 3].map((n) => `<button class="${this.genFaults === n ? 'on' : ''}" data-gen-n="${n}">${n}</button>`).join('')}
            </div>
            <button class="btn sm primary" id="btn-gen" ${this.generating ? 'disabled' : ''}>${icon('play', 12)}<span>${this.generating ? t('Generating…') : t('Generate')}</span></button>
          </div>
        </div>
      ` : ''}

      <div class="card">
        <div class="card-title">
          <span>${t('Objectives')}</span>
          <button class="btn sm" id="btn-panel-verify">${icon('play', 12)}<span>${t('Run tests')}</span></button>
        </div>
        ${v && this.lastVerifyBy ? `<div class="muted" style="font-size:12px">${t('Tested with the solver mod {solver}, not an official solver.', { solver: this.esc(this.codeHost.solvers().find((x) => x.address === this.lastVerifyBy)?.name ?? this.lastVerifyBy) })}</div>` : ''}
        ${s.objectives.length === 0 ? `<div class="muted">${t('No objectives defined.')}</div>` : ''}
        ${(v ? v.results : s.objectives.map((o) => ({
          objective: o,
          label: objectiveLabel(o),
          passed: false,
          detail: '',
        }))).map((r) => `
          <div class="obj-row ${v ? (r.passed ? 'pass' : 'fail') : ''}">
            <div>
              <div class="t">${this.esc(r.label)}</div>
              ${r.detail ? `<div class="d">${this.esc(r.detail)}</div>` : ''}
            </div>
            ${v ? `<span class="badge ${r.passed ? 'pass' : 'fail'}">${r.passed ? t('Pass') : t('Fail')}</span>` : ''}
          </div>
        `).join('')}
        ${v && v.overloads.length > 0 ? `
          <div class="obj-row fail">
            <div>
              <div class="t">${t('Thermal / current overload')}</div>
              <div class="d">${v.overloads.map((o) => `${this.esc(o.ref)}: ${this.esc(o.msg)}`).join('; ')}</div>
            </div>
            <span class="badge fail">${t('Fault')}</span>
          </div>
        ` : ''}
      </div>

      ${hints.length > 0 ? `
        <div class="card">
          <div class="card-title">
            <span>${t('Notes')} (${this.hintsShown}/${hints.length})</span>
            ${this.hintsShown < hints.length ? `<button class="btn sm" id="btn-next-hint">${t('Reveal note')}</button>` : ''}
          </div>
          ${hints.slice(0, this.hintsShown).map((h, i) => `
            <div class="hint-item"><b>${i + 1}.</b> ${this.esc(this.txt(t(h)))}</div>
          `).join('')}
        </div>
      ` : ''}
      ${this.lookHereHtml(s)}
      ${this.knowledgeHtml(s)}
    `;

    this.sideBodyEl.querySelectorAll<HTMLButtonElement>('[data-kn-ref]').forEach((b) => b.addEventListener('click', () => this.gotoRef(b.dataset.knRef!)));
    this.sideBodyEl.querySelector('#btn-look-here')?.addEventListener('click', () => void this.suggestWhereToLook());
    this.sideBodyEl.querySelector('#btn-panel-verify')?.addEventListener('click', () => void this.runVerify());
    this.sideBodyEl.querySelector('#btn-gen')?.addEventListener('click', () => void this.generateNext());
    this.sideBodyEl.querySelectorAll<HTMLButtonElement>('[data-gen-n]').forEach((b) => {
      b.addEventListener('click', () => { this.genFaults = Number(b.dataset.genN); this.renderMissionTab(); });
    });
    this.sideBodyEl.querySelector('#btn-start-tut')?.addEventListener('click', () => this.startTutorial());
    this.sideBodyEl.querySelectorAll<HTMLButtonElement>('[data-lesson]').forEach((b) => b.addEventListener('click', () => {
      this.showLesson = b.dataset.lesson === 'debrief' ? 'debrief' : 'brief';
      this.renderModal();
    }));
    this.sideBodyEl.querySelector('#btn-open-catalog')?.addEventListener('click', () => this.openBoardCatalog());
    this.sideBodyEl.querySelector('#btn-get-notes')?.addEventListener('click', () => {
      this.showMods = true;
      this.modsView = 'community';
      this.renderModal();
    });
    this.sideBodyEl.querySelectorAll<HTMLButtonElement>('[data-open-sc]').forEach((b) => {
      b.addEventListener('click', () => {
        const idx = Number(b.dataset.openSc);
        if (this.scenarios[idx]) void this.openScenario(idx);
      });
    });
    this.sideBodyEl.querySelector('#open-schematic')?.addEventListener('click', () => void this.openSchematic(s));
    this.sideBodyEl.querySelector('#vid-approach')?.addEventListener('click', () => this.playVideo(s.id, 'approach'));
    const sol = this.sideBodyEl.querySelector<HTMLButtonElement>('#vid-solution');
    sol?.addEventListener('click', () => {
      // solutions spoil the challenge: a second, deliberate click plays it
      if (sol.dataset.armed) { this.playVideo(s.id, 'solution'); return; }
      sol.dataset.armed = '1';
      sol.classList.add('warn');
      sol.textContent = t('Spoilers ahead — play solution ({time})', { time: fmtDur(this.videos[s.id].solution.seconds) });
    });
    this.sideBodyEl.querySelector('#btn-next-hint')?.addEventListener('click', () => {
      this.hintsShown = Math.min(hints.length, this.hintsShown + 1);
      this.attempts?.note();
      if (this.rated) this.rated.notes++;
      this.renderMissionTab();
    });
    this.sideBodyEl.querySelectorAll<HTMLElement>('[data-next-board]').forEach((b) => b.addEventListener('click', () => {
      void this.openScenario(Number(b.dataset.nextBoard)).then(() => this.refreshScenarioSelect());
    }));
    this.sideBodyEl.querySelector('#btn-copy-flag')?.addEventListener('click', async () => {
      if (this.revealedFlag) {
        await navigator.clipboard?.writeText(this.revealedFlag);
        this.toast(t('Flag copied to clipboard'), 'success');
      }
    });
  }

  private renderInspectTab() {
    const c = this.board.components.find((x) => x.id === this.selectedCompId) ?? null;

    if (!c) {
      const netName = this.selectedNet >= 0 ? this.conn.netNames[this.selectedNet] : null;
      const ni = this.selectedNet >= 0 ? this.sim?.nodeOfNet.get(this.selectedNet) : undefined;
      const v = ni !== undefined && this.sim?.source ? this.sim.V[ni] : null;
      const renderCompRows = () => {
        const q = this.compSearch.trim().toLowerCase();
        const filtered = q
          ? this.board.components.filter((comp) =>
              comp.ref.toLowerCase().includes(q)
              || KIND_NAMES[comp.kind].toLowerCase().includes(q)
              || t(KIND_NAMES[comp.kind]).toLowerCase().includes(q)
              || (comp.label?.toLowerCase().includes(q) ?? false))
          : this.board.components;
        const shown = filtered.slice(0, 120);
        const rows = shown.map((comp) => `
          <button class="list-btn" data-pick-comp="${comp.id}">
            <span><b>${this.esc(comp.ref)}</b> · ${this.esc(t(KIND_NAMES[comp.kind]))}</span>
            <span class="sub">${this.esc(marking(comp))}</span>
          </button>
        `).join('');
        const tail = filtered.length > 120
          ? `<div class="muted" style="padding-top:4px">${t('Showing 120 of {n} matches — refine search above', { n: filtered.length })}</div>`
          : '';
        return (rows || `<div class="muted">${t('No matching components.')}</div>`) + tail;
      };
      this.sideBodyEl.innerHTML = `
        <div class="card">
          <div class="card-title">${t('Selection')}</div>
          ${netName ? `
            <dl class="kv">
              <dt>${t('Net')}</dt><dd>${this.esc(netName)}</dd>
              <dt>${t('Potential')}</dt><dd>${v !== null ? `${v.toFixed(3)} V` : this.powerOn ? t('Floating') : t('Unpowered')}</dd>
            </dl>
          ` : `<div class="muted">${t('Select a component, pad, or trace in the viewport to inspect parameters and perform rework.')}</div>`}
        </div>
        <div class="card">
          <div class="card-title">${t('Components')} (${this.board.components.length})</div>
          <input type="text" id="inp-comp-search" placeholder="${t('Search ref or type (e.g. U2, C29, resistor)…')}" value="${this.esc(this.compSearch)}" style="width:100%;margin-bottom:8px" />
          <div class="stack" id="comp-list-box">${renderCompRows()}</div>
        </div>
      `;
      const bindCompClicks = () => {
        this.sideBodyEl.querySelectorAll<HTMLButtonElement>('[data-pick-comp]').forEach((b) => {
          b.addEventListener('click', () => {
            const id = b.dataset.pickComp!;
            this.selectedCompId = id;
            const chosen = this.board.components.find((x) => x.id === id);
            if (chosen) this.kbCursor = { pt: chosen.at, side: chosen.side }; // Tab back to the board: the cursor is on it
            if (this.board.components.length > 100) {
              const picked = this.board.components.find((x) => x.id === id);
              if (picked) {
                if (this.camera.bothSides) {
                  const fx = picked.side === 'B' ? this.board.w * 2 + BOTH_GAP - picked.at[0] : picked.at[0];
                  this.camera.focusAt(fx, picked.at[1], 10);
                } else {
                  this.camera.focusAt(picked.at[0], picked.at[1], 10, picked.side);
                }
                this.renderUI();
                return;
              }
            }
            this.renderInspectTab();
          });
        });
      };
      bindCompClicks();
      const searchEl = this.sideBodyEl.querySelector<HTMLInputElement>('#inp-comp-search');
      const listBox = this.sideBodyEl.querySelector<HTMLElement>('#comp-list-box');
      searchEl?.addEventListener('input', () => {
        this.compSearch = searchEl.value;
        if (listBox) {
          listBox.innerHTML = renderCompRows();
          bindCompClicks();
        }
      });
      return;
    }

    const cSim = this.powerOn && this.sim ? this.sim.comps.get(c.id) : undefined;
    const bands = c.kind === 'resistor' && c.state.populated && !c.state.burnt ? resistorBands(c.value) : null;
    const bandColorCss = (idx: number) => {
      const rgb = idx < 0 ? GOLD_RGB : BAND_RGB[idx];
      return `rgb(${Math.round(rgb[0] * 255)}, ${Math.round(rgb[1] * 255)}, ${Math.round(rgb[2] * 255)})`;
    };

    const e12 = e12Values(10, 1000000);

    this.sideBodyEl.innerHTML = `
      <div class="card">
        <div class="card-title">
          <button class="btn ghost sm" id="btn-comp-back" style="padding:0 4px">${icon('chevronLeft', 14)}<span>${t('Components')}</span></button>
          <span class="badge info">${this.esc(c.ref)}</span>
        </div>
        <div class="card-title lg">${this.esc(t(KIND_NAMES[c.kind]))}</div>
        <dl class="kv">
          <dt>${t('State')}</dt><dd>${!c.state.populated ? t('Unpopulated') : c.state.burnt ? t('Damaged (open)') : t('Populated')}${c.state.reversed ? ` · ${t('Reversed')}` : ''}${c.state.cold.length ? ` · ${t('{n} cold joint|{n} cold joints', { n: c.state.cold.length })}` : ''}</dd>
          <dt>${t('Value')}</dt><dd>${this.esc(marking(c))}</dd>
          ${bands ? `
            <dt>${t('Color code')}</dt>
            <dd>
              <span class="res-bands">
                <span class="res-band" style="background:${bandColorCss(bands[0])}"></span>
                <span class="res-band" style="background:${bandColorCss(bands[1])}"></span>
                <span class="res-band" style="background:${bandColorCss(bands[2])}"></span>
                <span class="res-band" style="background:${bandColorCss(-1)}"></span>
              </span>
            </dd>
          ` : ''}
          ${cSim ? `
            <dt>${t('Drop / current')}</dt><dd>${cSim.v.toFixed(3)} V · ${(cSim.i * 1000).toFixed(2)} mA</dd>
            <dt>${t('Power / temp')}</dt><dd>${(cSim.p * 1000).toFixed(1)} mW · ${(25 + cSim.p * (c.kind === 'resistor' ? 185 : 130)).toFixed(0)} °C</dd>
          ` : ''}
        </dl>
        <div class="callout">
          <span class="h">${t('Reference note')}</span>
          <span>${this.esc(
            c.kind === 'resistor'
              ? t('Read the 4 bands left-to-right toward the gold tolerance band: Digit 1, Digit 2, Multiplier (10^n). Example: Brown-Black-Red = 1-0 × 10² = 1 kΩ.')
              : c.kind === 'led'
                ? t('Look for the flat notch on the rim and the larger internal cathode anvil flag. Verify polarity in Diode mode (•◄|).')
                : c.kind === 'diode'
                  ? t('The silver/white band marks the Cathode (K). A healthy silicon diode drops ~0.6–0.7 V forward and reads OL reversed.')
                  : c.kind === 'switch'
                    ? t('4-pin tactile switches pair two legs internally on each side (1-1 and 2-2). Pressing bridges side 1 to side 2.')
                    : c.kind === 'fuse'
                      ? t('Check for downstream shorts (Ω mode or 100 mA limit + Thermal view) before replacing a blown fuse.')
                      : t('Probe pads in V DC (Power ON) or Ω / Diode mode (Power OFF) to trace connectivity.')
          )}</span>
        </div>
      </div>

      ${this.padsCardHtml(c)}

      <div class="card">
        <div class="card-title">${t('Rework')}</div>
        <div class="row wrap">
          ${c.kind === 'switch' ? `<button class="btn sm primary" id="act-toggle-sw">${c.state.closed ? t('Release switch') : t('Press switch')}</button>` : ''}
          ${c.state.populated ? `<button class="btn sm" id="act-flip180">${t('Rotate 180°')}</button>` : ''}
          ${c.state.cold.length ? `<button class="btn sm warn" id="act-reflow">${t('Reflow joints')}</button>` : ''}
          ${c.state.populated ? `<button class="btn sm" id="act-desolder">${t('Remove part')}</button>` : ''}
          ${!c.state.populated || c.state.burnt ? `<button class="btn sm primary" id="act-fit">${t('Fit new part: {kind}', { kind: this.esc(t(KIND_NAMES[c.kind]).toLowerCase()) })}</button>` : ''}
        </div>

        ${c.kind === 'resistor' ? `
          <div class="field">
            <label>${t('Resistance (e.g. 100, 330, 4k7, 10k)')}</label>
            <div class="row">
              <input type="text" class="grow" id="inp-res-val" value="${c.value || 330}" />
              <button class="btn sm primary" id="act-install-res">${t('Apply')}</button>
            </div>
            <select id="sel-e12" style="margin-top:2px">
              <option value="">${t('Standard E12 value…')}</option>
              ${e12.map((v) => `<option value="${v}" ${Math.abs(v - c.value) < 0.01 ? 'selected' : ''}>${fmtOhm(v)}</option>`).join('')}
            </select>
          </div>
        ` : ''}

        ${c.kind === 'led' ? `
          <div class="field">
            <label>${t('LED emission color')}</label>
            <div class="row">
              <select class="grow" id="sel-led-col">
                ${LED_COLORS.map((col) => `<option value="${col}" ${c.color === col ? 'selected' : ''}>${t(LED_COLOR_NAMES[col]).toUpperCase()}</option>`).join('')}
              </select>
              <button class="btn sm primary" id="act-install-led">${t('Apply')}</button>
            </div>
          </div>
        ` : ''}

        ${c.kind === 'fuse' ? `
          <div class="field">
            <label>${t('Fuse current rating (A)')}</label>
            <div class="row">
              <input type="number" class="grow" step="0.1" min="0.05" id="inp-fuse-val" value="${c.value || 0.5}" />
              <button class="btn sm primary" id="act-install-fuse">${t('Apply')}</button>
            </div>
          </div>
        ` : ''}

        ${c.kind === 'capacitor' ? `
          <div class="field">
            <label>${t('Capacitance (e.g. 100n, 10u)')}</label>
            <div class="row">
              <input type="text" class="grow" id="inp-cap-val" value="${c.value ? fmtSI(c.value, 'F') : '100n'}" />
              <button class="btn sm primary" id="act-install-cap">${t('Apply')}</button>
            </div>
          </div>
        ` : ''}
      </div>

      ${this.authorMode ? this.faultCardHtml(c) : ''}
    `;

    this.sideBodyEl.querySelector('#btn-comp-back')?.addEventListener('click', () => {
      this.selectedCompId = null;
      this.renderInspectTab();
    });
    this.sideBodyEl.querySelector('#act-toggle-sw')?.addEventListener('click', () => {
      c.state.closed = !c.state.closed;
      sfxClick();
      this.recompute(false);
      this.renderInspectTab();
    });
    this.sideBodyEl.querySelector('#act-flip180')?.addEventListener('click', () => {
      this.pushUndo();
      c.state.reversed = !c.state.reversed;
      sfxClick();
      this.recompute(false);
      this.renderInspectTab();
    });
    this.sideBodyEl.querySelector('#act-reflow')?.addEventListener('click', () => {
      this.pushUndo();
      c.state.cold = [];
      sfxSolder();
      this.recompute(false);
      this.renderInspectTab();
    });
    this.sideBodyEl.querySelector('#act-fit')?.addEventListener('click', () => {
      // a fresh part of the same type and value (value fields below change it)
      this.pushUndo();
      installPart(c, { ...(c.value > 0 && { value: c.value }) });
      sfxSolder();
      this.recompute(false);
      this.toast(t('Fitted a new {ref}', { ref: c.ref }), 'success');
      this.renderInspectTab();
    });
    this.sideBodyEl.querySelector('#act-desolder')?.addEventListener('click', () => {
      this.pushUndo();
      removePart(c);
      sfxSolder();
      this.recompute(false);
      this.renderInspectTab();
    });
    this.sideBodyEl.querySelector('#sel-e12')?.addEventListener('change', (e) => {
      const v = Number((e.target as HTMLSelectElement).value);
      if (v > 0) {
        this.pushUndo();
        installPart(c, { value: v, reversed: c.state.reversed });
        sfxSolder();
        this.recompute(false);
        this.renderInspectTab();
      }
    });
    this.sideBodyEl.querySelector('#act-install-res')?.addEventListener('click', () => {
      const raw = (this.sideBodyEl.querySelector('#inp-res-val') as HTMLInputElement).value;
      const v = parseValue(raw);
      if (!Number.isFinite(v) || v <= 0) { this.toast(t('Invalid resistor value'), 'danger'); return; }
      this.pushUndo();
      installPart(c, { value: v, reversed: c.state.reversed });
      sfxSolder();
      this.recompute(false);
      this.renderInspectTab();
    });
    this.sideBodyEl.querySelector('#act-install-led')?.addEventListener('click', () => {
      const col = (this.sideBodyEl.querySelector('#sel-led-col') as HTMLSelectElement).value as LedColor;
      this.pushUndo();
      installPart(c, { color: col, reversed: c.state.reversed });
      sfxSolder();
      this.recompute(false);
      this.renderInspectTab();
    });
    this.sideBodyEl.querySelector('#act-install-fuse')?.addEventListener('click', () => {
      const v = Number((this.sideBodyEl.querySelector('#inp-fuse-val') as HTMLInputElement).value);
      if (!Number.isFinite(v) || v <= 0) { this.toast(t('Invalid fuse rating'), 'danger'); return; }
      this.pushUndo();
      installPart(c, { value: v });
      sfxSolder();
      this.recompute(false);
      this.renderInspectTab();
    });
    this.sideBodyEl.querySelector('#act-install-cap')?.addEventListener('click', () => {
      const raw = (this.sideBodyEl.querySelector('#inp-cap-val') as HTMLInputElement).value;
      const v = parseValue(raw);
      if (!Number.isFinite(v) || v <= 0) { this.toast(t('Invalid capacitance'), 'danger'); return; }
      this.pushUndo();
      installPart(c, { value: v });
      sfxSolder();
      this.recompute(false);
      this.renderInspectTab();
    });

    this.sideBodyEl.querySelector('#sab-burn')?.addEventListener('click', () => {
      this.pushUndo();
      c.state.burnt = !c.state.burnt;
      this.recompute(true);
      this.renderInspectTab();
    });
    this.sideBodyEl.querySelector('#sab-cold')?.addEventListener('click', () => {
      this.pushUndo();
      toggleCold(c, 0);
      this.recompute(true);
      this.renderInspectTab();
    });
    this.sideBodyEl.querySelector('#sab-rev')?.addEventListener('click', () => {
      this.pushUndo();
      c.state.reversed = !c.state.reversed;
      this.recompute(true);
      this.renderInspectTab();
    });
    if (this.authorMode) this.bindFaultCard(c);
  }

  /** Author-mode fault injection for one part: every fault class that fits it, with severity. */
  private faultCardHtml(c: Component): string {
    const types = faultTypesFor(c, this.faults);
    const ft = types.find((x) => x.address === this.faultClass) ?? types[0];
    const cls = ft?.address;
    const hint = ft ? (ft.cls ? severityHint(ft.cls) : ft.severity && { ...ft.severity, what: tk('severity') }) : null;
    const jointFault = !!ft?.padChoice;
    const faults = listFaults(c);
    const fastBlind = this.solver === 'fast' && (faults.some((f) => f.spiceOnly) || !!ft?.spiceOnly);
    return `
      <div class="card">
        <div class="card-title">${t('Fault injection')} · ${this.esc(c.ref)}</div>
        <div class="row wrap">
          <button class="btn sm warn" id="sab-burn">${t('Toggle damage')}</button>
          <button class="btn sm warn" id="sab-cold">${t('Toggle open joint')}</button>
          <button class="btn sm warn" id="sab-rev">${t('Reverse 180°')}</button>
        </div>
        ${cls ? `
          <div class="field">
            <label>${t('Fault class')}</label>
            <select id="sab-class">
              ${types.map((k) => `<option value="${this.esc(k.address)}" ${k.address === cls ? 'selected' : ''}>${this.esc(k.cls ? t(k.label) : `${k.label} · ${k.modId}`)}</option>`).join('')}
            </select>
          </div>
          <div class="grid-2">
            ${jointFault ? `
              <div class="field">
                <label>${t('Pad')}</label>
                <select id="sab-pad">
                  <option value="">${t('Random')}</option>
                  ${c.pads.map((p, i) => `<option value="${i}">${this.esc(p.name)}${p.net ? ` · ${this.esc(p.net)}` : ''}</option>`).join('')}
                </select>
              </div>
            ` : ''}
            ${hint ? `
              <div class="field">
                <label>${this.esc(t(hint.what))} (${this.esc(t(hint.unit))})</label>
                <input type="text" id="sab-sev" placeholder="${t('random')} ${hint.unit === 'Ω' ? `${fmtSI(hint.min, 'Ω')} – ${fmtSI(hint.max, 'Ω')}` : `${hint.min}–${hint.max}`}" />
              </div>
            ` : ''}
          </div>
          <button class="btn sm warn block" id="sab-inject">${t('Inject fault')}</button>
        ` : ''}
        ${faults.length ? `
          <div class="card-title" style="margin-top:6px">${t('Faults on {ref}', { ref: this.esc(c.ref) })} (${faults.length})</div>
          ${faults.map((f) => `
            <div class="obj-row">
              <span class="mono">${this.esc(f.label)}${f.spiceOnly ? ' <span class="muted">· SPICE</span>' : ''}</span>
              <button class="btn ghost icon sm" data-clear-fault="${f.key}" title="${t('Remove fault')}">${icon('x', 12)}</button>
            </div>
          `).join('')}
        ` : ''}
        ${fastBlind ? `<div class="callout"><span class="h">${t('Fast DC solver')}</span><span>${t('Leaks, drift and resistive joints only exist in SPICE (Fast DC treats a resistive joint as open). Switch Bench → Solver to SPICE to see their effect.')}</span></div>` : ''}
      </div>
    `;
  }

  private bindFaultCard(c: Component) {
    const q = <T extends HTMLElement>(s: string) => this.sideBodyEl.querySelector<T>(s);
    q<HTMLSelectElement>('#sab-class')?.addEventListener('change', (e) => {
      this.faultClass = (e.target as HTMLSelectElement).value;
      this.renderInspectTab();
    });
    q('#sab-inject')?.addEventListener('click', () => {
      const ft = faultTypesFor(c, this.faults).find((x) => x.address === q<HTMLSelectElement>('#sab-class')?.value);
      if (!ft) return;
      const cls = ft.cls;
      const padRaw = q<HTMLSelectElement>('#sab-pad')?.value ?? '';
      const sevRaw = (q<HTMLInputElement>('#sab-sev')?.value ?? '').trim();
      let severity: number | undefined;
      if (sevRaw) {
        severity = (cls ? severityHint(cls)?.unit : ft.severity?.unit) === 'Ω' ? parseValue(sevRaw) : Number(sevRaw);
        if (!Number.isFinite(severity) || severity <= 0) { this.toast(t('Invalid severity'), 'danger'); return; }
        if (cls === 'flex-open-joint' || cls === 'flex-close-joint' || ft.severity?.unit === 'flex') severity = Math.min(severity, 1);
      }
      this.pushUndo();
      const opts = { severity, ...(padRaw !== '' && { pad: Number(padRaw) }) };
      const rnd = rng((Math.random() * 2 ** 32) >>> 0);
      const f = cls ? injectFault(c, cls as FaultClass, rnd, opts) : injectFaultType(ft.def!, c, rnd, opts);
      updateIntermittents(this.board, this.environment()); // a new intermittent takes its present state at once
      sfxClick();
      this.toast(f.describe, 'info');
      this.recompute(true);
      this.renderInspectTab();
    });
    this.sideBodyEl.querySelectorAll<HTMLButtonElement>('[data-clear-fault]').forEach((b) => {
      b.addEventListener('click', () => {
        this.pushUndo();
        clearFault(c, b.dataset.clearFault!);
        this.recompute(true);
        this.renderInspectTab();
      });
    });
  }

  private environment() {
    const th = this.thermal;
    return { partTemp: (id: string) => th?.partTemp(id), flexAt: (x: number, y: number) => this.flex.at(x, y) };
  }

  private renderStudioTab() {
    const s = this.activeScenario;
    const leds = this.board.components.filter((c) => c.kind === 'led').map((c) => c.ref);
    const probes = this.board.components.map((c) => c.ref);
    const faulted = this.board.components.map((c) => ({ c, faults: listFaults(c) })).filter((x) => x.faults.length);

    this.sideBodyEl.innerHTML = `
      <div class="card">
        <div class="card-title">
          <span>${t('Scenario metadata')}</span>
          <span class="badge info">${this.refLockedHash ? `#${this.refLockedHash}` : s.lock ? t('Locked') : t('Draft')}</span>
        </div>
        <div class="muted">
          ${t('1. Build, repair, or import a working board.')}<br/>
          ${t('2. Define objectives and lock a reference flag.')}<br/>
          ${t('3. Inject faults, then export JSON or copy a share link.')}
        </div>
        <div class="field">
          <label>${t('Title')}</label>
          <input type="text" id="st-title" value="${this.esc(s.meta.title)}" />
        </div>
        <div class="grid-2">
          <div class="field">
            <label>${t('Author')}</label>
            <input type="text" id="st-author" value="${this.esc(s.meta.author)}" />
          </div>
          <div class="field">
            <label>${t('Difficulty (1–5)')}</label>
            <input type="number" min="1" max="5" id="st-diff" value="${s.meta.difficulty}" />
          </div>
        </div>
        <div class="field">
          <label>${t('Description')}</label>
          <textarea id="st-desc" rows="2">${this.esc(s.meta.description)}</textarea>
        </div>
        <div class="field">
          <label>${t('Diagnostic notes (one per line)')}</label>
          <textarea id="st-hints" rows="2">${this.esc(s.meta.hints.join('\n'))}</textarea>
        </div>
      </div>

      <div class="card">
        <div class="card-title">${t('Objectives')} (${s.objectives.length})</div>
        ${s.objectives.map((o, i) => `
          <div class="obj-row">
            <span class="mono">
              ${o.type === 'led' ? `LED ${o.ref} = ${o.on ? 'ON' : 'OFF'}` : `V(${o.a}) ∈ [${o.min}, ${o.max}] V`}
            </span>
            <button class="btn ghost icon sm" data-del-obj="${i}" title="${t('Remove')}">${icon('x', 12)}</button>
          </div>
        `).join('')}
        <div class="row">
          <select class="grow" id="st-obj-ref">
            ${(leds.length ? leds : probes).map((r) => `<option value="${r}">${r}</option>`).join('')}
          </select>
          <button class="btn sm" id="st-add-led">${t('Add LED on')}</button>
        </div>
        <div class="row">
          <input type="number" step="0.1" id="st-vmin" value="2.3" style="width:72px" placeholder="${t('min V')}" />
          <input type="number" step="0.1" id="st-vmax" value="2.7" style="width:72px" placeholder="${t('max V')}" />
          <button class="btn sm grow" id="st-add-v">${t('Add V range')}</button>
        </div>
      </div>

      <div class="card">
        <div class="card-title">${t('Verification & fault mode')}</div>
        <div class="field">
          <label>${t('CTF flag')}</label>
          <input type="text" id="st-flag" value="${this.esc(this.studioFlagInput)}" />
        </div>
        <button class="btn sm primary block" id="st-lock">${icon('lock', 13)}<span>${t('Lock reference topology & flag')}</span></button>
        <button class="btn sm block ${this.authorMode ? 'warn' : ''}" id="st-author-mode">
          ${this.authorMode ? t('Fault injection active') : t('Enable fault injection')}
        </button>
      </div>

      <div class="card">
        <div class="card-title">${t('Injected faults')} (${faulted.reduce((n, x) => n + x.faults.length, 0)})</div>
        ${faulted.length ? faulted.map(({ c, faults }) => `
          <button class="btn ghost sm block" data-goto-fault="${this.esc(c.id)}" style="display:block;text-align:left;height:auto;padding:4px 6px;white-space:normal;overflow-wrap:anywhere">
            <b class="mono">${this.esc(c.ref)}</b>
            ${faults.map((f) => `<div class="muted" style="font-size:11px">${this.esc(f.label)}</div>`).join('')}
          </button>
        `).join('') : `<div class="muted">${t('None yet. Enable fault injection, select a part (Inspect tab) and inject a fault.')}</div>`}
      </div>

      <div class="card">
        <div class="card-title">${t('Export')}</div>
        <div class="grid-2">
          <button class="btn sm primary" id="st-export-json">${icon('download', 13)}<span>${t('Export JSON')}</span></button>
          <button class="btn sm" id="st-share-url">${icon('link', 13)}<span>${t('Copy link')}</span></button>
          <button class="btn sm" id="st-export-mod" style="grid-column:span 2" title="${t('A .zip others can install from Boards → Mods')}">${icon('box', 13)}<span>${t('Export as mod (.zip)')}</span></button>
        </div>
      </div>
    `;

    const syncMeta = () => {
      s.meta.title = (this.sideBodyEl.querySelector('#st-title') as HTMLInputElement).value.trim() || 'Untitled';
      s.meta.author = (this.sideBodyEl.querySelector('#st-author') as HTMLInputElement).value.trim() || 'anonymous';
      s.meta.difficulty = Math.max(1, Math.min(5, Number((this.sideBodyEl.querySelector('#st-diff') as HTMLInputElement).value) || 2));
      s.meta.description = (this.sideBodyEl.querySelector('#st-desc') as HTMLTextAreaElement).value;
      s.meta.hints = (this.sideBodyEl.querySelector('#st-hints') as HTMLTextAreaElement).value.split('\n').map((x) => x.trim()).filter(Boolean);
      this.refreshScenarioSelect();
    };

    ['#st-title', '#st-author', '#st-diff', '#st-desc', '#st-hints'].forEach((sel) => {
      this.sideBodyEl.querySelector(sel)?.addEventListener('change', syncMeta);
    });

    this.sideBodyEl.querySelectorAll<HTMLButtonElement>('[data-del-obj]').forEach((b) => {
      b.addEventListener('click', () => {
        s.objectives.splice(Number(b.dataset.delObj), 1);
        this.renderStudioTab();
      });
    });

    this.sideBodyEl.querySelector('#st-add-led')?.addEventListener('click', () => {
      const ref = (this.sideBodyEl.querySelector('#st-obj-ref') as HTMLSelectElement).value;
      if (ref) {
        s.objectives.push({ type: 'led', ref, on: true } satisfies Objective);
        this.renderStudioTab();
      }
    });

    this.sideBodyEl.querySelector('#st-add-v')?.addEventListener('click', () => {
      const ref = (this.sideBodyEl.querySelector('#st-obj-ref') as HTMLSelectElement).value;
      const min = Number((this.sideBodyEl.querySelector('#st-vmin') as HTMLInputElement).value);
      const max = Number((this.sideBodyEl.querySelector('#st-vmax') as HTMLInputElement).value);
      if (ref && Number.isFinite(min) && Number.isFinite(max)) {
        s.objectives.push({ type: 'voltage', a: ref, min, max } satisfies Objective);
        this.renderStudioTab();
      }
    });

    this.sideBodyEl.querySelector('#st-lock')?.addEventListener('click', async () => {
      syncMeta();
      const flag = (this.sideBodyEl.querySelector('#st-flag') as HTMLInputElement).value.trim();
      if (!flag) { this.toast(t('Enter a CTF flag first'), 'danger'); return; }
      this.studioFlagInput = flag;
      // a built-in board locked with a new flag becomes the author's own challenge: give it its own id
      // (the flag lock is derived from the id, and a copy with a built-in id would clash when shared)
      if (this.bundledIds.has(s.id)) s.id = `custom-${s.meta.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 30)}-${Date.now().toString(36)}`;
      const conn = buildConnectivity(this.board);
      const topo = topology(this.board, conn, s.id);
      s.lock = await lockFlag(flag, topo);
      this.refLockedHash = topo.slice(0, 6);
      this.authorMode = true;
      this.toast(t('Reference topology locked! Now sabotage the board and export/share.'), 'success');
      this.renderUI();
    });

    this.sideBodyEl.querySelectorAll<HTMLButtonElement>('[data-goto-fault]').forEach((b) => {
      b.addEventListener('click', () => {
        const c = this.board.components.find((x) => x.id === b.dataset.gotoFault);
        if (!c) return;
        this.selectedCompId = c.id;
        this.activeTab = 'inspect';
        if (this.camera.bothSides) this.camera.focusAt(c.side === 'B' ? this.board.w * 2 + BOTH_GAP - c.at[0] : c.at[0], c.at[1], 10);
        else this.camera.focusAt(c.at[0], c.at[1], 10, c.side);
        this.renderUI();
      });
    });

    this.sideBodyEl.querySelector('#st-author-mode')?.addEventListener('click', () => {
      this.authorMode = !this.authorMode;
      this.renderUI();
    });

    this.sideBodyEl.querySelector('#st-export-json')?.addEventListener('click', () => {
      syncMeta();
      const out: Scenario = { ...s, board: cloneBoard(this.board) };
      const blob = new Blob([serializeScenario(out)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${s.meta.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'puzzle'}.pcbfix.json`;
      a.click();
      URL.revokeObjectURL(url);
      this.toast(t('Exported .pcbfix.json challenge!'), 'success');
    });

    this.sideBodyEl.querySelector('#st-export-mod')?.addEventListener('click', () => { syncMeta(); void this.exportBoardAsMod(); });

    this.sideBodyEl.querySelector('#st-share-url')?.addEventListener('click', async () => {
      syncMeta();
      const out: Scenario = { ...s, board: cloneBoard(this.board) };
      const packed = await packText(serializeScenario(out));
      const shareUrl = `${window.location.origin}${window.location.pathname}#s=${packed}`;
      await navigator.clipboard?.writeText(shareUrl);
      this.toast(t('Shareable puzzle URL copied to clipboard!'), 'success');
    });
  }

  private createBlankBoard() {
    const sc = makeStarterBoard();
    this.scenarios.push(sc);
    this.loadScenario(sc);
    this.activeTab = 'studio';
    this.showBoards = false;
    this.renderModal();
    this.renderUI();
    this.toast(t('Blank board ready. Lock a flag in the Author tab, then break it.'), 'info');
  }

  private openBoardCatalog() {
    this.showBoards = true;
    this.showHelp = false;
    this.showFeedback = false;
    this.modalPos = [0, 0];
    this.renderModal();
  }

  // ---------------- Board picker: Today (what to do next) + Library (every board, by level) ----------------

  /** What kind of board this is, for the Library's Type filter and the details. */
  private boardKind(s: Scenario): BoardKind {
    if (this.modBoards.has(s)) return 'mod';
    const root = s.generated && this.scenarios.find((x) => x.id === s.generated!.from);
    if (root && root !== s) return this.boardKind(root);
    if (isTutorialScenario(s.id)) return 'tutorial';
    if ((SOLDERING_TRACK_IDS as readonly string[]).includes(s.id)) return 'track';
    if (this.demoUrls.has(s) || (s.id.startsWith('demo-') && BOARD_INFO[s.id])) return 'open';
    if (this.bundledIds.has(s.id)) return 'handmade';
    return 'custom';
  }

  /** Name and one-line symptom, translated: "Name · symptom" titles split, else the catalogue, else the description's first sentence. */
  private boardNames(s: Scenario): { name: string; symptom: string } {
    const { name, symptom } = splitTitle(t(s.meta.title));
    if (symptom) return { name, symptom: symptom.replace(/^\p{Ll}/u, (ch) => ch.toUpperCase()) };
    const own = BOARD_INFO[s.id]?.symptom;
    if (own) return { name, symptom: t(own) };
    const d = t(s.meta.description).replace(/^(?:Beginner Tutorial|Урок для новичков) \d+:\s*/, '');
    return { name, symptom: d.split(/(?<=[.!?])\s/)[0] ?? '' };
  }

  private fmtLevel(v: number): string {
    const s = v.toFixed(1);
    return lang() === 'ru' ? s.replace('.', ',') : s;
  }

  private levelPill(s: Scenario, opts: { big?: boolean; named?: boolean } = {}): string {
    return this.levelPillOf(shownLevel(s), { ...opts, players: levelFromPlayers(s) });
  }

  private levelPillOf(v: number, opts: { big?: boolean; named?: boolean; players?: boolean } = {}): string {
    const b = levelBand(v);
    const vars = { n: this.fmtLevel(v), band: t(b.name) };
    const tip = opts.players ? t('Level {n} of 10 · {band} (from players\' results)', vars) : t('Level {n} of 10 · {band} (estimate)', vars);
    return `<span class="bp-lv ${b.id}${opts.big ? ' big' : ''}" title="${this.esc(tip)}"><b>${this.fmtLevel(v)}</b>${opts.named ? `<em>${t(b.name)}</em>` : ''}</span>`;
  }

  /** The board's picture (public/thumbs, npm run thumbs); boards without one get a labelled placeholder. */
  private boardThumb(s: Scenario, opts: { pill?: boolean; done?: boolean } = {}): string {
    const pic = !!BOARD_INFO[s.id] && !this.modBoards.has(s);
    const kind = this.boardKind(s);
    const inner = pic
      ? `<img src="./thumbs/${encodeURIComponent(s.id)}.webp" alt="" loading="lazy" decoding="async" draggable="false">`
      : `<span class="bp-ph">${this.esc(kind === 'mod' ? this.modBoards.get(s)?.mod.name ?? t('Mod') : s.generated ? t('New faults') : t('Your board'))}</span>`;
    const done = opts.done !== false && this.solvedIds.has(s.id);
    return `<span class="bp-th${pic ? '' : ' none'}">${inner}${opts.pill === false ? '' : `<span class="bp-th-lv">${this.levelPill(s)}</span>`}${done ? `<span class="bp-th-ok" title="${t('Solved')}">${icon('check', 14)}</span>` : ''}</span>`;
  }

  private learnedSet(): Set<SkillKey> {
    return new Set(learnedSkills(this.solvedIds));
  }

  /** "Start repair", or back to the bench when this board is already open. */
  private startButton(s: Scenario, idx: number, cls = 'primary'): string {
    const open = s === this.activeScenario;
    const label = open ? (this.moves > 0 ? t('Back to the bench') : t('Start repair')) : this.solvedIds.has(s.id) ? t('Play again') : t('Start repair');
    return `<button class="btn ${cls}" data-bp-start="${open ? 'close' : idx}">${open ? '' : icon('play', 13)}<span>${label}</span></button>`;
  }

  private pickReason(r: PickReason): string {
    switch (r) {
      case 'first': return t('Your first repair');
      case 'open': return t('You have this one open');
      case 'next': return t('Next on your path');
      case 'after': return t('Up after that');
      case 'skip': return t('Know the basics? Skip ahead');
    }
  }

  private pickerToday(): string {
    const index = new Map(this.scenarios.map((s, i) => [s.id, i]));
    const picks = todayPicks(new Set(index.keys()), this.solvedIds, this.activeScenario.id, this.skill);
    const learned = this.learnedSet();
    if (!picks.length) {
      return `
        <div class="bp-scroll bp-today" data-scroll="today">
          <div class="bp-done">
            <div class="bp-done-t">${t('Every board on the path is alive again.')}</div>
            <p>${t('All {n} boards of the path are solved. The Library has them all to play again; mods add more boards.', { n: PATH_ORDER.length })}</p>
            <div class="row wrap"><button class="btn primary" data-bp-tab="library">${icon('grid', 13)}<span>${t('Open the Library')}</span></button><button class="btn" data-bp-act="mods">${icon('box', 13)}<span>${t('Mods')}</span></button></div>
          </div>
          ${this.dailyStrip()}
          ${this.trackStrip()}
          ${this.pickerPath(null)}
        </div>`;
    }
    const [main, ...alts] = picks;
    const mi = index.get(main.id)!, ms = this.scenarios[mi];
    const mn = this.boardNames(ms);
    const news = newSkillsFor(ms.id, learned).slice(0, 3);
    const facts = [ms.board.components.length > 1 ? t('{n} part|{n} parts', { n: ms.board.components.length }) : '', t(KIND_LABEL[this.boardKind(ms)])].filter(Boolean).join(' · ');
    const altCards = alts.map((p) => {
      const i = index.get(p.id)!, s = this.scenarios[i], n = this.boardNames(s);
      return `
        <button class="bp-alt" data-bp-show="${i}">
          ${this.boardThumb(s)}
          <span class="bp-why">${this.pickReason(p.reason)}</span>
          <span class="bp-t">${this.esc(n.name)}</span>
          <span class="bp-s">${this.esc(n.symptom)}</span>
        </button>`;
    }).join('');
    return `
      <div class="bp-scroll bp-today" data-scroll="today">
        <div class="bp-hero">
          <button class="bp-hero-pic" data-bp-show="${mi}" title="${t('Details')}">${this.boardThumb(ms, { done: false })}</button>
          <div class="bp-hero-body">
            <span class="bp-why on">${this.pickReason(main.reason)}</span>
            <h3>${this.esc(mn.name)}</h3>
            <div class="bp-hero-s">${this.esc(mn.symptom)}</div>
            ${news.length ? `<div class="bp-chips">${news.map((k) => `<span class="bp-chip new">${t('New: {skill}', { skill: t(skillLabel(k)) })}</span>`).join('')}</div>` : ''}
            <div class="bp-facts">${this.esc(facts)}</div>
            <div class="row wrap">${this.startButton(ms, mi, 'primary lg')}<button class="btn ghost" data-bp-show="${mi}">${t('Details')}</button></div>
          </div>
        </div>
        ${this.dailyStrip()}
        ${this.trackStrip()}
        <div class="bp-row">
          ${alts.length ? (this.mobile ? `<div class="bp-or"><div class="bp-h">${t('Or try')}</div><div class="bp-swipe">${altCards}</div></div>` : altCards) : ''}
          ${this.pickerPath(main.id)}
        </div>
      </div>`;
  }

  private dailyDate(key: string): { day: string; month: string; label: string } {
    const d = new Date(`${key}T12:00:00Z`), loc = lang() === 'ru' ? 'ru-RU' : 'en-GB';
    const f = (o: Intl.DateTimeFormatOptions) => d.toLocaleDateString(loc, { ...o, timeZone: 'UTC' });
    return { day: f({ day: 'numeric' }), month: f({ month: 'short' }).replace('.', ''), label: f({ day: 'numeric', month: 'short' }) };
  }

  /** Today's daily repair: one generated puzzle per UTC day, the same for every player (src/scenarios/daily.ts). */
  private dailyStrip(): string {
    const plan = dailyPlan(dailyKey());
    const parent = this.scenarios.find((s) => s.id === plan.boardId);
    if (!parent || !referenceBoard(parent)) return '';
    const done = this.solvedIds.has(plan.id);
    const ms = msToNextDaily();
    const next = t('{h} h {m} min', { h: Math.floor(ms / 3_600_000), m: Math.floor((ms % 3_600_000) / 60_000) });
    const date = this.dailyDate(plan.key);
    const sub = done ? t('Solved. A new one in {time}.', { time: next })
      : this.mobile ? t('A new one in {time}', { time: next })
      : t('The same puzzle for every player today · a new one in {time}', { time: next });
    return `
      <div class="bp-daily">
        <div class="bp-cal"><small>${this.esc(date.month)}</small><b>${this.esc(date.day)}</b></div>
        <span class="bp-daily-lv">${this.levelPillOf(dailyLevel(plan))}</span>
        <div class="bp-daily-main"><span class="bp-t">${t('Daily repair: {board}', { board: this.esc(this.boardNames(parent).name) })}</span><span class="bp-s">${this.esc(sub)}</span></div>
        ${done ? `<span class="bp-solved">${icon('check', 14)}<span>${t('Done')}</span></span>`
          : `<button class="btn" data-bp-act="daily" ${this.dailyBusy ? 'disabled' : ''}>${this.dailyBusy ? t('Preparing…') : t('Play')}</button>`}
      </div>`;
  }

  /**
   * The high-reliability soldering track: its own path beside the main one (lesson, repair,
   * inspection per board). Shows progress and the next board to do.
   */
  private trackStrip(): string {
    const ids = SOLDERING_TRACK_IDS as readonly string[];
    const nextId = ids.find((id) => !this.trackAccepted.has(id)) ?? ids[0];
    const idx = this.scenarios.findIndex((x) => x.id === nextId);
    if (idx < 0) return '';
    const n = ids.filter((id) => this.trackAccepted.has(id)).length;
    const sub = this.mobile ? t('Based on a public-domain US Navy textbook') : t('Solder, heat, cleaning and inspection, after NEETS Module 14 (a public-domain US Navy textbook)');
    return `
      <div class="bp-daily bp-solder-track">
        <div class="bp-cal"><small>${t('Track')}</small><b>${n}/${ids.length}</b></div>
        <span class="bp-daily-lv">${this.levelPill(this.scenarios[idx])}</span>
        <div class="bp-daily-main"><span class="bp-t">${t('High-reliability soldering: {board}', { board: this.esc(t(this.scenarios[idx].meta.title)) })}</span><span class="bp-s">${this.esc(sub)}</span></div>
        ${this.startButton(this.scenarios[idx], idx, '')}
      </div>`;
  }

  /** Builds today's daily (or reopens it) and puts it on the bench. */
  private async playDaily() {
    if (this.dailyBusy) return;
    const plan = dailyPlan(dailyKey());
    const have = this.scenarios.findIndex((s) => s.id === plan.id);
    if (have >= 0) { void this.openScenario(have); return; }
    const parent = this.scenarios.find((s) => s.id === plan.boardId);
    const good = parent && referenceBoard(parent);
    if (!parent || !good) return;
    this.dailyBusy = true;
    let res: Awaited<ReturnType<typeof makeDaily>> = null;
    try {
      res = await makeDaily(plan, parent, good, `${t('Daily repair')} · ${this.dailyDate(plan.key).label}`, () => new Promise((r) => setTimeout(r, 0)));
    } catch (err) {
      this.toast(t('Could not generate a problem: {error}', { error: err instanceof Error ? err.message : String(err) }), 'danger');
    }
    this.dailyBusy = false;
    if (!res) { this.toast(t('Today\'s daily repair could not be built on this device. Try the Library meanwhile.'), 'warn'); return; }
    // one daily in the list: today's replaces an older one
    const old = this.dailyScenario ? this.scenarios.indexOf(this.dailyScenario) : -1;
    if (old >= 0) this.scenarios[old] = res.scenario;
    else this.scenarios.push(res.scenario);
    this.dailyScenario = res.scenario;
    res.scenario.meta.description = t('Today\'s daily repair: the same puzzle for every player, {n} fault on a board you may know. A new one comes at midnight UTC.|Today\'s daily repair: the same puzzle for every player, {n} faults on a board you may know. A new one comes at midnight UTC.', { n: res.faults.length });
    this.refreshScenarioSelect();
    this.loadScenario(res.scenario);
    const n = res.faults.length;
    this.toast(t('Daily repair: {n} fault is hidden on the board.|Daily repair: {n} faults are hidden on the board.', { n }), 'success');
  }

  /** Skills from solved boards: three bars, what the main pick adds, what was learned last. Never a rating. */
  private pickerPath(mainId: string | null): string {
    const learned = learnedSkills(this.solvedIds);
    const got = new Set(learned);
    const next = mainId ? newSkillsFor(mainId, got).slice(0, 3) : [];
    const chips = (keys: SkillKey[], cls: string) => keys.map((k) => `<span class="bp-sk ${cls}">${this.esc(t(skillLabel(k)))}</span>`).join('');
    if (!learned.length) {
      return `
        <div class="bp-path">
          <div class="bp-h">${t('Your path')}</div>
          <div class="bp-bars"><div class="bp-bar"><span>${t('Lessons')}</span><span class="bp-track"><span style="width:${Math.round((TUTORIAL_SCENARIO_IDS.filter((id) => this.solvedIds.has(id)).length / TUTORIAL_SCENARIO_IDS.length) * 100)}%"></span></span><span>${TUTORIAL_SCENARIO_IDS.filter((id) => this.solvedIds.has(id)).length}/${TUTORIAL_SCENARIO_IDS.length}</span></div></div>
          <p class="bp-muted">${t('Six short lessons, from a flashlight to a voltage divider. Every tool and part you use shows up here.')}</p>
          ${next.length ? `<div><div class="bp-sub">${t('Your first repair teaches')}</div><div class="bp-chips">${chips(next, 'nx')}</div></div>` : ''}
        </div>`;
    }
    const bars = SKILL_GROUPS.map((g) => {
      const all = Object.keys(SKILLS[g.kind]);
      const n = all.filter((id) => got.has(`${g.kind}:${id}` as SkillKey)).length;
      return `<div class="bp-bar"><span>${t(g.label)}</span><span class="bp-track"><span style="width:${Math.round((n / all.length) * 100)}%"></span></span><span>${n}/${all.length}</span></div>`;
    }).join('');
    const full = this.bpAllSkills ? SKILL_GROUPS.map((g) => `
      <div><div class="bp-sub">${t(g.label)}</div><div class="bp-chips">${Object.keys(SKILLS[g.kind]).map((id) => {
        const k = `${g.kind}:${id}` as SkillKey;
        return `<span class="bp-sk ${got.has(k) ? '' : 'off'}">${this.esc(t(skillLabel(k)))}</span>`;
      }).join('')}</div></div>`).join('') : '';
    return `
      <div class="bp-path">
        <div class="bp-path-head"><span class="bp-h">${t('Your path')}</span><span class="bp-muted">${t('{n} board solved|{n} boards solved', { n: this.solvedIds.size })}</span></div>
        <div class="bp-bars">${bars}</div>
        ${next.length ? `<div><div class="bp-sub">${t('Next to learn')}</div><div class="bp-chips">${chips(next, 'nx')}</div></div>` : ''}
        <div><div class="bp-sub">${t('Learned last')}</div><div class="bp-chips">${chips(learned.slice(-3).reverse(), '')}</div></div>
        ${full}
        <button class="bp-link" data-bp-act="allskills">${this.bpAllSkills ? t('Show less') : t('See all skills')}</button>
      </div>`;
  }

  private pickerSearchText(s: Scenario): string {
    const topics = TUTORIAL_TOPICS[s.id] ?? [];
    const teaches = BOARD_INFO[s.id]?.teaches ?? [];
    const mod = this.modBoards.get(s)?.mod.name ?? '';
    const sym = BOARD_INFO[s.id]?.symptom ?? '';
    return [s.meta.title, t(s.meta.title), s.meta.description, t(s.meta.description), s.meta.author, mod, sym, sym && t(sym),
      ...topics, ...topics.map((x) => t(x)), ...teaches.map(skillLabel), ...teaches.map((k) => t(skillLabel(k)))].join(' ').toLowerCase();
  }

  private pickerFiltered(): { s: Scenario; idx: number }[] {
    const q = this.boardSearch.trim().toLowerCase();
    const order = (id: string) => { const i = PATH_ORDER.indexOf(id); return i < 0 ? 999 : i; };
    return this.scenarios
      .map((s, idx) => ({ s, idx }))
      .filter(({ s }) => {
        if (s === this.dailyScenario) return false;
        if (this.bpBand !== 'all' && levelBand(shownLevel(s)).id !== this.bpBand) return false;
        if (this.bpKind !== 'all' && this.boardKind(s) !== this.bpKind) return false;
        if (this.bpSkill !== 'all' && !(BOARD_INFO[s.id]?.teaches ?? []).includes(this.bpSkill)) return false;
        if (this.bpHideSolved && this.solvedIds.has(s.id)) return false;
        return !q || this.pickerSearchText(s).includes(q);
      })
      .sort((a, b) => shownLevel(a.s) - shownLevel(b.s) || order(a.s.id) - order(b.s.id) || a.s.meta.title.localeCompare(b.s.meta.title));
  }

  private pickerLibrary(): string {
    const list = this.pickerFiltered();
    const learned = this.learnedSet();
    const kinds = (['tutorial', 'track', 'handmade', 'open', 'mod', 'custom'] as const).filter((k) => this.scenarios.some((s) => this.boardKind(s) === k));
    const skillKeys = [...new Set(this.scenarios.flatMap((s) => BOARD_INFO[s.id]?.teaches ?? []))].filter((k) => !k.startsWith('fault:'));
    const extra = (this.bpKind !== 'all' ? 1 : 0) + (this.bpSkill !== 'all' ? 1 : 0) + (this.mobile && this.bpHideSolved ? 1 : 0);
    const bandBtn = (id: 'all' | BandId, label: string) => {
      const n = id === 'all' ? 0 : this.scenarios.filter((s) => levelBand(shownLevel(s)).id === id).length;
      return `<button class="${this.bpBand === id ? 'on' : ''}" data-bp-band="${id}">${id === 'all' ? '' : `<i class="bp-dot ${id}"></i>`}${label}${n && !this.mobile ? ` <small>${n}</small>` : ''}</button>`;
    };
    const hideSolved = `<button class="bp-switch ${this.bpHideSolved ? 'on' : ''}" data-bp-act="hidesolved" role="switch" aria-checked="${this.bpHideSolved}"><i></i>${t('Hide solved')}</button>`;
    const pop = this.bpFilters ? `
      <div class="bp-pop">
        ${this.mobile ? hideSolved : ''}
        <label>${t('Type')}<select id="bp-kind"><option value="all">${t('All types')}</option>${kinds.map((k) => `<option value="${k}" ${this.bpKind === k ? 'selected' : ''}>${t(KIND_LABEL[k])}</option>`).join('')}</select></label>
        <label>${t('Uses a tool or part')}<select id="bp-skill"><option value="all">${t('Any')}</option>${SKILL_GROUPS.filter((g) => g.kind !== 'fault').map((g) => `<optgroup label="${this.esc(t(g.label))}">${skillKeys.filter((k) => k.startsWith(`${g.kind}:`)).map((k) => `<option value="${k}" ${this.bpSkill === k ? 'selected' : ''}>${this.esc(t(skillLabel(k)))}</option>`).join('')}</optgroup>`).join('')}</select></label>
      </div>` : '';
    const groups = LEVEL_BANDS.map((b) => ({ b, items: list.filter(({ s }) => levelBand(shownLevel(s)).id === b.id) })).filter((g) => g.items.length);
    const body = groups.map(({ b, items }) => {
      const solved = items.filter(({ s }) => this.solvedIds.has(s.id)).length;
      const head = `<div class="bp-band ${b.id}"><b>${t(b.name)}</b><span>${this.fmtLevel(b.from)}–${this.fmtLevel(b.to)} · ${t('{n} board|{n} boards', { n: items.length })}${solved ? ` · ${t('{n} solved', { n: solved })}` : ''}</span></div>`;
      if (this.mobile) {
        return head + items.map(({ s, idx }) => {
          const n = this.boardNames(s);
          return `
            <button class="bp-rowi ${s === this.activeScenario ? 'active' : ''}" data-bp-show="${idx}">
              ${this.boardThumb(s, { pill: false, done: false })}
              <span class="bp-rowi-main"><span class="bp-t">${this.esc(n.name)}</span><span class="bp-s">${this.esc(n.symptom)}</span></span>
              <span class="bp-rowi-end">${this.levelPill(s)}${this.solvedIds.has(s.id) ? `<span class="bp-ok">${icon('check', 15)}</span>` : ''}</span>
            </button>`;
        }).join('');
      }
      // desktop: a ruled list (the symptom is the line people scan); within a band, one group per board type
      const row = ({ s, idx }: { s: Scenario; idx: number }) => {
        const n = this.boardNames(s);
        const nw = newSkillsFor(s.id, learned)[0];
        const tut = TUTORIAL_SCENARIO_IDS.indexOf(s.id as (typeof TUTORIAL_SCENARIO_IDS)[number]);
        const note = s === this.activeScenario ? `<span class="bp-chip on">${t('Open now')}</span>`
          : nw ? `<span class="bp-chip new">${t('New: {skill}', { skill: t(skillLabel(nw)) })}</span>`
          : tut >= 0 ? `<span class="bp-chip">${t('Tutorial {n}', { n: tut + 1 })}</span>`
          : this.modBoards.has(s) ? `<span class="bp-chip">${this.esc(this.modBoards.get(s)!.mod.name)}</span>` : '';
        return `
          <button class="bp-rowd ${this.bpSel === s ? 'sel' : ''}" data-bp-show="${idx}">
            ${this.boardThumb(s, { pill: false, done: false })}
            ${this.levelPill(s)}
            <span class="bp-rowi-main"><span class="bp-t">${this.esc(n.name)}</span><span class="bp-s">${this.esc(n.symptom)}</span></span>
            <span class="bp-rowd-note">${note}</span>
            <span class="bp-rowd-ok">${this.solvedIds.has(s.id) ? `<span class="bp-ok" title="${t('Solved')}">${icon('check', 15)}<span class="sr-only">${t('Solved')}</span></span>` : ''}</span>
          </button>`;
      };
      const kindsHere = [...new Set(items.map(({ s }) => this.boardKind(s)))];
      if (kindsHere.length < 2) return head + `<div class="bp-rows">${items.map(row).join('')}</div>`;
      return head + kindsHere.map((k) => `<div class="bp-kind">${t(KIND_LABEL[k])}</div><div class="bp-rows">${items.filter(({ s }) => this.boardKind(s) === k).map(row).join('')}</div>`).join('');
    }).join('') || `<div class="bp-empty"><div>${t('No matching boards found.')}</div><button class="btn sm" data-bp-act="clear">${t('Clear filters')}</button></div>`;

    const sel = this.bpSel && this.scenarios.includes(this.bpSel) ? this.bpSel : null;
    return `
      <div class="bp-lib ${sel && !this.mobile ? 'has-sel' : ''}">
        <div class="bp-lib-main">
          <div class="bp-toolbar">
            <input type="search" id="bp-search" placeholder="${this.mobile ? t('Search boards') : t('Search boards, symptoms, tools')}" value="${this.esc(this.boardSearch)}" autocomplete="off" />
            <div class="bp-fchips">${bandBtn('all', t('All'))}${LEVEL_BANDS.map((b) => bandBtn(b.id, t(b.name))).join('')}${this.mobile ? `<button class="${this.bpFilters || extra ? 'on' : ''}" data-bp-act="filters">${icon('layers', 13)}${t('More')}${extra ? ` · ${extra}` : ''}</button>` : ''}</div>
            ${this.mobile ? '' : `${hideSolved}<div class="bp-fchips"><button class="${this.bpFilters || extra ? 'on' : ''}" data-bp-act="filters">${icon('layers', 13)}${t('Filters')}${extra ? ` · ${extra}` : ''}</button></div>`}
            ${pop}
          </div>
          <div class="bp-scroll bp-list" data-scroll="library">${body}</div>
        </div>
        ${sel && !this.mobile ? `<aside class="bp-scroll bp-drawer" data-scroll="drawer"><button class="btn ghost icon sm bp-x" data-bp-act="close-details" title="${t('Close')}">${icon('x', 14)}</button>${this.pickerDetails(sel)}</aside>` : ''}
      </div>`;
  }

  private pickerDetails(s: Scenario): string {
    const idx = this.scenarios.indexOf(s);
    const n = this.boardNames(s);
    const learned = this.learnedSet();
    const tut = isTutorialScenario(s.id);
    const uses = (BOARD_INFO[s.id]?.teaches ?? []).filter((k) => tut || !k.startsWith('fault:'));
    const news = new Set(newSkillsFor(s.id, learned));
    const mb = this.modBoards.get(s);
    const parts = s.board.components.length;
    const src = s.meta.source && /^https:\/\//.test(s.meta.source) ? s.meta.source : '';
    const facts: [string, string][] = [
      [t('Type'), t(KIND_LABEL[this.boardKind(s)]) + (mb ? ` · ${mb.mod.name}` : '')],
      [t('Author'), t(s.meta.author)],
      ...(parts > 1 ? [[t('Parts'), String(parts)] as [string, string]] : []),
      ...(s.meta.par ? [[t('Par'), t('{n} move|{n} moves', { n: s.meta.par })] as [string, string]] : []),
      [t('Solver'), s.solver === 'spice-power' ? 'SPICE + PWR' : 'DC'],
      [t('Level'), levelFromPlayers(s) ? t('{n} of 10 (from players\' results)', { n: this.fmtLevel(shownLevel(s)) }) : t('{n} of 10 (estimate)', { n: this.fmtLevel(shownLevel(s)) })],
      ...(this.videos[s.id] ? [[t('Video guide'), t('In the board\'s Overview tab')] as [string, string]] : []),
      ...(mb?.schematic ? [[t('Schematic'), t('Included')] as [string, string]] : []),
      ...(s.meta.license ? [[t('Licence'), s.meta.license] as [string, string]] : []),
    ];
    return `
      ${this.boardThumb(s, { pill: false })}
      <div class="bp-d-top">${this.levelPill(s, { big: true, named: true })}${this.solvedIds.has(s.id) ? `<span class="bp-solved">${icon('check', 14)}<span>${t('Solved')}</span></span>` : ''}</div>
      <div><h3>${this.esc(n.name)}</h3><div class="bp-d-s">${this.esc(n.symptom)}</div></div>
      <p>${this.esc(t(s.meta.description))}</p>
      ${uses.length ? (() => {
        const label = (k: SkillKey) => this.esc(t(skillLabel(k)));
        const fresh = uses.filter((k) => news.has(k)), known = uses.filter((k) => !news.has(k));
        return `<div class="bp-uses"><div class="bp-sub">${t('You\'ll use')}</div>
          ${fresh.length ? `<p><b>${t('New for you')}:</b> ${fresh.map(label).join(', ')}</p>` : ''}
          ${known.length ? `<p class="bp-muted">${fresh.length ? `${t('Also')}: ` : ''}${known.map(label).join(', ')}</p>` : ''}</div>`;
      })() : ''}
      ${this.startButton(s, idx, 'primary lg bp-go')}
      <details class="bp-more" ${this.bpMoreOpen ? 'open' : ''}>
        <summary>${icon('chevronRight', 13)}<span>${t('Board details')}</span></summary>
        <dl>${facts.map(([k, v]) => `<dt>${this.esc(k)}</dt><dd>${this.esc(v)}</dd>`).join('')}${src ? `<dt>${t('Source')}</dt><dd><a href="${this.esc(src)}" target="_blank" rel="noopener">${this.esc(src.replace(/^https:\/\//, ''))}</a></dd>` : ''}</dl>
        ${s.meta.credits ? `<p class="bp-credits">${this.esc(t(s.meta.credits))}</p>` : ''}
      </details>`;
  }

  private renderBoardsModal() {
    // keep scroll positions and the search caret across re-renders
    const scroll = new Map<string, number>();
    this.modalRootEl.querySelectorAll<HTMLElement>('[data-scroll]').forEach((el) => scroll.set(el.dataset.scroll!, el.scrollTop));
    const searchFocused = document.activeElement?.id === 'bp-search';
    const caret = searchFocused ? (document.activeElement as HTMLInputElement).selectionStart : null;
    if (this.bpSel && !this.scenarios.includes(this.bpSel)) this.bpSel = null;

    const lib = this.bpTab === 'library';
    const attention = this.modsNeedAttention();
    const menu = this.bpMenu ? `
      <div class="bp-menu" role="menu">
        <button data-bp-act="new" role="menuitem">${icon('plus', 15)}<span>${t('New blank board')}<small>${t('Build a board or author a puzzle')}</small></span></button>
        <button data-bp-act="import" role="menuitem">${icon('upload', 15)}<span>${t('Import a file')}<small>${t('KiCad, boardview, .pcbfix.json')}</small></span></button>
        <button data-bp-act="mods" role="menuitem">${icon('box', 15)}<span>${t('Mods')}${attention ? ' ⚠' : ''}<small>${t('Install, remove and make mods')}</small></span></button>
      </div>` : '';
    const tabs = `<div class="bp-tabs" role="tablist"><button role="tab" aria-selected="${!lib}" class="${lib ? '' : 'on'}" data-bp-tab="today">${t('Today')}</button><button role="tab" aria-selected="${lib}" class="${lib ? 'on' : ''}" data-bp-tab="library">${t('Library')}</button></div>`;
    const sheet = this.mobile && this.bpSel ? `
      <div class="bp-sheet-bg" data-bp-act="close-details">
        <div class="bp-sheet bp-scroll" data-scroll="sheet" role="dialog" aria-label="${this.esc(this.boardNames(this.bpSel).name)}"><div class="bp-grab"></div>${this.pickerDetails(this.bpSel)}</div>
      </div>` : '';

    this.modalRootEl.innerHTML = `
      <div class="modal-backdrop" id="modal-close-bg">
        <div class="modal board-catalog bp" style="transform: translate3d(${this.modalPos[0]}px, ${this.modalPos[1]}px, 0)">
          <div class="modal-head" title="${this.mobile ? '' : t('Drag to move window')}">
            <div class="row">
              <h2>${this.mobile ? (lib ? t('Library') : t('Today')) : t('Boards')}</h2>
              ${tabs}
            </div>
            <div class="row">
              <button class="btn ghost icon sm bp-more-btn" data-bp-act="menu" title="${t('New board, import, mods')}" aria-haspopup="menu" aria-expanded="${this.bpMenu}">${icon('more', 16)}${attention ? '<i class="bp-attn"></i>' : ''}</button>
              <button class="btn ghost icon sm" id="modal-close" title="${t('Close (Esc)')}">${icon('x', 14)}</button>
            </div>
            ${menu}
          </div>
          ${lib ? this.pickerLibrary() : this.pickerToday()}
          <nav class="bp-tabbar">
            <button class="${lib ? '' : 'on'}" data-bp-tab="today">${icon('target', 20)}<span>${t('Today')}</span></button>
            <button class="${lib ? 'on' : ''}" data-bp-tab="library">${icon('grid', 20)}<span>${t('Library')}</span></button>
          </nav>
          ${sheet}
        </div>
      </div>`;

    this.modalRootEl.querySelectorAll<HTMLElement>('[data-scroll]').forEach((el) => { const v = scroll.get(el.dataset.scroll!); if (v) el.scrollTop = v; });
    const searchEl = this.modalRootEl.querySelector<HTMLInputElement>('#bp-search');
    if (searchFocused && searchEl) { searchEl.focus(); searchEl.setSelectionRange(caret, caret); }
    this.modalRootEl.querySelector<HTMLDetailsElement>('.bp-more')?.addEventListener('toggle', (e) => { this.bpMoreOpen = (e.target as HTMLDetailsElement).open; });

    const closeModal = () => {
      this.showBoards = false;
      this.bpSel = null;
      this.bpMenu = false;
      this.bpFilters = false;
      this.renderModal();
    };
    const modal = this.modalRootEl.querySelector<HTMLElement>('.modal')!;
    modal.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const el = target.closest<HTMLElement>('[data-bp-tab],[data-bp-start],[data-bp-show],[data-bp-band],[data-bp-act]');
      // a click anywhere else closes the ⋯ menu
      if (this.bpMenu && el?.dataset.bpAct !== 'menu' && !target.closest('.bp-menu')) { this.bpMenu = false; if (!el) { this.renderBoardsModal(); return; } }
      if (!el) return;
      const d = el.dataset;
      if (d.bpTab) { this.bpTab = d.bpTab as 'today' | 'library'; this.bpFilters = false; if (this.mobile) this.bpSel = null; }
      else if (d.bpStart) {
        closeModal();
        if (d.bpStart !== 'close' && this.scenarios[Number(d.bpStart)]) void this.openScenario(Number(d.bpStart));
        return;
      } else if (d.bpShow) {
        const s = this.scenarios[Number(d.bpShow)];
        if (!s) return;
        if (!this.mobile) this.bpTab = 'library';
        this.bpSel = this.bpSel === s && !this.mobile && el.classList.contains('bp-card') ? null : s;
      } else if (d.bpBand) this.bpBand = d.bpBand as 'all' | BandId;
      else switch (d.bpAct) {
        case 'menu': this.bpMenu = !this.bpMenu; break;
        case 'filters': this.bpFilters = !this.bpFilters; break;
        case 'hidesolved': this.bpHideSolved = !this.bpHideSolved; break;
        case 'allskills': this.bpAllSkills = !this.bpAllSkills; break;
        case 'clear': this.boardSearch = ''; this.bpBand = 'all'; this.bpKind = 'all'; this.bpSkill = 'all'; this.bpHideSolved = false; break;
        case 'close-details': if (target !== el && el.classList.contains('bp-sheet-bg')) return; this.bpSel = null; break;
        case 'daily': closeModal(); void this.playDaily(); return;
        case 'new': closeModal(); this.createBlankBoard(); return;
        case 'import': closeModal(); this.fileInputEl.click(); return;
        case 'mods': this.showBoards = false; this.bpMenu = false; this.showMods = true; this.renderModal(); return;
        default: return;
      }
      this.renderBoardsModal();
    });
    modal.addEventListener('change', (e) => {
      const el = e.target as HTMLSelectElement;
      if (el.id === 'bp-kind') this.bpKind = el.value as 'all' | BoardKind;
      else if (el.id === 'bp-skill') this.bpSkill = el.value as 'all' | SkillKey;
      else return;
      this.renderBoardsModal();
    });
    searchEl?.addEventListener('input', () => { this.boardSearch = searchEl.value; this.renderBoardsModal(); });

    this.modalRootEl.querySelector('#modal-close')?.addEventListener('click', closeModal);
    this.modalRootEl.querySelector('#modal-close-bg')?.addEventListener('click', (e) => {
      if (this.suppressModalBgClose) {
        this.suppressModalBgClose = false;
        return;
      }
      if ((e.target as HTMLElement).id === 'modal-close-bg') closeModal();
    });
  }

  /** Modding guide: on the website next to the bench; the desktop app opens the site in the browser. */
  private get moddingUrl() {
    return desktop ? `${BRAND.site}modding.html` : './modding.html';
  }

  private renderModsModal() {
    const { mods, failed } = this.modResult;
    const browse = this.modsView === 'browse' && !!this.modio;
    const community = this.modsView === 'community';
    const cu = community ? this.loadCommunityUi() : this.communityUi;
    const submitFor = cu?.submitFor ?? null;
    const boardIdx = (b: ModBoard) => this.scenarios.findIndex((s) => this.modBoards.get(s) === b);
    const official = this.loadouts.active === OFFICIAL;
    const needLine = (n: ModNeed) => {
      const id = this.esc(n.id), range = this.esc(n.range);
      const find = this.modio ? `<button class="btn sm ghost" data-mod-find="${id}">${icon('globe', 11)}<span>${t('Find on mod.io')}</span></button>` : '';
      if (n.why === 'missing') return `<li><span>${t('needs «{mod}» {range}: not installed', { mod: id, range })}</span>${find}</li>`;
      if (n.why === 'version') return `<li><span>${t('needs «{mod}» {range}: you have {have}', { mod: id, range, have: this.esc(n.have ?? '?') })}</span>${find}</li>`;
      if (n.why === 'off') return `<li><span>${t('needs «{mod}»: it is turned off', { mod: id })}</span><button class="btn sm ghost" data-mod-enable="${id}">${t('Turn on')}</button></li>`;
      return `<li><span>${t('needs «{mod}», which can\'t run either', { mod: id })}</span></li>`;
    };
    const modCards = mods.map((m) => {
      const mf = m.manifest;
      const st = this.modResult.status.get(mf.id);
      const on = isModOn(this.loadouts, mf.id);
      const reqs = Object.entries(mf.requires);
      return `
        <div class="card mod-card${st?.state === 'active' ? '' : ' mod-inactive'}">
          <div class="mod-head">
            <div>
              <div class="mod-name">${this.esc(mf.name)} <span class="muted mono">v${this.esc(mf.version)}</span></div>
              <div class="muted">${t('by {author}', { author: this.esc(mf.author) })} · ${this.esc(mf.license)} · ${this.esc(t(m.source.origin))}${mf.homepage ? ` · <a href="${this.esc(mf.homepage)}" target="_blank" rel="noopener">${t('homepage')}</a>` : ''}</div>
            </div>
            <div class="row">
              <label class="mod-toggle" title="${official ? t('Turning a mod on switches to «My mods»') : t('Turn this mod on or off in this loadout')}"><input type="checkbox" data-mod-on="${this.esc(mf.id)}" ${on ? 'checked' : ''} /><span>${on ? t('On') : t('Off')}</span></label>
              ${m.source.origin === 'Installed' ? `<button class="btn sm ghost" data-mod-remove="${this.esc(mf.id)}" title="${t('Remove this mod')}">${icon('x', 12)}<span>${t('Remove')}</span></button>` : ''}
            </div>
          </div>
          ${mf.description ? `<p class="text-2" style="margin:0">${this.esc(mf.description)}</p>` : ''}
          ${reqs.length ? `<div class="muted mod-reqs">${t('Uses: {mods}', { mods: reqs.map(([id, r]) => `${this.esc(id)} ${this.esc(r)}`).join(', ') })}</div>` : ''}
          ${st?.state === 'blocked' ? `
            <div class="mod-needs">
              <div>${t("Can't run:")}</div>
              <ul>${st.needs.map(needLine).join('')}${st.conflicts.map((c) => `<li><span>${t("can't run together with «{mod}»", { mod: this.esc(c) })}</span></li>`).join('')}</ul>
            </div>` : ''}
          ${mf.code ? this.codeHtml(m) : ''}
          ${st?.state === 'active' ? this.modChangesHtml(mf) : ''}
          ${st?.state === 'active' ? this.benchHtml(mf.id) : ''}
          ${st?.state === 'active' && m.boards.length ? `
          <div class="mod-boards">
            ${m.boards.map((b) => `<button class="btn sm" data-mod-open="${boardIdx(b)}">${icon('play', 11)}<span>${this.esc(b.stub.meta.title)}</span>${b.schematic ? `<span class="muted">· ${t('schematic')}</span>` : ''}</button>`).join('')}
          </div>` : ''}
          ${m.warnings.length ? `<details class="mod-warn"><summary>${t('{n} warning|{n} warnings', { n: m.warnings.length })}</summary><ul>${m.warnings.map((w) => `<li>${this.esc(w)}</li>`).join('')}</ul></details>` : ''}
        </div>`;
    }).join('');
    const failedCards = failed.map((f) => `
      <div class="card mod-card mod-failed">
        <div class="card-title" style="margin:0">${icon('x', 13)} ${this.esc(f.name)} <span class="muted">${this.esc(f.origin)}</span></div>
        <p class="text-2 mono" style="margin:0;overflow-wrap:anywhere">${this.esc(f.error)}</p>
      </div>`).join('');

    this.modalRootEl.innerHTML = `
      <div class="modal-backdrop" id="mods-close-bg">
        <div class="modal board-catalog" style="transform: translate3d(${this.modalPos[0]}px, ${this.modalPos[1]}px, 0)">
          <div class="modal-head" title="${t('Drag to move window')}">
            <div class="row">
              <h2>${t('Mods')}</h2>
              <span class="badge info">${t('{n} loaded', { n: mods.length })}</span>
            </div>
            <div class="row">
              <button class="btn sm primary" id="mods-install">${icon('upload', 13)}<span>${t('Install mod (.zip)')}</span></button>
              ${desktop ? `<button class="btn sm" id="mods-folder" title="${this.esc(modsFolderPath ?? '')}">${icon('box', 13)}<span>${t('Open mods folder')}</span></button>` : ''}
              <button class="btn sm" id="mods-back">${icon('grid', 13)}<span>${t('Boards')}</span></button>
              <button class="btn ghost icon sm" id="mods-close" title="${t('Close (Esc)')}">${icon('x', 14)}</button>
            </div>
          </div>
          <div class="cat-body">
            ${submitFor ? '' : `
              <div class="seg mods-tabs">
                <button class="${browse || community ? '' : 'on'}" data-mods-view="installed">${t('Installed')} · ${mods.length}</button>
                <button class="${community ? 'on' : ''}" data-mods-view="community">${icon('users', 12)} ${t('Community')}</button>
                ${this.modio ? `<button class="${browse ? 'on' : ''}" data-mods-view="browse">${icon('globe', 12)} ${t('Browse mod.io')}</button>` : ''}
              </div>`}
            ${submitFor ? cu!.submitHtml(submitFor) : community ? (cu ? cu.communityHtml() : `<div class="muted modio-msg">${t('Loading mods…')}</div>`) : browse ? this.modioBrowseHtml() : `
            <div class="card">
              <p class="text-2" style="margin:0">
                ${this.mobile ? t('Boards, puzzles, notes and rules made by others. A mod with code runs only if you turn code mods on.') : t('Mods add what other people made: boards with their BOM and schematic, repair puzzles, board notes, part models, fault types and rules. Most mods are data only. A mod with code runs only if you turn code mods on, and then in a sandbox.')}
                ${desktop ? t('Install a .zip here, or put mod folders / .zip files into the mods folder and reload (Ctrl/Cmd+R).') : t('Install a .zip here or drop it on the bench; it stays in this browser.')}
              </p>
              <div class="row wrap">
                <a class="btn sm" href="${this.moddingUrl}" target="_blank" rel="noopener">${icon('book', 13)}<span>${t('How to make a mod')}</span></a>
                <button class="btn sm ghost" id="mods-export">${icon('download', 13)}<span>${t('Current board as a mod')}</span></button>
              </div>
            </div>
            ${this.safeMode ? `
              <div class="card mod-failed mod-safe">
                <span>${t('Safe mode: mods are off for this visit.')}</span>
                <button class="btn sm" id="mods-leave-safe">${t('Leave safe mode')}</button>
              </div>` : this.loadoutBarHtml()}
            ${mods.some((m) => m.manifest.code) || this.codeModsOn ? this.codeSwitchHtml() : ''}
            ${this.officialCardsHtml()}
            ${failedCards}
            ${modCards || `<div class="muted" style="padding:24px;text-align:center">${this.modio ? t('No mods yet. Browse mod.io, install a mod .zip, or make one from any board with «Current board as a mod».') : t('No mods yet. Install a mod .zip, or make one from any board with «Current board as a mod».')}</div>`}
            `}
          </div>
          <input type="file" id="mods-file" accept=".zip,application/zip" hidden />
        </div>
      </div>`;

    const close = () => { this.showMods = false; this.renderModal(); };
    const root = this.modalRootEl;
    root.querySelector('#mods-close')?.addEventListener('click', close);
    root.querySelector('#mods-close-bg')?.addEventListener('click', (e) => {
      if (this.suppressModalBgClose) { this.suppressModalBgClose = false; return; }
      if ((e.target as HTMLElement).id === 'mods-close-bg') close();
    });
    root.querySelector('#mods-back')?.addEventListener('click', () => { this.showMods = false; this.showBoards = true; this.renderModal(); });
    const fileEl = root.querySelector<HTMLInputElement>('#mods-file')!;
    root.querySelector('#mods-install')?.addEventListener('click', () => fileEl.click());
    fileEl.addEventListener('change', async () => {
      const f = fileEl.files?.[0];
      if (!f) return;
      // installed cleanly: show its first board; otherwise stay here to show the error / warnings
      const warnings = await this.installModFile(f);
      if (warnings === 0) close();
      else if (this.showMods) this.renderModsModal();
    });
    root.querySelector('#mods-folder')?.addEventListener('click', () => void desktop?.openModsFolder());
    root.querySelectorAll<HTMLButtonElement>('[data-mods-view]').forEach((b) => b.addEventListener('click', () => {
      const v = b.dataset.modsView;
      this.modsView = v === 'browse' ? 'browse' : v === 'community' ? 'community' : 'installed';
      this.renderModsModal();
      if (this.modsView === 'browse' && !this.modioList.length && !this.modioLoading && !this.modioError) void this.loadModioPage(true);
    }));
    if (community && cu?.unloaded) void cu.loadCommunity();
    if (browse && !submitFor) this.bindModioBrowse(root);
    if (community && cu && !submitFor) cu.bindCommunity(root);
    if (submitFor) cu!.bindSubmit(root, submitFor);
    root.querySelectorAll<HTMLButtonElement>('[data-mod-submit]').forEach((b) => b.addEventListener('click', () => {
      const id = b.dataset.modSubmit!;
      void this.communityUiReady().then((x) => x.openSubmit(id));
    }));
    root.querySelector('#mods-export')?.addEventListener('click', () => void this.exportBoardAsMod());
    root.querySelectorAll<HTMLButtonElement>('[data-mod-open]').forEach((b) => b.addEventListener('click', () => {
      const i = Number(b.dataset.modOpen);
      close();
      if (this.scenarios[i]) void this.openScenario(i);
    }));
    root.querySelector<HTMLInputElement>('#code-mods-on')?.addEventListener('change', (e) => {
      const on = (e.target as HTMLInputElement).checked;
      if (on && !confirm(t('Code mods run other people\'s programs inside DEADBOARD. They run in a sandbox with no access to the page, your files or the network (unless a mod asks and you allow it), but this protection hasn\'t had an outside security review yet. Turn on code mods?'))) { (e.target as HTMLInputElement).checked = false; return; }
      this.codeModsOn = on;
      try { localStorage.setItem('deadboard_code_mods', on ? '1' : '0'); } catch { /* storage unavailable */ }
      void this.syncCodeMods();
      this.renderModsModal();
    });
    root.querySelectorAll<HTMLButtonElement>('[data-use-solver]').forEach((b) => b.addEventListener('click', () => {
      this.modSolver = b.dataset.useSolver!;
      this.simFromMod = false;
      this.refreshSolverSelect();
      this.boot.powerOff();
      this.recompute(false);
      this.renderUI();
      this.renderModsModal();
      this.toast(t('Solving with {solver}. Switch back under Bench → Solver.', { solver: this.codeHost.solvers().find((x) => x.address === this.modSolver)?.name ?? '' }), 'info');
    }));
    root.querySelectorAll<HTMLButtonElement>('[data-mod-bench]').forEach((b) => b.addEventListener('click', () => void this.runBenchCheck(b.dataset.modBench!)));
    root.querySelectorAll<HTMLInputElement>('[data-mod-on]').forEach((el) => el.addEventListener('change', () => {
      void this.applyLoadouts(setModOn(this.loadouts, el.dataset.modOn!, el.checked));
    }));
    root.querySelectorAll<HTMLButtonElement>('[data-mod-enable]').forEach((b) => b.addEventListener('click', () => {
      void this.applyLoadouts(setModOn(this.loadouts, b.dataset.modEnable!, true));
    }));
    root.querySelectorAll<HTMLButtonElement>('[data-mod-find]').forEach((b) => b.addEventListener('click', () => {
      this.modsView = 'browse';
      this.modioQ = b.dataset.modFind!;
      this.renderModsModal();
      void this.loadModioPage(true);
    }));
    root.querySelector('#mods-leave-safe')?.addEventListener('click', () => {
      // reload without ?safe (a reload is needed even when the address doesn't change: automatic safe mode)
      history.replaceState(history.state, '', this.leaveSafeUrl());
      location.reload();
    });
    root.querySelector<HTMLSelectElement>('#loadout-select')?.addEventListener('change', (e) => {
      void this.applyLoadouts(switchLoadout(this.loadouts, (e.target as HTMLSelectElement).value));
    });
    root.querySelector('#loadout-new')?.addEventListener('click', () => {
      const name = prompt(t('Name of the new loadout'), '');
      if (name === null) return;
      void this.applyLoadouts(newLoadout(this.loadouts, name || t('Loadout'), mods.map((m) => m.manifest.id)));
    });
    root.querySelector('#loadout-delete')?.addEventListener('click', () => {
      const l = this.loadouts.custom.find((x) => x.id === this.loadouts.active);
      if (!l || !confirm(t('Delete the loadout «{name}»? Your mods stay installed.', { name: l.name }))) return;
      void this.applyLoadouts(deleteLoadout(this.loadouts, l.id));
    });
    root.querySelectorAll<HTMLButtonElement>('[data-mod-remove]').forEach((b) => b.addEventListener('click', async () => {
      const id = b.dataset.modRemove!;
      const name = mods.find((m) => m.manifest.id === id)?.manifest.name ?? id;
      if (!confirm(t('Remove the mod «{name}»? Its boards disappear from the list (your progress on them is kept).', { name }))) return;
      try {
        await removeInstalled(id);
        forgetModioInstall(id);
        await this.loadMods();
        this.refreshScenarioSelect();
        if (this.started) { this.recompute(true); this.renderUI(); }
        this.toast(t('Removed mod «{name}»', { name }), 'success');
      } catch (e) {
        this.toast(t('Could not remove the mod: {error}', { error: e instanceof Error ? e.message : String(e) }), 'danger');
      }
      this.renderModsModal();
    }));
  }

  /** A field value in a few words, for the list of changes. */
  private briefValue(field: string, v: unknown): string {
    if (v === undefined || v === null) return '—';
    if (Array.isArray(v) && field === 'units') {
      // a device's units: kind and the key number of each (Vth, Vf at the first point, hFE)
      return this.esc((v as Record<string, unknown>[]).map((u) => {
        const vf = Array.isArray(u.vf) ? (u.vf as number[][])[0] : null;
        return `${u.kind}${typeof u.vth === 'number' ? ` Vth ${u.vth} V` : ''}${vf ? ` Vf ${vf[0]} V @ ${vf[1]} A` : ''}${typeof u.hfe === 'number' ? ` hFE ${u.hfe}` : ''}`;
      }).join(', '));
    }
    if (Array.isArray(v)) return field === 'objectives' ? t('{n} test|{n} tests', { n: v.length }) : t('{n} note|{n} notes', { n: v.length });
    const s = String(v);
    return this.esc(field === 'title' || field === 'description' ? `«${s.length > 48 ? s.slice(0, 47) + '…' : s}»` : s);
  }

  /** What a running mod's patches did: changed fields, conflicts, skipped patches, missing targets. */
  private modChangesHtml(mf: ModManifest): string {
    const lines: string[] = [];
    const warn: string[] = [];
    const titleOf = (addr: string) => this.esc(t(this.patchLog.get(addr)?.title ?? addr));
    for (const [addr, { res }] of this.patchLog) {
      for (const c of res.changes.filter((x) => x.modId === mf.id)) {
        lines.push(`<li><b>${titleOf(addr)}</b> · ${this.esc(c.field)}: ${this.briefValue(c.field, c.before)} → ${this.briefValue(c.field, c.after)}${c.why ? `<div class="muted">${this.esc(c.why)}</div>` : ''}</li>`);
      }
      for (const c of res.conflicts.filter((x) => x.mods.includes(mf.id))) {
        const winner = c.mods[c.mods.length - 1];
        warn.push(`<li>${t('{board}: «{field}» is also set by {mods}; {winner} wins (loaded last)', { board: titleOf(addr), field: this.esc(c.field), mods: this.esc(c.mods.filter((x) => x !== mf.id).join(', ')), winner: this.esc(winner) })}</li>`);
      }
      for (const sk of res.skipped.filter((x) => x.modId === mf.id)) {
        warn.push(`<li>${t('{board}: patch skipped ({why})', { board: titleOf(addr), why: this.esc(sk.problems.join('; ')) })}</li>`);
      }
    }
    const listed = new Set([...this.scenarios.map((s) => this.addressOf(s)), ...(this.devices?.addresses ?? []), ...(this.faults?.addresses ?? []), ...(this.meters?.addresses ?? []), ...this.rules.addresses]);
    for (const c of this.devices?.clashes ?? []) {
      if (c.mods.includes(mf.id)) warn.push(`<li>${t('{mpn} is also added by {mods}; {winner} is used (loaded last)', { mpn: this.esc(c.mpn), mods: this.esc(c.mods.filter((x) => x !== mf.id).join(', ')), winner: this.esc(c.mods[c.mods.length - 1]) })}</li>`);
    }
    const targets = [...mf.patches.map((p) => p.target), ...mf.knowledge.map((k) => k.board), ...mf.puzzles.map((p) => p.board)];
    for (const addr of new Set(targets)) if (!listed.has(addr)) warn.push(`<li>${t('{board} is not loaded, so what this mod adds to it is unused', { board: this.esc(addr) })}</li>`);
    const adds = [
      mf.knowledge.length ? t('{n} knowledge pack|{n} knowledge packs', { n: mf.knowledge.length }) : '',
      mf.puzzles.length ? t('{n} puzzle|{n} puzzles', { n: mf.puzzles.length }) : '',
      mf.faultTypes.length ? t('{n} fault type|{n} fault types', { n: mf.faultTypes.length }) + ` (${this.esc(mf.faultTypes.map((f) => f.name).join(', '))})` : '',
      mf.rules.length ? t('{n} rule|{n} rules', { n: mf.rules.length }) : '',
      mf.meters.length ? t('{n} meter|{n} meters', { n: mf.meters.length }) + ` (${this.esc(mf.meters.map((m) => m.name).join(', '))})` : '',
      mf.devices.length ? t('{n} device model|{n} device models', { n: mf.devices.length }) + ` (${this.esc(mf.devices.map((d) => d.mpn).join(', '))})` : '',
    ].filter(Boolean);
    return `
      ${adds.length ? `<div class="muted mod-reqs">${t('Adds: {what}', { what: adds.join(', ') })}</div>` : ''}
      ${lines.length ? `<details class="mod-changes"><summary>${t('Changes {n} field|Changes {n} fields', { n: lines.length })}</summary><ul>${lines.join('')}</ul></details>` : ''}
      ${warn.length ? `<div class="mod-needs"><ul>${warn.join('')}</ul></div>` : ''}`;
  }

  /** The experimental switch for code mods. */
  private codeSwitchHtml(): string {
    if (!this.codeModsSupported) return `<div class="card muted mod-code-switch">${t('Mods that contain code run on the website and in the desktop app, not in this app.')}</div>`;
    return `
      <div class="card mod-code-switch">
        <label class="mod-toggle"><input type="checkbox" id="code-mods-on" ${this.codeModsOn ? 'checked' : ''} /><span><b>${t('Code mods')}</b> · ${t('experimental')}</span></label>
        <span class="muted">${t('Mods with code (new solvers, tools) run in a sandbox: no access to the page, your files or the network unless a mod asks.')}</span>
      </div>`;
  }

  /** What a code mod's card says about its code: permissions, whether it runs, what it registered. */
  private codeHtml(m: LoadedMod): string {
    const code = m.manifest.code!;
    const id = m.manifest.id;
    const perms = code.permissions.length ? code.permissions.map((p) => `<span class="badge warn">${this.esc(p)}</span>`).join(' ') : `<span class="muted">${t('no permissions')}</span>`;
    const st = this.codeHost.status(id);
    const solvers = this.codeHost.solvers().filter((x) => x.modId === id);
    const state = !this.codeModsSupported ? t('not available in this app')
      : !this.codeModsOn ? t('not running: code mods are off')
      : this.modResult.status.get(id)?.state !== 'active' ? t('not running')
      : !st || st.state === 'starting' ? t('starting…')
      : st.state === 'crashed' ? `<span class="mod-code-err">${t('stopped: {error}', { error: this.esc(st.error ?? '') })}</span>`
      : t('running in the sandbox');
    return `
      <div class="mod-code">
        <div>${icon('box', 11)} ${t('Runs code')} · ${perms} · <span class="muted">${state}</span></div>
        ${this.codeHost.importers().filter((x) => x.modId === id).map((x) => `<div>${t('Opens')}: <b>${this.esc(x.name)}</b> <span class="mono">${this.esc(x.extensions.join(' '))}</span> <span class="muted">· ${t('drop a file on the bench')}</span></div>`).join('')}
        ${solvers.map((x) => `<div class="row wrap"><span>${t('Solver')}: <b>${this.esc(x.name)}</b></span>${this.modSolver === x.address ? `<span class="badge pass">${t('in use')}</span>` : `<button class="btn sm ghost" data-use-solver="${this.esc(x.address)}">${t('Use')}</button>`}</div>`).join('')}
      </div>`;
  }

  /** Bench check button and the last report, on a running mod's card. */
  private benchHtml(modId: string): string {
    const r = this.benchReports.get(modId);
    const running = this.benchRunning === modId;
    const n = (l: string) => r?.findings.filter((f) => f.level === l).length ?? 0;
    const mark = { pass: '✓', warn: '!', fail: '✗' } as const;
    const title = (addr: string) => {
      const sc = this.scenarios.find((x) => this.addressOf(x) === addr);
      return this.esc(sc ? t(sc.meta.title) : addr);
    };
    return `
      <div class="bench">
        <div class="row wrap">
          <button class="btn sm ghost" data-mod-bench="${this.esc(modId)}" ${this.benchRunning ? 'disabled' : ''} title="${t('Test this mod on the simulator: its boards, puzzles, patches, knowledge and devices')}">${icon('play', 11)}<span>${running ? t('Checking…') : t('Bench check')}</span></button>
          ${this.modResult.mods.some((m) => m.manifest.id === modId && m.source.origin === 'Installed') ? `<button class="btn sm ghost" data-mod-submit="${this.esc(modId)}" title="${t('Send this mod for review; once accepted it is listed under Community for everyone')}">${icon('upload', 11)}<span>${t('Submit')}</span></button>` : ''}
          ${running ? `<span class="muted" id="bench-step"></span>` : ''}
          ${r && !running ? `<span class="bench-sum"><span class="pass">✓ ${n('pass')}</span> <span class="warn">! ${n('warn')}</span> <span class="fail">✗ ${n('fail')}</span> <span class="muted">· ${(r.ms / 1000).toFixed(1)} s</span></span>` : ''}
        </div>
        ${r && !running ? `
          <details class="mod-changes" ${n('fail') ? 'open' : ''}><summary>${t('Bench check report')}</summary>
            <ul>${r.findings.map((f) => `<li class="bench-${f.level}"><b>${mark[f.level]}</b> ${title(f.item)}: ${this.esc(f.text)}</li>`).join('')}</ul>
            ${r.moved.filter((m) => m.nets.length).map((m) => `
              <div class="bench-moved"><b>${this.esc(t(m.title))}</b>: ${t('{n} net moved|{n} nets moved', { n: m.netsMoved })}
                <ul>${m.nets.slice(0, 6).map((x) => `<li class="mono">${this.esc(x.net)}: ${x.before.toFixed(3)} V → ${x.after.toFixed(3)} V</li>`).join('')}</ul>
              </div>`).join('')}
          </details>` : ''}
      </div>`;
  }

  /** Runs the bench check on a running mod, against the boards as listed (patched) here. */
  private async runBenchCheck(modId: string) {
    const mod = this.modResult.active.find((m) => m.manifest.id === modId);
    if (!mod || this.benchRunning) return;
    this.benchRunning = modId;
    this.renderModsModal();
    const ctx: BenchContext = {
      board: async (address) => {
        const idx = this.scenarios.findIndex((s) => this.addressOf(s) === address && !this.modBoards.get(s)?.basedOn);
        if (idx < 0) return null;
        const sc = await this.ensureLoaded(idx, true);
        return sc ? { title: sc.meta.title, scenario: sc } : null;
      },
      modSolvers: (id) => this.codeHost.solvers().filter((x) => x.modId === id),
      solveWith: async (address, board, conn, title, o) => simFromResult(board, conn, await this.codeHost.solve(address, { netlist: buildNetlist(board, conn, title, o.switches), meters: o.meters })),
      boardAddresses: () => this.scenarios
        .filter((s) => !this.modBoards.get(s)?.basedOn && !s.generated)
        .map((s) => this.addressOf(s))
        .filter((a): a is string => !!a),
      step: async (what) => {
        const el = this.modalRootEl.querySelector('#bench-step');
        if (el) el.textContent = t(what);
        await new Promise((r) => setTimeout(r, 0)); // let the window paint between solves
      },
    };
    try {
      const { benchCheck } = await import('../mods/benchcheck');
      this.benchReports.set(modId, await benchCheck(mod, this.modResult.active, ctx));
    } catch (e) {
      this.toast(t('Bench check failed: {error}', { error: e instanceof Error ? e.message : String(e) }), 'danger');
    }
    this.benchRunning = null;
    this.refreshScenarioSelect();
    if (this.showMods) this.renderModsModal();
  }

  /** The mods that ship with the app: always on, listed so it's clear what community mods build on. */
  private officialCardsHtml(): string {
    return OFFICIAL_MODS.map((om) => {
      const changed = [...this.patchLog].filter(([addr]) => addr.startsWith(`${om.id}/`));
      return `
        <div class="card mod-card mod-official">
          <div class="mod-head">
            <div>
              <div class="mod-name">${t(om.name)} <span class="muted mono">v${om.version}</span> <span class="badge pass">${t('Official')}</span></div>
              <div class="muted">${t('Ships with DEADBOARD · always on')} · <span class="mono">${om.id}</span></div>
            </div>
          </div>
          <p class="text-2" style="margin:0">${t(om.description)}</p>
          ${om.id === 'official-faults' ? `<div class="muted mod-reqs">${t('{n} fault class|{n} fault classes', { n: FAULT_CLASSES.length })}${this.faults?.types.length ? ` · ${t('{n} from mods in use', { n: this.faults.types.length })}` : ''}</div>` : ''}
          ${om.id === 'official-rules' ? `<div class="muted mod-reqs">${t('{n} rule|{n} rules', { n: this.rules.rules.length })}</div>` : ''}
          ${om.id === 'official-instruments' && (this.meters?.meters.length ?? 0) > 1 ? `<div class="muted mod-reqs">${t('{n} meter|{n} meters', { n: this.meters!.meters.length })}</div>` : ''}
          ${om.id === 'official-solvers' ? `<div class="muted mod-reqs">${SOLVERS.map((x) => `<span title="${this.esc(t(x.description))}">${t(x.name)}</span>`).join(' · ')} · ${t('{n} device model|{n} device models', { n: allDevices().length })}${this.devices?.overlay.length ? ` · ${t('{n} from mods in use', { n: this.devices.overlay.length })}` : ''}</div>` : ''}
          ${changed.length && !this.safeMode ? `
            <details class="mod-changes"><summary>${om.id === 'official-boards' ? t('{n} board changed by mods|{n} boards changed by mods', { n: changed.length }) : t('{n} item changed by mods|{n} items changed by mods', { n: changed.length })}</summary>
              <ul>${changed.map(([, { title, res }]) => `<li><b>${this.esc(t(title))}</b> · ${this.esc([...new Set(res.changes.map((c) => `${c.field} (${c.modId})`))].join(', ') || t('no change'))}</li>`).join('')}</ul>
            </details>` : ''}
        </div>`;
    }).join('');
  }

  /** Loadout picker above the installed mods (src/mods/loadouts.ts). */
  private loadoutBarHtml(): string {
    const lo = this.loadouts;
    const name = (id: string, n: string) => (id === MY_MODS ? t('My mods') : this.esc(n));
    const opts = [`<option value="${OFFICIAL}" ${lo.active === OFFICIAL ? 'selected' : ''}>${t('Official (no community mods)')}</option>`]
      .concat(lo.custom.map((l) => `<option value="${this.esc(l.id)}" ${lo.active === l.id ? 'selected' : ''}>${name(l.id, l.name)}</option>`));
    return `
      <div class="card loadout-bar">
        <label class="row"><span>${t('Loadout')}</span><select id="loadout-select">${opts.join('')}</select></label>
        <button class="btn sm ghost" id="loadout-new">${t('New loadout')}</button>
        ${lo.active !== OFFICIAL && lo.active !== MY_MODS ? `<button class="btn sm ghost" id="loadout-delete">${t('Delete loadout')}</button>` : ''}
        ${lo.active === OFFICIAL ? `<span class="muted">${t('The game as shipped. Turn a mod on to switch to «My mods».')}</span>` : ''}
      </div>`;
  }

  /** This address without ?safe. */
  private leaveSafeUrl(): string {
    // by hand, not URLSearchParams: that would rewrite "?boards" as "?boards="
    const q = location.search.slice(1).split('&').filter((p) => p && decodeURIComponent(p.split('=')[0]) !== 'safe').join('&');
    return location.pathname + (q ? `?${q}` : '') + location.hash;
  }

  // ---------------- Community tab + Submit (src/ui/community-ui.ts, loaded on first use) ----------------

  /** The Community UI if it's loaded; otherwise starts loading it (the window redraws when ready). */
  private loadCommunityUi(): CommunityUi | null {
    if (!this.communityUi && !this.communityUiLoad) void this.communityUiReady().then(() => { if (this.showMods) this.renderModsModal(); });
    return this.communityUi;
  }

  private communityUiReady(): Promise<CommunityUi> {
    this.communityUiLoad ??= import('./community-ui').then(({ CommunityUi }) => {
      const app = this; // `mobile` is read live (a getter), and getters have their own `this`
      this.communityUi = new CommunityUi({
        esc: (s) => app.esc(s),
        get mobile() { return app.mobile; },
        siteBase: desktop ? BRAND.site : './',
        mods: () => app.modResult.mods,
        benchReport: (id) => app.benchReports.get(id),
        benchRunning: () => app.benchRunning,
        runBenchCheck: (id) => app.runBenchCheck(id),
        installModBytes: (bytes, file) => app.installModBytes(bytes, file),
        modActive: (id) => app.modActive(id),
        toast: (msg, kind) => app.toast(msg, kind),
        isOpen: () => app.showMods,
        view: () => app.modsView,
        rerender: () => { if (app.showMods) app.renderModsModal(); },
        closeMods: () => { app.showMods = false; app.renderModal(); },
      });
      return this.communityUi;
    });
    return this.communityUiLoad;
  }

  // ---------------- mod.io browser (src/mods/modio.ts) ----------------

  private modioBrowseHtml(): string {
    const sorts: [ModioSort, string][] = [['downloads', t('Most downloaded')], ['newest', t('Newest')], ['rating', t('Top rated')]];
    return `
      <div class="modio-bar">
        <input type="search" id="modio-q" placeholder="${t('Search mods')}" value="${this.esc(this.modioQ)}" autocomplete="off" />
        <div class="seg" id="modio-sort">
          ${sorts.map(([k, l]) => `<button class="${this.modioSort === k ? 'on' : ''}" data-modio-sort="${k}">${l}</button>`).join('')}
        </div>
      </div>
      <div id="modio-list" class="modio-list">${this.modioListHtml()}</div>
      <div class="muted modio-foot">
        ${t('Made by players, hosted by mod.io. A mod with code runs only if you turn code mods on (Installed tab).')}
        <a href="https://mod.io/terms" target="_blank" rel="noopener">${t('mod.io Terms')}</a> ·
        <a href="https://mod.io/privacy" target="_blank" rel="noopener">${t('mod.io Privacy')}</a>
      </div>`;
  }

  private modioListHtml(): string {
    if (this.modioError) {
      return `<div class="card modio-msg"><span>${this.esc(this.modioError)}</span><button class="btn sm" id="modio-retry">${t('Try again')}</button></div>`;
    }
    if (!this.modioList.length) {
      return `<div class="muted modio-msg">${this.modioLoading ? t('Loading mods…') : this.modioQ ? t('No mods match «{q}».', { q: this.esc(this.modioQ) }) : t('No mods on mod.io yet. Be the first: see «How to make a mod».')}</div>`;
    }
    const installed = new Set(this.modResult.mods.filter((m) => m.source.origin === 'Installed').map((m) => m.manifest.id));
    const mb = (n: number) => (n >= 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} kB`);
    const cards = this.modioList.map((m) => {
      const st = modioState(m, installed);
      const busy = this.modioBusy.has(m.id);
      const action = busy
        ? `<button class="btn sm" disabled>${t('Installing…')}</button>`
        : st === 'installed'
          ? `<span class="badge pass">${icon('check', 11)} ${t('Installed')}</span>`
          : `<button class="btn sm primary" data-modio-install="${m.id}">${icon('download', 12)}<span>${st === 'update' ? t('Update') : t('Install')}</span></button>`;
      const facts = [
        m.author && t('by {author}', { author: this.esc(m.author) }),
        t('{n} download|{n} downloads', { n: m.downloads }),
        m.file?.size ? mb(m.file.size) : '',
        this.esc(m.rating),
      ].filter(Boolean).join(' · ');
      return `
        <div class="card modio-card">
          ${m.logo ? `<img class="modio-logo" src="${this.esc(m.logo)}" alt="" loading="lazy" referrerpolicy="no-referrer" />` : `<div class="modio-logo none">${icon('box', 22)}</div>`}
          <div class="modio-info">
            <div class="mod-name">${this.esc(m.name)}${m.file?.version ? ` <span class="muted mono">v${this.esc(m.file.version)}</span>` : ''}</div>
            <div class="muted">${facts}</div>
            ${m.summary ? `<p class="text-2">${this.esc(m.summary)}</p>` : ''}
            <div class="row wrap">
              ${action}
              ${m.profileUrl ? `<a class="btn sm ghost" href="${this.esc(m.profileUrl)}" target="_blank" rel="noopener">${t('mod.io page')}</a>` : ''}
            </div>
          </div>
        </div>`;
    }).join('');
    const more = this.modioNext < this.modioTotal
      ? `<button class="btn sm block" id="modio-more" ${this.modioLoading ? 'disabled' : ''}>${this.modioLoading ? t('Loading mods…') : t('Show more')}</button>`
      : '';
    return cards + more;
  }

  /** Redraws only the list, so the search box keeps its focus and caret. */
  private renderModioList() {
    const el = this.modalRootEl.querySelector('#modio-list');
    if (el) el.innerHTML = this.modioListHtml();
  }

  private bindModioBrowse(root: HTMLElement) {
    const q = root.querySelector<HTMLInputElement>('#modio-q');
    let timer = 0;
    q?.addEventListener('input', () => {
      clearTimeout(timer);
      timer = window.setTimeout(() => { this.modioQ = q.value.trim(); void this.loadModioPage(true); }, 400);
    });
    q?.addEventListener('keydown', (e) => {
      e.stopPropagation(); // typing is not tool shortcuts
      if (e.key === 'Enter') { clearTimeout(timer); this.modioQ = q.value.trim(); void this.loadModioPage(true); }
    });
    root.querySelectorAll<HTMLButtonElement>('[data-modio-sort]').forEach((b) => b.addEventListener('click', () => {
      this.modioSort = b.dataset.modioSort as ModioSort;
      root.querySelectorAll('[data-modio-sort]').forEach((x) => x.classList.toggle('on', x === b));
      void this.loadModioPage(true);
    }));
    // the list is redrawn on its own: listen on its container
    root.querySelector('#modio-list')?.addEventListener('click', (e) => {
      const el = (e.target as HTMLElement).closest<HTMLElement>('[data-modio-install], #modio-more, #modio-retry');
      if (!el) return;
      if (el.id === 'modio-more') void this.loadModioPage(false);
      else if (el.id === 'modio-retry') void this.loadModioPage(this.modioList.length === 0);
      else {
        const m = this.modioList.find((x) => x.id === Number(el.dataset.modioInstall));
        if (m) void this.installFromModio(m);
      }
    });
  }

  /** The next page of mod.io listings (`reset`: from the start, for a new search or order). */
  private async loadModioPage(reset: boolean) {
    if (!this.modio) return;
    this.modioReq?.abort();
    const ac = (this.modioReq = new AbortController());
    if (reset) { this.modioList = []; this.modioNext = 0; this.modioTotal = 0; }
    this.modioLoading = true;
    this.modioError = null;
    this.renderModioList();
    const limit = 20;
    try {
      const page = await listMods(this.modio, { q: this.modioQ, sort: this.modioSort, offset: this.modioNext, limit, signal: ac.signal });
      if (ac !== this.modioReq) return;
      const seen = new Set(this.modioList.map((m) => m.id));
      this.modioList = [...this.modioList, ...page.mods.filter((m) => !seen.has(m.id))];
      this.modioTotal = page.total;
      this.modioNext = page.offset + limit;
    } catch (e) {
      if ((e as Error)?.name === 'AbortError' || ac !== this.modioReq) return;
      this.modioError = e instanceof ModioError && e.status === 429
        ? t('mod.io asks to slow down: try again in {s} s.', { s: e.retryAfter ?? 60 })
        : e instanceof ModioError && e.status === 0
          ? t('Could not reach mod.io. Check your connection.')
          : t('mod.io error: {error}', { error: e instanceof Error ? e.message : String(e) });
    }
    if (ac === this.modioReq) {
      this.modioLoading = false;
      this.renderModioList();
    }
  }

  private async installFromModio(m: ModioMod) {
    if (this.modioBusy.has(m.id) || !m.file) return;
    this.modioBusy.add(m.id);
    this.renderModioList();
    let mod: LoadedMod | null = null;
    try {
      const bytes = await downloadMod(m);
      mod = await this.installModBytes(bytes, m.file.name || `${m.nameId || m.id}.zip`);
      if (mod) {
        rememberModioInstall(m.id, mod.manifest.id, m.file.id);
        trackEvent('mod installed', { mod: m.nameId || String(m.id) });
      }
    } catch (e) {
      const why = e instanceof ModioError && e.status === 0
        ? t('the download was blocked or the connection dropped. Open its mod.io page, download the .zip there and install it with «Install mod (.zip)».')
        : e instanceof Error ? e.message : String(e);
      this.toast(t('Could not download «{name}»: {error}', { name: m.name, error: why }), 'danger');
    }
    this.modioBusy.delete(m.id);
    if (!this.showMods) return;
    // installed cleanly: show its first board (like a picked .zip); otherwise stay for the error / warnings
    if (mod && !mod.warnings.length && this.modActive(mod.manifest.id)) { this.showMods = false; this.renderModal(); return; }
    this.renderModsModal();
  }

  /** Packs the open board (with its current faults, objectives and flag lock) as a ready-to-share mod. */
  private async exportBoardAsMod() {
    const s = this.activeScenario;
    const slug = (x: string) => x.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'board';
    const boardId = slug(s.meta.title);
    const author = s.meta.author && s.meta.author !== 'anonymous' ? s.meta.author : 'your-name';
    const manifest = {
      format: MOD_FORMAT,
      id: `${slug(author)}-${boardId}`.slice(0, 64),
      name: s.meta.title,
      version: '1.0.0',
      author,
      description: s.meta.description.slice(0, 300),
      license: s.meta.license ?? 'CC-BY-4.0',
      boards: [{ id: boardId, file: `boards/${boardId}.pcbfix.json` }],
    };
    const out: Scenario = { ...s, board: cloneBoard(this.board) };
    // a built-in board keeps the built-in's id and flag: give the copy its own id; the old lock can't
    // follow (it is derived from the id), so the author locks a flag of their own first
    let lockNote = '';
    if (this.bundledIds.has(s.id)) {
      out.id = `${manifest.id}-${boardId}`.slice(0, 80);
      if (out.lock) { delete out.lock; lockNote = ' ' + t('It has no flag: lock your own in the Author tab first if you want one.'); }
    }
    const te = new TextEncoder();
    const zip = await writeZip([
      ['mod.json', te.encode(JSON.stringify(manifest, null, 2) + '\n')],
      [`boards/${boardId}.pcbfix.json`, te.encode(serializeScenario(out))],
    ]);
    const url = URL.createObjectURL(new Blob([zip as BlobPart], { type: 'application/zip' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `${manifest.id}.zip`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    this.toast(t('Saved {file}: check the name, author and licence in mod.json before sharing.', { file: `${manifest.id}.zip` }) + lockNote, lockNote ? 'info' : 'success');
  }

  private renderModal() {
    this.mount.querySelector('#btn-boards')?.classList.toggle('active', this.showBoards);
    this.mount.querySelector('#btn-feedback')?.classList.toggle('active', this.showFeedback);
    if (this.showBoards) {
      this.renderBoardsModal();
      return;
    }
    if (this.showMods) {
      this.renderModsModal();
      return;
    }
    if (this.showFeedback) {
      this.renderFeedbackModal();
      return;
    }
    if (this.showLesson) {
      this.renderLessonModal();
      return;
    }
    if (!this.showHelp) {
      this.modalRootEl.innerHTML = '';
      return;
    }
    this.modalRootEl.innerHTML = this.txt(`
      <div class="modal-backdrop" id="help-close-bg">
        <div class="modal" style="transform: translate3d(${this.modalPos[0]}px, ${this.modalPos[1]}px, 0)">
          <div class="modal-head" title="${t('Drag to move window')}">
            <h2>${t('Documentation')}</h2>
            <button class="btn ghost icon sm" id="help-close" title="${t('Close')}">${icon('x', 14)}</button>
          </div>
          <div class="card">
            <div class="card-title">${t('Language')} · Language</div>
            <div class="row">${this.langPickerHtml('full')}</div>
          </div>
          <div class="card">
            <div class="card-title">${t('Overview')}</div>
            <p class="text-2" style="margin:0">
              ${t('Each scenario provides a simulated circuit board solved via fast DC nodal analysis or a full SPICE engine (selectable in the top bar; export any board as an ngspice <code>.cir</code> netlist), rendered in 2D/3D WebGPU.')}
              ${t('Diagnose electrical faults, perform rework, and execute <b>Run tests</b> to verify repairs and decrypt the CTF flag.')}
              ${t('Once a board is fixed, <b>Next problem on this board</b> breaks it again with fresh random faults.')}
            </p>
          </div>
          ${beginnerPrimerHtml()}
          <div class="card">
            <div class="card-title">${t('Fault diagnosis')}</div>
            <ul>
              <li>${t('<b>Open or cut trace</b> — Disable power, verify continuity in <b>Ω</b> mode, then bridge with <b>Soldering iron (3)</b> or <b>Jumper wire (6)</b>.')}</li>
              <li>${t('<b>Solder bridge or copper sliver</b> — Flip to the bottom side (<b>F</b>) and inspect closely. Clear blobs with <b>Desolder wick (4)</b> or cut slivers with <b>Trace cutter (7)</b>.')}</li>
              <li>${t('<b>Cold solder joint</b> — Matte grainy pads on the back side indicate poor wetting; reflow using <b>Soldering iron (3)</b>.')}</li>
              <li>${t('<b>Reversed polarity</b> — Check the LED cathode notch and internal anvil or diode band against the silkscreen <b>K</b> marker; correct with <b>Rotate 180° (5)</b> or test in <b>Diode</b> mode.')}</li>
              <li>${t('<b>Damaged or wrong part</b> — Inspect resistor color bands or power dissipation in <b>Thermal</b> mode, then swap values in <b>Parts bin (8)</b>.')}</li>
            </ul>
          </div>
          <div class="card">
            <div class="card-title">${t('Found a bug? Have an idea?')}</div>
            <p class="text-2" style="margin:0">${t('Tell us from inside the bench: no account needed. Technical details (browser, GPU, board) can be attached so the problem can be reproduced.')}</p>
            <div class="row"><button class="btn sm" id="help-feedback">${icon('message', 13)}<span>${t('Send feedback')}</span></button></div>
          </div>
          <div class="card">
            <div class="card-title">${t('Importing & authoring')}</div>
            <p class="text-2" style="margin:0">
              ${t('Drag and drop a KiCad <code>.kicad_pcb</code>, boardview <code>.brd</code> / <code>.tvw</code> or <code>.pcbfix.json</code> file into the workspace.')}
              ${t('In the <b>Author</b> tab, lock a working reference topology with your flag, inject faults, and export JSON, a shareable link, or a mod.')}
              ${t('<b>Mods</b> (Boards → Mods) bundle boards with their BOM and schematic for others to install: <a href="{url}" target="_blank" rel="noopener">how to make a mod</a>.', { url: this.moddingUrl })}
            </p>
          </div>
        </div>
      </div>
    `);
    this.modalRootEl.querySelector('#help-feedback')?.addEventListener('click', () => this.openFeedback(true));
    this.modalRootEl.querySelectorAll<HTMLSelectElement>('.lang-select').forEach((sel) => sel.addEventListener('change', () => this.switchLanguage(sel.value, sel)));
    this.modalRootEl.querySelector('#help-close')?.addEventListener('click', () => {
      this.showHelp = false;
      this.renderModal();
    });
    this.modalRootEl.querySelector('#help-close-bg')?.addEventListener('click', (e) => {
      if (this.suppressModalBgClose) {
        this.suppressModalBgClose = false;
        return;
      }
      if ((e.target as HTMLElement).id === 'help-close-bg') {
        this.showHelp = false;
        this.renderModal();
      }
    });
  }

  /** Overview card of a soldering-track board: the lesson, the inspection, and the track. */
  private lessonCardHtml(title: string): string {
    const ids = SOLDERING_TRACK_IDS as readonly string[];
    const ins = this.lastInspection;
    const ok = ins && lessonAccepted(lessonFor(this.activeScenario.id), ins);
    return `
      <div class="card">
        <div class="card-title">
          <span>${t('High-reliability soldering')}</span>
          <span class="badge info">${ids.filter((id) => this.trackAccepted.has(id)).length}/${ids.length}</span>
        </div>
        <div class="row wrap">
          <button class="btn sm" data-lesson="brief">${icon('book', 12)}<span>${t('Lesson: {title}', { title: this.esc(t(title)) })}</span></button>
          ${ins ? `<button class="btn sm" data-lesson="debrief"><span class="badge ${ok ? 'pass' : 'fail'}">${ok ? t('Accepted') : t('Rejected')}</span><span>${t('Inspection')}</span></button>` : ''}
        </div>
        <div class="muted">${t('Based on NEETS Module 14, a public-domain US Navy textbook. A board counts as done when it works and passes inspection.')}</div>
        <div class="stack">${this.trackRowsHtml(ids, this.activeScenario.id, this.trackAccepted)}</div>
      </div>`;
  }

  /** The lesson before a soldering-track repair, or the inspection after it. */
  private renderLessonModal() {
    const lesson = lessonFor(this.activeScenario.id);
    if (!lesson || (this.showLesson === 'debrief' && !this.lastInspection)) { this.showLesson = null; this.renderModal(); return; }
    const brief = this.showLesson === 'brief';
    const ids = SOLDERING_TRACK_IDS as readonly string[];
    const nextId = ids[ids.indexOf(this.activeScenario.id) + 1];
    const nextIdx = nextId ? this.scenarios.findIndex((x) => x.id === nextId) : -1;
    const accepted = !brief && lessonAccepted(lesson, this.lastInspection!);
    const body = brief ? lessonBriefHtml(lesson, (x) => this.esc(x), './', this.mobile) : debriefHtml(lesson, this.lastInspection!, (x) => this.esc(x));
    this.modalRootEl.innerHTML = `
      <div class="modal-backdrop" id="lesson-close-bg">
        <div class="modal lesson-modal" role="dialog" aria-modal="true" aria-labelledby="lesson-h" style="transform: translate3d(${this.modalPos[0]}px, ${this.modalPos[1]}px, 0)">
          <div class="modal-head" title="${t('Drag to move window')}">
            <h2 id="lesson-h">${brief ? this.esc(t(lesson.title)) : t('Inspection')}</h2>
            <button class="btn ghost icon sm" id="lesson-close" title="${t('Close')}" aria-label="${t('Close')}">${icon('x', 14)}</button>
          </div>
          ${body}
          <div class="row lesson-actions">
            ${brief
              ? `<button class="btn primary" id="lesson-go">${icon('play', 13)}<span>${t('Start the repair')}</span></button>`
              : `${accepted && nextIdx >= 0 ? `<button class="btn primary" data-open-sc="${nextIdx}">${icon('play', 13)}<span>${t('Next lesson')}</span></button>` : ''}
                 <button class="btn${accepted && nextIdx >= 0 ? '' : ' primary'}" id="lesson-go">${accepted ? t('Close') : t('Back to the board')}</button>
                 <button class="btn ghost" id="lesson-brief">${icon('book', 13)}<span>${t('Lesson')}</span></button>`}
          </div>
        </div>
      </div>`;
    const close = () => { this.showLesson = null; this.renderModal(); this.canvas.focus({ preventScroll: true }); };
    this.modalRootEl.querySelector('#lesson-close')?.addEventListener('click', close);
    this.modalRootEl.querySelector('#lesson-go')?.addEventListener('click', close);
    this.modalRootEl.querySelector('#lesson-brief')?.addEventListener('click', () => { this.showLesson = 'brief'; this.renderModal(); });
    this.modalRootEl.querySelectorAll<HTMLButtonElement>('[data-open-sc]').forEach((b) => b.addEventListener('click', () => {
      this.showLesson = null;
      if (this.scenarios[Number(b.dataset.openSc)]) void this.openScenario(Number(b.dataset.openSc));
    }));
    this.modalRootEl.querySelector('#lesson-close-bg')?.addEventListener('click', (e) => {
      if (this.suppressModalBgClose) { this.suppressModalBgClose = false; return; }
      if ((e.target as HTMLElement).id === 'lesson-close-bg') close();
    });
    this.modalRootEl.querySelector<HTMLElement>('#lesson-go')?.focus({ preventScroll: true });
  }

  private esc(s: string): string {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  private loop = (now: number) => {
    const dt = Math.min(0.05, (now - this.lastFrameMs) / 1000);
    this.lastFrameMs = now;
    // thermal state evolves in real time (heating while powered, cooling, frost melting, IPA drying)
    if (this.thermal && this.preheatTemp > 0 && !this.thermal.sources.some((x) => x.kind === 'preheat')) {
      this.thermal.addSource({ kind: 'preheat', temp: this.preheatTemp, h: PREHEAT_H, until: this.thermal.time + 1 });
    }
    this.thermal?.step(dt);
    this.flex.advance(dt);
    // phones refit on every change of shape; desktops on the first frame (the first with the real
    // canvas shape) and then only while the view is the untouched automatic fit
    if (this.mobile || !this.fitAspect || this.autoFramed) this.refitOnShapeChange();
    if (this.ironHold) this.updateIronHud();
    if (this.rework && this.reworkMode.realistic) {
      const evs = this.rework.update(dt);
      if (evs.length) this.onReworkEvents(evs);
    }
    // intermittent faults follow temperature and flex; re-solve when one switches
    this.intermittentClock += dt;
    if (this.intermittentClock >= 0.2) {
      this.intermittentClock = 0;
      const changed = updateIntermittents(this.board, this.environment());
      // rosin melting on a hot part gives off a wisp of smoke
      for (const c of this.rosinParts) {
        const s = this.thermal?.partSurface(c.id);
        if (!s || s.rosin <= 0.02) { this.rosinParts.delete(c); continue; }
        if (s.melted > 0.02) this.renderer?.spawnSmoke(c.at[0], c.at[1], c.side, this.board.thickness, 'flux');
      }
      if (changed.length) { this.recompute(true); this.renderDmm(); }
    }
    // bench supply: the power controller advances the board's power state; the meter averages
    if (this.powerOn || this.boot.history.length) {
      // the controller waits while the solve for its present state is still running
      if (this.powerOn && !this.pendingSolve && this.boot.tick(dt, this.supplyReading().amps, (s) => this.missingRails(s))) {
        this.recomputeAsync();
      }
      this.psuClock += dt;
      if (this.psuClock >= 0.1) { this.psuClock = 0; this.renderPsu(); if (this.scopeProbe) this.renderScope(); }
    }
    if (this.scopeProbe) {
      this.scopeSample += dt;
      if (this.scopeSample >= 0.03) {
        this.scopeSample = 0;
        const now = performance.now() / 1000;
        this.scopeRoll.push({ t: now, v: this.probedVolts() ?? 0 });
        while (this.scopeRoll.length && this.scopeRoll[0].t < now - 12) this.scopeRoll.shift();
      }
      if (!this.powerOn && !this.boot.history.length) { this.psuClock += dt; if (this.psuClock >= 0.1) { this.psuClock = 0; this.renderScope(); } }
    }
    this.camera.tick(dt);
    // flipping the board (F, the side buttons) takes the keyboard cursor to the same spot on the other face
    if (this.kbActive && this.kbCursor && !this.camera.bothSides && this.kbCursor.side !== this.camera.side) this.kbCursor = { pt: this.kbCursor.pt, side: this.camera.side };
    const tutSteps = this.tutorialOpen ? getTutorialSteps(this.activeScenario.id) : null;
    const tutStep = tutSteps ? tutSteps[Math.max(0, Math.min(tutSteps.length - 1, this.tutorialStep))] : null;
    this.renderer.render(this.camera, {
      board: this.board,
      conn: this.conn,
      sim: this.sim,
      thermal: this.thermal,
      powerOn: this.powerOn,
      vizMode: this.vizMode,
      selectedNet: this.selectedNet,
      selectedCompId: this.selectedCompId,
      hovered: this.hovered,
      probeRed: this.probeRed,
      probeBlack: this.probeBlack,
      diodeLitIds: this.diodeLitIds,
      jumperDraft: this.jumperStart && this.cursorWorld
        ? { a: this.jumperStart.a, la: this.jumperStart.la, b: this.cursorWorld, lb: this.cursorSide }
        : null,
      cursorWorld: this.cursorWorld,
      cursorSide: this.cursorSide,
      activeTool: this.activeTool,
      kbCursor: this.kbActive && this.kbCursor ? { pos: this.kbCursor.pt, side: this.kbCursor.side } : null,
      tutorialTarget: tutStep?.target
        ? { pos: tutStep.target.pos, side: tutStep.target.side, radius: tutStep.target.radius }
        : null,
    });
    this.placeTutPointer();
    this.rafId = requestAnimationFrame(this.loop);
  };

  destroy() {
    cancelAnimationFrame(this.rafId);
    this.renderer?.destroy();
  }
}
