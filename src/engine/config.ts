/**
 * Lantern Summit math configuration.
 * All pays are in multiples of the total bet. Tuned with `npm run sim`
 * (see docs/math-report.md for the latest simulated figures).
 */

export const COLS = 6;
export const ROWS = 5;
export const MIN_CLUSTER = 8;

export const SYM = {
  LAPIS: 0,
  JADE: 1,
  AMBER: 2,
  CORAL: 3,
  TURQUOISE: 4,
  BOWL: 5,
  KETTLE: 6,
  RHODO: 7,
  BELL: 8,
  SCATTER: 9,
  LANTERN: 10,
} as const;

export const PAYING_SYMBOLS = 9; // ids 0..8 pay anywhere

export const SYMBOL_NAMES = [
  'Lapis Stone',
  'Jade Stone',
  'Amber Stone',
  'Coral Stone',
  'Turquoise Stone',
  'Singing Bowl',
  'Copper Kettle',
  'Rhododendron',
  'Golden Bell',
  'Snow Leopard Spirit',
  'Sky Lantern',
];

/** Pays for [8-9, 10-11, 12+] symbols anywhere, x total bet. */
export const PAYTABLE: number[][] = [
  [0.3, 0.65, 2.2], // Lapis
  [0.45, 1, 3.4], // Jade
  [0.55, 1.1, 4.5], // Amber
  [0.9, 1.7, 6.5], // Coral
  [1.1, 2.2, 9], // Turquoise
  [1.7, 4.5, 13], // Singing Bowl
  [2.2, 5.5, 17], // Copper Kettle
  [4.5, 11, 35], // Rhododendron
  [11, 28, 70], // Golden Bell
];

/** Scatter pays, x total bet, by count (index = count). */
export function scatterPay(count: number): number {
  if (count >= 6) return 50;
  if (count === 5) return 6;
  if (count === 4) return 2.5;
  return 0;
}

export const FS_TRIGGER = 4;
export const FS_RETRIGGER = 3;
export const FS_RETRIGGER_SPINS = 5;
export const MAX_WIN = 10000;

/** Ember meter: every tumble adds one ember; full meter charges a guaranteed multiplier. */
export const EMBER_MAX = 20;
export const EMBER_BOOST_VALUES = [2, 3, 5, 10];
export const EMBER_BOOST_WEIGHTS = [40, 30, 20, 10];

export interface ReelMode {
  /** relative weight per symbol id 0..10 */
  weights: number[];
  lanternValues: number[];
  lanternWeights: number[];
}

export const LANTERN_VALUES = [2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 25, 50, 100, 250, 500];

export const BASE_MODE: ReelMode = {
  //        Lap  Jade Amb  Cor  Tur  Bowl Ket  Rho  Bell Scat  Lant
  weights: [150, 140, 128, 112, 100, 80, 72, 56, 44, 17.9, 6],
  lanternValues: LANTERN_VALUES,
  lanternWeights: [300, 220, 160, 130, 90, 60, 45, 30, 20, 12, 8, 4, 1.5, 0.4, 0.15],
};

export interface ClimbOption {
  id: number;
  label: string;
  spins: number;
  startMult: number;
  mode: ReelMode;
}

function fsMode(lanternWeight: number): ReelMode {
  return {
    weights: [150, 140, 128, 112, 100, 80, 72, 56, 44, 15, lanternWeight],
    lanternValues: LANTERN_VALUES,
    lanternWeights: [150, 140, 130, 120, 100, 80, 60, 45, 30, 20, 12, 6, 2, 0.6, 0.2],
  };
}

/** Pick your climb. Lantern frequency is calibrated per option so every option returns the same. */
export const CLIMB_OPTIONS: ClimbOption[] = [
  { id: 0, label: 'Long Trail', spins: 15, startMult: 1, mode: fsMode(23.2) },
  { id: 1, label: 'Ridge Path', spins: 10, startMult: 15, mode: fsMode(26.8) },
  { id: 2, label: 'Summit Dash', spins: 6, startMult: 42, mode: fsMode(42) },
];

/** Bonus buy price, x bet. Operators can switch the feature off per market. */
export const BUY_COST = 83;
export const FEATURES = { bonusBuy: true };

export const BET_LEVELS = [0.2, 0.4, 0.6, 1, 2, 4, 6, 10, 20, 50, 100];
export const START_BALANCE = 10000;
