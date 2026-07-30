// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
// ============================================================
// SECTION: IMPORTS
// ============================================================
import React, { useState, useEffect, useRef } from 'react';
import { 
  Trophy, Undo2, RotateCcw, Lock, Settings, X, CheckCircle2,
  Circle, Square, Triangle, Hexagon, Star, Heart, 
  Moon, Sun, Cloud, Snowflake, Crown, Music, 
  Zap, ChevronLeft, ChevronRight, Diamond, Gem,
  Flower2, Leaf, Flame, Waves, Mountain, Umbrella, Apple,
  Anchor, Bell, Cookie, Ghost, Smartphone, Share, PlusSquare, MoreVertical
} from 'lucide-react';
import { supabase, isGlobalLeaderboardEnabled } from './lib/supabaseClient';
import { playPickup, playPlace, playLock, playError, playLevelComplete, playSectionComplete } from './lib/sounds';
const safeStorage = {
  getItem: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
  setItem: (k, v) => { try { localStorage.setItem(k, v); } catch { /* ignore */ } },
  clear: () => { try { localStorage.clear(); } catch { /* ignore */ } }
};

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
  { id: 'grey',        bg: 'bg-zinc-500',    border: 'border-zinc-700',    hex: '#71717a', icon: Snowflake,iconText: 'text-white' },
  { id: 'brown',       bg: 'bg-amber-800',   border: 'border-amber-950',   hex: '#92400e', icon: Zap,      iconText: 'text-white' },
  { id: 'hot-pink',    bg: 'bg-pink-400',    border: 'border-pink-700',    hex: '#f472b6', icon: Anchor,   iconText: 'text-white' },
  { id: 'green',       bg: 'bg-green-600',   border: 'border-green-900',   hex: '#16a34a', icon: Hexagon,  iconText: 'text-white' },
  { id: 'orange',      bg: 'bg-orange-500',  border: 'border-orange-800',  hex: '#f97316', icon: Triangle, iconText: 'text-zinc-950' },
  { id: 'purple',      bg: 'bg-purple-700',  border: 'border-purple-950',  hex: '#7e22ce', icon: Moon,     iconText: 'text-white' },
  { id: 'light-blue',  bg: 'bg-sky-300',     border: 'border-sky-600',     hex: '#7dd3fc', icon: Cloud,    iconText: 'text-zinc-950' },
  { id: 'dark-blue',   bg: 'bg-indigo-900',  border: 'border-indigo-950',  hex: '#312e81', icon: Crown,    iconText: 'text-white' },
  { id: 'light-green', bg: 'bg-lime-300',    border: 'border-lime-600',    hex: '#bef264', icon: Leaf,     iconText: 'text-zinc-950' },
  { id: 'dark-green',  bg: 'bg-emerald-800', border: 'border-emerald-950', hex: '#065f46', icon: Flower2,  iconText: 'text-white' },
  { id: 'light-grey',  bg: 'bg-slate-300',   border: 'border-slate-500',   hex: '#cbd5e1', icon: Ghost,    iconText: 'text-zinc-950' },
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
  { id: 'dark-violet', bg: 'bg-violet-900',  border: 'border-violet-950',  hex: '#4c1d95', icon: Diamond,  iconText: 'text-white' },
];
// ============================================================
// END SECTION: NUT COLOR / ICON PALETTE (NUT_TYPES)
// ============================================================


// ============================================================
// SECTION: COLOUR DISTANCE / CONTRAST ENGINE
// Measures how different two colours actually *look*, in CIE Lab space
// (the same colour-space perceptual-distance tools use) rather than
// raw hue angle. This matters specifically for pale/near-grey colours:
// an earlier HSL-based version of this engine computed a large "hue"
// gap between e.g. white and light-grey even though both are almost
// fully desaturated and read as visually identical — HSL hue is
// meaningless once saturation drops near zero, but Lab's L*/a*/b* axes
// stay meaningful for any colour, so it doesn't have that blind spot.
// A pair "clashes" when Lab distance (deltaE) falls under
// CLASH_THRESHOLD.
// ============================================================
function hexToLab(hex) {
  let r = parseInt(hex.slice(1, 3), 16) / 255;
  let g = parseInt(hex.slice(3, 5), 16) / 255;
  let b = parseInt(hex.slice(5, 7), 16) / 255;
  const toLinear = c => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  r = toLinear(r); g = toLinear(g); b = toLinear(b);
  // sRGB -> XYZ (D65 white point) -> Lab
  const x = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047;
  const y = (r * 0.2126 + g * 0.7152 + b * 0.0722) / 1.0;
  const z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883;
  const f = t => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  const fx = f(x), fy = f(y), fz = f(z);
  return { L: 116 * fy - 16, a: 500 * (fx - fy), b: 200 * (fy - fz) };
}

const NUT_LAB = Object.fromEntries(NUT_TYPES.map(t => [t.id, hexToLab(t.hex)]));

// Straight Euclidean distance in Lab space (deltaE76). 0 = identical;
// roughly 10 = similar-but-distinguishable; 25+ = clearly distinct.
function colorDistance(idA, idB) {
  const a = NUT_LAB[idA], b = NUT_LAB[idB];
  return Math.sqrt((a.L - b.L) ** 2 + (a.a - b.a) ** 2 + (a.b - b.b) ** 2);
}

const CLASH_THRESHOLD = 29; // below this, two colours read as "the same" at a glance

