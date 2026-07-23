import { createClient } from '@supabase/supabase-js';

// ============================================================
// Global leaderboard backend.
//
// Without these two env vars set, `supabase` is null and the game
// falls back to the original behaviour: a leaderboard scoped to just
// this browser (via localStorage). That's what "GLOBAL LEADERBOARD"
// was actually doing before this file existed — the label was
// aspirational, the storage was per-device.
//
// To make it genuinely global:
//   1. Create a free project at https://supabase.com
//   2. Run supabase/schema.sql (repo root) in the SQL editor there
//   3. Copy .env.example to .env and fill in the two values from
//      Project Settings -> API
//   4. Restart `npm run dev` / rebuild
// ============================================================
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export const isGlobalLeaderboardEnabled = supabase !== null;

if (!isGlobalLeaderboardEnabled && typeof window !== 'undefined') {
  // Only warn once per session so it doesn't spam the console.
  console.warn(
    '[Nutstack] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY not set — ' +
    'leaderboard is running in local-only mode (see src/lib/supabaseClient.ts).'
  );
}

export type LeaderboardRow = {
  username: string;
  total_score: number;
  levels_played: number;
  updated_at: string;
};
