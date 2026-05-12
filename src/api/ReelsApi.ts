/**
 * ReelsApi — manifest fetching and feed ordering for the Reels tab.
 *
 * The feed is built as follows on every refresh:
 *   1. Fetch reels manifest from the static host (or cached copy if offline)
 *   2. Filter out reels marked seen in the last 7 days
 *   3. Sort by publishedAt newest-first
 *   4. If <10 unseen reels remain, mix in older seen reels using a
 *      date-seeded shuffle so the order changes daily but is stable
 *      within one day for one user
 *   5. Apply optional deity filter
 *
 * No backend, no auth, no analytics. Seen/saved state is device-local.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import {Reel, ReelInteraction, ReelsManifest, DeityId} from '@/types';
import {StorageKeys} from '@/storage/keys';
import {Config} from '@/utils/config';

const MIN_FEED_LENGTH = 10;
const SEEN_FRESHNESS_DAYS = 7;

// =============================================================================
// Network
// =============================================================================

async function fetchJson<T>(url: string): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), Config.fetchTimeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {Accept: 'application/json'},
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

async function isOnline(): Promise<boolean> {
  try {
    const s = await NetInfo.fetch();
    return s.isConnected === true && s.isInternetReachable !== false;
  } catch {
    return false;
  }
}

// =============================================================================
// Manifest cache
// =============================================================================

async function readManifestCache(): Promise<ReelsManifest | null> {
  try {
    const raw = await AsyncStorage.getItem(StorageKeys.REELS_MANIFEST);
    return raw ? (JSON.parse(raw) as ReelsManifest) : null;
  } catch {
    return null;
  }
}

async function writeManifestCache(m: ReelsManifest): Promise<void> {
  try {
    await AsyncStorage.setItem(StorageKeys.REELS_MANIFEST, JSON.stringify(m));
  } catch {
    // best-effort
  }
}

// =============================================================================
// Interactions (seen / saved)
// =============================================================================

async function loadInteractions(): Promise<Record<string, ReelInteraction>> {
  try {
    const raw = await AsyncStorage.getItem(StorageKeys.REEL_INTERACTIONS);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

async function saveInteractions(
  map: Record<string, ReelInteraction>,
): Promise<void> {
  await AsyncStorage.setItem(
    StorageKeys.REEL_INTERACTIONS,
    JSON.stringify(map),
  );
}

// =============================================================================
// Daily shuffle
// =============================================================================

/**
 * Tiny deterministic hash → 32-bit unsigned int. Used to seed the shuffle so
 * "today's order" is stable across app launches but rotates daily.
 */
function hashString(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffleSeeded<T>(arr: readonly T[], seed: number): T[] {
  const out = arr.slice();
  const rand = mulberry32(seed);
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

// =============================================================================
// Public API
// =============================================================================

export const ReelsApi = {
  /**
   * Pull the latest reels manifest. Falls back to cached copy if offline.
   * Returns null if there is no cache and no network.
   */
  async refreshManifest(): Promise<ReelsManifest | null> {
    if (!(await isOnline())) return readManifestCache();
    try {
      const url = `${Config.contentBaseUrl}/reels-manifest.json`;
      const manifest = await fetchJson<ReelsManifest>(url);
      await writeManifestCache(manifest);
      return manifest;
    } catch (err) {
      console.warn('[ReelsApi] manifest refresh failed:', err);
      return readManifestCache();
    }
  },

  /**
   * Build the feed the user actually sees.
   * @param deityFilter - if set, only reels matching this deity (or 'all')
   */
  async feed(deityFilter?: DeityId | 'all'): Promise<Reel[]> {
    const manifest =
      (await readManifestCache()) ?? (await ReelsApi.refreshManifest());
    if (!manifest) return [];

    let reels = manifest.reels.slice();
    if (deityFilter && deityFilter !== 'all') {
      reels = reels.filter(r => r.deityId === deityFilter);
    }
    if (reels.length === 0) return [];

    const interactions = await loadInteractions();
    const now = Date.now();
    const freshnessCutoff = now - SEEN_FRESHNESS_DAYS * 24 * 60 * 60 * 1000;

    const recentlySeen = (id: string) => {
      const i = interactions[id];
      return i?.seen && (i.seenAt ?? 0) > freshnessCutoff;
    };

    const unseen = reels
      .filter(r => !recentlySeen(r.id))
      .sort(
        (a, b) =>
          new Date(b.publishedAt).getTime() -
          new Date(a.publishedAt).getTime(),
      );

    if (unseen.length >= MIN_FEED_LENGTH) {
      return unseen;
    }

    // Top up with older content using today's deterministic shuffle so the
    // "fallback" feed feels different each day.
    const seenIds = new Set(unseen.map(r => r.id));
    const older = reels.filter(r => !seenIds.has(r.id));
    const shuffled = shuffleSeeded(older, hashString(todayKey()));
    return [...unseen, ...shuffled];
  },

  /** All saved reels, newest-saved first. */
  async listSaved(): Promise<Reel[]> {
    const [manifest, interactions] = await Promise.all([
      readManifestCache(),
      loadInteractions(),
    ]);
    if (!manifest) return [];
    const savedIds = Object.values(interactions)
      .filter(i => i.saved)
      .sort((a, b) => (b.savedAt ?? 0) - (a.savedAt ?? 0))
      .map(i => i.reelId);
    const byId = new Map(manifest.reels.map(r => [r.id, r]));
    return savedIds.map(id => byId.get(id)).filter((r): r is Reel => !!r);
  },

  async markSeen(reelId: string): Promise<void> {
    const map = await loadInteractions();
    const cur = map[reelId] ?? {reelId, seen: false, saved: false};
    map[reelId] = {...cur, seen: true, seenAt: Date.now()};
    await saveInteractions(map);
  },

  async toggleSaved(reelId: string): Promise<boolean> {
    const map = await loadInteractions();
    const cur = map[reelId] ?? {reelId, seen: false, saved: false};
    const nextSaved = !cur.saved;
    map[reelId] = {
      ...cur,
      saved: nextSaved,
      savedAt: nextSaved ? Date.now() : cur.savedAt,
    };
    await saveInteractions(map);
    return nextSaved;
  },

  async isSaved(reelId: string): Promise<boolean> {
    const map = await loadInteractions();
    return !!map[reelId]?.saved;
  },
};
