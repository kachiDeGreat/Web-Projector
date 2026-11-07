export interface LyricsSearchResult {
  id: number | string;
  title: string;
  artist: string;
  album?: string;
  lyrics: string;
  duration?: number;
  source: 'LRCLIB' | 'Lyrics.ovh';
}

export const cleanLyricsText = (
  plainLyrics?: string | null,
  syncedLyrics?: string | null,
): string => {
  if (plainLyrics && plainLyrics.trim()) {
    let cleaned = plainLyrics.trim();
    // Strip common intro headers from lyrics.ovh or similar providers
    cleaned = cleaned.replace(/^Paroles de la chanson[^\n]*\n+/i, '');
    cleaned = cleaned.replace(/^Lyrics of the song[^\n]*\n+/i, '');
    return cleaned.trim();
  }
  if (syncedLyrics && syncedLyrics.trim()) {
    return syncedLyrics
      .split('\n')
      .map((line) => line.replace(/\[\d{2}:\d{2}(?:\.\d{1,3})?\]/g, '').trim())
      .filter((line) => line.length > 0)
      .join('\n');
  }
  return '';
};

/**
 * Searches lyrics from Primary Provider (LRCLIB)
 */
async function searchLrclib(title: string, artist?: string): Promise<LyricsSearchResult[]> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  try {
    let url = `https://lrclib.net/api/search?track_name=${encodeURIComponent(title)}`;
    if (artist) {
      url += `&artist_name=${encodeURIComponent(artist)}`;
    }

    let res = await fetch(url, { signal: controller.signal });
    let data = res.ok ? await res.json() : null;

    let hasLyrics =
      Array.isArray(data) &&
      data.some((d: any) => !d.instrumental && (d.plainLyrics || d.syncedLyrics));

    // Fallback query within LRCLIB if track_name returned empty
    if (!hasLyrics) {
      const queryTerm = `${title} ${artist || ''}`.trim();
      const fallbackRes = await fetch(
        `https://lrclib.net/api/search?q=${encodeURIComponent(queryTerm)}`,
        { signal: controller.signal }
      );
      if (fallbackRes.ok) {
        data = await fallbackRes.json();
      }
    }

    if (Array.isArray(data)) {
      return data
        .filter((item: any) => !item.instrumental && (item.plainLyrics || item.syncedLyrics))
        .map((item: any) => ({
          id: `lrclib_${item.id}`,
          title: item.trackName || item.name || title,
          artist: item.artistName || artist || 'Unknown',
          album: item.albumName || '',
          lyrics: cleanLyricsText(item.plainLyrics, item.syncedLyrics),
          duration: item.duration,
          source: 'LRCLIB' as const,
        }))
        .filter((item) => item.lyrics.length > 0);
    }
  } catch (err) {
    console.warn('LRCLIB search attempt failed or timed out:', err);
  } finally {
    clearTimeout(timeoutId);
  }

  return [];
}

/**
 * Searches lyrics from Backup Provider (Lyrics.ovh)
 */
