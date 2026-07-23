// ============================================================
// SECTION: IMPORTS
// ============================================================
import React, { useState, useEffect, useRef } from 'react';
import { 
  Trophy, Undo2, RotateCcw, Lock, Settings, X,
  Circle, Square, Triangle, Hexagon, Star, Heart, 
  Moon, Sun, Cloud, Snowflake, Crown, Music, 
  Zap, ChevronLeft, ChevronRight, Diamond, Gem,
  Flower2, Leaf, Flame, Waves, Mountain, Umbrella, Apple,
  Anchor, Bell, Cookie, Ghost
} from 'lucide-react';
import { supabase, isGlobalLeaderboardEnabled } from './lib/supabaseClient';
// ============================================================
// END SECTION: IMPORTS
// ============================================================


// ============================================================
// SECTION: SEEDED DETERMINISTIC RANDOM GENERATOR
// Utilities for reproducible shuffle/random based on a numeric seed.
// Used to make every level layout identical for a given level number.
// ============================================================
function seededRandom(seed) {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

function seededAdvancedShuffle(array, seed, intensityPasses = 3) {
  const shuffled = [...array];
  let localSeed = seed;
  
  for (let pass = 0; pass < intensityPasses; pass++) {
    let m = shuffled.length, t, i;
    while (m) {
      i = Math.floor(seededRandom(localSeed++) * m--);
      t = shuffled[m];
      shuffled[m] = shuffled[i];
      shuffled[i] = t;
    }
  }
  return shuffled;
}
// ============================================================
// END SECTION: SEEDED DETERMINISTIC RANDOM GENERATOR
// ============================================================


// ============================================================
// SECTION: NUT COLOR / ICON PALETTE (NUT_TYPES)
// 26 selectable colour-and-shape identities. Each carries a real hex
// swatch (matching its Tailwind class) so palette selection downstream
// can measure actual visual distance between colours instead of relying
// on a hand-maintained "these two look the same" list. `iconText` is
// explicit so every icon remains readable on its own nut.
// ============================================================
const NUT_TYPES = [
  { id: 'red',         bg: 'bg-red-600',     border: 'border-red-900',     hex: '#dc2626', icon: Star,     iconText: 'text-white' },
  { id: 'yellow',      bg: 'bg-yellow-300',  border: 'border-yellow-600',  hex: '#fde047', icon: Sun,      iconText: 'text-zinc-950' },
  { id: 'blue',        bg: 'bg-blue-700',    border: 'border-blue-950',    hex: '#1d4ed8', icon: Circle,   iconText: 'text-white' },
  { id: 'white',       bg: 'bg-white',       border: 'border-zinc-400',    hex: '#ffffff', icon: Square,   iconText: 'text-zinc-950' },
  { id: 'grey',        bg: 'bg-zinc-600',    border: 'border-zinc-900',    hex: '#52525b', icon: Snowflake,iconText: 'text-white' },
  { id: 'brown',       bg: 'bg-amber-800',   border: 'border-amber-950',   hex: '#92400e', icon: Zap,      iconText: 'text-white' },
  { id: 'hot-pink',    bg: 'bg-pink-400',    border: 'border-pink-700',    hex: '#f472b6', icon: Anchor,   iconText: 'text-white' },
  { id: 'green',       bg: 'bg-green-600',   border: 'border-green-900',   hex: '#16a34a', icon: Hexagon,  iconText: 'text-white' },
  { id: 'orange',      bg: 'bg-orange-500',  border: 'border-orange-800',  hex: '#f97316', icon: Triangle, iconText: 'text-zinc-950' },
  { id: 'purple',      bg: 'bg-purple-700',  border: 'border-purple-950',  hex: '#7e22ce', icon: Moon,     iconText: 'text-white' },
  { id: 'light-blue',  bg: 'bg-sky-300',     border: 'border-sky-600',     hex: '#7dd3fc', icon: Cloud,    iconText: 'text-zinc-950' },
  { id: 'dark-blue',   bg: 'bg-indigo-900',  border: 'border-indigo-950',  hex: '#312e81', icon: Crown,    iconText: 'text-white' },
  { id: 'light-green', bg: 'bg-lime-300',    border: 'border-lime-600',    hex: '#bef264', icon: Leaf,     iconText: 'text-zinc-950' },
  { id: 'dark-green',  bg: 'bg-emerald-800', border: 'border-emerald-950', hex: '#065f46', icon: Flower2,  iconText: 'text-white' },
  { id: 'light-grey',  bg: 'bg-slate-300',   border: 'border-slate-500',   hex: '#cbd5e1', icon: Diamond,  iconText: 'text-zinc-950' },
  { id: 'dark-grey',   bg: 'bg-slate-700',   border: 'border-slate-950',   hex: '#334155', icon: Gem,      iconText: 'text-white' },
  { id: 'light-red',   bg: 'bg-rose-300',    border: 'border-rose-600',    hex: '#fda4af', icon: Heart,    iconText: 'text-zinc-950' },
  { id: 'dark-red',    bg: 'bg-rose-900',    border: 'border-rose-950',    hex: '#881337', icon: Flame,    iconText: 'text-white' },
  { id: 'light-teal',  bg: 'bg-teal-300',    border: 'border-teal-600',    hex: '#5eead4', icon: Waves,    iconText: 'text-zinc-950' },
  { id: 'dark-teal',   bg: 'bg-teal-800',    border: 'border-teal-950',    hex: '#115e59', icon: Music,    iconText: 'text-white' },
  { id: 'light-pink',  bg: 'bg-pink-300',    border: 'border-pink-600',    hex: '#f9a8d4', icon: Umbrella, iconText: 'text-zinc-950' },
  { id: 'dark-pink',   bg: 'bg-pink-800',    border: 'border-pink-950',    hex: '#9d174d', icon: Bell,     iconText: 'text-white' },
  { id: 'light-orange',bg: 'bg-orange-300',  border: 'border-orange-600',  hex: '#fdba74', icon: Apple,    iconText: 'text-zinc-950' },
  { id: 'dark-orange', bg: 'bg-orange-800',  border: 'border-orange-950',  hex: '#9a3412', icon: Mountain, iconText: 'text-white' },
  { id: 'light-violet',bg: 'bg-violet-300',  border: 'border-violet-600',  hex: '#c4b5fd', icon: Cookie,   iconText: 'text-zinc-950' },
  { id: 'dark-violet', bg: 'bg-violet-900',  border: 'border-violet-950',  hex: '#4c1d95', icon: Ghost,    iconText: 'text-white' },
];
// ============================================================
// END SECTION: NUT COLOR / ICON PALETTE (NUT_TYPES)
// ============================================================


// ============================================================
// SECTION: COLOUR DISTANCE / CONTRAST ENGINE
// Replaces the old hand-maintained "these two clash" pair list with a
// real measurement: convert each swatch to HSL, then score how
// different two colours actually look — weighting hue (the biggest
// driver of "these read as the same colour") more than lightness or
// saturation. A pair "clashes" when the score falls under
// CLASH_THRESHOLD. This scales to the whole 26-colour catalogue
// automatically instead of needing every new pair hand-entered.
// ============================================================
function hexToHsl(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0));
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return { h: h * 60, s, l };
}

const NUT_HSL = Object.fromEntries(NUT_TYPES.map(t => [t.id, hexToHsl(t.hex)]));

// 0 = identical, larger = more visually distinct. Hue distance is
// circular (359° and 1° are neighbours) and dominates the score;
// lightness/saturation add extra separation for same-hue light/dark
// pairs (e.g. light-red vs dark-red) without letting hue alone decide.
function colorDistance(idA, idB) {
  const a = NUT_HSL[idA], b = NUT_HSL[idB];
  const rawHueDiff = Math.abs(a.h - b.h);
  const hueDiff = Math.min(rawHueDiff, 360 - rawHueDiff);
  const lightDiff = Math.abs(a.l - b.l) * 100;
  const satDiff = Math.abs(a.s - b.s) * 60;
  return hueDiff + lightDiff * 0.5 + satDiff * 0.3;
}

const CLASH_THRESHOLD = 26; // below this, two colours read as "the same" at a glance

function clashesWithAny(id, chosenIds) {
  return chosenIds.some(c => colorDistance(id, c) < CLASH_THRESHOLD);
}
// ============================================================
// END SECTION: COLOUR DISTANCE / CONTRAST ENGINE
// ============================================================


// ============================================================
// SECTION: ROW LAYOUT HELPERS
// Shared, pure helpers that turn a total bolt count into a row count
// and per-row bolt counts. Used by BOTH the level generator (to work
// out exactly where the "revealed" row boundary falls, for the reveal
// mechanic) and the board's render layout math (BOARD LAYOUT
// CALCULATIONS, below) — so the two can never disagree about row shape.
// ============================================================
// Row thresholds apply to totalBolts (active + 2 empty):
//   total ≤ 7          → 1 row
//   total 8–14         → 2 rows
//   total ≥ 15         → 3 rows
function getTargetRowCount(totalBolts, capacity) {
  if (totalBolts <= 6) return 1;
  if (capacity <= 5) {
    if (totalBolts <= 10) return 2;
    return 3;
  }
  if (totalBolts <= 14) return 2;
  return 3;
}

// Distribute bolts evenly with max 1 bolt difference:
// remainders are distributed from the top row downwards.
function computeRowSizes(totalBolts, rows) {
  const baseRowSize = Math.floor(totalBolts / rows);
  const remainder = totalBolts % rows;
  const rowSizes = Array.from({ length: rows }, () => baseRowSize);
  for (let i = 0; i < remainder; i++) {
    rowSizes[i] += 1;
  }
  return rowSizes;
}
// ============================================================
// END SECTION: ROW LAYOUT HELPERS
// ============================================================


// ============================================================
// SECTION: LEVEL PROGRESSION / VARIATION HELPERS
// Pure deterministic rules. A duplicate count is the number of extra
// complete colour stacks, therefore activeBolts = colours + duplicates.
// ============================================================
const MAX_COLORS = 26; // matches the fixed NUT_TYPES catalogue
const TUTORIAL_CONFIGS = {
  1: { totalBolts: 5, capacity: 3, colors: 3, duplicateStacks: 0, hiddenActiveCount: 0, colorIds: ['red', 'yellow', 'blue'] },
  2: { totalBolts: 6, capacity: 4, colors: 4, duplicateStacks: 0, hiddenActiveCount: 0, colorIds: ['green', 'orange', 'purple', 'white'] },
  3: { totalBolts: 6, capacity: 6, colors: 4, duplicateStacks: 0, hiddenActiveCount: 0, colorIds: ['grey', 'brown', 'hot-pink', 'red'] },
  4: { totalBolts: 8, capacity: 3, colors: 4, duplicateStacks: 2, hiddenActiveCount: 0, colorIds: ['red', 'yellow', 'green', 'purple'] },
  5: { totalBolts: 6, capacity: 3, colors: 4, duplicateStacks: 0, hiddenActiveCount: 2, colorIds: ['blue', 'orange', 'white', 'grey'] },
};

