
import { getDB } from './bibleService';

const SONG_STORE = 'songs';
const MEDIA_STORE = 'media';

// In-memory songs cache for ultra-fast 0ms access even with 1000+ songs
let memorySongsCache: any[] | null = null;

export const getCachedSongsFast = (): any[] | null => {
  return memorySongsCache;
};

// Local IndexedDB + songs/ filesystem sync with ultra-fast caching
export const getSongs = async (forceRefresh = false): Promise<any[]> => {
  // If memory cache is available and force refresh is not requested, return immediately
  if (!forceRefresh && memorySongsCache && memorySongsCache.length > 0) {
    // Refresh in background without blocking caller
    fetch('/api/songs/list')
      .then((res) => (res.ok ? res.json() : null))
      .then((apiSongs) => {
        if (Array.isArray(apiSongs) && apiSongs.length > 0) {
          memorySongsCache = apiSongs;
        }
      })
      .catch(() => {});
    return memorySongsCache;
  }

  let apiSongs: any[] | null = null;
  try {
    const res = await fetch('/api/songs/list');
    if (res.ok) {
      apiSongs = await res.json();
    }
  } catch (e) {
    console.warn("Could not fetch songs from /api/songs/list, falling back to IndexedDB", e);
  }

  const db = await getDB();
  const dbSongs = await new Promise<any[]>((resolve, reject) => {
    const tx = db.transaction(SONG_STORE, 'readonly');
    const store = tx.objectStore(SONG_STORE);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });

  if (Array.isArray(apiSongs)) {
    memorySongsCache = apiSongs;

    // Asynchronously update IndexedDB in background so UI isn't blocked
    setTimeout(() => {
      try {
        const tx = db.transaction(SONG_STORE, 'readwrite');
        const store = tx.objectStore(SONG_STORE);
        for (const song of apiSongs) {
          store.put(song);
        }
      } catch (e) {}
    }, 0);

    return apiSongs;
  }

  memorySongsCache = dbSongs;
  return dbSongs;
};

export const saveMedia = async (file: File): Promise<string> => {
  const db = await getDB();
  return new Promise<string>((resolve, reject) => {
    const tx = db.transaction(MEDIA_STORE, 'readwrite');
    const store = tx.objectStore(MEDIA_STORE);
    const id = "media_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
    const request = store.put({ id, file, name: file.name, type: file.type, createdAt: Date.now() });
    request.onsuccess = () => resolve(id);
    request.onerror = () => reject(request.error);
  });
};

export const getMedia = async (id: string): Promise<File | null> => {
  const db = await getDB();
  return new Promise<File | null>((resolve, reject) => {
    const tx = db.transaction(MEDIA_STORE, 'readonly');
    const store = tx.objectStore(MEDIA_STORE);
    const request = store.get(id);
    request.onsuccess = () => {
      if (request.result) {
        resolve(request.result.file);
      } else {
        resolve(null);
      }
    };
    request.onerror = () => reject(request.error);
  });
};