async function searchLyricsOvh(title: string, artist?: string): Promise<LyricsSearchResult[]> {
  const results: LyricsSearchResult[] = [];

  // Strategy 1: Direct lookup if artist is specified
  if (artist) {
    try {
      const directController = new AbortController();
      const directTimeout = setTimeout(() => directController.abort(), 4000);
      const directRes = await fetch(
        `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`,
        { signal: directController.signal }
      );
      clearTimeout(directTimeout);

      if (directRes.ok) {
        const directData = await directRes.json();
        if (directData?.lyrics) {
          const cleaned = cleanLyricsText(directData.lyrics);
          if (cleaned) {
            results.push({
              id: `ovh_direct_${Date.now()}`,
              title,
              artist,
              lyrics: cleaned,
              source: 'Lyrics.ovh',
            });
          }
        }
      }
    } catch (e) {
      console.warn('Lyrics.ovh direct lookup error:', e);
    }
  }

  // Strategy 2: Suggest search endpoint (powered by Deezer catalog)
  try {
    const queryTerm = `${title} ${artist || ''}`.trim();
    const suggestController = new AbortController();
    const suggestTimeout = setTimeout(() => suggestController.abort(), 5000);

    const suggestRes = await fetch(
      `https://api.lyrics.ovh/suggest/${encodeURIComponent(queryTerm)}`,
      { signal: suggestController.signal }
    );
    clearTimeout(suggestTimeout);

    if (suggestRes.ok) {
      const suggestData = await suggestRes.json();
      const topTracks = (suggestData.data || []).slice(0, 4);

      const fetchPromises = topTracks.map(async (track: any) => {
        try {
          const trackArtist = track.artist?.name || artist || 'Unknown';
          const trackTitle = track.title || title;

          const lyricController = new AbortController();
          const lyricTimeout = setTimeout(() => lyricController.abort(), 4000);

          const lyricRes = await fetch(
            `https://api.lyrics.ovh/v1/${encodeURIComponent(trackArtist)}/${encodeURIComponent(trackTitle)}`,
            { signal: lyricController.signal }
          );
          clearTimeout(lyricTimeout);

          if (lyricRes.ok) {
            const lyricData = await lyricRes.json();
            if (lyricData?.lyrics) {
              const cleaned = cleanLyricsText(lyricData.lyrics);
              if (cleaned) {
                return {
                  id: `ovh_${track.id || Math.random()}`,
                  title: track.title || title,
                  artist: trackArtist,
                  album: track.album?.title || '',
                  lyrics: cleaned,
                  duration: track.duration,
                  source: 'Lyrics.ovh' as const,
                };
              }
            }
          }
        } catch (e) {
          // ignore individual track fetch errors
        }
        return null;
      });

      const settled = await Promise.allSettled(fetchPromises);
      for (const res of settled) {
        if (res.status === 'fulfilled' && res.value) {
          results.push(res.value);
        }
      }
    }
  } catch (err) {
    console.warn('Lyrics.ovh suggest search failed or timed out:', err);
  }

  return results;
}

/**
 * Main Automatic Lyrics Search with Multi-Provider Redundancy & Fallback
 */
export async function searchAutomaticLyrics(
  title: string,
  artist?: string
): Promise<{
  results: LyricsSearchResult[];
  providerUsed: 'LRCLIB' | 'Lyrics.ovh (Backup API)' | 'Combined' | 'None';
}> {
  const cleanTitle = title.trim();
  const cleanArtist = (artist || '').trim();

  if (!cleanTitle) {
    return { results: [], providerUsed: 'None' };
  }

  // 1. Try Primary API (LRCLIB)
  let lrclibResults = await searchLrclib(cleanTitle, cleanArtist);

  if (lrclibResults.length > 0) {
    // Deduplicate
    const unique: LyricsSearchResult[] = [];
    const seen = new Set<string>();
    for (const item of lrclibResults) {
      const key = `${item.title.toLowerCase().trim()}___${item.artist.toLowerCase().trim()}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(item);
      }
      if (unique.length >= 6) break;
    }
    return { results: unique, providerUsed: 'LRCLIB' };
  }

  // 2. If LRCLIB returned 0 results or failed, automatically fall back to Backup API (Lyrics.ovh)
  console.log('LRCLIB returned no results. Falling back to Backup API (Lyrics.ovh)...');
  let ovhResults = await searchLyricsOvh(cleanTitle, cleanArtist);

  if (ovhResults.length > 0) {
    // Deduplicate
    const unique: LyricsSearchResult[] = [];
    const seen = new Set<string>();
    for (const item of ovhResults) {
      const key = `${item.title.toLowerCase().trim()}___${item.artist.toLowerCase().trim()}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(item);
      }
      if (unique.length >= 6) break;
    }
    return { results: unique, providerUsed: 'Lyrics.ovh (Backup API)' };
  }

  return { results: [], providerUsed: 'None' };
}