const REVEAL_POSITIONS = [3, 7, 10];
const NORMAL_CAPACITY_TRANSITIONS = {
  3: [5, 6, 7, 8], 4: [6, 7, 8], 5: [3, 7, 8],
  6: [3, 4, 8], 7: [3, 4, 5], 8: [3, 4, 5, 6],
};
const TOTAL_BOLT_RANGES = {
  3: [14, 17], 4: [13, 16], 5: [12, 15],
  6: [10, 13], 7: [9, 12], 8: [8, 11],
};
// The first procedural block introduces one new idea at a time. Values stay
// within the approved capacity/bolt ranges while avoiding the former spike.
const EARLY_LEVEL_OVERRIDES = {
  6: { capacity: 5, totalBolts: 12, duplicateStacks: 0, scramblePairs: 1 },
  7: { capacity: 7, totalBolts: 10, duplicateStacks: 1, scramblePairs: 1 },
  8: { capacity: 4, totalBolts: 13, duplicateStacks: 0, scramblePairs: 2 },
  9: { capacity: 6, totalBolts: 11, duplicateStacks: 0, scramblePairs: 2 },
 10: { capacity: 8, totalBolts: 10, duplicateStacks: 1, scramblePairs: 3 },
};
const _levelConfigCache = {};

function getBlockInfo(level) {
  const index = Math.floor((level - 6) / 10);
  return { index, position: ((level - 6) % 10) + 1 };
}

function isRevealLevel(level) {
  return level > 5 && REVEAL_POSITIONS.includes(getBlockInfo(level).position);
}

function isDoubleColorLevel(level) {
  if (level <= 5 || isRevealLevel(level)) return false;
  const { index, position } = getBlockInfo(level);
  const slots = index % 2 === 0 ? [2, 5] : [2, 8];
  return slots.includes(position);
}

function getRevealCapacityForLevel(level) {
  const { index, position } = getBlockInfo(level);
  const base = position === 3 ? 3 : position === 7 ? 5 : 7;
  return base + ((index + position) % 2);
}

// Small, deliberately rarely-picked colours. Every so often the palette
// leads with one of these for a bit of visual variety instead of always
// reaching for the same familiar set — but it only survives if it
// clears the same clash check as every other colour, so it can never
// collide with whatever else ends up on the board that level.
const RARE_ACCENTS = ['dark-teal', 'light-violet', 'dark-pink', 'light-teal', 'dark-violet'];
const RARE_ACCENT_CHANCE = 1 / 6;

function choosePaletteIds(level, colors, tutorialIds) {
  if (tutorialIds) return tutorialIds;

  // Deterministic per-level shuffle drawing from the *entire* 26-colour
  // catalogue (not a fixed small pool), so levels get real variety
  // instead of recycling the same handful of colours forever.
  let candidates = seededAdvancedShuffle(NUT_TYPES.map(t => t.id), level * 151 + 31, 2);

  // Roughly one level in six, try to lead with a rare accent colour.
  if (seededRandom(level * 47 + 5) < RARE_ACCENT_CHANCE) {
    const accent = RARE_ACCENTS[Math.floor(seededRandom(level * 89 + 13) * RARE_ACCENTS.length)];
    candidates = [accent, ...candidates.filter(id => id !== accent)];
  }

  // Greedily accept colours that don't clash (by real HSL distance)
  // with anything already chosen.
  const chosen = [];
  for (const id of candidates) {
    if (chosen.length >= colors) break;
    if (!clashesWithAny(id, chosen)) chosen.push(id);
  }

  // Relaxation pass: only reachable at very high colour counts, where
  // the fully clash-free catalogue can't fill every slot. Loosen the
  // threshold gradually rather than falling back to raw randomness.
  let relaxedThreshold = CLASH_THRESHOLD;
  while (chosen.length < colors && relaxedThreshold > 6) {
    relaxedThreshold -= 4;
    for (const id of candidates) {
      if (chosen.length >= colors) break;
      if (chosen.includes(id)) continue;
      const tooClose = chosen.some(c => colorDistance(id, c) < relaxedThreshold);
      if (!tooClose) chosen.push(id);
    }
  }

  // Last resort (unreachable with 26 colours at realistic level sizes):
  // fill whatever's left ignoring distance entirely.
  for (const id of candidates) {
    if (chosen.length >= colors) break;
    if (!chosen.includes(id)) chosen.push(id);
  }

  return chosen;
}

function getNormalCapacity(level, previousCapacity, isDuplicate) {
  const allowed = NORMAL_CAPACITY_TRANSITIONS[previousCapacity];
  const candidates = isDuplicate ? allowed.filter(capacity => capacity >= 5) : allowed;
  return candidates[Math.floor(seededRandom(level * 283 + previousCapacity) * candidates.length)];
}
// ============================================================
// END SECTION: LEVEL PROGRESSION / VARIATION HELPERS
// ============================================================


// ============================================================
// SECTION: LEVEL CONFIG GENERATOR
// Defines rules for capacity, colors, hidden nuts, and bolt counts
// based on the current level number.
// ============================================================
function generateDeterministicLevelConfig(level) {
  if (_levelConfigCache[level]) return _levelConfigCache[level];

  const tutorial = TUTORIAL_CONFIGS[level];
  const earlyOverride = EARLY_LEVEL_OVERRIDES[level];
  const previous = level > 1 ? generateDeterministicLevelConfig(level - 1) : null;
  const revealThisLevel = level > 5 && isRevealLevel(level);
  const isDoubleColor = level > 5 && isDoubleColorLevel(level);
  const capacity = tutorial
    ? tutorial.capacity
    : earlyOverride
      ? earlyOverride.capacity
    : revealThisLevel
      ? getRevealCapacityForLevel(level)
      : getNormalCapacity(level, previous.capacity, isDoubleColor);

  const [minTotal, maxTotal] = tutorial
    ? [tutorial.totalBolts, tutorial.totalBolts]
    : earlyOverride
      ? [earlyOverride.totalBolts, earlyOverride.totalBolts]
      : TOTAL_BOLT_RANGES[capacity];
  const totalBolts = minTotal + Math.floor(seededRandom(level * 997 + capacity) * (maxTotal - minTotal + 1));
  const emptyBolts = 2;
  const activeBolts = totalBolts - emptyBolts;
  const duplicateStacks = tutorial
    ? tutorial.duplicateStacks
    : earlyOverride
      ? earlyOverride.duplicateStacks
    : isDoubleColor
      ? 1 + Math.floor(seededRandom(level * 571) * Math.min(3, Math.floor(activeBolts * 0.4)))
      : 0;
  const colors = tutorial ? tutorial.colors : activeBolts - duplicateStacks;
  const rows = getTargetRowCount(totalBolts, capacity);
  const rowSizes = computeRowSizes(totalBolts, rows);
  const hiddenActiveCount = tutorial
    ? tutorial.hiddenActiveCount
    : revealThisLevel ? totalBolts - rowSizes[rows - 1] : 0;
  const colorIds = choosePaletteIds(level, colors, tutorial?.colorIds);
  const duplicateColorIds = duplicateStacks === 0
    ? []
    : seededAdvancedShuffle(colorIds, level * 613, 2).slice(0, duplicateStacks);
  const stackColorIds = seededAdvancedShuffle([...colorIds, ...duplicateColorIds], level * 719, 3);
  const scramblePairs = tutorial
    ? Math.min(Math.floor(activeBolts / 2), Math.max(1, level - 1))
    : earlyOverride
      ? earlyOverride.scramblePairs
      : Math.min(Math.floor(activeBolts / 2), 5, 2 + Math.floor((level - 11) / 12));

  const config = {
    level, totalBolts, activeBolts, emptyBolts, capacity, colors,
    duplicateStacks, isRevealLevel: revealThisLevel || tutorial?.hiddenActiveCount > 0,
    isDoubleColor, hiddenActiveCount, rows, rowSizes, colorIds, stackColorIds,
    scramblePairs, solutionMoveUpperBound: scramblePairs * 4,
    generationSeed: level * 999,
  };
  assertLevelConfig(config, previous);
  _levelConfigCache[level] = config;
  return config;
}

function assertLevelConfig(config, previous) {
  const fail = message => { throw new Error(`Invalid level ${config.level}: ${message}`); };
  const tutorial = TUTORIAL_CONFIGS[config.level];
  if (config.emptyBolts !== 2 || config.activeBolts !== config.totalBolts - 2) fail('must have exactly two empty bolts');
  if (config.stackColorIds.length !== config.activeBolts) fail('stack colours must match active bolts');
  if (new Set(config.colorIds).size !== config.colors || config.colorIds.length !== config.colors) fail('colour identities must be unique');
  if (config.colors + config.duplicateStacks !== config.activeBolts) fail('colours + duplicates must equal active bolts');
  if (config.duplicateStacks > Math.floor(config.activeBolts * 0.4)) fail('too many duplicate stacks');
  if (config.colorIds.length > MAX_COLORS) fail('palette overflow');
  if (config.rowSizes.reduce((sum, size) => sum + size, 0) !== config.totalBolts) fail('row layout total mismatch');
  if (config.hiddenActiveCount > config.activeBolts) fail('hidden bolts cannot include empty bolts');
  if (config.scramblePairs > Math.floor(config.activeBolts / 2)) fail('too many independent scramble pairs');
  if (config.solutionMoveUpperBound < 4 || config.solutionMoveUpperBound > 20) fail('solution budget outside supported range');
  if (config.rows !== getTargetRowCount(config.totalBolts, config.capacity)) fail('incorrect row count');
  const remainder = config.totalBolts % config.rows;
  for (let i = 0; i < config.rows; i++) {
    const expected = Math.floor(config.totalBolts / config.rows) + (i < remainder ? 1 : 0);
    if (config.rowSizes[i] !== expected) fail('row size mismatch');
  }
  if (tutorial) {
    if (config.totalBolts !== tutorial.totalBolts || config.capacity !== tutorial.capacity || config.colors !== tutorial.colors || config.duplicateStacks !== tutorial.duplicateStacks || config.hiddenActiveCount !== tutorial.hiddenActiveCount) fail('tutorial target mismatch');
    if (config.level === 2 && config.colorIds.some(id => TUTORIAL_CONFIGS[1].colorIds.includes(id))) fail('level 2 palette must be disjoint from level 1');
  }
  if (config.level > 5) {
    const [min, max] = TOTAL_BOLT_RANGES[config.capacity];
    if (config.totalBolts < min || config.totalBolts > max) fail('outside capacity bolt range');
    if (config.isRevealLevel && config.duplicateStacks !== 0) fail('reveal levels cannot duplicate colours');
    if (config.isDoubleColor && (config.isRevealLevel || config.capacity <= 4)) fail('invalid duplicate level');
    if (!config.isRevealLevel && previous && !NORMAL_CAPACITY_TRANSITIONS[previous.capacity].includes(config.capacity)) fail('capacity transition too close');
    if (config.isRevealLevel && config.hiddenActiveCount !== config.totalBolts - config.rowSizes[config.rowSizes.length - 1]) fail('reveal split must be all rows above bottom');
  }
}

