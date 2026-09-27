/**
 * Game Tracking Store — local DB for arcade/game-center play tracking.
 * Uses localStorage, same pattern as progressStore.ts.
 * 100% offline, works inside an Android APK.
 *
 * Tracks:
 *  - which games were played, how often, and for how long
 *  - which games the child marked as favorites
 */

export interface GamePlayRecord {
  gameId: string;
  gameName: string;
  playCount: number;
  lastPlayed: string; // ISO date string
  totalTimeSec: number;
  favorites: boolean;
}

export const GAME_STORAGE_KEYS = {
  GAMES_PLAYED: 'ala_games_played',
  GAME_FAVORITES: 'ala_game_favorites', // legacy/derived list of favorite gameIds
} as const;

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function save<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // Storage full or unavailable
  }
}

// ─── All Game Records ─────────────────────────────────────────────────────────

export function getAllGameRecords(): GamePlayRecord[] {
  return load<GamePlayRecord[]>(GAME_STORAGE_KEYS.GAMES_PLAYED, []);
}

function saveAllGameRecords(records: GamePlayRecord[]): void {
  save<GamePlayRecord[]>(GAME_STORAGE_KEYS.GAMES_PLAYED, records);
  // Keep the legacy favorites list in sync (simple string array of gameIds)
  save<string[]>(
    GAME_STORAGE_KEYS.GAME_FAVORITES,
    records.filter(r => r.favorites).map(r => r.gameId)
  );
}

// ─── Get stats for one game ───────────────────────────────────────────────────

export function getGameStats(gameId: string): GamePlayRecord | null {
  const found = getAllGameRecords().find(r => r.gameId === gameId);
  return found ?? null;
}

// ─── Record a game session ────────────────────────────────────────────────────

export function recordGamePlayed(
  gameId: string,
  gameName: string,
  timeSpentSec = 0
): GamePlayRecord {
  const all = getAllGameRecords();
  let rec = all.find(r => r.gameId === gameId);
  if (!rec) {
    rec = {
      gameId,
      gameName,
      playCount: 0,
      lastPlayed: new Date().toISOString(),
      totalTimeSec: 0,
      favorites: false,
    };
    all.push(rec);
  }
  rec.gameName = gameName; // keep name fresh in case of renames
  rec.playCount += 1;
  rec.lastPlayed = new Date().toISOString();
  rec.totalTimeSec += Math.max(0, Math.round(timeSpentSec));
  saveAllGameRecords(all);
  return rec;
}

// ─── Favorites ────────────────────────────────────────────────────────────────

/** Toggle favorite status. Returns the new favorite state. */
export function toggleFavoriteGame(gameId: string): boolean {
  const all = getAllGameRecords();
  let rec = all.find(r => r.gameId === gameId);
  if (!rec) {
    rec = {
      gameId,
      gameName: gameId, // will be corrected on next recordGamePlayed
      playCount: 0,
      lastPlayed: new Date().toISOString(),
      totalTimeSec: 0,
      favorites: true,
    };
    all.push(rec);
  } else {
    rec.favorites = !rec.favorites;
  }
  saveAllGameRecords(all);
  return rec.favorites;
}

export function getFavoriteGames(): GamePlayRecord[] {
  return getAllGameRecords().filter(r => r.favorites);
}

/** Mark/unmark explicitly without toggling. */
export function setFavoriteGame(gameId: string, favorite: boolean): void {
  const all = getAllGameRecords();
  let rec = all.find(r => r.gameId === gameId);
  if (!rec) {
    rec = {
      gameId,
      gameName: gameId,
      playCount: 0,
      lastPlayed: new Date().toISOString(),
      totalTimeSec: 0,
      favorites: favorite,
    };
    all.push(rec);
  } else {
    rec.favorites = favorite;
  }
  saveAllGameRecords(all);
}

// ─── Leaderboards / queries ───────────────────────────────────────────────────

export function getMostPlayedGames(limit = 10): GamePlayRecord[] {
  return [...getAllGameRecords()]
    .sort((a, b) => b.playCount - a.playCount)
    .slice(0, limit);
}

export function getRecentlyPlayedGames(limit = 10): GamePlayRecord[] {
  return [...getAllGameRecords()]
    .sort((a, b) => b.lastPlayed.localeCompare(a.lastPlayed))
    .slice(0, limit);
}

// ─── Reset ────────────────────────────────────────────────────────────────────

export function resetGameStats(): void {
  saveAllGameRecords([]);
}

// ─── Exported storage keys (for migrations / debugging) ─────────────────────

export { GAME_STORAGE_KEYS as GameStorageKeys };