export const addSong = async (
  title: string,
  artist: string,
  lyrics: string,
  settings?: any,
  customId?: string,
) => {
  let fileSavedId: string | null = null;
  let filename: string | null = null;
  try {
    const res = await fetch('/api/songs/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, artist, lyrics, settings }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.id) fileSavedId = data.id;
      if (data.filename) filename = data.filename;
    }
  } catch (e) {
    console.warn("Could not save song to /api/songs/save", e);
  }

  const db = await getDB();
  return new Promise<string>((resolve, reject) => {
    const tx = db.transaction(SONG_STORE, 'readwrite');
    const store = tx.objectStore(SONG_STORE);
    const id = customId || fileSavedId || "song_" + Date.now();
    const newSong = {
      id,
      title,
      artist,
      lyrics,
      settings,
      filename,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    if (memorySongsCache) {
      memorySongsCache = [newSong, ...memorySongsCache.filter((s) => s.id !== id)];
    }
    const request = store.put(newSong);
    request.onsuccess = () => resolve(id);
    request.onerror = () => reject(request.error);
  });
};

export const updateSong = async (
  id: string,
  title: string,
  artist: string,
  lyrics: string,
  settings?: any,
  originalFilename?: string,
) => {
  let updatedFilename: string | undefined = undefined;
  try {
    const res = await fetch('/api/songs/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, title, artist, lyrics, settings, originalFilename }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.filename) updatedFilename = data.filename;
    }
  } catch (e) {
    console.warn("Could not update song on /api/songs/save", e);
  }

  if (memorySongsCache) {
    memorySongsCache = memorySongsCache.map((s) =>
      s.id === id
        ? {
            ...s,
            title,
            artist,
            lyrics,
            settings,
            filename: updatedFilename || s.filename,
            updatedAt: Date.now(),
          }
        : s,
    );
  }

  const db = await getDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(SONG_STORE, 'readwrite');
    const store = tx.objectStore(SONG_STORE);
    const getReq = store.get(id);
    getReq.onsuccess = () => {
      const existing = getReq.result || {};
      const request = store.put({
        ...existing,
        id,
        title,
        artist,
        lyrics,
        settings,
        filename: updatedFilename || existing.filename,
        updatedAt: Date.now(),
      });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    };
    getReq.onerror = () => reject(getReq.error);
  });
};

export const deleteSong = async (id: string, filename?: string, title?: string) => {
  if (memorySongsCache) {
    memorySongsCache = memorySongsCache.filter((s) => s.id !== id);
  }
  try {
    await fetch('/api/songs/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, filename, title }),
    });
  } catch (e) {
    console.warn("Could not delete song from /api/songs/delete", e);
  }

  const db = await getDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(SONG_STORE, 'readwrite');
    const store = tx.objectStore(SONG_STORE);
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const deleteAllSongs = async () => {
  memorySongsCache = [];
  try {
    await fetch('/api/songs/delete-all', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.warn("Could not delete all songs from /api/songs/delete-all", e);
  }

  const db = await getDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(SONG_STORE, 'readwrite');
    const store = tx.objectStore(SONG_STORE);
    const request = store.clear();
    let resolved = false;
    request.onsuccess = () => {
      if (!resolved) {
        resolved = true;
        resolve();
      }
    };
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => {
      if (!resolved) {
        resolved = true;
        resolve();
      }
    };
    tx.onerror = () => reject(tx.error);
  });
};