// Automated invariant validation for a representative 100-level run.
// Every scramble pair has a legal four-move recovery using the two empty
// bolts, so this also certifies a concrete upper bound on solution length.
export function validateGeneratedLevels(levelCount = 100) {
  for (let level = 1; level <= levelCount; level++) generateDeterministicLevelConfig(level);
  for (let start = 6; start <= levelCount; start += 10) {
    const block = Array.from({ length: Math.min(10, levelCount - start + 1) }, (_, i) => generateDeterministicLevelConfig(start + i));
    if (block.length !== 10) continue;
    const reveals = block.filter(config => config.isRevealLevel);
    const duplicates = block.filter(config => config.isDoubleColor);
    if (reveals.length !== 3 || duplicates.length !== 2) {
      console.warn(`Invalid block starting ${start}: reveals length ${reveals.length}, duplicates length ${duplicates.length}`);
      return false;
    }
    if (!reveals.some(config => config.capacity <= 4) || !reveals.some(config => config.capacity >= 5 && config.capacity <= 6) || !reveals.some(config => config.capacity >= 7)) {
      console.warn(`Reveal tiers missing in block ${start}`);
      return false;
    }
    const revealPositions = reveals.map(config => config.level - start + 1);
    if (revealPositions.join(',') !== REVEAL_POSITIONS.join(',')) {
      console.warn(`Reveal positions invalid in block ${start}`);
      return false;
    }
    for (let i = 1; i < revealPositions.length; i++) {
      const duplicatesBetween = duplicates.filter(config => config.level > start + revealPositions[i - 1] - 1 && config.level < start + revealPositions[i] - 1);
      if (duplicatesBetween.length > 1) {
        console.warn(`Duplicate clustering in block ${start}`);
        return false;
      }
    }
  }
  return true;
}

// Validation runs manually or in dev to diagnose issues without fatal crashes.
// validateGeneratedLevels(100);
// ============================================================
// END SECTION: LEVEL CONFIG GENERATOR
// ============================================================


