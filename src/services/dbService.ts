
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

// Local Server Sync (WebSocket / SSE)
export const updateLiveState = async (state: any) => {
  try {
    if (import.meta.hot) {
      import.meta.hot.send('web-projector:update', state);
      return;
    }
    await fetch('/api/state?t=' + Date.now(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(state)
    });
  } catch (err) {
    console.error('Failed to sync live state', err);
  }
};

export const subscribeToLiveState = (callback: (state: any) => void) => {
  if (import.meta.hot) {
    const handler = (data: any) => callback(data);
    import.meta.hot.on('web-projector:state', handler);
    import.meta.hot.send('web-projector:request-state', {});
    return () => {
      // @ts-ignore
      if (import.meta.hot.off) {
        // @ts-ignore
        import.meta.hot.off('web-projector:state', handler);
      }
    };
  }

  // Fallback to SSE if Vite HMR is somehow disabled
  let eventSource: EventSource;
  let heartbeatTimer: any;

  const connect = () => {
    eventSource = new EventSource('/api/state?t=' + Date.now());
    
    const resetHeartbeat = () => {
      clearTimeout(heartbeatTimer);
      heartbeatTimer = setTimeout(() => {
        console.warn('SSE heartbeat timeout. Reconnecting...');
        eventSource.close();
        connect();
      }, 20000);
    };

    eventSource.onmessage = (event) => {
      resetHeartbeat();
      try {
        const state = JSON.parse(event.data);
        callback(state);
      } catch (e) {
        console.error('Failed to parse SSE data', e);
      }
    };

    eventSource.addEventListener('ping', () => resetHeartbeat());
    eventSource.onerror = () => {};
    resetHeartbeat();
  };

  connect();

  return () => {
    clearTimeout(heartbeatTimer);
    if (eventSource) eventSource.close();
  };
};
