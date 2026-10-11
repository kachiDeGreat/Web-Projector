import { BibleSettings, SongSettings, GlobalDisplaySettings, LiveState } from '../store/LiveContext';

export interface SuperSettingsPayload {
  version?: string;
  updatedAt?: string;
  bibleSettings?: Partial<BibleSettings>;
  defaultSongSettings?: Partial<SongSettings>;
  globalSettings?: Partial<GlobalDisplaySettings>;
  liveState?: Partial<LiveState>;
}

export const settingsService = {
  async getSuperSettings(): Promise<SuperSettingsPayload | null> {
    try {
      const res = await fetch('/api/settings', {
        headers: { 'Cache-Control': 'no-cache' }
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.settings) {
          return json.settings;
        }
      }
    } catch (e) {
      console.error('Failed to load super_settings.json from server:', e);
    }
    return null;
  },

  async saveSuperSettings(payload: SuperSettingsPayload): Promise<boolean> {
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const json = await res.json();
        return !!json.success;
      }
    } catch (e) {
      console.error('Failed to save super_settings.json to server:', e);
    }
    return false;
  }
};