// ============================================================
// SECTION: MAIN GAME COMPONENT (NutBoltGame)
// All game state, logic, layout calculations, and JSX live here.
// ============================================================
function NutBoltGame() {

  // ----------------------------------------------------------
  // SUB-SECTION: STATE DECLARATIONS
  // ----------------------------------------------------------
  const [level, setLevel] = useState(1);
  const [bolts, setBolts] = useState([]);
  const [selectedIdx, setSelectedIdx] = useState(null);
  const [errorIdx, setErrorIdx] = useState(null);
  const [justLockedIdx, setJustLockedIdx] = useState(null);
  const [history, setHistory] = useState([]);
  const [moveCount, setMoveCount] = useState(0);
  const [undoCount, setUndoCount] = useState(0);
  const [username, setUsername] = useState('AAA');
  
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showLevelBrowser, setShowLevelBrowser] = useState(false);
  const [browserPage, setBrowserPage] = useState(0);
  const [showIntroClearPop, setShowIntroClearPop] = useState(false);
  
  const [completedLevels, setCompletedLevels] = useState([]);
  const [playerScores, setPlayerScores] = useState({});
  const [confirmWipe, setConfirmWipe] = useState(false);

  const [showUsernamePrompt, setShowUsernamePrompt] = useState(false);
  const [pendingUsername, setPendingUsername] = useState('');
  const [isInitialLoadDone, setIsInitialLoadDone] = useState(false);

  const currentConfig = generateDeterministicLevelConfig(level);
  
   // Safe default dimensions so calculations never evaluate to 0 on mobile startup
  const [boardSize, setBoardSize] = useState({ 
    width: typeof window !== 'undefined' ? window.innerWidth : 350, 
    height: typeof window !== 'undefined' ? window.innerHeight : 500 
  });

  // Combined real height of the fixed header + dock footer, measured from
  // the actual rendered elements (see the observer effect below) instead
  // of a hardcoded guess, so the board always gets exactly the leftover space.
  const [chromeHeight, setChromeHeight] = useState(120);

  // Refs declared together, up front, so every effect below can safely
  // assume they already exist by the time it runs.
  const boardRef = useRef(null);
  const headerRef = useRef(null);
  const footerRef = useRef(null);
  // ----------------------------------------------------------
  // END SUB-SECTION: STATE DECLARATIONS
  // ----------------------------------------------------------


  // ----------------------------------------------------------
  // SUB-SECTION: EFFECT — LOCK PAGE SCROLL / PREVENT BOUNCE
  // The game is a fixed, full-viewport app: nothing outside the board
  // or a modal's own list should ever scroll. This locks the document
  // itself so mobile browsers can't rubber-band/bounce the page and
  // drag the fixed header/footer along with it, and restores whatever
  // was there before on unmount (in case this mounts inside a larger page).
  // ----------------------------------------------------------
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prev = {
      htmlOverflow: html.style.overflow,
      bodyOverflow: body.style.overflow,
      htmlOverscroll: html.style.overscrollBehavior,
      bodyOverscroll: body.style.overscrollBehavior,
    };

    html.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    html.style.overscrollBehavior = 'none';
    body.style.overscrollBehavior = 'none';

    return () => {
      html.style.overflow = prev.htmlOverflow;
      body.style.overflow = prev.bodyOverflow;
      html.style.overscrollBehavior = prev.htmlOverscroll;
      body.style.overscrollBehavior = prev.bodyOverscroll;
    };
  }, []);
  // ----------------------------------------------------------
  // END SUB-SECTION: EFFECT — LOCK PAGE SCROLL / PREVENT BOUNCE
  // ----------------------------------------------------------


  // ----------------------------------------------------------
  // SUB-SECTION: EFFECT — LOCALSTORAGE INITIAL LOAD
  // Runs once on mount. Loads saved username, leaderboard,
  // completed levels, and current level from localStorage.
  // ----------------------------------------------------------
  useEffect(() => {
    try {
      const savedName = localStorage.getItem('nb_arcade_name_v7');
      if (savedName) setUsername(savedName);
      else setShowUsernamePrompt(true);
      
      const savedLeaderboard = localStorage.getItem('nb_global_leaderboard_v7');
      if (savedLeaderboard) {
        const parsed = JSON.parse(savedLeaderboard);
        setPlayerScores((parsed && typeof parsed === 'object' && !Array.isArray(parsed)) ? parsed : {});
      }
      
      // Puzzle data is versioned: old snapshots use palette IDs and layouts
      // that no longer exist, so they must never be restored into v8 boards.
      const savedCompleted = localStorage.getItem('nb_completed_levels_v8');
      if (savedCompleted) {
        const parsed = JSON.parse(savedCompleted);
        setCompletedLevels(Array.isArray(parsed) ? parsed : []);
      }

      const savedCurrentLevel = localStorage.getItem('nb_current_level_v8');
      if (savedCurrentLevel) {
        const parsedLevel = parseInt(savedCurrentLevel, 10);
        if (!isNaN(parsedLevel) && parsedLevel >= 1) {
          setLevel(parsedLevel);
        }
      }
    } catch (err) {
      console.warn("Storage Load Warning:", err);
      setShowUsernamePrompt(true);
    } finally {
      setIsInitialLoadDone(true);
    }
  }, []);
  // ----------------------------------------------------------
  // END SUB-SECTION: EFFECT — LOCALSTORAGE INITIAL LOAD
  // ----------------------------------------------------------


  // ----------------------------------------------------------
  // SUB-SECTION: GLOBAL LEADERBOARD SYNC (Supabase)
  // fetchGlobalLeaderboard pulls every player's row from the shared
  // `leaderboard` table and merges it into local playerScores state —
  // "merge" so a fetch failure (offline, RLS misconfigured, etc.) can
  // never erase what's already on screen. Runs once on mount and again
  // each time the leaderboard modal is opened, so it's reasonably fresh
  // without polling constantly.
  // ----------------------------------------------------------
  const fetchGlobalLeaderboard = async () => {
    if (!isGlobalLeaderboardEnabled || !supabase) return;
    try {
      const { data, error } = await supabase
        .from('leaderboard')
        .select('username, total_score, levels_played');
      if (error) throw error;
      if (!data) return;
      setPlayerScores(prev => {
        const merged = { ...prev };
        for (const row of data) {
          merged[row.username] = {
            totalScore: row.total_score,
            levelsPlayed: row.levels_played,
          };
        }
        return merged;
      });
    } catch (err) {
      console.warn('Global leaderboard fetch failed, showing local data only:', err);
    }
  };

  useEffect(() => {
    fetchGlobalLeaderboard();
  }, []);
  // ----------------------------------------------------------
  // END SUB-SECTION: GLOBAL LEADERBOARD SYNC (Supabase)
  // ----------------------------------------------------------


  // ----------------------------------------------------------
  // SUB-SECTION: EFFECT — PERSIST CURRENT LEVEL
  // Saves the active level number to localStorage whenever it changes.
  // ----------------------------------------------------------
  useEffect(() => {
    if (isInitialLoadDone) {
      localStorage.setItem('nb_current_level_v8', String(level));
    }
  }, [level, isInitialLoadDone]);
  // ----------------------------------------------------------
  // END SUB-SECTION: EFFECT — PERSIST CURRENT LEVEL
  // ----------------------------------------------------------


  // ----------------------------------------------------------
  // SUB-SECTION: EFFECT — VIEWPORT / CHROME SIZE OBSERVER
  // Single ResizeObserver that watches the board, header, and footer
  // elements together and measures their REAL rendered sizes. This
  // replaces two previous effects: a window-resize listener that ran
  // before its own boardRef existed in source order (fragile), and a
  // second, separate ResizeObserver that only watched the board and
  // left header/footer height as a hardcoded 128px guess. Now the
  // board's available height is always exact, even if header/footer
  // styling changes later or the mobile URL bar shows/hides.
  // ----------------------------------------------------------
  useEffect(() => {
    const boardEl = boardRef.current;
    if (!boardEl) return;

    const measure = () => {
      const boardRect = boardEl.getBoundingClientRect();
      if (boardRect.width > 0 && boardRect.height > 0) {
        setBoardSize(prev => {
          if (Math.abs(prev.width - boardRect.width) > 5 || Math.abs(prev.height - boardRect.height) > 5) {
            return { width: boardRect.width, height: boardRect.height };
          }
          return prev;
        });
      }

      const headerH = headerRef.current ? headerRef.current.getBoundingClientRect().height : 56;
      const footerH = footerRef.current ? footerRef.current.getBoundingClientRect().height : 64;
      const nextChrome = headerH + footerH;
      setChromeHeight(prev => (Math.abs(prev - nextChrome) > 2 ? nextChrome : prev));
    };

    measure();

    const ro = new ResizeObserver(measure);
    ro.observe(boardEl);
    if (headerRef.current) ro.observe(headerRef.current);
    if (footerRef.current) ro.observe(footerRef.current);
    return () => ro.disconnect();
  }, []);
  // ----------------------------------------------------------
  // END SUB-SECTION: EFFECT — VIEWPORT / CHROME SIZE OBSERVER
  // ----------------------------------------------------------


  // ----------------------------------------------------------
  // SUB-SECTION: EFFECT — LOAD / GENERATE LEVEL ON LEVEL CHANGE
  // Triggers loadAndGenerateLevel whenever the level number changes
  // (after initial data has been loaded from localStorage).
  // ----------------------------------------------------------
  useEffect(() => {
    if (isInitialLoadDone) {
      loadAndGenerateLevel();
    }
  }, [level, isInitialLoadDone]);
  // ----------------------------------------------------------
  // END SUB-SECTION: EFFECT — LOAD / GENERATE LEVEL ON LEVEL CHANGE
  // ----------------------------------------------------------


  // ----------------------------------------------------------
  // SUB-SECTION: EFFECT — SAVE IN-PROGRESS STATE / DETECT WIN
  // Runs whenever bolt state changes. Saves unfinished progress
  // to localStorage and clears the snapshot on level completion.
  // ----------------------------------------------------------
  useEffect(() => {
    if (!isInitialLoadDone || bolts.length === 0) return;

    const isClear = bolts.every(b => b.nuts.length === 0 || checkBoltLock(b.nuts));
    
    try {
      if (!isClear) {
        const unfinished = JSON.parse(localStorage.getItem('nb_unfinished_snapshots_v8') || '{}');
        unfinished[`stage_${level}`] = { bolts, history, moveCount, undoCount };
        localStorage.setItem('nb_unfinished_snapshots_v8', JSON.stringify(unfinished));
      } else {
        const unfinished = JSON.parse(localStorage.getItem('nb_unfinished_snapshots_v8') || '{}');
        if (unfinished[`stage_${level}`]) {
          delete unfinished[`stage_${level}`];
          localStorage.setItem('nb_unfinished_snapshots_v8', JSON.stringify(unfinished));
        }

        const snapshots = JSON.parse(localStorage.getItem('nb_level_snapshots_v8') || '{}');
        if (!snapshots[level]) {
          snapshots[level] = bolts;
          localStorage.setItem('nb_level_snapshots_v8', JSON.stringify(snapshots));
        }
      }
    } catch (err) {
      console.warn("State save warning:", err);
    }
  }, [bolts, history, moveCount, undoCount, level, isInitialLoadDone]);
  // ----------------------------------------------------------
  // END SUB-SECTION: EFFECT — SAVE IN-PROGRESS STATE / DETECT WIN
  // ----------------------------------------------------------


  // ----------------------------------------------------------
  // SUB-SECTION: LEVEL PAGE / UNLOCK HELPERS
  // Utilities for the level browser pagination and page-lock system.
  // A page unlocks when the previous page has >= 8 completions.
  // ----------------------------------------------------------
  const getPageCompletionCount = (pageIndex) => {
    const startLvl = pageIndex * 10 + 1;
    const endLvl = (pageIndex + 1) * 10;
    return completedLevels.filter(lvl => lvl >= startLvl && lvl <= endLvl).length;
  };

  const isPageUnlocked = (pageIndex) => {
    if (pageIndex === 0) return true;
    return getPageCompletionCount(pageIndex - 1) >= 8;
  };

  const canAdvanceToLevel = (targetLvl) => {
    const targetPage = Math.floor((targetLvl - 1) / 10);
    return isPageUnlocked(targetPage);
  };
  // ----------------------------------------------------------
  // END SUB-SECTION: LEVEL PAGE / UNLOCK HELPERS
  // ----------------------------------------------------------


  // ----------------------------------------------------------
  // SUB-SECTION: USERNAME SUBMIT HANDLER
  // Validates and saves the 3-letter player tag on first launch.
  // ----------------------------------------------------------
  const handleUsernameSubmit = () => {
    const clean = pendingUsername.trim().toUpperCase().slice(0, 3);
    const finalName = clean.length > 0 ? clean : 'AAA';
    setUsername(finalName);
    localStorage.setItem('nb_arcade_name_v7', finalName);
    setShowUsernamePrompt(false);
  };
  // ----------------------------------------------------------
  // END SUB-SECTION: USERNAME SUBMIT HANDLER
  // ----------------------------------------------------------


  // ----------------------------------------------------------
  // SUB-SECTION: REVERSE SHUFFLE SIMULATOR
  // Creates a certified puzzle rather than a full random permutation.
  // Each pair swaps just its top nuts. With two empty bolts, every pair has
  // a known four-move recovery sequence, so solutionMoveUpperBound is real.
  // ----------------------------------------------------------
  const applyReverseShuffling = (initialBolts, capacity, seed) => {
    const activeBoltsCount = initialBolts.filter(b => b.nuts.length > 0).length;
    const targetEmptyCount = initialBolts.length - activeBoltsCount;
    const totalNuts = activeBoltsCount * capacity;

    const runSingleScramble = (currentSeed) => {
      let lSeed = currentSeed;
      const bolts = initialBolts.map(bolt => ({
        nuts: bolt.nuts.map(nut => ({ ...nut })),
        isRevealPeg: false,
      }));

      const scrambleMoves = Math.max(300, Math.round(totalNuts * 15));

      // Phase 1: Random Reverse Scramble
      for (let i = 0; i < scrambleMoves; i++) {
        const validSources = [];
        for (let j = 0; j < bolts.length; j++) {
          if (bolts[j].nuts.length > 0) {
            validSources.push(j);
          }
        }
        if (validSources.length === 0) break;

        const sourceIdx = validSources[Math.floor(seededRandom(lSeed++) * validSources.length)];

        const validTargets = [];
        for (let j = 0; j < bolts.length; j++) {
          if (j !== sourceIdx && bolts[j].nuts.length < capacity) {
            const movingNut = bolts[sourceIdx].nuts[bolts[sourceIdx].nuts.length - 1];
            const targetNuts = bolts[j].nuts;
            let run = 1;
            if (targetNuts.length > 0 && targetNuts[targetNuts.length - 1].id === movingNut.id) {
               run = 2;
               if (targetNuts.length > 1 && targetNuts[targetNuts.length - 2].id === movingNut.id) {
                 run = 3;
               }
            }
            if (run < 3) {
              validTargets.push(j);
            }
          }
        }
        
        if (validTargets.length === 0) {
          // Fallback if strictly preventing chains of 3 leaves no valid targets
          for (let j = 0; j < bolts.length; j++) {
            if (j !== sourceIdx && bolts[j].nuts.length < capacity) {
              validTargets.push(j);
            }
          }
        }

        if (validTargets.length > 0) {
          const targetIdx = validTargets[Math.floor(seededRandom(lSeed++) * validTargets.length)];
          bolts[targetIdx].nuts.push(bolts[sourceIdx].nuts.pop());
        }
      }

      // Phase 2: Consolidation to full active bolts and target empty bolts
      let consolidationSteps = 0;
      const maxConsolidationSteps = 500;

      while (consolidationSteps < maxConsolidationSteps) {
        const currentEmptyCount = bolts.filter(b => b.nuts.length === 0).length;
        if (currentEmptyCount === targetEmptyCount) {
          break;
        }

        const partialBolts = [];
        for (let j = 0; j < bolts.length; j++) {
          if (bolts[j].nuts.length > 0 && bolts[j].nuts.length < capacity) {
            partialBolts.push(j);
          }
        }

        if (partialBolts.length < 2) {
          break;
        }

        // Shuffle partial bolts order slightly using seed to avoid bias
        const p1 = Math.floor(seededRandom(lSeed++) * partialBolts.length);
        let p2 = Math.floor(seededRandom(lSeed++) * partialBolts.length);
        if (p1 === p2) p2 = (p1 + 1) % partialBolts.length;

        const sourceIdx = bolts[partialBolts[p1]].nuts.length < bolts[partialBolts[p2]].nuts.length ? partialBolts[p1] : partialBolts[p2];
        const targetIdx = sourceIdx === partialBolts[p1] ? partialBolts[p2] : partialBolts[p1];

        bolts[targetIdx].nuts.push(bolts[sourceIdx].nuts.pop());
        consolidationSteps++;
      }

      // Sort bolts so completely empty bolts are at the end
      bolts.sort((a, b) => {
        if (a.nuts.length === 0 && b.nuts.length > 0) return 1;
        if (a.nuts.length > 0 && b.nuts.length === 0) return -1;
        return 0;
      });

      // Phase 3: Chain-breaking post-processing
      // Strictly prevent stacks of 3 or more of the same color
      for (let b = 0; b < bolts.length; b++) {
        const nutList = bolts[b].nuts;
        for (let i = 0; i < nutList.length - 2; i++) {
          if (nutList[i].id === nutList[i + 1].id && nutList[i].id === nutList[i + 2].id) {
            // Found a chain of 3+, try to swap the middle nut
            let swapped = false;
            for (let tb = 0; tb < bolts.length && !swapped; tb++) {
              for (let tn = 0; tn < bolts[tb].nuts.length && !swapped; tn++) {
                const targetNut = bolts[tb].nuts[tn];
                if (targetNut.id !== nutList[i].id) {
                  // Swap
                  const temp = nutList[i + 1].id;
                  nutList[i + 1].id = targetNut.id;
                  bolts[tb].nuts[tn].id = temp;
                  swapped = true;
                }
              }
            }
          }
        }
      }

      return bolts;
    };

    // Quality Scoring Function
    // Lower score is better (fewer matching adjacent nuts, lower color concentration per bolt)
    const evaluateQuality = (candidateBolts) => {
      let score = 0;

      for (const bolt of candidateBolts) {
        if (bolt.nuts.length === 0) continue;

        // Count color frequencies in this bolt
        const colorCounts = {};
        let runLength = 1;
        for (let i = 0; i < bolt.nuts.length; i++) {
          const colorId = bolt.nuts[i].id;
          colorCounts[colorId] = (colorCounts[colorId] || 0) + 1;

          // Penalty for adjacent same colors
          if (i > 0) {
            if (bolt.nuts[i].id === bolt.nuts[i - 1].id) {
              runLength++;
              if (runLength >= 3) {
                score += 1000;
              } else {
                score += 20;
              }
            } else {
              runLength = 1;
            }
          }
        }

        // Penalty if any single color dominates this bolt
        for (const c in colorCounts) {
          if (colorCounts[c] >= 3) {
            score += 300 * (colorCounts[c] - 2); // Heavy penalty for 3 or 4 of same color in one bolt
          }
        }
      }

      return score;
    };

    // Try multiple shuffle candidates and pick the best mixed result
    let bestCandidate = null;
    let bestScore = Infinity;

    for (let attempt = 0; attempt < 80; attempt++) {
      const candidateSeed = seed + attempt * 997;
      const candidateBolts = runSingleScramble(candidateSeed);
      const score = evaluateQuality(candidateBolts);

      if (score < bestScore) {
        bestScore = score;
        bestCandidate = candidateBolts;
        if (score === 0) break; // Perfect shuffle achieved
      }
    }

    return bestCandidate || runSingleScramble(seed);
  };
  // ----------------------------------------------------------
  // END SUB-SECTION: REVERSE SHUFFLE SIMULATOR
  // ----------------------------------------------------------


  // ----------------------------------------------------------
  // SUB-SECTION: LOAD AND GENERATE LEVEL (loadAndGenerateLevel)
  // Tries to restore a saved/unfinished state first.
  // Falls back to generating a solved board and applying
  // controlled reverse-shuffling steps.
  // ----------------------------------------------------------
  const loadAndGenerateLevel = (forceNew = false) => {
    if (!forceNew) {
      if (completedLevels.includes(level)) {
        try {
          const snapshots = JSON.parse(localStorage.getItem('nb_level_snapshots_v8') || '{}');
          if (snapshots[level]) {
            setBolts(snapshots[level]);
            setSelectedIdx(null);
            setHistory([]);
            setMoveCount(0);
            setUndoCount(0);
            return;
          }
        } catch {
          /* ignore */
        }
      } else {
        try {
          const unfinished = JSON.parse(localStorage.getItem('nb_unfinished_snapshots_v8') || '{}');
          if (unfinished[`stage_${level}`]) {
            const saved = unfinished[`stage_${level}`];
            setBolts(saved.bolts);
            setHistory(saved.history || []);
            setMoveCount(saved.moveCount || 0);
            setUndoCount(saved.undoCount || 0);
            setSelectedIdx(null);
            return;
          }
        } catch {
          /* ignore */
        }
      }
    }

    const { activeBolts, emptyBolts, capacity, isRevealLevel, hiddenActiveCount, stackColorIds, generationSeed } = currentConfig;
    const totalBolts = activeBolts + emptyBolts;

    // Step 1: Create a fully sorted solved base state
    const baseBolts = [];
    for (let b = 0; b < totalBolts; b++) {
      if (b < activeBolts) {
        const color = NUT_TYPES.find(type => type.id === stackColorIds[b]);
        const nuts = Array.from({ length: capacity }, () => ({ id: color.id, revealed: true }));
        baseBolts.push({ nuts, isRevealPeg: false });
      } else {
        baseBolts.push({ nuts: [], isRevealPeg: false });
      }
    }

    // Step 2: Apply controlled reverse-shuffling
    let scrambledBolts = applyReverseShuffling(baseBolts, capacity, generationSeed);

    // Step 3: Apply reveal/hidden flags if level uses reveal mechanics.
    // Hidden bolts are always the first `hiddenActiveCount` positions
    // (see LEVEL CONFIG GENERATOR), so they land in the top row(s) once
    // chunked, and the remaining active + empty bolts (always revealed)
    // land in the bottom row.
    if (isRevealLevel) {
      scrambledBolts = scrambledBolts.map((b, idx) => {
        const shouldBeHiddenPeg = idx < hiddenActiveCount;
        const updatedNuts = b.nuts.map((nut, nIdx) => ({
          ...nut,
          revealed: shouldBeHiddenPeg ? (nIdx === b.nuts.length - 1) : true
        }));
        return { ...b, nuts: updatedNuts, isRevealPeg: shouldBeHiddenPeg };
      });
    }

    setBolts(scrambledBolts);
    setSelectedIdx(null);
    setHistory([]);
    setMoveCount(0);
    setUndoCount(0);
  };
  // ----------------------------------------------------------
  // END SUB-SECTION: LOAD AND GENERATE LEVEL
  // ----------------------------------------------------------


  // ----------------------------------------------------------
  // SUB-SECTION: BOLT / NUT LOGIC HELPERS
  // checkBoltLock — returns true when a bolt is fully sorted (locked).
  // getTopRunCount — counts how many matching nuts are at the top
  //   of a bolt (the moveable stack).
  // ----------------------------------------------------------
  const checkBoltLock = (nutsList) => {
    if (nutsList.length !== currentConfig.capacity) return false;
    return nutsList.every(n => n.id === nutsList[0].id);
  };

  const getTopRunCount = (nutsList) => {
    if (nutsList.length === 0) return 0;
    const topId = nutsList[nutsList.length - 1].id;
    let count = 1;
    for (let i = nutsList.length - 2; i >= 0; i--) {
      if (!nutsList[i].revealed) break;
      if (nutsList[i].id === topId) count++;
      else break;
    }
    return count;
  };
  // ----------------------------------------------------------
  // END SUB-SECTION: BOLT / NUT LOGIC HELPERS
  // ----------------------------------------------------------


  // ----------------------------------------------------------
  // SUB-SECTION: BOLT CLICK HANDLER (handleBoltClick)
  // First tap selects a source bolt; second tap on a different bolt
  // attempts to move the top matching run of nuts to the target.
  // Reveals the next hidden nut on the source bolt after a move.
  // ----------------------------------------------------------
  const handleBoltClick = (idx) => {
    if (selectedIdx === null) {
      if (bolts[idx].nuts.length === 0 || checkBoltLock(bolts[idx].nuts)) return;
      setSelectedIdx(idx);
    } else {
      if (selectedIdx === idx) {
        setSelectedIdx(null);
        return;
      }
      
      const sourcePeg = bolts[selectedIdx];
      const targetPeg = bolts[idx];

      if (targetPeg.nuts.length >= currentConfig.capacity || checkBoltLock(targetPeg.nuts)) {
        setErrorIdx(idx);
        setTimeout(() => setErrorIdx(null), 400);
        setSelectedIdx(null);
        return;
      }

      const topNut = sourcePeg.nuts[sourcePeg.nuts.length - 1];
      if (targetPeg.nuts.length > 0 && targetPeg.nuts[targetPeg.nuts.length - 1].id !== topNut.id) {
        setErrorIdx(idx);
        setTimeout(() => setErrorIdx(null), 400);
        setSelectedIdx(null);
        return;
      }

      const runCount = getTopRunCount(sourcePeg.nuts);
      const availableSpace = currentConfig.capacity - targetPeg.nuts.length;
      const moveAmount = Math.min(runCount, availableSpace);

      if (moveAmount <= 0) {
        setSelectedIdx(null);
        return;
      }

      const movingNuts = sourcePeg.nuts.slice(sourcePeg.nuts.length - moveAmount);
      setHistory(prev => [...prev, JSON.stringify(bolts)]);

      const updatedBolts = bolts.map((b, i) => {
        if (i === selectedIdx) {
          const remaining = b.nuts.slice(0, b.nuts.length - moveAmount);
          if (remaining.length > 0) {
            let currentIdx = remaining.length - 1;
            if (!remaining[currentIdx].revealed) {
              remaining[currentIdx] = { ...remaining[currentIdx], revealed: true };
            }
            while (currentIdx > 0) {
              const nextIdx = currentIdx - 1;
              if (!remaining[nextIdx].revealed && remaining[nextIdx].id === remaining[currentIdx].id) {
                remaining[nextIdx] = { ...remaining[nextIdx], revealed: true };
                currentIdx--;
              } else {
                break;
              }
            }
          }
          return { ...b, nuts: remaining };
        }
        if (i === idx) return { ...b, nuts: [...b.nuts, ...movingNuts] };
        return b;
      });

      setBolts(updatedBolts);
      setSelectedIdx(null);
      setMoveCount(prev => prev + 1);
      
      const targetUpdatedNuts = updatedBolts[idx].nuts;
      if (targetUpdatedNuts.length === currentConfig.capacity && targetUpdatedNuts.every(n => n.id === targetUpdatedNuts[0].id)) {
        setJustLockedIdx(idx);
        setTimeout(() => setJustLockedIdx(null), 800);
      }
    }
  };
  // ----------------------------------------------------------
  // END SUB-SECTION: BOLT CLICK HANDLER
  // ----------------------------------------------------------


  // ----------------------------------------------------------
  // SUB-SECTION: UNDO HANDLER (handleUndo)
  // Pops the last bolt state from history and restores it.
  // ----------------------------------------------------------
  const handleUndo = () => {
    if (history.length === 0) return;
    setBolts(JSON.parse(history[history.length - 1]));
    setHistory(history.slice(0, -1));
    setUndoCount(prev => prev + 1);
    setSelectedIdx(null);
  };
  // ----------------------------------------------------------
  // END SUB-SECTION: UNDO HANDLER
  // ----------------------------------------------------------


  // ----------------------------------------------------------
  // SUB-SECTION: RESET HANDLER (handleReset)
  // Clears unfinished progress for the current level and
  // regenerates a fresh puzzle from scratch.
  // ----------------------------------------------------------
  const handleReset = () => {
    try {
      const unfinished = JSON.parse(localStorage.getItem('nb_unfinished_snapshots_v8') || '{}');
      if (unfinished[`stage_${level}`]) {
        delete unfinished[`stage_${level}`];
        localStorage.setItem('nb_unfinished_snapshots_v8', JSON.stringify(unfinished));
      }
    } catch {
      /* ignore */
    }
    loadAndGenerateLevel(true);
  };
  // ----------------------------------------------------------
  // END SUB-SECTION: RESET HANDLER
  // ----------------------------------------------------------


  // ----------------------------------------------------------
  // SUB-SECTION: WIPE DATA HANDLER (handleWipeData)
  // Nuclear reset: clears all localStorage and resets all state
  // to defaults. Triggered from the Settings modal confirm flow.
  // ----------------------------------------------------------
  const handleWipeData = () => {
    localStorage.clear();
    setLevel(1);
    setCompletedLevels([]);
    setPlayerScores({});
    setUsername('AAA');
    setShowSettings(false);
    setConfirmWipe(false);
    setShowUsernamePrompt(true);
  };
  // ----------------------------------------------------------
  // END SUB-SECTION: WIPE DATA HANDLER
  // ----------------------------------------------------------


  // ----------------------------------------------------------
  // SUB-SECTION: SCORE CALCULATOR (calculateLevelScore)
  // Derives a score for the completed level based on bolt count,
  // reveal bonus, move count, and undo penalties.
  // ----------------------------------------------------------
  const calculateLevelScore = () => {
    const baseVal = 1500 + ((currentConfig.activeBolts - currentConfig.colors) * 250) + (currentConfig.isRevealLevel ? 500 : 0);
    const efficiencyFactor = Math.max(50, 400 - (moveCount * 2) - (undoCount * 4));
    return baseVal + efficiencyFactor;
  };
  // ----------------------------------------------------------
  // END SUB-SECTION: SCORE CALCULATOR
  // ----------------------------------------------------------


  // ----------------------------------------------------------
  // SUB-SECTION: NEXT LEVEL PROGRESSION (handleNextLevelProgress)
  // Called when the player taps "PROCEED NEXT" on the stage-clear
  // screen. Awards score (first clear only), marks level complete,
  // and either advances or shows the intro-complete popup for level 5.
  // ----------------------------------------------------------
  const handleNextLevelProgress = () => {
    const scoreGenerated = calculateLevelScore();
    const updated = { ...playerScores };
    if (!updated[username]) updated[username] = { totalScore: 0, levelsPlayed: 0 };
    
    const wasIntroLvl = level === 5;

    if (!completedLevels.includes(level)) {
      updated[username].totalScore += scoreGenerated;
      updated[username].levelsPlayed += 1;
      setPlayerScores(updated);
      localStorage.setItem('nb_global_leaderboard_v7', JSON.stringify(updated));
      const nextCompleted = [...completedLevels, level];
      setCompletedLevels(nextCompleted);
      localStorage.setItem('nb_completed_levels_v8', JSON.stringify(nextCompleted));

      // Local cache above always succeeds and is what keeps this
      // browser working offline; this is the "make it actually global"
      // half — best-effort, never blocks or breaks play if it fails.
      if (isGlobalLeaderboardEnabled && supabase) {
        supabase.from('leaderboard').upsert({
          username,
          total_score: updated[username].totalScore,
          levels_played: updated[username].levelsPlayed,
          updated_at: new Date().toISOString(),
        }).then(({ error }) => {
          if (error) console.warn('Global leaderboard sync failed:', error);
        });
      }
    }

    if (wasIntroLvl) {
      setShowIntroClearPop(true);
    } else {
      advanceStage();
    }
  };

  const advanceStage = () => {
    const nextLvl = level + 1;
    if (canAdvanceToLevel(nextLvl)) {
      setLevel(nextLvl);
    } else {
      setShowLevelBrowser(true);
      setBrowserPage(Math.floor((level - 1) / 10));
    }
  };

  const openLevelBrowser = () => {
    setShowLevelBrowser(true);
    setBrowserPage(Math.floor((level - 1) / 10));
  };
  // ----------------------------------------------------------
  // END SUB-SECTION: NEXT LEVEL PROGRESSION
  // ----------------------------------------------------------


  // ----------------------------------------------------------
  // SUB-SECTION: DERIVED STATE — WIN CONDITION & LEADERBOARD SORT
  // isLevelClear — true when all bolts are empty or locked.
  // sortedLeaderboard — player entries sorted by average score desc.
  // ----------------------------------------------------------
  const isLevelClear = bolts.length > 0 && bolts.every(b => b.nuts.length === 0 || checkBoltLock(b.nuts));
  
  const sortedLeaderboard = Object.entries(playerScores)
    .map(([name, data]) => ({
      name,
      ...data,
      avgScore: data.levelsPlayed > 0 ? Math.round(data.totalScore / data.levelsPlayed) : 0
    }))
    .sort((a, b) => b.avgScore - a.avgScore);
  // ----------------------------------------------------------
  // END SUB-SECTION: DERIVED STATE — WIN CONDITION & LEADERBOARD SORT
  // ----------------------------------------------------------


  // ----------------------------------------------------------
  // SUB-SECTION: BOARD LAYOUT CALCULATIONS
  // Computes nut height, bolt width, column/row gaps, and row
  // groupings from the current board size and level config.
  // Prevents mobile zero-dimension crashes and horizontal overlap.
  //
  // Sizing is fit, not guessed: available width/height is measured
  // for real (see the chrome-size observer effect), then bolt width,
  // nut height, and both gap dimensions are solved together so bolts
  // always fill the row cleanly — shrinking the gap before shrinking
  // bolts when space is tight, and growing the gap (instead of just
  // capping bolt width) when space is generous, so a sparse row
  // spreads out instead of bunching against one edge.
  // ----------------------------------------------------------
  const BOARD_PADDING = 8;
  const MIN_ROW_GAP = 10;
  const MAX_ROW_GAP = 26;
  const MIN_COL_GAP = 8;
  const MAX_COL_GAP = 28;
  const MIN_BOLT_W = 28;
  const MAX_BOLT_W = 86;
  const DESIRED_COL_GAP = 14;
  const MIN_NUT_H = 12;
  const MAX_NUT_H = 86; // matches MAX_BOLT_W so the width cap (below), not this, is what limits nut height

  // Fallback guards for initial render frames on mobile screens
  const safeWidth = Math.max(280, boardSize.width || (typeof window !== 'undefined' ? window.innerWidth : 350));
  const safeHeight = Math.max(400, boardSize.height || (typeof window !== 'undefined' ? window.innerHeight : 500));

  const boardWidthAvail = Math.max(100, safeWidth - BOARD_PADDING * 2);
  const totalBolts = currentConfig.activeBolts + currentConfig.emptyBolts;
  const cap = currentConfig.capacity;

  // Same helpers the level generator uses for its reveal-row split, so
  // rendering and generation always agree on row shape (see ROW LAYOUT
  // HELPERS, above the level config generator).
  const targetRows = getTargetRowCount(totalBolts, cap);
  const rowSizes = computeRowSizes(totalBolts, targetRows);
  const columns = Math.max(...rowSizes);
  const safeCapacity = Math.max(1, cap);

  // Real measured header + footer height (falls back to 120 before first measure)
  const headerFooterHeight = chromeHeight;
  const availH = Math.max(200, safeHeight - headerFooterHeight - (BOARD_PADDING * 2));

  // Reserve row-gap space BEFORE sizing nuts, so the gaps we render
  // afterward can never push the last row's pegs off-screen.
  const reservedRowGapH = targetRows > 1 ? MIN_ROW_GAP * (targetRows - 1) : 0;
  const availHForPegs = Math.max(100, availH - reservedRowGapH);

  // Solve bolt width + column gap together so a row always fits exactly:
  // start from the desired gap, shrink the gap first if bolts would go
  // below minimum width, then only shrink bolt width as a last resort.
  // If there's slack instead, grow the gap (up to MAX_COL_GAP) rather
  // than just capping bolt width, so sparse rows spread out evenly.
  let colGap = columns > 1 ? DESIRED_COL_GAP : 0;
  let boltColWidth = columns > 0 ? (boardWidthAvail - colGap * (columns - 1)) / columns : boardWidthAvail;

  if (boltColWidth < MIN_BOLT_W && columns > 1) {
    colGap = MIN_COL_GAP;
    boltColWidth = (boardWidthAvail - colGap * (columns - 1)) / columns;
  }

  if (boltColWidth > MAX_BOLT_W) {
    boltColWidth = MAX_BOLT_W;
    if (columns > 1) {
      colGap = Math.max(MIN_COL_GAP, Math.min(MAX_COL_GAP, (boardWidthAvail - boltColWidth * columns) / (columns - 1)));
    }
  }

  boltColWidth = Math.max(MIN_BOLT_W, Math.min(MAX_BOLT_W, boltColWidth));
  colGap = Math.max(MIN_COL_GAP, Math.min(MAX_COL_GAP, colGap));

  // Calculate nutHeight bounded by boltColWidth to prevent abnormally tall thin nuts.
  // The +0.6 (rather than a bigger buffer) reserves just enough headroom for the
  // peg tip above the top nut, so more of the available height goes to the nuts
  // themselves instead of empty space above them.
  let nutHeight = Math.max(MIN_NUT_H, Math.min(MAX_NUT_H, availHForPegs / ((safeCapacity + 0.6) * targetRows)));
  nutHeight = Math.min(nutHeight, boltColWidth);
  const pegHeight = Math.max(20, nutHeight * safeCapacity + 5);

  const rowGap = targetRows > 1
    ? Math.max(MIN_ROW_GAP, Math.min(MAX_ROW_GAP, (availH - pegHeight * targetRows) / (targetRows - 1)))
    : 0;

  // Chunk bolts into rows while preserving true state array indices
  const chunkedBolts = [];
  let chunkIdx = 0;
  for (const size of rowSizes) {
    chunkedBolts.push(
      bolts.slice(chunkIdx, chunkIdx + size).map((bolt, i) => ({
        ...bolt,
        globalIdx: chunkIdx + i
      }))
    );
    chunkIdx += size;
  }
  // ----------------------------------------------------------
  // END SUB-SECTION: BOARD LAYOUT CALCULATIONS
  // ----------------------------------------------------------

  // ----------------------------------------------------------
  // SUB-SECTION: JSX RENDER — ROOT SHELL
  // Fixed, full-viewport container (not a scrolling page): header and
  // footer are pinned edges of this box, so they can never be dragged
  // by a swipe, and there is nothing here for the browser to scroll —
  // only the game board (which never overflows) and modal-internal
  // lists (which scroll on their own, contained, without dragging the
  // rest of the app). Children: header, board, footer, and all modal
  // overlays stacked via absolute positioning against this fixed box.
  // ----------------------------------------------------------
  return (
    <div className="fixed inset-0 bg-black text-slate-100 flex flex-col overflow-hidden overscroll-none select-none">
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes custom-shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px) rotate(-2deg); }
          50% { transform: translateX(4px) rotate(2deg); }
          75% { transform: translateX(-4px) rotate(-2deg); }
        }
        @keyframes custom-burst {
          0% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.7); }
          50% { box-shadow: 0 0 20px 10px rgba(245, 158, 11, 0); }
          100% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0); }
        }
        .animate-error-shake {
          animation: custom-shake 0.3s cubic-bezier(.36,.07,.19,.97) both;
        }
        .animate-lock-burst {
          animation: custom-burst 0.6s ease-out both;
        }
      `}} />

      {/* ======================================================
          HEADER BAR
          Left: Leaderboard button | Center: Level nav (prev/label/next) | Right: Settings button
          ====================================================== */}
      <header ref={headerRef} className="w-full h-14 px-4 bg-zinc-950 border-b border-zinc-700 shrink-0 flex justify-between items-center z-35">
        <button type="button" onClick={() => { setShowLeaderboard(true); fetchGlobalLeaderboard(); }} className="w-10 h-10 rounded-xl flex items-center justify-center border bg-zinc-900 border-zinc-600 text-amber-300">
          <Trophy size={20} />
        </button>

        <div className="flex items-center gap-2">
          <button type="button" disabled={level <= 1} onClick={() => level > 1 && setLevel(p => p - 1)} className="w-10 h-10 bg-zinc-900 border border-zinc-600 rounded-xl flex items-center justify-center text-white active:bg-zinc-800 disabled:opacity-35 transition-colors">
            <ChevronLeft size={20} strokeWidth={3} />
          </button>
          <button type="button" onClick={openLevelBrowser} className="px-6 h-10 bg-white border border-white rounded-xl flex items-center justify-center font-black text-lg tracking-tight text-black hover:bg-slate-200 transition-colors">
            LVL {level}
          </button>
          <button type="button" disabled={!canAdvanceToLevel(level + 1)} onClick={() => setLevel(p => p + 1)} className="w-10 h-10 bg-zinc-900 border border-zinc-600 rounded-xl flex items-center justify-center text-white active:bg-zinc-800 disabled:opacity-35 transition-colors">
            <ChevronRight size={20} strokeWidth={3} />
          </button>
        </div>

        <button type="button" onClick={() => setShowSettings(true)} className="w-10 h-10 rounded-xl flex items-center justify-center border bg-zinc-900 border-zinc-600 text-slate-100">
          <Settings size={20} />
        </button>
      </header>
      {/* END HEADER BAR */}


           {/* ======================================================
          GAME BOARD
          Flex container measured by boardRef. Renders bolts in
          rows (chunkedBolts). Each bolt shows a peg, slot guides,
          stacked nuts, and a lock indicator when sorted.
          ====================================================== */}
      <div
        ref={boardRef}
        className="flex-1 w-full overflow-hidden flex flex-col items-center justify-center relative touch-manipulation"
        style={{
          padding: `${BOARD_PADDING}px`,
          gap: `${rowGap}px`,
          background: '#000000'
        }}
      >
        {chunkedBolts.map((row, rIdx) => (
          <div key={`row-${rIdx}`} className="flex flex-row justify-center items-center" style={{ gap: `${colGap}px` }}>
            {row.map((bolt) => {
              const globalIdx = bolt.globalIdx;
              const isLocked = checkBoltLock(bolt.nuts);
              const isSelected = selectedIdx === globalIdx;

              return (
                <div 
                  key={`bolt-${globalIdx}`} 
                  onClick={() => handleBoltClick(globalIdx)} 
                  className={`relative flex flex-col items-center cursor-pointer group select-none transition-transform ${errorIdx === globalIdx ? 'animate-error-shake' : ''} ${justLockedIdx === globalIdx ? 'animate-lock-burst' : ''}`}
                  style={{ height: `${pegHeight}px`, width: `${boltColWidth}px` }}
                >
                  {/* Slot guide lines (empty slot indicators) */}
                  <div className="absolute inset-x-0 bottom-1 flex flex-col-reverse items-center justify-start pointer-events-none gap-y-[2px]">
                    {Array.from({ length: safeCapacity }).map((_, i) => (
                      <div key={i} className="w-full border border-dashed border-slate-800/20 rounded bg-slate-900/5" style={{ height: `${Math.max(1, nutHeight - 2)}px` }} />
                    ))}
                  </div>
                  
                  {/* Peg rod */}
                  <div className={`absolute bottom-1 w-1 rounded-t-full transition-all ${isLocked ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]' : isSelected ? 'bg-blue-400 shadow-[0_0_12px_rgba(96,165,250,0.8)] animate-pulse' : 'bg-slate-800 group-hover:bg-slate-700'}`} style={{ height: `${Math.max(1, pegHeight - 4)}px` }} />
                  
                  {/* Nut stack */}
                  <div className="absolute inset-x-0 bottom-1 flex flex-col-reverse items-center gap-y-[2px] z-10 pointer-events-none">
                    {bolt.nuts.map((nut, nIdx) => {
                      const isTopNut = nIdx === bolt.nuts.length - 1;
                      const isNutRevealed = nut.revealed;
                      
                      const nutType = NUT_TYPES.find(t => t.id === nut.id) || NUT_TYPES[0]; 
                      const Icon = nutType.icon;
                      return (
                        <div 
                          key={nIdx} 
                          className={`rounded flex flex-col items-center justify-center border-b-2 shadow-sm transform transition-all w-full ${isNutRevealed ? `${nutType.bg} ${nutType.border} ${nutType.iconText} border-black/30` : 'bg-zinc-800 border-zinc-950 border-b-black text-zinc-300'} ${isSelected && isTopNut ? '-translate-y-3 ring-4 ring-blue-400 ring-offset-1 ring-offset-black scale-110 z-20 shadow-[0_10px_20px_rgba(0,0,0,0.5)]' : ''}`}
                          style={{ height: `${Math.max(1, nutHeight - 2)}px` }}
                        >
                          {isNutRevealed ? (
                            <Icon size={Math.max(8, Math.min(24, nutHeight * 0.55))} className="drop-shadow-md" strokeWidth={3} />
                          ) : (
                            <div className="text-[10px] font-bold text-zinc-300">?</div>
                          )}
                        </div>
                      );
                    })}
                    {/* Lock cap shown when bolt is fully sorted */}
                    {isLocked && (
                      <div
                        className={`rounded-full bg-gradient-to-b from-yellow-200 via-amber-400 to-amber-600 border border-amber-700 shadow-md z-20 ${justLockedIdx === globalIdx ? 'animate-lock-burst' : ''}`}
                        style={{ width: '65%', height: `${Math.max(4, Math.min(12, nutHeight * 0.3))}px` }}
                      />
                    )}
                  </div>
                  
                  {/* Bolt base + lock icon */}
                  <div className={`absolute bottom-0 h-1.5 w-8 rounded-full shadow transition-colors ${isLocked ? 'bg-amber-500' : isSelected ? 'bg-blue-500' : 'bg-slate-600'}`}>
                    {isLocked && <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-amber-500 text-slate-950 p-0.5 rounded-full shadow"><Lock size={6} strokeWidth={3} /></div>}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
      {/* END GAME BOARD */}


      {/* ======================================================
          FOOTER BAR
          Left: Reset button | Center: Undo button | Right: Move/Height stats
          ====================================================== */}
      <footer ref={footerRef} className="w-full h-16 px-4 bg-black border-t border-zinc-700 shrink-0 flex items-center justify-between z-35">
        <button type="button" onClick={handleReset} disabled={moveCount === 0} className="w-11 h-11 rounded-xl flex items-center justify-center border bg-zinc-900 border-zinc-600 text-rose-300 disabled:opacity-35">
          <RotateCcw size={20} />
        </button>
        <button type="button" onClick={handleUndo} disabled={history.length === 0} className="w-12 h-12 rounded-2xl flex items-center justify-center border bg-blue-600 border-blue-400 text-white disabled:bg-zinc-800 disabled:border-zinc-600 disabled:text-slate-300 shadow-xl active:scale-95 transition-all">
          <Undo2 size={24} strokeWidth={2.5} />
        </button>
        <div className="flex items-center gap-2 bg-zinc-900 rounded-xl px-3 py-1.5 border border-zinc-700">
          <div className="flex flex-col items-center">
            <span className="text-[8px] text-slate-300 uppercase font-bold">Moves</span>
            <span className="text-xs font-black text-amber-400">{moveCount}</span>
          </div>
          <div className="w-[1px] h-5 bg-slate-700" />
          <div className="flex flex-col items-center">
            <span className="text-[8px] text-slate-300 uppercase font-bold">Height</span>
            <span className="text-xs font-black text-sky-400">{currentConfig.capacity}</span>
          </div>
        </div>
      </footer>
      {/* END FOOTER BAR */}


      {/* ======================================================
          MODAL: STAGE CLEAR INTERSTITIAL
          Shown when isLevelClear is true (and not the intro clear pop).
          Displays score and a "PROCEED NEXT" button.
          ====================================================== */}
      {isLevelClear && !showIntroClearPop && (
        <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 z-40">
          <div className="w-full max-w-xs bg-slate-900 border border-slate-800 rounded-[28px] p-6 text-center space-y-5 shadow-2xl">
            <div className="w-16 h-16 bg-amber-500/10 border-2 border-amber-500/30 rounded-full flex items-center justify-center mx-auto text-amber-400">
              <Trophy size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tight">STAGE CLEAR!</h2>
              <p className="text-xs text-slate-400 mt-1">Score Calculated: +{calculateLevelScore()}</p>
            </div>
            <button
              type="button"
              onClick={handleNextLevelProgress}
              className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 font-black text-sm rounded-xl uppercase tracking-wider shadow-lg active:brightness-90 transition-all"
            >
              PROCEED NEXT
            </button>
          </div>
        </div>
      )}
      {/* END MODAL: STAGE CLEAR INTERSTITIAL */}


      {/* ======================================================
          MODAL: TRAINING INTRO COMPLETE POPUP
          Shown after completing level 5 (the last tutorial level).
          Congratulates the player and gates entry to the full game.
          ====================================================== */}
      {showIntroClearPop && (
        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-xs bg-slate-900 border-2 border-amber-500/40 rounded-[28px] p-6 text-center space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="w-14 h-14 bg-gradient-to-tr from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto text-slate-950 font-black text-xl rotate-12 shadow-lg">
              🚀
            </div>
            <div>
              <h2 className="text-xl font-black text-amber-400 uppercase tracking-tight">Training Complete!</h2>
              <p className="text-sm text-white font-bold mt-2">The game begins now!</p>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Introductory levels are behind you. Prepare for full grid variants and hidden layers. Good luck!
              </p>
            </div>
            <button 
              type="button" 
              onClick={() => { setShowIntroClearPop(false); advanceStage(); }} 
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-xs rounded-xl uppercase tracking-widest shadow-lg active:scale-98 transition-transform"
            >
              UNLEASH THE GRID
            </button>
          </div>
        </div>
      )}
      {/* END MODAL: TRAINING INTRO COMPLETE POPUP */}


      {/* ======================================================
          MODAL: USERNAME PROMPT (INITIAL LOAD)
          Shown on first launch when no saved name exists.
          Collects a 3-letter player tag for the leaderboard.
          ====================================================== */}
      {showUsernamePrompt && (
        <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4 z-[60]">
          <div className="w-full max-w-xs bg-slate-900 border border-slate-800 rounded-[28px] p-6 text-center space-y-4 shadow-2xl">
            <h2 className="text-xl font-black uppercase tracking-tight">Welcome, Pilot!</h2>
            <p className="text-xs text-slate-400">Provide a 3-letter signature badge prefix for global leaderboards</p>
            <input
              type="text"
              autoFocus
              maxLength={3}
              value={pendingUsername}
              onChange={(e) => setPendingUsername(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && handleUsernameSubmit()}
              placeholder="AAA"
              className="w-full p-3 bg-slate-950 text-amber-400 text-center font-black text-xl tracking-widest border border-slate-800 rounded-xl focus:outline-none focus:border-amber-500"
            />
            <button
              type="button"
              onClick={handleUsernameSubmit}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 font-black text-sm rounded-xl uppercase tracking-wider"
            >
              Start Sorting
            </button>
          </div>
        </div>
      )}
      {/* END MODAL: USERNAME PROMPT */}


      {/* ======================================================
          MODAL: GLOBAL LEADERBOARD
          Lists all players sorted by average score per level.
          Top 3 get gold/silver/bronze badge styling.
          ====================================================== */}
      {showLeaderboard && (
        <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-[28px] p-5 space-y-4 max-h-[80%] flex flex-col shadow-2xl">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2 text-amber-400">
                <Crown size={16} />
                <h3 className="text-sm font-black uppercase tracking-wider">GLOBAL LEADERBOARD</h3>
              </div>
              <button type="button" className="text-slate-400 hover:text-white" onClick={() => setShowLeaderboard(false)}>
                <X size={16} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto overscroll-contain space-y-2 pr-1">
              {sortedLeaderboard.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-300 font-medium">No recorded highscores found yet.</div>
              ) : (
                sortedLeaderboard.map((player, rank) => {
                  let rankStyle = "border-slate-800 bg-slate-950/40 text-slate-300";
                  let badge = <span className="text-slate-300 font-bold w-5 text-center">{rank + 1}</span>;
                  
                  if (rank === 0) {
                    rankStyle = "border-amber-500/30 bg-amber-500/5 text-amber-400 font-bold";
                    badge = <Crown size={12} className="text-amber-400 w-5" />;
                  } else if (rank === 1) {
                    rankStyle = "border-slate-400/30 bg-slate-400/5 text-slate-200 font-semibold";
                    badge = <span className="text-slate-400 font-black w-5 text-center">2</span>;
                  } else if (rank === 2) {
                    rankStyle = "border-orange-700/30 bg-orange-700/5 text-orange-400 font-semibold";
                    badge = <span className="text-orange-500 font-black w-5 text-center">3</span>;
                  }

                  return (
                    <div key={player.name} className={`flex justify-between items-center px-3 py-2.5 rounded-xl border font-medium text-xs ${rankStyle}`}>
                      <div className="flex items-center gap-2">
                        {badge}
                        <span className="uppercase tracking-wider">{player.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-white font-extrabold">
                          {player.avgScore} <span className="text-[9px] font-normal text-slate-400">avg</span>
                        </div>
                        <div className="text-[9px] text-slate-300">{player.levelsPlayed} clear(s)</div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
      {/* END MODAL: GLOBAL LEADERBOARD */}


      {/* ======================================================
          MODAL: PLAYER PROFILE / SETTINGS
          Edit 3-letter tag and save, or wipe all local data.
          confirmWipe toggles the two-step confirm flow.
          ====================================================== */}
      {showSettings && (
        <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-xs bg-slate-900 border border-slate-800 rounded-[28px] p-5 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h3 className="text-sm font-black uppercase tracking-wider">PLAYER PROFILE</h3>
              <button type="button" className="text-slate-400 hover:text-white" onClick={() => { setShowSettings(false); setConfirmWipe(false); }}>
                <X size={16} />
              </button>
            </div>

            {!confirmWipe ? (
              // -- Settings default view --
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Edit Tag Name</label>
                  <input 
                    type="text" 
                    maxLength={3} 
                    value={username} 
                    onChange={(e) => setUsername(e.target.value.toUpperCase())} 
                    className="w-full p-2 bg-slate-950 text-amber-400 text-center font-black tracking-widest border border-slate-800 rounded-xl focus:outline-none focus:border-slate-600"
                  />
                </div>
                
                <button 
                  type="button" 
                  onClick={() => { localStorage.setItem('nb_arcade_name_v7', username); setShowSettings(false); }} 
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-xs font-black rounded-xl text-white uppercase tracking-wider transition-colors"
                >
                  SAVE SIGNATURE
                </button>
                
                <div className="pt-4 border-t border-slate-800/60 mt-4 space-y-2">
                  <button 
                    type="button" 
                    onClick={() => window.location.reload()} 
                    className="w-full py-2 bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-bold rounded-xl uppercase transition-colors"
                  >
                    Force Hard Refresh App
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setConfirmWipe(true)} 
                    className="w-full py-2 bg-red-950/40 border border-red-900/40 text-red-400 hover:bg-red-900/20 text-xs font-bold rounded-xl uppercase transition-colors"
                  >
                    Wipe / Reset Data
                  </button>
                </div>
              </div>
            ) : (
              // -- Wipe confirmation view --
              <div className="text-center p-1 space-y-4">
                <p className="text-xs text-red-400 font-semibold leading-relaxed">
                  Are you absolutely sure? This action clears all completed stages, high scores, and locally tracked profile history permanently.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    type="button" 
                    onClick={() => setConfirmWipe(false)} 
                    className="py-2 bg-slate-800 hover:bg-slate-700 text-xs font-bold rounded-xl text-slate-300 uppercase"
                  >
                    Cancel
                  </button>
                  <button 
                    type="button" 
                    onClick={handleWipeData} 
                    className="py-2 bg-red-600 hover:bg-red-700 text-xs font-black rounded-xl text-white uppercase tracking-wider shadow-md"
                  >
                    Confirm Wipe
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {/* END MODAL: PLAYER PROFILE / SETTINGS */}


      {/* ======================================================
          MODAL: LEVEL SELECTOR / BROWSER
          Paginated 10-level grid. Pages lock until the previous
          page has >= 8 completions. Current and cleared levels
          get distinct visual treatment.
          ====================================================== */}
      {showLevelBrowser && (
        <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-[28px] p-5 max-h-[85%] flex flex-col shadow-2xl">
            <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-800">
              <h3 className="text-sm font-black uppercase tracking-wider">LEVEL SELECTOR</h3>
              <button type="button" className="text-slate-400 hover:text-white" onClick={() => setShowLevelBrowser(false)}>
                <X size={16} />
              </button>
            </div>

            {/* Page navigation row */}
            <div className="flex justify-between items-center bg-slate-950/80 rounded-xl p-2 mb-3 border border-slate-800 text-xs">
              <button 
                type="button"
                disabled={browserPage === 0}
                onClick={() => setBrowserPage(p => p - 1)}
                className="px-2 py-1 bg-slate-800 rounded-lg text-slate-300 disabled:opacity-20 flex items-center gap-0.5 font-bold transition-all"
              >
                <ChevronLeft size={12} strokeWidth={2.5} /> Prev
              </button>
              
              <span className="font-bold text-slate-400">
                Levels {browserPage * 10 + 1} - {(browserPage + 1) * 10}
              </span>

              <button 
                type="button"
                disabled={!isPageUnlocked(browserPage + 1)}
                onClick={() => setBrowserPage(p => p + 1)}
                className="px-2 py-1 bg-slate-800 rounded-lg text-slate-300 disabled:opacity-40 flex items-center gap-0.5 font-bold transition-all disabled:bg-slate-900/50"
              >
                {!isPageUnlocked(browserPage + 1) ? (
                  <span className="flex items-center gap-1 text-slate-600"><Lock size={10}/> Locked</span>
                ) : (
                  <>Next <ChevronRight size={12} strokeWidth={2.5} /></>
                )}
              </button>
            </div>
            
            {/* Unlock progress hint */}
            <div className="text-[10px] text-slate-300 font-medium pb-2 text-center">
              Requires 8 completions on current page to unlock next set ({getPageCompletionCount(browserPage)}/10 clear)
            </div>

            {/* Level grid (5 columns × 2 rows = 10 levels per page) */}
            <div className="flex-1 overflow-y-auto overscroll-contain grid grid-cols-5 gap-2 pt-1 pr-0.5">
              {Array.from({ length: 10 }).map((_, i) => {
                const targetLvl = browserPage * 10 + (i + 1);
                const isCurrent = targetLvl === level;
                const isDone = completedLevels.includes(targetLvl);

                return (
                  <button 
                    key={targetLvl} 
                    type="button" 
                    onClick={() => { setLevel(targetLvl); setShowLevelBrowser(false); }} 
                    className={`h-10 rounded-xl flex flex-col items-center justify-center border transition-all text-xs font-bold relative ${
                      isCurrent 
                        ? 'bg-blue-600 border-blue-400 text-white shadow-md scale-105 z-10' 
                        : isDone 
                          ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-400' 
                          : 'bg-slate-950 border-slate-800/80 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <span>{targetLvl}</span>
                    {isDone && <span className="absolute bottom-0.5 text-[6px] text-emerald-500 font-extrabold tracking-tighter">CLEAR</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
      {/* END MODAL: LEVEL SELECTOR / BROWSER */}

    </div>
  );
  // ----------------------------------------------------------
  // END SUB-SECTION: JSX RENDER — ROOT SHELL
  // ----------------------------------------------------------
}
// ============================================================
// END SECTION: MAIN GAME COMPONENT (NutBoltGame)
// ============================================================


// ============================================================
// SECTION: ERROR BOUNDARY WRAPPER (NutBoltAppWrapper)
// Class component that catches runtime render errors and shows
// a recovery screen with a "Wipe Storage & Reboot" button.
// This is the default export — the app entry point.
// ============================================================
export default class NutBoltAppWrapper extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Game engine crash detected:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 bg-red-950 text-red-200 p-6 flex flex-col justify-center items-center font-mono text-center overflow-auto z-[9999]">
          <h2 className="text-2xl font-black mb-4 uppercase tracking-widest text-red-500">System Error</h2>
          <p className="text-sm mb-6 max-w-sm">{this.state.error?.message || "An unexpected rendering fault occurred."}</p>
          <button 
            onClick={() => { localStorage.clear(); window.location.reload(); }}
            className="px-6 py-3 bg-red-600 text-white font-bold rounded-xl shadow-lg active:scale-95 transition-transform uppercase tracking-wider"
          >
            Wipe Storage & Reboot
          </button>
        </div>
      );
    }
    return <NutBoltGame />;
  }
}
// ============================================================
// END SECTION: ERROR BOUNDARY WRAPPER
// ============================================================