function clashesWithAny(id, chosenIds, threshold = CLASH_THRESHOLD) {
  return chosenIds.some(c => colorDistance(id, c) < threshold);
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
//   total ≤ 6          → 1 row
//   total 7–14         → 2 rows
//   total ≥ 15         → 3 rows
function getTargetRowCount(totalBolts) {
  if (totalBolts <= 6) return 1;
  if (totalBolts <= 12) return 2;
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

// Change this salt value if you ever want to re-seed and generate a fresh set of puzzle layouts for all levels
const LEVEL_SEED_SALT = 8888;

function choosePaletteIds(level, colors, tutorialIds, bgHex = null) {
  if (tutorialIds) return tutorialIds;

  const levelKey = level + LEVEL_SEED_SALT;

  // Deterministic per-level shuffle drawing from the *entire* 26-colour
  // catalogue (not a fixed small pool), so levels get real variety
  // instead of recycling the same handful of colours forever.
  let candidates = seededAdvancedShuffle(NUT_TYPES.map(t => t.id), levelKey * 151 + 31, 2);

  // Roughly one level in six, try to lead with a rare accent colour.
  if (seededRandom(levelKey * 47 + 5) < RARE_ACCENT_CHANCE) {
    const accent = RARE_ACCENTS[Math.floor(seededRandom(levelKey * 89 + 13) * RARE_ACCENTS.length)];
    candidates = [accent, ...candidates.filter(id => id !== accent)];
  }

  // Greedily accept colours that don't clash (by real HSL distance)
  // with anything already chosen.
  const chosen = [];
  let bgMockId = null;
  let targetColors = colors;
  if (bgHex) {
    bgMockId = 'bg-mock';
    NUT_LAB[bgMockId] = hexToLab(bgHex);
    chosen.push(bgMockId);
    targetColors = colors + 1;
  }

  for (const id of candidates) {
    if (chosen.length >= targetColors) break;
    if (!clashesWithAny(id, chosen)) chosen.push(id);
  }

  // Relaxation pass: only reachable at very high colour counts, where
  // the fully clash-free catalogue can't fill every slot. Loosen the
  // threshold gradually rather than falling back to raw randomness.
  let relaxedThreshold = CLASH_THRESHOLD;
  while (chosen.length < targetColors && relaxedThreshold > 6) {
    relaxedThreshold -= 4;
    for (const id of candidates) {
      if (chosen.length >= targetColors) break;
      if (chosen.includes(id)) continue;
      const tooClose = clashesWithAny(id, chosen, relaxedThreshold);
      if (!tooClose) chosen.push(id);
    }
  }

  // Last resort (unreachable with 26 colours at realistic level sizes):
  // fill whatever's left ignoring distance entirely.
  for (const id of candidates) {
    if (chosen.length >= targetColors) break;
    if (!chosen.includes(id)) chosen.push(id);
  }

  if (bgMockId) {
    return chosen.filter(id => id !== bgMockId).slice(0, colors);
  }
  return chosen;
}

function getNormalCapacity(level, previousCapacity, isDuplicate) {
  const allowed = NORMAL_CAPACITY_TRANSITIONS[previousCapacity];
  const candidates = isDuplicate ? allowed.filter(capacity => capacity >= 5) : allowed;
  return candidates[Math.floor(seededRandom(level * 283 + previousCapacity) * candidates.length)];
}

function getLevelPar(config) {
  if (!config) return 15;
  const baseNuts = (config.activeBolts || 3) * (config.capacity || 4);
  const scrambleAdj = (config.scramblePairs || 1) * 3.5;
  const duplicateAdj = (config.duplicateStacks || 0) * 4;
  const hiddenAdj = (config.hiddenActiveCount || 0) * 2;
  const capacityFactor = Math.max(1, config.capacity - 2) * 1.2;
  
  const estimatedPar = Math.round(baseNuts * 0.9 + scrambleAdj + duplicateAdj + hiddenAdj + capacityFactor);
  return Math.max(8, estimatedPar);
}
// ============================================================
// END SECTION: LEVEL PROGRESSION / VARIATION HELPERS
// ============================================================


// ============================================================
// SECTION: LEVEL CONFIG GENERATOR
// Defines rules for capacity, colors, hidden nuts, and bolt counts
// based on the current level number.
// ============================================================
function generateDeterministicLevelConfig(level, bgHex = null) {
  const cacheKey = `${level}-${bgHex || 'default'}`;
  if (_levelConfigCache[cacheKey]) return _levelConfigCache[cacheKey];

  const levelKey = level + LEVEL_SEED_SALT;

  const tutorial = TUTORIAL_CONFIGS[level];
  const earlyOverride = EARLY_LEVEL_OVERRIDES[level];
  const previous = level > 1 ? generateDeterministicLevelConfig(level - 1, bgHex) : null;
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
  const totalBolts = minTotal + Math.floor(seededRandom(levelKey * 997 + capacity) * (maxTotal - minTotal + 1));
  const emptyBolts = 2;
  const activeBolts = totalBolts - emptyBolts;
  const duplicateStacks = tutorial
    ? tutorial.duplicateStacks
    : earlyOverride
      ? earlyOverride.duplicateStacks
    : isDoubleColor
      ? 1 + Math.floor(seededRandom(levelKey * 571) * Math.min(3, Math.floor(activeBolts * 0.4)))
      : 0;
  const colors = tutorial ? tutorial.colors : activeBolts - duplicateStacks;
  const rows = getTargetRowCount(totalBolts, capacity);
  const rowSizes = computeRowSizes(totalBolts, rows);
  const hiddenActiveCount = tutorial
    ? tutorial.hiddenActiveCount
    : revealThisLevel ? totalBolts - rowSizes[rows - 1] : 0;
  const colorIds = choosePaletteIds(level, colors, tutorial?.colorIds, bgHex);
  const duplicateColorIds = duplicateStacks === 0
    ? []
    : seededAdvancedShuffle(colorIds, levelKey * 613, 2).slice(0, duplicateStacks);
  const stackColorIds = seededAdvancedShuffle([...colorIds, ...duplicateColorIds], levelKey * 719, 3);
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
    generationSeed: levelKey * 999,
  };
  assertLevelConfig(config, previous);
  _levelConfigCache[cacheKey] = config;
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
// SECTION: 2D COLOR PAD PICKER COMPONENT
// Single-pad color picker: X = Hue (0-360°), Y = Brightness/Shade.
// Includes visual target reticle, sync on open/change, and mobile touch prevention.
// ============================================================
function hslToHex(h: number, s: number, l: number) {
  l /= 100;
  const a = (s * Math.min(l, 1 - l)) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const c = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * c)
      .toString(16)
      .padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function hexToHsl(hex: string) {
  let c = (hex || '#e2e8f0').replace('#', '');
  if (c.length === 3) c = c.split('').map(x => x + x).join('');
  const num = parseInt(c, 16);
  if (isNaN(num)) return { h: 210, s: 40, l: 90 };
  const r = ((num >> 16) & 255) / 255;
  const g = ((num >> 8) & 255) / 255;
  const b = (num & 255) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function ColorPadPicker({ color, onChange }: { color: string; onChange: (hex: string) => void }) {
  const padRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [marker, setMarker] = useState({ x: 50, y: 50 }); // % coordinates for target ring
  const isDraggingRef = useRef(false);

  // Sync marker position with current color whenever isOpen becomes true or color changes externally
  useEffect(() => {
    if (isDraggingRef.current) return;
    const { h, l } = hexToHsl(color);
    const x = Math.max(0, Math.min(100, (h / 360) * 100));
    const y = Math.max(0, Math.min(100, (1 - l / 100) * 100));
    setMarker({ x, y });
  }, [color, isOpen]);

  const updateFromPointer = (clientX: number, clientY: number) => {
    if (!padRef.current) return;
    const rect = padRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));

    setMarker({ x: x * 100, y: y * 100 });

    const hue = Math.round(x * 360);
    const lightness = Math.round((1 - y) * 100);
    const newHex = hslToHex(hue, 80, lightness);
    onChange(newHex);
  };

  const getPointerCoords = (e: MouseEvent | TouchEvent | React.MouseEvent | React.TouchEvent) => {
    const touchEv = e as unknown as TouchEvent;
    if (touchEv.touches && touchEv.touches.length > 0) {
      return { clientX: touchEv.touches[0].clientX, clientY: touchEv.touches[0].clientY };
    }
    if (touchEv.changedTouches && touchEv.changedTouches.length > 0) {
      return { clientX: touchEv.changedTouches[0].clientX, clientY: touchEv.changedTouches[0].clientY };
    }
    const mouseEv = e as unknown as MouseEvent;
    return { clientX: mouseEv.clientX, clientY: mouseEv.clientY };
  };

  const handlePointerStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (e.cancelable && e.type.startsWith('touch')) {
      e.preventDefault();
    }
    isDraggingRef.current = true;
    const { clientX, clientY } = getPointerCoords(e);
    updateFromPointer(clientX, clientY);

    const handlePointerMove = (me: MouseEvent | TouchEvent) => {
      if (!isDraggingRef.current) return;
      if (me.cancelable && me.type.startsWith('touch')) me.preventDefault();
      const coords = getPointerCoords(me);
      updateFromPointer(coords.clientX, coords.clientY);
    };

    const handlePointerEnd = () => {
      isDraggingRef.current = false;
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerEnd);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('touchend', handlePointerEnd);
      window.removeEventListener('touchcancel', handlePointerEnd);
    };

    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerEnd);
    window.addEventListener('touchmove', handlePointerMove, { passive: false });
    window.addEventListener('touchend', handlePointerEnd);
    window.addEventListener('touchcancel', handlePointerEnd);
  };

  return (
    <div className="relative">
      {/* Color Swatch Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-7 h-7 rounded-full border-2 border-white/60 shadow-md transition-transform active:scale-95 flex items-center justify-center overflow-hidden cursor-pointer"
        style={{ backgroundColor: color }}
      >
        <div className="w-full h-full rounded-full ring-1 ring-black/20" />
      </button>

      {/* Pop-over 2D Pad */}
      {isOpen && (
        <div className="absolute right-0 top-9 z-50 p-3 bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl flex flex-col items-center space-y-2.5 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex justify-between items-center w-full px-1 gap-4">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Drag to select</span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="w-6 h-6 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold flex items-center justify-center transition-colors cursor-pointer"
            >
              ✕
            </button>
          </div>

          <div
            ref={padRef}
            onMouseDown={handlePointerStart}
            onTouchStart={handlePointerStart}
            className="w-48 h-36 rounded-xl cursor-crosshair relative overflow-hidden border border-white/20 touch-none shadow-inner select-none"
            style={{
              background: `
                linear-gradient(to top, #000000 0%, transparent 50%, #ffffff 100%),
                linear-gradient(to right, 
                  hsl(0, 80%, 50%), 
                  hsl(60, 80%, 50%), 
                  hsl(120, 80%, 50%), 
                  hsl(180, 80%, 50%), 
                  hsl(240, 80%, 50%), 
                  hsl(300, 80%, 50%), 
                  hsl(360, 80%, 50%)
                )
              `,
            }}
          >
            {/* Visual Target Ring / Reticle */}
            <div
              className="absolute w-4 h-4 rounded-full border-2 border-white ring-1 ring-black/40 shadow-lg pointer-events-none transform -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${marker.x}%`, top: `${marker.y}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
// ============================================================
// END SECTION: 2D COLOR PAD PICKER COMPONENT
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
  const [justPlacedIdx, setJustPlacedIdx] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [history, setHistory] = useState([]);
  const [moveCount, setMoveCount] = useState(0);
  const [undoCount, setUndoCount] = useState(0);
  const [resetsUsed, setResetsUsed] = useState(0);
  const [levelRecords, setLevelRecords] = useState<{ [lvl: number]: number }>({});
  const [username, setUsername] = useState('AAAA');
  
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showLevelBrowser, setShowLevelBrowser] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [completedLevelNotice, setCompletedLevelNotice] = useState<number | null>(null);
  const [browserPage, setBrowserPage] = useState(0);
  const [showIntroClearPop, setShowIntroClearPop] = useState(false);
  
  const [completedLevels, setCompletedLevels] = useState([]);
  const [playerScores, setPlayerScores] = useState({});
  const [userLevelScores, setUserLevelScores] = useState<{ [lvl: number]: number }>({});
  const [confirmWipe, setConfirmWipe] = useState(false);

  const [showUsernamePrompt, setShowUsernamePrompt] = useState(false);
  const [pendingUsername, setPendingUsername] = useState('');
  const [isInitialLoadDone, setIsInitialLoadDone] = useState(false);

  const [touchDrag, setTouchDrag] = useState<{
    sourceIdx: number;
    startX?: number;
    startY?: number;
    x: number;
    y: number;
    movingNuts: Nut[];
  } | null>(null);

  const [bgColor, setBgColor] = useState('#e2e8f0');

  const currentConfig = generateDeterministicLevelConfig(level, bgColor);
  
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
  const dragPreviewRefs = useRef({});
  const lastSoundPlayedLevelRef = useRef(null);
  const lastTouchTimeRef = useRef(0);
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
      const savedWelcome = safeStorage.getItem('nb_pwa_welcome_v2');
      if (!savedWelcome) {
        setShowWelcomeModal(true);
      }

      const savedName = safeStorage.getItem('nb_arcade_name_v7');
      if (savedName) setUsername(savedName);
      else setShowUsernamePrompt(true);
      
      const savedLeaderboard = safeStorage.getItem('nb_global_leaderboard_v7');
      if (savedLeaderboard) {
        const parsed = JSON.parse(savedLeaderboard);
        setPlayerScores((parsed && typeof parsed === 'object' && !Array.isArray(parsed)) ? parsed : {});
      }
      
      // Puzzle data is versioned: old snapshots use palette IDs and layouts
      // that no longer exist, so they must never be restored into v8 boards.
      const savedCompleted = safeStorage.getItem('nb_completed_levels_v8');
      if (savedCompleted) {
        const parsed = JSON.parse(savedCompleted);
        setCompletedLevels(Array.isArray(parsed) ? parsed : []);
      }

      const savedRecords = safeStorage.getItem('nb_level_records_v1');
      if (savedRecords) {
        try {
          const parsed = JSON.parse(savedRecords);
          if (parsed && typeof parsed === 'object') {
            const validRecords: { [lvl: number]: number } = {};
            for (const k in parsed) {
              const numVal = Number(parsed[k]);
              if (numVal > 0) validRecords[Number(k)] = numVal;
            }
            setLevelRecords(validRecords);
          }
        } catch {
          /* ignore */
        }
      }

      const savedUserScores = safeStorage.getItem('nb_user_level_scores_v1');
      if (savedUserScores) {
        try {
          const parsed = JSON.parse(savedUserScores);
          if (parsed && typeof parsed === 'object') {
            setUserLevelScores(parsed);
          }
        } catch {
          /* ignore */
        }
      }

      const savedCurrentLevel = safeStorage.getItem('nb_current_level_v8');
      if (savedCurrentLevel) {
        const parsedLevel = parseInt(savedCurrentLevel, 10);
        if (!isNaN(parsedLevel) && parsedLevel >= 1) {
          setLevel(parsedLevel);
        }
      }

      const savedSound = safeStorage.getItem('nb_sound_enabled_v1');
      if (savedSound !== null) {
        setSoundEnabled(savedSound === 'true');
      }

      const savedBgColor = safeStorage.getItem('nb_bg_color_v1');
      if (savedBgColor && savedBgColor !== '#000000') setBgColor(savedBgColor);
      else setBgColor('#e2e8f0');
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
  // SUB-SECTION: EFFECT — AUTO-UPDATE CHECKER (PWA / Mobile)
  // Polls /version.json on mount, app focus (visibilitychange),
  // and every 3 minutes. If a new version is detected, automatically
  // refreshes the app so mobile users always get latest updates without
  // needing manual cache clearing.
  // ----------------------------------------------------------
  useEffect(() => {
    let initialVersion: string | null = null;

    const checkForUpdates = async () => {
      try {
        const res = await fetch(`/version.json?t=${Date.now()}`, { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (data && data.version) {
          if (!initialVersion) {
            initialVersion = data.version;
          } else if (initialVersion !== data.version) {
            setUpdateAvailable(true);
            setTimeout(() => {
              window.location.reload();
            }, 1000);
          }
        }
      } catch {
        // network error ignored
      }
    };

    checkForUpdates();

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        checkForUpdates();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    const interval = setInterval(checkForUpdates, 3 * 60 * 1000);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      clearInterval(interval);
    };
  }, []);
  // ----------------------------------------------------------
  // END SUB-SECTION: EFFECT — AUTO-UPDATE CHECKER
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
  const fetchGlobalLevelRecords = async () => {
    if (!isGlobalLeaderboardEnabled || !supabase) return;
    try {
      const { data, error } = await supabase
        .from('level_records')
        .select('level, record_moves');
      if (error) throw error;
      if (!data) return;
      setLevelRecords(prev => {
        const merged = { ...prev };
        for (const row of data) {
          if (row.record_moves > 0 && (merged[row.level] === undefined || merged[row.level] <= 0 || row.record_moves < merged[row.level])) {
            merged[row.level] = row.record_moves;
          }
        }
        safeStorage.setItem('nb_level_records_v1', JSON.stringify(merged));
        return merged;
      });
    } catch (err) {
      console.warn('Global level records fetch failed, showing local data only:', err);
    }
  };

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

  const fetchPlayerSaveFromCloud = async (uname: string) => {
    if (!isGlobalLeaderboardEnabled || !supabase || !uname) return;
    try {
      const { data, error } = await supabase
        .from('player_saves')
        .select('*')
        .eq('username', uname)
        .single();
      if (data && !error) {
        if (data.current_level && data.current_level > level) {
          setLevel(data.current_level);
          safeStorage.setItem('nb_current_level_v8', data.current_level.toString());
        }
        if (Array.isArray(data.completed_levels) && data.completed_levels.length >= completedLevels.length) {
          setCompletedLevels(data.completed_levels);
          safeStorage.setItem('nb_completed_levels_v8', JSON.stringify(data.completed_levels));
        }
        if (data.level_records && typeof data.level_records === 'object') {
          setLevelRecords(prev => {
            const merged = { ...prev, ...data.level_records };
            safeStorage.setItem('nb_level_records_v1', JSON.stringify(merged));
            return merged;
          });
        }
        if (data.user_level_scores && typeof data.user_level_scores === 'object') {
          setUserLevelScores(prev => {
            const merged = { ...prev, ...data.user_level_scores };
            safeStorage.setItem('nb_user_level_scores_v1', JSON.stringify(merged));
            return merged;
          });
        }
      }
    } catch {
      // ignore
    }
  };

  const syncPlayerStateToCloud = () => {
    if (!isGlobalLeaderboardEnabled || !supabase || !username) return;
    supabase.from('player_saves').upsert({
      username,
      current_level: level,
      completed_levels: completedLevels,
      level_records: levelRecords,
      user_level_scores: userLevelScores,
      updated_at: new Date().toISOString(),
    }).then();
  };

  useEffect(() => {
    if (isInitialLoadDone && username) {
      syncPlayerStateToCloud();
    }
  }, [completedLevels, level, levelRecords, userLevelScores, username, isInitialLoadDone]);

  useEffect(() => {
    fetchGlobalLeaderboard();
    fetchGlobalLevelRecords();
    const savedName = safeStorage.getItem('nb_arcade_name_v7');
    if (savedName) {
      fetchPlayerSaveFromCloud(savedName);
    }
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
      safeStorage.setItem('nb_current_level_v8', String(level));
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
    
    if (isClear) {
      if (lastSoundPlayedLevelRef.current !== level) {
        lastSoundPlayedLevelRef.current = level;
        let isSectionComplete = false;
        if (level % 10 === 0) {
          const sectionStartLvl = level - 9;
          const prev9Complete = Array.from({ length: 9 }, (_, i) => sectionStartLvl + i)
            .every(lvl => completedLevels.includes(lvl));
          if (prev9Complete) {
            isSectionComplete = true;
          }
        }

        if (isSectionComplete) {
          playSectionComplete(soundEnabled);
        } else {
          playLevelComplete(soundEnabled);
        }
      }
    } else {
      if (lastSoundPlayedLevelRef.current === level) {
        lastSoundPlayedLevelRef.current = null;
      }
    }

    try {
      if (!isClear) {
        const unfinished = JSON.parse(safeStorage.getItem('nb_unfinished_snapshots_v8') || '{}');
        unfinished[`stage_${level}`] = { bolts, history, moveCount, undoCount, resetsUsed };
        safeStorage.setItem('nb_unfinished_snapshots_v8', JSON.stringify(unfinished));
      } else {
        const unfinished = JSON.parse(safeStorage.getItem('nb_unfinished_snapshots_v8') || '{}');
        if (unfinished[`stage_${level}`]) {
          delete unfinished[`stage_${level}`];
          safeStorage.setItem('nb_unfinished_snapshots_v8', JSON.stringify(unfinished));
        }

        const snapshots = JSON.parse(safeStorage.getItem('nb_level_snapshots_v8') || '{}');
        if (!snapshots[level]) {
          snapshots[level] = bolts;
          safeStorage.setItem('nb_level_snapshots_v8', JSON.stringify(snapshots));
        }
      }
    } catch (err) {
      console.warn("State save warning:", err);
    }
  }, [bolts, history, moveCount, undoCount, resetsUsed, level, isInitialLoadDone, completedLevels, soundEnabled]);
  // ----------------------------------------------------------
  // END SUB-SECTION: EFFECT — SAVE IN-PROGRESS STATE / DETECT WIN
  // ----------------------------------------------------------


  // ----------------------------------------------------------
  // SUB-SECTION: LEVEL PAGE / UNLOCK HELPERS
  // Utilities for 10-level chunk unlocking and 30-level page pagination.
  // Set 0 = levels 1-10, Set 1 = levels 11-20, etc.
  // Set k unlocks when Set k-1 has >= 8 completed levels.
  // ----------------------------------------------------------
  const getSetCompletionCount = (setIdx: number) => {
    const startLvl = setIdx * 10 + 1;
    const endLvl = (setIdx + 1) * 10;
    return completedLevels.filter(lvl => lvl >= startLvl && lvl <= endLvl).length;
  };

  const isSetUnlocked = (setIdx: number) => {
    if (setIdx <= 0) return true;
    return getSetCompletionCount(setIdx - 1) >= 8;
  };

  const canAdvanceToLevel = (targetLvl: number) => {
    const setIdx = Math.floor((targetLvl - 1) / 10);
    return isSetUnlocked(setIdx);
  };
  // ----------------------------------------------------------
  // END SUB-SECTION: LEVEL PAGE / UNLOCK HELPERS
  // ----------------------------------------------------------


  // ----------------------------------------------------------
  // SUB-SECTION: USERNAME SUBMIT HANDLER
  // Validates and saves the 4-letter player tag on first launch.
  // ----------------------------------------------------------
  const handleUsernameSubmit = () => {
    const clean = pendingUsername.trim().toUpperCase().slice(0, 4);
    const finalName = clean.length > 0 ? clean : 'AAAA';
    setUsername(finalName);
    safeStorage.setItem('nb_arcade_name_v7', finalName);
    setShowUsernamePrompt(false);
    fetchPlayerSaveFromCloud(finalName);
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
  const loadAndGenerateLevel = (forceNew = false, initialResets = 0) => {
    if (!forceNew) {
      try {
        const unfinished = JSON.parse(safeStorage.getItem('nb_unfinished_snapshots_v8') || '{}');
        if (unfinished[`stage_${level}`]) {
          const saved = unfinished[`stage_${level}`];
          setBolts(saved.bolts);
          setHistory(saved.history || []);
          setMoveCount(saved.moveCount || 0);
          setUndoCount(saved.undoCount || 0);
          setResetsUsed(saved.resetsUsed || 0);
          setSelectedIdx(null);
          return;
        }
      } catch {
        /* ignore */
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
    setResetsUsed(forceNew ? initialResets : 0);
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

  const getValidTargetsForBolt = (fromIdx: number, currentBolts = bolts) => {
    const sourcePeg = currentBolts[fromIdx];
    if (!sourcePeg || sourcePeg.nuts.length === 0) return [];
    if (checkBoltLock(sourcePeg.nuts)) return [];

    const topNut = sourcePeg.nuts[sourcePeg.nuts.length - 1];
    const capacity = currentConfig.capacity || 5;

    const targets: number[] = [];
    for (let i = 0; i < currentBolts.length; i++) {
      if (i === fromIdx) continue;
      const targetPeg = currentBolts[i];
      if (!targetPeg) continue;
      if (checkBoltLock(targetPeg.nuts)) continue;
      if (targetPeg.nuts.length >= capacity) continue;

      if (targetPeg.nuts.length > 0 && targetPeg.nuts[targetPeg.nuts.length - 1].id !== topNut.id) {
        continue;
      }

      targets.push(i);
    }
    return targets;
  };
  // ----------------------------------------------------------
  // END SUB-SECTION: BOLT / NUT LOGIC HELPERS
  // ----------------------------------------------------------


  // ----------------------------------------------------------
  // SUB-SECTION: DRAG & DROP TARGET FINDER (findTargetBoltForDrop)
  // Calculates direct hit or proximity distance to valid target bolts.
  // ----------------------------------------------------------
  const findTargetBoltForDrop = (clientX: number, clientY: number, sourceIdx: number): number | null => {
    if (sourceIdx < 0 || sourceIdx >= bolts.length) return null;
    const sourcePeg = bolts[sourceIdx];
    if (!sourcePeg || sourcePeg.nuts.length === 0) return null;
    const topNut = sourcePeg.nuts[sourcePeg.nuts.length - 1];

    const isValidTarget = (targetIdx: number) => {
      if (targetIdx === sourceIdx) return false;
      const targetPeg = bolts[targetIdx];
      if (!targetPeg) return false;
      if (targetPeg.nuts.length >= currentConfig.capacity) return false;
      if (checkBoltLock(targetPeg.nuts)) return false;
      if (targetPeg.nuts.length > 0 && targetPeg.nuts[targetPeg.nuts.length - 1].id !== topNut.id) return false;
      return true;
    };

    // 1. Direct hit check via elementFromPoint
    const targetEl = document.elementFromPoint(clientX, clientY);
    const directBoltEl = targetEl?.closest('[data-bolt-idx]');
    if (directBoltEl) {
      const directIdx = parseInt(directBoltEl.getAttribute('data-bolt-idx') || '-1');
      if (!isNaN(directIdx) && directIdx >= 0 && directIdx !== sourceIdx) {
        return directIdx;
      }
    }

    // 2. Measure proximity to all bolt elements
    const boltElements = Array.from(document.querySelectorAll('[data-bolt-idx]'));
    if (boltElements.length === 0) return null;

    let bestValidIdx: number | null = null;
    let minValidDist = Infinity;

    let bestAnyIdx: number | null = null;
    let minAnyDist = Infinity;

    let validTargetCount = 0;

    for (const el of boltElements) {
      const idxAttr = el.getAttribute('data-bolt-idx');
      if (idxAttr === null) continue;
      const bIdx = parseInt(idxAttr);
      if (isNaN(bIdx) || bIdx < 0) continue;

      const rect = el.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const dist = Math.hypot(clientX - centerX, clientY - centerY);

      const valid = isValidTarget(bIdx);
      if (valid) {
        validTargetCount++;
        if (dist < minValidDist) {
          minValidDist = dist;
          bestValidIdx = bIdx;
        }
      }

      if (bIdx !== sourceIdx && dist < minAnyDist) {
        minAnyDist = dist;
        bestAnyIdx = bIdx;
      }
    }

    // Smart forgiving distance thresholds:
    // If there is only 1 valid compatible bolt for this nut on the board, allow a generous 320px radius
    // If there are multiple valid compatible bolts, allow up to 200px for the closest valid one
    const validRadiusThreshold = validTargetCount === 1 ? 320 : 200;

    if (bestValidIdx !== null && minValidDist <= validRadiusThreshold) {
      return bestValidIdx;
    }

    // Fallback to closest bolt if drop was reasonably near any bolt (within 130px)
    if (bestAnyIdx !== null && minAnyDist <= 130) {
      return bestAnyIdx;
    }

    return null;
  };
  // ----------------------------------------------------------
  // END SUB-SECTION: DRAG & DROP TARGET FINDER
  // ----------------------------------------------------------


  // ----------------------------------------------------------
  // SUB-SECTION: MOVE EXECUTION ENGINE (executeMove)
  // Validates target capacity & top nut color, updates bolt state,
  // reveals new top nuts, records move history, and plays sound/animations.
  // ----------------------------------------------------------
  const executeMove = (fromIdx: number, toIdx: number) => {
    if (fromIdx === toIdx) {
      setSelectedIdx(null);
      return;
    }
    
    const sourcePeg = bolts[fromIdx];
    const targetPeg = bolts[toIdx];

    if (!sourcePeg || !targetPeg || sourcePeg.nuts.length === 0) {
      setSelectedIdx(null);
      return;
    }

    if (targetPeg.nuts.length >= currentConfig.capacity || checkBoltLock(targetPeg.nuts)) {
      setErrorIdx(toIdx);
      playError(soundEnabled);
      setTimeout(() => setErrorIdx(null), 400);
      setSelectedIdx(null);
      return;
    }

    const topNut = sourcePeg.nuts[sourcePeg.nuts.length - 1];
    if (targetPeg.nuts.length > 0 && targetPeg.nuts[targetPeg.nuts.length - 1].id !== topNut.id) {
      setErrorIdx(toIdx);
      playError(soundEnabled);
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
      if (i === fromIdx) {
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
      if (i === toIdx) return { ...b, nuts: [...b.nuts, ...movingNuts] };
      return b;
    });

    setBolts(updatedBolts);
    setSelectedIdx(null);
    setMoveCount(prev => prev + 1);

    const targetNutCountAfterMove = updatedBolts[toIdx].nuts.length;
    const capacity = currentConfig.capacity || 5;
    const newSlotIndex = Math.max(0, targetNutCountAfterMove - 1);
    const stackRatio = capacity > 1 ? newSlotIndex / (capacity - 1) : 0;
    playPlace(soundEnabled, stackRatio);
    setJustPlacedIdx(toIdx);
    setTimeout(() => setJustPlacedIdx(null), 300);
    
    const targetUpdatedNuts = updatedBolts[toIdx].nuts;
    if (targetUpdatedNuts.length === currentConfig.capacity && targetUpdatedNuts.every(n => n.id === targetUpdatedNuts[0].id)) {
      setJustLockedIdx(toIdx);
      const lockedCount = updatedBolts.filter(b => checkBoltLock(b.nuts)).length;
      const stepIndex = Math.max(0, lockedCount - 1);
      playLock(soundEnabled, stepIndex);
      setTimeout(() => setJustLockedIdx(null), 800);
    }
  };
  // ----------------------------------------------------------
  // END SUB-SECTION: MOVE EXECUTION ENGINE
  // ----------------------------------------------------------


  // ----------------------------------------------------------
  // SUB-SECTION: BOLT CLICK HANDLER (handleBoltClick)
  // First tap selects a source bolt; second tap on a different bolt
  // attempts to move the top matching run of nuts to the target.
  // Performs single-target auto-moves without requiring a second tap.
  // ----------------------------------------------------------
  const handleBoltClick = (idx: number) => {
    if (Date.now() - lastTouchTimeRef.current < 400) {
      return;
    }

    if (selectedIdx !== null) {
      if (selectedIdx !== idx) {
        executeMove(selectedIdx, idx);
      } else {
        setSelectedIdx(null);
      }
      return;
    }

    // Nothing selected yet: determine valid targets for this bolt
    const targets = getValidTargetsForBolt(idx);
    const matchingTargets = targets.filter(tIdx => bolts[tIdx] && bolts[tIdx].nuts.length > 0);
    const emptyTargets = targets.filter(tIdx => bolts[tIdx] && bolts[tIdx].nuts.length === 0);

    if (matchingTargets.length === 1) {
      // Single matching target stack exists: move directly to it
      executeMove(idx, matchingTargets[0]);
    } else if (matchingTargets.length > 1) {
      // Multiple non-empty matching stacks exist: play error sound & trigger error shake animation
      setErrorIdx(idx);
      playError(soundEnabled);
      setTimeout(() => setErrorIdx(null), 400);
    } else if (emptyTargets.length > 0) {
      // No matching stacks, but empty bolt(s) exist: auto-move to the first available empty bolt
      executeMove(idx, emptyTargets[0]);
    } else {
      // 0 valid targets
      const bolt = bolts[idx];
      if (bolt && bolt.nuts.length > 0 && !checkBoltLock(bolt.nuts)) {
        setErrorIdx(idx);
        playError(soundEnabled);
        setTimeout(() => setErrorIdx(null), 400);
      }
    }
  };
  // ----------------------------------------------------------
  // END SUB-SECTION: BOLT CLICK HANDLER
  // ----------------------------------------------------------


  // ----------------------------------------------------------
  // SUB-SECTION: UNDO HANDLER (handleUndo)
  // Pops the last bolt state from history and restores it.
  // Counts undo as a move.
  // ----------------------------------------------------------
  const handleUndo = () => {
    if (history.length === 0) return;
    setBolts(JSON.parse(history[history.length - 1]));
    setHistory(history.slice(0, -1));
    setUndoCount(prev => prev + 1);
    setMoveCount(prev => prev + 1);
    setSelectedIdx(null);
  };
  // ----------------------------------------------------------
  // END SUB-SECTION: UNDO HANDLER
  // ----------------------------------------------------------


  // ----------------------------------------------------------
  // SUB-SECTION: RESET HANDLER (handleReset)
  // Clears unfinished progress for the current level, increments
  // resetsUsed counter, and regenerates a fresh puzzle.
  // ----------------------------------------------------------
  const handleReset = () => {
    const nextResets = resetsUsed + 1;
    try {
      const unfinished = JSON.parse(safeStorage.getItem('nb_unfinished_snapshots_v8') || '{}');
      if (unfinished[`stage_${level}`]) {
        delete unfinished[`stage_${level}`];
        safeStorage.setItem('nb_unfinished_snapshots_v8', JSON.stringify(unfinished));
      }
    } catch {
      /* ignore */
    }
    loadAndGenerateLevel(true, nextResets);
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
    safeStorage.clear();
    setLevel(1);
    setCompletedLevels([]);
    setLevelRecords({});
    setUserLevelScores({});
    setPlayerScores({});
    setUsername('AAAA');
    setShowSettings(false);
    setConfirmWipe(false);
    setShowUsernamePrompt(true);
  };
  // ----------------------------------------------------------
  // END SUB-SECTION: WIPE DATA HANDLER
  // ----------------------------------------------------------


  // ----------------------------------------------------------
  // SUB-SECTION: SCORE CALCULATOR (calculateLevelScore)
  // Derives an efficiency score based on moves used vs target,
  // with bonuses for no resets used (+350) and 10/10 set completion (+500).
  // ----------------------------------------------------------
  const calculateLevelScore = () => {
    const par = getLevelPar(currentConfig);
    const moveRatio = par / Math.max(1, moveCount || par);
    const efficiencyBase = Math.round(1000 * Math.min(2.0, Math.max(0.2, moveRatio)));

    const noResetBonus = (resetsUsed === 0) ? Math.round(efficiencyBase * 0.10) : 0;

    const setIdx = Math.floor((level - 1) / 10);
    const startLvl = setIdx * 10 + 1;
    const setCompletedCount = Array.from({ length: 10 }, (_, i) => startLvl + i)
      .filter(lvl => lvl === level || completedLevels.includes(lvl)).length;
    const setBonus = (setCompletedCount === 10) ? 500 : 0;

    return efficiencyBase + noResetBonus + setBonus;
  };
  // ----------------------------------------------------------
  // END SUB-SECTION: SCORE CALCULATOR
  // ----------------------------------------------------------


  // ----------------------------------------------------------
  // SUB-SECTION: NEXT LEVEL PROGRESSION (handleNextLevelProgress)
  // Called when the player taps "PROCEED NEXT" on the stage-clear
  // screen. Awards score (first clear only), updates level record,
  // marks level complete, and either advances or shows intro popup.
  // ----------------------------------------------------------
  const handleNextLevelProgress = () => {
    const scoreGenerated = calculateLevelScore();
    const updated = { ...playerScores };
    if (!updated[username]) updated[username] = { totalScore: 0, levelsPlayed: 0 };
    
    const wasIntroLvl = level === 5;

    // Record best move count for this level (locally & globally on Supabase)
    const currentRecord = levelRecords[level];
    if (moveCount > 0 && (currentRecord === undefined || currentRecord <= 0 || moveCount < currentRecord)) {
      const updatedRecords = { ...levelRecords, [level]: moveCount };
      setLevelRecords(updatedRecords);
      safeStorage.setItem('nb_level_records_v1', JSON.stringify(updatedRecords));

      if (isGlobalLeaderboardEnabled && supabase) {
        supabase.from('level_records').upsert({
          level,
          record_moves: moveCount,
          holder_username: username,
          updated_at: new Date().toISOString(),
        }).then(({ error }) => {
          if (error) console.warn('Global level record sync failed:', error);
        });
      }
    }

    const isFirstClear = !completedLevels.includes(level);
    const previousLevelScore = userLevelScores[level] || 0;

    if (isFirstClear) {
      const newUserScores = { ...userLevelScores, [level]: scoreGenerated };
      setUserLevelScores(newUserScores);
      safeStorage.setItem('nb_user_level_scores_v1', JSON.stringify(newUserScores));

      updated[username].totalScore += scoreGenerated;
      updated[username].levelsPlayed += 1;
      setPlayerScores(updated);
      safeStorage.setItem('nb_global_leaderboard_v7', JSON.stringify(updated));
      const nextCompleted = Array.from(new Set([...completedLevels, level]));
      setCompletedLevels(nextCompleted);
      safeStorage.setItem('nb_completed_levels_v8', JSON.stringify(nextCompleted));

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
    } else if (scoreGenerated > previousLevelScore) {
      // Replay: replace old score with the new higher score
      const diff = scoreGenerated - previousLevelScore;
      const newUserScores = { ...userLevelScores, [level]: scoreGenerated };
      setUserLevelScores(newUserScores);
      safeStorage.setItem('nb_user_level_scores_v1', JSON.stringify(newUserScores));

      updated[username].totalScore += diff;
      setPlayerScores(updated);
      safeStorage.setItem('nb_global_leaderboard_v7', JSON.stringify(updated));

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
    const isTenthLevel = level % 10 === 0;
    const isNextCompleted = completedLevels.includes(nextLvl);
    const isNextLocked = !canAdvanceToLevel(nextLvl);

    if ((isTenthLevel && (isNextCompleted || isNextLocked)) || isNextLocked) {
      setShowLevelBrowser(true);
      setBrowserPage(Math.floor((level - 1) / 30));
    } else {
      setLevel(nextLvl);
    }
  };

  const openLevelBrowser = () => {
    setShowLevelBrowser(true);
    setBrowserPage(Math.floor((level - 1) / 30));
  };
  // ----------------------------------------------------------
  // END SUB-SECTION: NEXT LEVEL PROGRESSION
  // ----------------------------------------------------------


  // ----------------------------------------------------------
  // SUB-SECTION: DERIVED STATE — WIN CONDITION & LEADERBOARD SORT
  // isLevelClear — true when all bolts are empty or locked.
  // sortedLeaderboard — player entries sorted by average score desc.
  // ----------------------------------------------------------
  const isLevelClear = bolts.length > 0 && moveCount > 0 && bolts.every(b => b.nuts.length === 0 || checkBoltLock(b.nuts));
  
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
  const MIN_ROW_GAP = 16;
  const MAX_ROW_GAP = 52;
  const MIN_COL_GAP = 8;
  const MAX_COL_GAP = 28;
  const MIN_BOLT_W = 28;
  const MAX_BOLT_W = 86;
  const DESIRED_COL_GAP = 14;
  const MIN_NUT_H = 18;
  const MAX_NUT_H = 86; // matches MAX_BOLT_W so the width cap (below), not this, is what limits nut height

  // Fallback guards for initial render frames on mobile screens.
  // boardSize.height is measured on boardRef, which is already flex-1 between header & footer.
  const safeWidth = Math.max(280, boardSize.width || (typeof window !== 'undefined' ? window.innerWidth : 350));
  const safeHeight = boardSize.height > 0
    ? boardSize.height
    : Math.max(400, (typeof window !== 'undefined' ? window.innerHeight : 500) - chromeHeight);

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

  const availH = Math.max(200, safeHeight - (BOARD_PADDING * 2));

  // Reserve row-gap space AND bolt base overhang (6px bottom overflow per row)
  // BEFORE sizing nuts, so the row gaps we render can never push bolt bases onto the stack below.
  const baseOverhangReserve = targetRows * 6;
  const reservedRowGapH = (targetRows > 1 ? MIN_ROW_GAP * (targetRows - 1) : 0) + baseOverhangReserve;
  const availHForPegs = Math.max(100, availH - reservedRowGapH);

  // Solve bolt width + column gap together so a row always fits exactly:
  // start from the desired gap, shrink the gap first if bolts would go
  // below minimum width, then only shrink bolt width as a last resort.
  // If there's slack instead, grow the gap (up to MAX_COL_GAP) rather
  // than just capping bolt width, so sparse rows spread out evenly.
  let colGap = columns > 1 ? (columns >= 6 ? 10 : DESIRED_COL_GAP) : 0;
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

  // Calculate nutHeight bounded by boltColWidth so nuts scale up to fill vertical space while never being taller than wide.
  const idealNutH = boltColWidth * 0.90;
  let nutHeight = Math.min(idealNutH, Math.max(MIN_NUT_H, (availHForPegs - targetRows * 6) / (safeCapacity * targetRows)));
  nutHeight = Math.max(MIN_NUT_H, Math.min(MAX_NUT_H, nutHeight));
  const pegHeight = Math.max(25, nutHeight * safeCapacity + 8);

  const rowGap = targetRows > 1
    ? Math.max(MIN_ROW_GAP, Math.min(MAX_ROW_GAP, (availH - baseOverhangReserve - pegHeight * targetRows) / (targetRows - 1)))
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
    <div className="fixed inset-0 text-slate-100 flex flex-col overflow-hidden overscroll-none select-none" style={{ backgroundColor: bgColor, backgroundImage: 'radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(0,0,0,0.7) 100%)' }}>
      {/* Update Available Banner */}
      {updateAvailable && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[100] bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-2xl border border-emerald-400 font-bold text-xs flex items-center gap-2 animate-bounce">
          <span>🚀 New update available! Automatically refreshing...</span>
        </div>
      )}

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
        @keyframes custom-nut-land {
          0% { transform: scaleY(1) scaleX(1); }
          30% { transform: scaleY(0.82) scaleX(1.1); }
          60% { transform: scaleY(1.06) scaleX(0.97); }
          100% { transform: scaleY(1) scaleX(1); }
        }
        .animate-error-shake {
          animation: custom-shake 0.3s cubic-bezier(.36,.07,.19,.97) both;
        }
        .animate-lock-burst {
          animation: custom-burst 0.6s ease-out both;
        }
        .animate-nut-land {
          animation: custom-nut-land 0.28s cubic-bezier(.34,1.56,.64,1) both;
          transform-origin: bottom center;
        }
      `}} />

      {/* ======================================================
          HEADER BAR
          Left: Leaderboard button | Center: Level nav (prev/label/next) | Right: Settings button
          ====================================================== */}
      <header ref={headerRef} className="w-full h-16 px-4 border-b border-white/20 shrink-0 flex justify-between items-center z-35 bg-white/15 backdrop-blur-xl shadow-sm">
        <button type="button" onClick={() => { setShowLeaderboard(true); fetchGlobalLeaderboard(); }} className="w-10 h-10 rounded-xl flex items-center justify-center border border-white/30 bg-white/15 text-amber-400 hover:bg-white/25 transition-all shadow-sm backdrop-blur-md">
          <Trophy size={20} />
        </button>

        <div className="flex items-center gap-2">
          <button 
            type="button" 
            disabled={level <= 1} 
            onClick={() => {
              if (level > 1) {
                const targetLvl = level - 1;
                if (completedLevels.includes(targetLvl)) {
                  setCompletedLevelNotice(targetLvl);
                } else {
                  setLevel(targetLvl);
                }
              }
            }} 
            className="w-10 h-10 bg-white/15 border border-white/30 rounded-xl flex items-center justify-center text-slate-900 dark:text-white active:bg-white/25 hover:bg-white/25 disabled:opacity-35 transition-all shadow-sm backdrop-blur-md"
          >
            <ChevronLeft size={20} strokeWidth={3} />
          </button>
          <button type="button" onClick={openLevelBrowser} className="px-6 h-10 bg-white/25 border border-white/40 rounded-xl flex items-center justify-center font-black text-lg tracking-tight text-slate-900 dark:text-white hover:bg-white/35 transition-all shadow-sm backdrop-blur-md">
            LVL {level}
          </button>
          <button 
            type="button" 
            disabled={!canAdvanceToLevel(level + 1)} 
            onClick={() => {
              const targetLvl = level + 1;
              if (canAdvanceToLevel(targetLvl)) {
                if (completedLevels.includes(targetLvl)) {
                  setCompletedLevelNotice(targetLvl);
                } else {
                  setLevel(targetLvl);
                }
              }
            }} 
            className="w-10 h-10 bg-white/15 border border-white/30 rounded-xl flex items-center justify-center text-slate-900 dark:text-white active:bg-white/25 hover:bg-white/25 disabled:opacity-35 transition-all shadow-sm backdrop-blur-md"
          >
            <ChevronRight size={20} strokeWidth={3} />
          </button>
        </div>

        <button type="button" onClick={() => setShowSettings(true)} className="w-10 h-10 rounded-xl flex items-center justify-center border border-white/30 bg-white/15 text-slate-900 dark:text-white hover:bg-white/25 transition-all shadow-sm backdrop-blur-md">
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
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
        }}
        onDrop={(e) => {
          e.preventDefault();
          const rawData = e.dataTransfer.getData('text/plain') || e.dataTransfer.getData('sourceIdx');
          const sourceIdx = parseInt(rawData);
          if (!isNaN(sourceIdx)) {
            const targetIdx = findTargetBoltForDrop(e.clientX, e.clientY, sourceIdx);
            if (targetIdx !== null && targetIdx !== sourceIdx) {
              executeMove(sourceIdx, targetIdx);
            } else {
              setSelectedIdx(null);
            }
          }
        }}
      >
        {chunkedBolts.map((row, rIdx) => (
          <div key={`row-${rIdx}`} className="flex flex-row justify-center items-center" style={{ gap: `${colGap}px` }}>
            {row.map((bolt) => {
              const globalIdx = bolt.globalIdx;
              const isLocked = checkBoltLock(bolt.nuts);
              const isSelected = selectedIdx === globalIdx;

              const runCount = getTopRunCount(bolt.nuts);
              const movingNuts = bolt.nuts.slice(bolt.nuts.length - runCount);

              return (
                <div 
                  key={`bolt-${globalIdx}`} 
                  data-bolt-idx={globalIdx}
                  onClick={() => handleBoltClick(globalIdx)} 
                  draggable={bolt.nuts.length > 0 && !isLocked}
                  onDragStart={(e) => {
                    e.dataTransfer.setData('sourceIdx', globalIdx.toString());
                    e.dataTransfer.effectAllowed = 'move';
                    if (selectedIdx !== globalIdx) {
                      setSelectedIdx(globalIdx);
                      playPickup(soundEnabled);
                    }
                    const dragPreview = dragPreviewRefs.current[globalIdx];
                    if (dragPreview) {
                      e.dataTransfer.setDragImage(dragPreview, dragPreview.offsetWidth / 2, dragPreview.offsetHeight / 2);
                    }
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    const rawData = e.dataTransfer.getData('text/plain') || e.dataTransfer.getData('sourceIdx');
                    const sourceIdx = parseInt(rawData);
                    const src = !isNaN(sourceIdx) ? sourceIdx : globalIdx;
                    const targetIdx = findTargetBoltForDrop(e.clientX, e.clientY, src);
                    if (targetIdx !== null && targetIdx !== src) {
                      executeMove(src, targetIdx);
                    } else {
                      setSelectedIdx(null);
                    }
                  }}
                  onDragEnd={() => {
                    setSelectedIdx(null);
                  }}
                  onTouchStart={(e) => {
                    if (bolt.nuts.length === 0 || isLocked) return;
                    const touch = e.touches[0];
                    if (!touch) return;
                    setTouchDrag({
                      sourceIdx: globalIdx,
                      startX: touch.clientX,
                      startY: touch.clientY,
                      x: touch.clientX,
                      y: touch.clientY,
                      movingNuts,
                    });
                  }}
                  onTouchMove={(e) => {
                    if (!touchDrag) return;
                    const touch = e.touches[0];
                    if (touch) {
                      setTouchDrag(prev => prev ? { ...prev, x: touch.clientX, y: touch.clientY } : null);
                    }
                  }}
                  onTouchEnd={(e) => {
                    if (!touchDrag) return;
                    const touch = e.changedTouches[0];
                    lastTouchTimeRef.current = Date.now();
                    if (touch) {
                      const dist = Math.hypot(touch.clientX - touchDrag.startX, touch.clientY - touchDrag.startY);
                      if (dist < 12) {
                        // It was just a tap without dragging!
                        setTouchDrag(null);
                        handleBoltClick(touchDrag.sourceIdx);
                        return;
                      }
                      const targetIdx = findTargetBoltForDrop(touch.clientX, touch.clientY, touchDrag.sourceIdx);
                      if (targetIdx !== null && targetIdx !== touchDrag.sourceIdx) {
                        executeMove(touchDrag.sourceIdx, targetIdx);
                      } else {
                        handleBoltClick(touchDrag.sourceIdx);
                      }
                    }
                    setTouchDrag(null);
                  }}
                  className={`relative flex flex-col items-center cursor-pointer group select-none transition-transform transition-opacity duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${isLocked ? 'opacity-60' : ''} ${errorIdx === globalIdx ? 'animate-error-shake' : ''} ${justLockedIdx === globalIdx ? 'animate-lock-burst' : ''}`}
                  style={{ height: `${pegHeight}px`, width: `${boltColWidth}px` }}
                >
                  {/* Slot guide lines (empty slot indicators) */}
                  <div className="absolute inset-x-0 bottom-3 flex flex-col-reverse items-center justify-start pointer-events-none gap-y-[2px]">
                    {Array.from({ length: safeCapacity }).map((_, i) => (
                      <div key={i} className="w-full border border-dashed border-white/20 rounded-xl bg-white/5 backdrop-blur-[1px] shadow-[inset_0_1px_2px_rgba(0,0,0,0.15)]" style={{ height: `${Math.max(1, nutHeight - 2)}px` }} />
                    ))}
                  </div>
                  
                  {/* Peg rod (bolt thread) - Frosted Metallic Threaded Rod with Specular Sheen */}
                  <div 
                    className={`absolute bottom-1 rounded-t-2xl transition-all border overflow-hidden ${isLocked ? 'bg-gradient-to-b from-amber-300/60 via-amber-400/50 to-amber-500/60 border-amber-200/90 shadow-[0_0_20px_rgba(251,191,36,0.8)]' : isSelected ? 'bg-gradient-to-b from-sky-300/60 via-sky-400/50 to-sky-500/60 border-sky-200/90 shadow-[0_0_22px_rgba(56,189,248,0.85)] animate-pulse' : 'bg-white/30 backdrop-blur-md border-white/60 shadow-[inset_0_1px_2px_rgba(255,255,255,0.8),0_0_14px_rgba(255,255,255,0.25)] group-hover:bg-white/40'}`} 
                    style={{ 
                      height: `${Math.max(1, pegHeight - 4)}px`, 
                      width: `${Math.max(4, boltColWidth * 0.3)}px`,
                      backgroundImage: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.2) 0px, rgba(255,255,255,0.2) 2px, transparent 2px, transparent 6px)',
                    }}
                  >
                    {/* Glass specular sheen line */}
                    <div className="absolute inset-y-1 left-[20%] w-[25%] rounded-full bg-white blur-[0.5px] pointer-events-none opacity-90" />
                  </div>
                  
                  {/* Nut stack */}
                  <div className={`absolute inset-x-0 bottom-3 flex flex-col-reverse items-center gap-y-[2px] z-10 pointer-events-none ${justPlacedIdx === globalIdx ? 'animate-nut-land' : ''}`}>
                    {bolt.nuts.map((nut, nIdx) => {
                      const isNutRevealed = nut.revealed;
                      
                      const nutType = NUT_TYPES.find(t => t.id === nut.id) || NUT_TYPES[0]; 
                      const Icon = nutType.icon;

                      const isNutBeingDragged = (touchDrag && touchDrag.sourceIdx === globalIdx && nIdx >= bolt.nuts.length - touchDrag.movingNuts.length) || (isSelected && nIdx >= bolt.nuts.length - runCount);

                      return (
                        <div 
                          key={nIdx} 
                          className={`rounded-xl flex flex-col items-center justify-center border-b-2 relative shadow-[inset_0_2px_1px_rgba(255,255,255,0.45),inset_0_-3px_5px_rgba(0,0,0,0.35),0_4px_8px_rgba(0,0,0,0.3)] transform transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] w-full ${isNutBeingDragged ? 'opacity-0 pointer-events-none' : ''} ${isNutRevealed ? `${nutType.bg} ${nutType.border} ${nutType.iconText} border-black/30` : 'bg-zinc-800 border-zinc-950 border-b-black text-zinc-300'}`}
                          style={{ height: `${Math.max(1, nutHeight - 2)}px` }}
                        >
                          <div className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1 h-2 rounded-full bg-black/25 pointer-events-none" />
                          <div className="absolute right-1.5 top-1/2 -translate-y-1/2 w-1 h-2 rounded-full bg-black/25 pointer-events-none" />
                          {isNutRevealed ? (
                            <Icon size={Math.max(8, Math.min(28, nutHeight * 0.55))} className="drop-shadow-md" strokeWidth={3} />
                          ) : (
                            <div className={`font-bold text-zinc-300 ${nutHeight > 30 ? 'text-sm' : nutHeight > 22 ? 'text-xs' : 'text-[10px]'}`}>?</div>
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
                  
                  {/* Bolt base + lock icon - Frosted 3D Metallic Glass Stand */}
                  <div
                    className={`absolute rounded-full border overflow-hidden transition-all ${isLocked ? 'bg-gradient-to-b from-yellow-200/90 via-amber-400/90 to-amber-600/90 border-amber-100 shadow-[0_0_16px_rgba(245,158,11,0.6)]' : isSelected ? 'bg-gradient-to-b from-sky-200/90 via-sky-400/90 to-sky-600/90 border-sky-100 shadow-[0_0_16px_rgba(56,189,248,0.7)]' : 'bg-gradient-to-b from-white/35 via-white/20 to-white/10 backdrop-blur-md border-white/60 shadow-[inset_0_1.5px_2px_rgba(255,255,255,0.9),0_4px_12px_rgba(0,0,0,0.3)]'}`}
                    style={{ width: `${boltColWidth * 0.85}px`, height: '22px', bottom: '-6px' }}
                  >
                    {/* Gloss highlight — polish sheen */}
                    <div className="absolute inset-x-[10%] top-[10%] h-[40%] rounded-full bg-gradient-to-b from-white to-white/20 pointer-events-none" />
                    {isLocked && <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-amber-500 text-slate-950 p-0.5 rounded-full shadow z-10"><Lock size={6} strokeWidth={3} /></div>}
                  </div>

                  {/* Hidden drag preview */}
                  <div
                    ref={(el) => { if (el) dragPreviewRefs.current[globalIdx] = el; }}
                    className="absolute top-[-9999px] left-[-9999px] flex flex-col-reverse items-center gap-y-[2px] drop-shadow-[0_20px_20px_rgba(0,0,0,0.5)] brightness-110"
                    style={{ width: `${boltColWidth}px` }}
                  >
                    {movingNuts.map((nut, idx) => {
                      const nutType = NUT_TYPES.find(t => t.id === nut.id) || NUT_TYPES[0];
                      const Icon = nutType.icon;
                      return (
                        <div
                          key={`drag-${idx}`}
                          className={`rounded-xl flex flex-col items-center justify-center border-b-2 shadow-[inset_0_2px_0_rgba(255,255,255,0.3),inset_0_-3px_5px_rgba(0,0,0,0.35)] w-full ${nutType.bg} ${nutType.border} ${nutType.iconText} border-black/30`}
                          style={{ height: `${Math.max(1, nutHeight - 2)}px` }}
                        >
                          <Icon size={Math.max(8, Math.min(28, nutHeight * 0.55))} className="drop-shadow-md" strokeWidth={3} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ))}

        {/* Floating Touch Drag Overlay for iOS & Touchscreens */}
        {touchDrag && (
          <div
            className="fixed pointer-events-none z-50 flex flex-col-reverse items-center gap-y-[2px] transform -translate-x-1/2 -translate-y-1/2 drop-shadow-[0_25px_30px_rgba(0,0,0,0.7)] scale-110"
            style={{
              left: `${touchDrag.x}px`,
              top: `${touchDrag.y - 30}px`,
              width: `${boltColWidth}px`,
            }}
          >
            {touchDrag.movingNuts.map((nut, idx) => {
              const nutType = NUT_TYPES.find(t => t.id === nut.id) || NUT_TYPES[0];
              const Icon = nutType.icon;
              return (
                <div
                  key={`touch-drag-${idx}`}
                  className={`rounded-xl flex flex-col items-center justify-center border-b-2 relative shadow-[inset_0_2px_1px_rgba(255,255,255,0.5),inset_0_-3px_6px_rgba(0,0,0,0.4)] w-full ${nutType.bg} ${nutType.border} ${nutType.iconText} border-black/30 brightness-110`}
                  style={{ height: `${Math.max(1, nutHeight - 2)}px` }}
                >
                  <div className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1 h-2 rounded-full bg-black/25 pointer-events-none" />
                  <div className="absolute right-1.5 top-1/2 -translate-y-1/2 w-1 h-2 rounded-full bg-black/25 pointer-events-none" />
                  <Icon size={Math.max(8, Math.min(28, nutHeight * 0.55))} className="drop-shadow-md" strokeWidth={3} />
                </div>
              );
            })}
          </div>
        )}
      </div>
      {/* END GAME BOARD */}


      {/* ======================================================
          FOOTER BAR
          Left: Reset button | Center: Undo button | Right: Move/Height stats
          Grid-3 layout ensures Undo button is mathematically centered
          ====================================================== */}
      <footer ref={footerRef} className="w-full h-20 px-6 border-t border-white/20 shrink-0 grid grid-cols-3 items-center z-35 bg-white/15 backdrop-blur-xl shadow-sm">
        <div className="justify-self-start">
          <button type="button" onClick={handleReset} disabled={moveCount === 0} className="w-14 h-14 rounded-2xl flex items-center justify-center border border-white/30 bg-white/15 text-rose-500 hover:bg-white/25 disabled:opacity-35 transition-all shadow-sm backdrop-blur-md">
            <RotateCcw size={24} />
          </button>
        </div>
        <div className="justify-self-center">
          <button type="button" onClick={handleUndo} disabled={history.length === 0} className="w-16 h-16 rounded-3xl flex items-center justify-center border border-white/40 bg-white/25 text-slate-900 dark:text-white disabled:bg-white/5 disabled:border-white/10 disabled:text-slate-400 shadow-lg active:scale-95 hover:bg-white/35 transition-all backdrop-blur-md">
            <Undo2 size={28} strokeWidth={2.5} />
          </button>
        </div>
        <div className="justify-self-end flex items-center gap-3 bg-white/15 rounded-2xl px-4 py-2 border border-white/30 shadow-sm backdrop-blur-md">
          <div className="flex flex-col items-center min-w-[36px]">
            <span className="text-[9px] text-slate-700 dark:text-slate-200 uppercase font-bold tracking-wider">Moves</span>
            <span className="text-sm font-black text-amber-500 dark:text-amber-300">{moveCount}</span>
          </div>
          <div className="w-[1px] h-6 bg-white/30" />
          <div className="flex flex-col items-center min-w-[36px]">
            <span className="text-[9px] text-slate-700 dark:text-slate-200 uppercase font-bold tracking-wider">Record</span>
            <span className="text-sm font-black text-emerald-400 dark:text-emerald-300">
              {levelRecords[level] !== undefined ? levelRecords[level] : '-'}
            </span>
          </div>
        </div>
      </footer>
      {/* END FOOTER BAR */}


      {/* ======================================================
          MODAL: STAGE CLEAR INTERSTITIAL
          Shown when isLevelClear is true (and not the intro clear pop).
          Displays score, efficiency %, moves vs par, and a "PROCEED NEXT" button.
          ====================================================== */}
      {isLevelClear && !showIntroClearPop && (() => {
        const currentPar = getLevelPar(currentConfig);
        const efficiencyPct = Math.round((currentPar / Math.max(1, moveCount)) * 100);
        const effBase = Math.round(1000 * Math.min(2.0, Math.max(0.2, currentPar / Math.max(1, moveCount))));
        const noResetAmt = Math.round(effBase * 0.10);

        return (
          <div className="fixed inset-0 bg-black/35 backdrop-blur-md flex items-center justify-center p-4 z-40 animate-in fade-in duration-150">
            <div className="w-full max-w-xs bg-white/15 backdrop-blur-2xl border border-white/30 rounded-[32px] p-6 text-center space-y-3.5 shadow-[0_25px_60px_rgba(0,0,0,0.35)] text-white">
              <div className="w-14 h-14 bg-amber-400/20 border-2 border-amber-300/40 rounded-full flex items-center justify-center mx-auto text-amber-300 backdrop-blur-md shadow-sm">
                <Trophy size={28} />
              </div>
              <div>
                <h2 className="text-2xl font-black uppercase tracking-tight drop-shadow-sm">STAGE CLEAR!</h2>
                
                <div className="bg-white/10 rounded-2xl p-2.5 border border-white/20 text-xs space-y-1 mt-2">
                  <div className="flex justify-between font-bold text-slate-200">
                    <span>Moves: <strong className="text-white">{moveCount}</strong></span>
                    <span>Par: <strong className="text-sky-300">{currentPar}</strong></span>
                  </div>
                  <div className="flex justify-between font-black text-xs">
                    <span className="text-slate-200">Efficiency:</span>
                    <span className="text-amber-300">{efficiencyPct}%</span>
                  </div>
                  <div className="flex justify-between font-black text-xs border-t border-white/10 pt-1">
                    <span className="text-slate-200">Score Earned:</span>
                    <span className="text-emerald-300">+{calculateLevelScore()} pts</span>
                  </div>
                </div>

                <div className="flex flex-wrap justify-center gap-1.5 mt-2">
                  {resetsUsed === 0 && (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-500/30 text-emerald-200 border border-emerald-400/40 backdrop-blur-md shadow-sm">
                      ⚡ No Reset Bonus (+{noResetAmt})
                    </span>
                  )}
                  {Array.from({ length: 10 }, (_, i) => Math.floor((level - 1) / 10) * 10 + 1 + i)
                    .filter(l => l === level || completedLevels.includes(l)).length === 10 && (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-500/30 text-amber-200 border border-amber-400/40 backdrop-blur-md shadow-sm">
                      🏆 10/10 Set Mastery (+500)
                    </span>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={handleNextLevelProgress}
                className="w-full py-3.5 bg-blue-600/90 hover:bg-blue-500 font-black text-sm rounded-2xl uppercase tracking-wider shadow-lg active:scale-98 transition-all border border-blue-400/40 backdrop-blur-md"
              >
                PROCEED NEXT
              </button>
            </div>
          </div>
        );
      })()}
      {/* END MODAL: STAGE CLEAR INTERSTITIAL */}


      {/* ======================================================
          MODAL: TRAINING INTRO COMPLETE POPUP
          Shown after completing level 5 (the last tutorial level).
          Congratulates the player and gates entry to the full game.
          ====================================================== */}
      {showIntroClearPop && (
        <div className="fixed inset-0 bg-black/35 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="w-full max-w-xs bg-white/15 backdrop-blur-2xl border border-white/30 rounded-[32px] p-6 text-center space-y-4 shadow-[0_25px_60px_rgba(0,0,0,0.35)] text-white animate-in fade-in zoom-in-95 duration-200">
            <div className="w-14 h-14 bg-amber-400/25 border border-amber-300/50 rounded-2xl flex items-center justify-center mx-auto text-amber-200 font-black text-xl rotate-12 shadow-lg backdrop-blur-md">
              🚀
            </div>
            <div>
              <h2 className="text-xl font-black text-amber-300 uppercase tracking-tight drop-shadow-sm">Training Complete!</h2>
              <p className="text-sm text-white font-bold mt-2">The game begins now!</p>
              <p className="text-xs text-slate-100 font-medium mt-1 leading-relaxed">
                Introductory levels are behind you. Prepare for full grid variants and hidden layers. Good luck!
              </p>
            </div>
            <button 
              type="button" 
              onClick={() => { setShowIntroClearPop(false); advanceStage(); }} 
              className="w-full py-3 bg-amber-500/90 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-2xl uppercase tracking-widest shadow-lg active:scale-98 transition-transform border border-amber-300/50 backdrop-blur-md"
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
          Collects a 4-letter player tag for the leaderboard.
          ====================================================== */}
      {showUsernamePrompt && !showWelcomeModal && (
        <div className="fixed inset-0 bg-black/35 backdrop-blur-md flex items-center justify-center p-4 z-[60] animate-in fade-in duration-150">
          <div className="w-full max-w-xs bg-white/15 backdrop-blur-2xl border border-white/30 rounded-[32px] p-6 text-center space-y-4 shadow-[0_25px_60px_rgba(0,0,0,0.35)] text-white">
            <h2 className="text-xl font-black uppercase tracking-tight drop-shadow-sm">Welcome, Pilot!</h2>
            <p className="text-xs text-slate-100 font-medium">Provide a 4-letter signature badge prefix for global leaderboards</p>
            <input
              type="text"
              autoFocus
              maxLength={4}
              value={pendingUsername}
              onChange={(e) => setPendingUsername(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && handleUsernameSubmit()}
              placeholder="AAAA"
              className="w-full p-3 bg-black/30 text-amber-300 text-center font-black text-xl tracking-widest border border-white/30 rounded-2xl focus:outline-none focus:border-amber-400 placeholder-slate-400/60 backdrop-blur-md"
            />
            <button
              type="button"
              onClick={handleUsernameSubmit}
              className="w-full py-3 bg-blue-600/90 hover:bg-blue-500 font-black text-sm rounded-2xl uppercase tracking-wider border border-blue-400/30 backdrop-blur-md shadow-md"
            >
              Start Sorting
            </button>
          </div>
        </div>
      )}
      {/* END MODAL: USERNAME PROMPT */}


      {/* ======================================================
          MODAL: WELCOME & MOBILE APP / HOMESCREEN GUIDE
          Shown on first launch to remind mobile players to open in Safari/Chrome
          and add to Home Screen for the full-screen app experience.
          ====================================================== */}
      {showWelcomeModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xl flex items-center justify-center p-4 z-[70] animate-in fade-in duration-200">
          <div className="w-full max-w-xs sm:max-w-sm bg-white/15 backdrop-blur-2xl border border-white/30 rounded-[32px] p-5 sm:p-6 text-center space-y-4 shadow-[0_25px_60px_rgba(0,0,0,0.45)] text-white animate-in fade-in zoom-in-95 duration-200 overflow-hidden relative">
            <div className="w-14 h-14 bg-gradient-to-tr from-sky-500/30 via-amber-400/30 to-purple-500/30 border border-white/40 rounded-2xl flex items-center justify-center mx-auto text-amber-300 shadow-lg backdrop-blur-md">
              <Smartphone size={28} className="drop-shadow" />
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-black text-amber-300 uppercase tracking-tight drop-shadow-sm">Welcome to Nut & Bolt Stack!</h2>
              <p className="text-xs text-slate-100 font-medium leading-relaxed">
                For the best full-screen arcade experience with zero browser bars:
              </p>
            </div>

            <div className="bg-black/25 rounded-2xl p-3 border border-white/15 text-left space-y-3 text-xs backdrop-blur-md">
              {/* iPhone / Safari section */}
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 font-black text-sky-300 uppercase text-[11px] tracking-wider">
                  <Share size={13} className="text-sky-300" />
                  <span>iPhone / iPad (Safari)</span>
                </div>
                <ol className="list-decimal list-inside text-[11px] text-slate-200 space-y-0.5 pl-1 leading-tight font-medium">
                  <li>Open in <strong className="text-white">Safari</strong> browser</li>
                  <li>Tap the <strong className="text-sky-200">Share</strong> button at bottom</li>
                  <li>Tap <strong className="text-amber-200">Add to Home Screen</strong> (<PlusSquare size={11} className="inline-block mx-0.5 text-amber-300" />)</li>
                </ol>
              </div>

              {/* Android / Chrome section */}
              <div className="border-t border-white/10 pt-2 space-y-1">
                <div className="flex items-center gap-1.5 font-black text-emerald-300 uppercase text-[11px] tracking-wider">
                  <MoreVertical size={13} className="text-emerald-300" />
                  <span>Android (Chrome)</span>
                </div>
                <ol className="list-decimal list-inside text-[11px] text-slate-200 space-y-0.5 pl-1 leading-tight font-medium">
                  <li>Open in <strong className="text-white">Chrome</strong> browser</li>
                  <li>Tap the <strong className="text-emerald-200">Menu (⋮)</strong> at top right</li>
                  <li>Tap <strong className="text-emerald-200">Add to Home screen</strong></li>
                </ol>
              </div>
            </div>

            <div className="p-2 bg-amber-400/15 border border-amber-300/30 rounded-xl text-[10px] text-amber-100 font-semibold leading-tight">
              ✨ Added to Home Screen already? You're all set!
            </div>

            <button
              type="button"
              onClick={() => {
                safeStorage.setItem('nb_pwa_welcome_v2', 'true');
                setShowWelcomeModal(false);
              }}
              className="w-full py-3.5 bg-gradient-to-r from-blue-600 via-sky-600 to-blue-600 hover:brightness-110 font-black text-xs rounded-2xl uppercase tracking-wider border border-blue-400/40 backdrop-blur-md shadow-lg active:scale-98 transition-transform text-white cursor-pointer"
            >
              GOT IT, LET'S PLAY!
            </button>
          </div>
        </div>
      )}
      {/* END MODAL: WELCOME & MOBILE APP HOMESCREEN GUIDE */}


      {/* ======================================================
          MODAL: GLOBAL LEADERBOARD
          Lists all players sorted by average score per level.
          Top 3 get gold/silver/bronze badge styling.
          ====================================================== */}
      {showLeaderboard && (
        <div className="fixed inset-0 bg-black/35 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white/15 backdrop-blur-2xl border border-white/30 rounded-[32px] p-6 space-y-4 max-h-[85vh] flex flex-col shadow-[0_25px_60px_rgba(0,0,0,0.35)] text-white">
            <div className="flex justify-between items-center pb-3 border-b border-white/20">
              <div className="flex items-center gap-2 text-amber-300">
                <Crown size={20} />
                <h3 className="text-base font-black uppercase tracking-wider drop-shadow-sm">GLOBAL LEADERBOARD</h3>
              </div>
              <button type="button" className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 text-slate-200 hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-white/20 backdrop-blur-md" onClick={() => setShowLeaderboard(false)}>
                <X size={18} strokeWidth={2.5} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto overscroll-contain space-y-2.5 pr-1">
              {sortedLeaderboard.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-200 font-medium">No recorded highscores found yet.</div>
              ) : (
                sortedLeaderboard.map((player, rank) => {
                  let rankStyle = "border-white/20 bg-white/10 text-slate-100 backdrop-blur-md";
                  let badge = <span className="text-slate-200 font-bold w-5 text-center">{rank + 1}</span>;
                  
                  if (rank === 0) {
                    rankStyle = "border-amber-400/50 bg-amber-400/20 text-amber-200 font-bold backdrop-blur-md shadow-sm";
                    badge = <Crown size={16} className="text-amber-300 w-5" />;
                  } else if (rank === 1) {
                    rankStyle = "border-slate-300/50 bg-white/20 text-white font-semibold backdrop-blur-md";
                    badge = <span className="text-slate-200 font-black w-5 text-center">2</span>;
                  } else if (rank === 2) {
                    rankStyle = "border-amber-600/50 bg-amber-600/20 text-amber-200 font-semibold backdrop-blur-md";
                    badge = <span className="text-amber-300 font-black w-5 text-center">3</span>;
                  }

                  return (
                    <div key={player.name} className={`flex justify-between items-center px-4 py-3 rounded-2xl border font-medium text-xs ${rankStyle}`}>
                      <div className="flex items-center gap-2.5">
                        {badge}
                        <span className="uppercase tracking-wider font-extrabold">{player.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-white font-black text-sm">
                          {player.avgScore} <span className="text-[10px] font-normal text-slate-200">avg</span>
                        </div>
                        <div className="text-[10px] text-slate-200">{player.levelsPlayed} clear(s)</div>
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
        <div className="fixed inset-0 bg-black/35 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-white/15 backdrop-blur-2xl border border-white/30 rounded-[32px] p-6 space-y-4 shadow-[0_25px_60px_rgba(0,0,0,0.35)] text-white">
            <div className="flex justify-between items-center pb-3 border-b border-white/20">
              <h3 className="text-base font-black uppercase tracking-wider text-white drop-shadow-sm">PLAYER PROFILE</h3>
              <button type="button" className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 text-slate-200 hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-white/20 backdrop-blur-md" onClick={() => { setShowSettings(false); setConfirmWipe(false); }}>
                <X size={18} strokeWidth={2.5} />
              </button>
            </div>

            {!confirmWipe ? (
              // -- Settings default view --
              <div className="space-y-4 pt-1">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-200 uppercase tracking-wide">Player Badge</label>
                  <input 
                    type="text" 
                    maxLength={4} 
                    value={username} 
                    onChange={(e) => setUsername(e.target.value.toUpperCase())} 
                    className="w-full p-2.5 bg-black/30 text-amber-300 text-center font-black text-lg tracking-widest border border-white/25 rounded-2xl focus:outline-none focus:border-amber-400 placeholder-slate-400/60 backdrop-blur-md"
                  />
                </div>
                
                <button 
                  type="button" 
                  onClick={() => { safeStorage.setItem('nb_arcade_name_v7', username); setShowSettings(false); }} 
                  className="w-full py-2.5 bg-blue-600/90 hover:bg-blue-500 text-xs font-black rounded-2xl text-white uppercase tracking-wider transition-colors shadow-md border border-blue-400/30 backdrop-blur-md"
                >
                  SAVE NAME
                </button>

                <div className="flex items-center justify-between pt-1">
                  <label className="text-xs font-bold text-slate-200 uppercase tracking-wide">Sound Effects</label>
                  <button
                    type="button"
                    onClick={() => {
                      const next = !soundEnabled;
                      setSoundEnabled(next);
                      safeStorage.setItem('nb_sound_enabled_v1', String(next));
                    }}
                    className={`w-12 h-7 rounded-full transition-colors relative p-1 border border-white/20 backdrop-blur-md ${soundEnabled ? 'bg-blue-600/80' : 'bg-white/15'}`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform ${soundEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <label className="text-xs font-bold text-slate-200 uppercase tracking-wide">Background Color</label>
                  <ColorPadPicker
                    color={bgColor}
                    onChange={(newColor) => {
                      setBgColor(newColor);
                      safeStorage.setItem('nb_bg_color_v1', newColor);
                    }}
                  />
                </div>
                
                <div className="pt-4 border-t border-white/20 mt-4 space-y-2">
                  <button 
                    type="button" 
                    onClick={() => { setShowSettings(false); setShowWelcomeModal(true); }} 
                    className="w-full py-2.5 bg-sky-500/20 hover:bg-sky-500/30 text-sky-200 text-xs font-bold rounded-2xl uppercase transition-colors border border-sky-400/30 backdrop-blur-md flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Smartphone size={15} />
                    <span>Home Screen App Guide</span>
                  </button>
                  <button 
                    type="button" 
                    onClick={() => window.location.reload()} 
                    className="w-full py-2.5 bg-white/15 hover:bg-white/25 text-slate-100 text-xs font-bold rounded-2xl uppercase transition-colors border border-white/20 backdrop-blur-md"
                  >
                    Refresh App
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setConfirmWipe(true)} 
                    className="w-full py-2.5 bg-rose-500/20 border border-rose-400/30 text-rose-200 hover:bg-rose-500/30 text-xs font-bold rounded-2xl uppercase transition-colors backdrop-blur-md"
                  >
                    Wipe & Reset Data
                  </button>
                </div>
              </div>
            ) : (
              // -- Wipe confirmation view --
              <div className="space-y-3 text-center py-2">
                <p className="text-xs text-rose-200 font-bold leading-relaxed">
                  Are you sure? This will delete your leaderboard stats and clear all completed stage progress permanently.
                </p>
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button 
                    type="button" 
                    onClick={() => setConfirmWipe(false)} 
                    className="py-2.5 bg-white/15 hover:bg-white/25 text-xs font-bold rounded-2xl text-slate-200 uppercase border border-white/20 backdrop-blur-md"
                  >
                    Cancel
                  </button>
                  <button 
                    type="button" 
                    onClick={handleWipeData} 
                    className="py-2.5 bg-rose-600 hover:bg-rose-500 text-xs font-black rounded-2xl text-white uppercase tracking-wider shadow-md border border-rose-400/40 backdrop-blur-md"
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
          Paginated 30-level grid (5 columns × 6 rows).
          Levels unlock in 10-level sets when previous set has >= 8 clears.
          ====================================================== */}
      {showLevelBrowser && (
        <div className="fixed inset-0 bg-black/35 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 z-50 animate-in fade-in duration-150">
          <div className="w-full max-w-sm sm:max-w-md bg-white/15 backdrop-blur-2xl border border-white/30 rounded-[28px] sm:rounded-[32px] p-3.5 sm:p-5 flex flex-col shadow-[0_25px_60px_rgba(0,0,0,0.35)] text-white space-y-2.5 sm:space-y-3">
            <div className="flex justify-between items-center pb-2 border-b border-white/20">
              <h3 className="text-sm sm:text-base font-black uppercase tracking-wider text-white drop-shadow-sm">LEVEL SELECTOR</h3>
              <button type="button" className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/15 hover:bg-white/25 text-slate-200 hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-white/20 backdrop-blur-md" onClick={() => setShowLevelBrowser(false)}>
                <X size={16} strokeWidth={2.5} />
              </button>
            </div>

            {/* Page navigation row */}
            <div className="flex justify-between items-center bg-white/10 backdrop-blur-md rounded-xl sm:rounded-2xl p-2 sm:p-2.5 border border-white/20 text-xs sm:text-sm">
              <button 
                type="button"
                disabled={browserPage === 0}
                onClick={() => setBrowserPage(p => Math.max(0, p - 1))}
                className="px-2.5 py-1 bg-white/15 hover:bg-white/25 border border-white/20 rounded-lg sm:rounded-xl text-white disabled:opacity-20 flex items-center gap-1 font-bold transition-all shadow-sm"
              >
                <ChevronLeft size={14} strokeWidth={2.5} /> Prev
              </button>
              
              <span className="font-extrabold text-white text-xs sm:text-sm tracking-wide">
                Levels {browserPage * 30 + 1} – {(browserPage + 1) * 30}
              </span>

              <button 
                type="button"
                disabled={!isSetUnlocked((browserPage + 1) * 3)}
                onClick={() => setBrowserPage(p => p + 1)}
                className="px-2.5 py-1 bg-white/15 hover:bg-white/25 border border-white/20 rounded-lg sm:rounded-xl text-white disabled:opacity-30 flex items-center gap-1 font-bold transition-all shadow-sm disabled:bg-white/5"
              >
                {!isSetUnlocked((browserPage + 1) * 3) ? (
                  <span className="flex items-center gap-1 text-slate-200/60"><Lock size={12}/> Locked</span>
                ) : (
                  <>Next <ChevronRight size={14} strokeWidth={2.5} /></>
                )}
              </button>
            </div>
            
            {/* Unlock progress hint */}
            <div className="text-[11px] sm:text-xs text-slate-100 font-medium text-center tracking-wide">
              Complete 8/10 levels in a set to unlock the next 10 levels
            </div>

            {/* Level grid (5 columns strictly × 6 rows = 30 levels per page) */}
            <div className="grid grid-cols-5 gap-1.5 sm:gap-2 pt-0.5">
              {Array.from({ length: 30 }).map((_, i) => {
                const targetLvl = browserPage * 30 + (i + 1);
                const setIdx = Math.floor((targetLvl - 1) / 10);
                const isUnlocked = isSetUnlocked(setIdx);
                const isCurrent = targetLvl === level;
                const isDone = completedLevels.includes(targetLvl);

                return (
                  <button 
                    key={targetLvl} 
                    type="button" 
                    disabled={!isUnlocked}
                    onClick={() => { 
                      if (isDone) {
                        setCompletedLevelNotice(targetLvl);
                        setShowLevelBrowser(false);
                      } else {
                        setLevel(targetLvl); 
                        setShowLevelBrowser(false); 
                      }
                    }} 
                    className={`h-8 sm:h-10 rounded-xl sm:rounded-2xl flex items-center justify-center border transition-all text-xs sm:text-sm font-black relative shadow-sm backdrop-blur-md ${
                      isCurrent 
                        ? 'bg-blue-600/90 border-blue-400 text-white shadow-lg ring-2 ring-blue-400/60 scale-105 z-10' 
                        : isDone 
                          ? 'bg-emerald-500/30 border-emerald-400/50 text-emerald-200 hover:bg-emerald-500/40' 
                          : !isUnlocked
                            ? 'bg-white/5 border-white/5 text-slate-500/50 cursor-not-allowed'
                            : 'bg-white/15 hover:bg-white/25 border-white/25 text-white hover:scale-102'
                    }`}
                  >
                    {!isUnlocked ? (
                      <Lock size={13} className="text-slate-300/50" />
                    ) : (
                      <span>{targetLvl}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
      {/* END MODAL: LEVEL SELECTOR / BROWSER */}

      {/* ======================================================
          MODAL: COMPLETED STAGE NOTICE
          Shown when selecting a level that has already been cleared.
          Informs user stage is cleared and allows returning to
          level selector or replaying.
          ====================================================== */}
      {completedLevelNotice !== null && (
        <div className="fixed inset-0 bg-black/35 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="w-full max-w-xs bg-white/15 backdrop-blur-2xl border border-white/30 rounded-[32px] p-6 text-center space-y-4 shadow-[0_25px_60px_rgba(0,0,0,0.35)] text-white">
            <div className="w-14 h-14 bg-emerald-400/20 border-2 border-emerald-300/40 rounded-full flex items-center justify-center mx-auto text-emerald-300 backdrop-blur-md shadow-sm">
              <CheckCircle2 size={32} />
            </div>
            <div>
              <h2 className="text-xl font-black uppercase tracking-tight drop-shadow-sm">STAGE COMPLETED!</h2>
              <p className="text-xs text-slate-200 font-medium mt-1">Stage {completedLevelNotice} is already completed.</p>
              
              <div className="bg-white/10 rounded-2xl p-3 border border-white/20 text-xs space-y-1.5 mt-3">
                <div className="flex justify-between font-bold text-slate-200">
                  <span>Best Record:</span>
                  <span className="text-emerald-300 font-black">
                    {levelRecords[completedLevelNotice] !== undefined ? `${levelRecords[completedLevelNotice]} moves` : '-'}
                  </span>
                </div>
                <div className="flex justify-between font-bold text-slate-200">
                  <span>Level Par:</span>
                  <span className="text-sky-300 font-black">
                    {getLevelPar(generateDeterministicLevelConfig(completedLevelNotice, bgColor))} moves
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  const targetLvl = completedLevelNotice;
                  setCompletedLevelNotice(null);
                  setShowLevelBrowser(true);
                  setBrowserPage(Math.floor((targetLvl - 1) / 30));
                }}
                className="w-full py-3 bg-blue-600/90 hover:bg-blue-500 font-black text-xs rounded-2xl uppercase tracking-wider shadow-lg active:scale-98 transition-all border border-blue-400/40 backdrop-blur-md"
              >
                LEVEL SELECTOR
              </button>
              <button
                type="button"
                onClick={() => {
                  const targetLvl = completedLevelNotice;
                  setCompletedLevelNotice(null);
                  setLevel(targetLvl);
                  loadAndGenerateLevel(true);
                }}
                className="w-full py-2.5 bg-white/15 hover:bg-white/25 font-bold text-xs rounded-2xl uppercase tracking-wider text-slate-200 border border-white/20 backdrop-blur-md"
              >
                REPLAY STAGE
              </button>
            </div>
          </div>
        </div>
      )}
      {/* END MODAL: COMPLETED STAGE NOTICE */}

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
            onClick={() => { safeStorage.clear(); window.location.reload(); }}
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