export const getBibles = async () => {
  const db = await getDB();
  return new Promise<any[]>((resolve, reject) => {
    const tx = db.transaction('bibles', 'readonly');
    const store = tx.objectStore('bibles');
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const addBible = async (bibleData: any) => {
  const db = await getDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction('bibles', 'readwrite');
    const store = tx.objectStore('bibles');
    const request = store.put({ id: bibleData.name || "bible_" + Date.now(), ...bibleData, createdAt: Date.now() });
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

// In-memory cross-window synchronization channel (0ms latency, zero HTTP roundtrip)
const LIVE_CHANNEL_NAME = 'web-projector-live-sync';
let sharedBroadcastChannel: BroadcastChannel | null = null;
try {
  if (typeof window !== 'undefined' && typeof BroadcastChannel !== 'undefined') {
    sharedBroadcastChannel = new BroadcastChannel(LIVE_CHANNEL_NAME);
  }
} catch (e) {
  console.warn('BroadcastChannel initialization skipped', e);
}

// Local Server Sync (Multi-layer: BroadcastChannel -> Electron IPC -> WebSocket -> SSE)
export const updateLiveState = (state: any) => {
  if (!state) return;

  // 1. Instant 0ms in-memory broadcast to all same-origin tabs and windows
  if (sharedBroadcastChannel) {
    try {
      sharedBroadcastChannel.postMessage(state);
    } catch (e) {}
  }

  // 2. Instant 0ms native Electron IPC relay to the projector stage window
  if (typeof window !== 'undefined' && (window as any).electronAPI?.sendLiveState) {
    try {
      (window as any).electronAPI.sendLiveState(state);
    } catch (e) {}
  }

  // 3. Vite HMR WebSocket in development mode
  if (import.meta.hot) {
    try {
      import.meta.hot.send('web-projector:update', state);
    } catch (e) {}
  }

  // 4. Non-blocking background HTTP POST for OBS Browser Source and remote network clients
  fetch('/api/state?t=' + Date.now(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(state),
  }).catch((err) => {
    // Suppress network log spam if offline
  });
};

export const subscribeToLiveState = (callback: (state: any) => void) => {
  let isCleanedUp = false;
  let lastSerialized = '';

  const handleIncoming = (state: any) => {
    if (isCleanedUp || !state) return;
    try {
      const serialized = JSON.stringify(state);
      if (serialized === lastSerialized) return;
      lastSerialized = serialized;
      callback(state);
    } catch (e) {
      callback(state);
    }
  };

  // 1. Subscribe to BroadcastChannel for instant local multi-window updates
  const onBcMessage = (event: MessageEvent) => {
    if (event.data) {
      handleIncoming(event.data);
    }
  };
  if (sharedBroadcastChannel) {
    sharedBroadcastChannel.addEventListener('message', onBcMessage);
  }

  // 2. Subscribe to Electron native IPC
  let unsubscribeIpc: (() => void) | null = null;
  if (typeof window !== 'undefined' && (window as any).electronAPI?.onLiveState) {
    try {
      unsubscribeIpc = (window as any).electronAPI.onLiveState((state: any) => {
        handleIncoming(state);
      });
      // Query initial state immediately if available
      (window as any).electronAPI.getLatestLiveState?.().then((initialState: any) => {
        if (initialState) handleIncoming(initialState);
      }).catch(() => {});
    } catch (e) {}
  }

  // 3. Subscribe to Vite HMR WebSocket in development mode
  let offHmr: (() => void) | null = null;
  if (import.meta.hot) {
    const handler = (data: any) => handleIncoming(data);
    import.meta.hot.on('web-projector:state', handler);
    import.meta.hot.send('web-projector:request-state', {});
    offHmr = () => {
      // @ts-ignore
      if (import.meta.hot.off) {
        // @ts-ignore
        import.meta.hot.off('web-projector:state', handler);
      }
    };
  }

  // 4. Fallback / OBS Browser Source / Remote SSE client
  let eventSource: EventSource | null = null;
  let heartbeatTimer: any = null;

  const connect = () => {
    if (isCleanedUp) return;
    try {
      eventSource = new EventSource('/api/state?t=' + Date.now());

      const resetHeartbeat = () => {
        clearTimeout(heartbeatTimer);
        heartbeatTimer = setTimeout(() => {
          if (!isCleanedUp && eventSource) {
            console.warn('SSE heartbeat timeout. Reconnecting...');
            eventSource.close();
            connect();
          }
        }, 20000);
      };

      eventSource.onmessage = (event) => {
        resetHeartbeat();
        try {
          const state = JSON.parse(event.data);
          handleIncoming(state);
        } catch (e) {}
      };

      eventSource.addEventListener('ping', () => resetHeartbeat());
      eventSource.onerror = () => {};
      resetHeartbeat();
    } catch (e) {
      console.warn('Could not establish EventSource connection', e);
    }
  };

  connect();

  return () => {
    isCleanedUp = true;
    if (sharedBroadcastChannel) {
      sharedBroadcastChannel.removeEventListener('message', onBcMessage);
    }
    if (unsubscribeIpc) {
      unsubscribeIpc();
    }
    if (offHmr) {
      offHmr();
    }
    clearTimeout(heartbeatTimer);
    if (eventSource) {
      eventSource.close();
    }
  };
};
