import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { updateLiveState, subscribeToLiveState } from '../services/dbService';
import { settingsService, SuperSettingsPayload } from '../services/settingsService';

export interface BibleSettings {
  layout: 'FS' | 'LT';
  verticalAlign: 'top' | 'middle' | 'bottom';
  horizontalAlign: 'left' | 'center' | 'right';
  linesMode: 1 | 2 | 3 | 4;
  bibleFontSize: number;
  bibleFontWeight: string;
  bibleTextTransform: 'none' | 'uppercase' | 'capitalize' | 'lowercase';
  bibleLowerThirdStyle: 'theme-1' | 'theme-2' | 'theme-3' | 'theme-4' | 'theme-5' | 'torn-edge' | 'none';
  lowerThirdWidth: number;
  enableLowerThirdBg: boolean;
  lowerThirdBgColor: string;
  lowerThirdBgOpacity: number;
  lowerThirdPadding: number;
  refFontSize: number;
  refPosition: 'top' | 'bottom';
  refAlign: 'left' | 'center' | 'right';
  refTextTransform: 'none' | 'uppercase' | 'capitalize' | 'lowercase';
  refFontWeight: string;
  refColor: string;
  animation: 'none' | 'fade' | 'slide' | 'zoom';
}

export interface SongSettings {
  layout: 'FS' | 'LT';
  verticalAlign: 'top' | 'middle' | 'bottom';
  horizontalAlign: 'left' | 'center' | 'right';
  linesMode: 1 | 2 | 3 | 4;
  songFontSize: number;
  songFontWeight: string;
  songTextTransform: 'none' | 'uppercase' | 'capitalize' | 'lowercase';
  enableKineticTypography: boolean;
  kineticTempo: 'slow' | 'medium' | 'fast';
  animation: 'none' | 'fade' | 'slide' | 'zoom';
  animationTemplate?: string;
}

export interface GlobalDisplaySettings {
  fontFamily: string;
  textColor: string;
  shadowIntensity: number;
  transparentBackground: boolean;
  paddingLR: number;
  backgroundMode: 'solid' | 'image' | 'video';
  backgroundColor: string;
  backgroundUrl: string;
  backgroundDim?: number;
}

export interface LiveState extends GlobalDisplaySettings, BibleSettings, SongSettings {
  type: 'bible' | 'song' | 'clear';
  title: string;
  text: string;
}

export const defaultBibleSettings: BibleSettings = {
  layout: 'LT',
  verticalAlign: 'bottom',
  horizontalAlign: 'center',
  linesMode: 2,
  bibleFontSize: 4.5,
  bibleFontWeight: '600',
  bibleTextTransform: 'none',
  bibleLowerThirdStyle: 'none',
  lowerThirdWidth: 78,
  enableLowerThirdBg: true,
  lowerThirdBgColor: '#000000',
  lowerThirdBgOpacity: 50,
  lowerThirdPadding: 3,
  refFontSize: 2.5,
  refPosition: 'top',
  refAlign: 'left',
  refTextTransform: 'none',
  refFontWeight: 'bold',
  refColor: '#FFFFFF',
  animation: 'none',
};

export const defaultSongSettings: SongSettings = {
  layout: 'FS',
  verticalAlign: 'bottom',
  horizontalAlign: 'center',
  linesMode: 1,
  songFontSize: 5.5,
  songFontWeight: '600',
  songTextTransform: 'none',
  enableKineticTypography: false,
  kineticTempo: 'fast',
  animation: 'none',
  animationTemplate: 'guessing-kinetic',
};

export const defaultGlobalSettings: GlobalDisplaySettings = {
  fontFamily: 'Inter',
  textColor: '#FFFFFF',
  shadowIntensity: 80,
  transparentBackground: false,
  paddingLR: 5,
  backgroundMode: 'solid',
  backgroundColor: '#050505',
  backgroundUrl: '',
  backgroundDim: 25,
};

export const buildLiveState = (
  type: 'bible' | 'song' | 'clear',
  content: { title: string; text: string },
  global: GlobalDisplaySettings,
  bible: BibleSettings,
  song: SongSettings
): LiveState => {
  if (type === 'bible') {
    return {
      ...global,
      ...song,
      ...bible,
      type: 'bible',
      title: content.title,
      text: content.text,
      enableKineticTypography: false,
    };
  }
  if (type === 'song') {
    return {
      ...global,
      ...bible,
      ...song,
      type: 'song',
      title: content.title,
      text: content.text,
    };
  }
  return {
    ...global,
    ...bible,
    ...song,
    type: 'clear',
    title: '',
    text: '',
    enableKineticTypography: false,
  };
};

const getStoredBibleSettings = (): BibleSettings => {
  try {
    const saved = localStorage.getItem('webProjectorBibleSettings');
    if (saved) return { ...defaultBibleSettings, ...JSON.parse(saved) };
    const legacy = localStorage.getItem('webProjectorSettings');
    if (legacy) {
      const parsed = JSON.parse(legacy);
      return {
        ...defaultBibleSettings,
        layout: parsed.layout || defaultBibleSettings.layout,
        verticalAlign: parsed.verticalAlign || defaultBibleSettings.verticalAlign,
        horizontalAlign: parsed.horizontalAlign || defaultBibleSettings.horizontalAlign,
        linesMode: parsed.linesMode || defaultBibleSettings.linesMode,
        bibleFontSize: parsed.bibleFontSize ?? defaultBibleSettings.bibleFontSize,
        bibleFontWeight: parsed.bibleFontWeight || defaultBibleSettings.bibleFontWeight,
        bibleTextTransform: parsed.bibleTextTransform || defaultBibleSettings.bibleTextTransform,
        bibleLowerThirdStyle: parsed.bibleLowerThirdStyle || defaultBibleSettings.bibleLowerThirdStyle,
        lowerThirdWidth: parsed.lowerThirdWidth ?? defaultBibleSettings.lowerThirdWidth,
        enableLowerThirdBg: parsed.enableLowerThirdBg ?? defaultBibleSettings.enableLowerThirdBg,
        lowerThirdBgColor: parsed.lowerThirdBgColor || defaultBibleSettings.lowerThirdBgColor,
        lowerThirdBgOpacity: parsed.lowerThirdBgOpacity ?? defaultBibleSettings.lowerThirdBgOpacity,
        lowerThirdPadding: parsed.lowerThirdPadding ?? defaultBibleSettings.lowerThirdPadding,
        refFontSize: parsed.refFontSize ?? defaultBibleSettings.refFontSize,
        refPosition: parsed.refPosition || defaultBibleSettings.refPosition,
        refAlign: parsed.refAlign || defaultBibleSettings.refAlign,
        refTextTransform: parsed.refTextTransform || defaultBibleSettings.refTextTransform,
        refFontWeight: parsed.refFontWeight || defaultBibleSettings.refFontWeight,
        refColor: parsed.refColor || defaultBibleSettings.refColor,
        animation: parsed.animation || defaultBibleSettings.animation,
      };
    }
  } catch (e) {
    console.error('Failed to parse bible settings', e);
  }
  return defaultBibleSettings;
};

const getStoredDefaultSongSettings = (): SongSettings => {
  try {
    const saved = localStorage.getItem('webProjectorDefaultSongSettings');
    if (saved) return { ...defaultSongSettings, ...JSON.parse(saved) };
  } catch (e) {
    console.error('Failed to parse default song settings', e);
  }
  return defaultSongSettings;
};

const getStoredGlobalSettings = (): GlobalDisplaySettings => {
  try {
    const saved = localStorage.getItem('webProjectorGlobalSettings');
    if (saved) return { ...defaultGlobalSettings, ...JSON.parse(saved) };
    const legacy = localStorage.getItem('webProjectorSettings');
    if (legacy) {
      const parsed = JSON.parse(legacy);
      return {
        ...defaultGlobalSettings,
        fontFamily: parsed.fontFamily || defaultGlobalSettings.fontFamily,
        textColor: parsed.textColor || defaultGlobalSettings.textColor,
        shadowIntensity: parsed.shadowIntensity ?? defaultGlobalSettings.shadowIntensity,
        transparentBackground: parsed.transparentBackground ?? defaultGlobalSettings.transparentBackground,
        paddingLR: parsed.paddingLR ?? defaultGlobalSettings.paddingLR,
        backgroundMode: parsed.backgroundMode || defaultGlobalSettings.backgroundMode,
        backgroundColor: parsed.backgroundColor || defaultGlobalSettings.backgroundColor,
        backgroundUrl: parsed.backgroundUrl || defaultGlobalSettings.backgroundUrl,
        backgroundDim: parsed.backgroundDim ?? defaultGlobalSettings.backgroundDim,
      };
    }
  } catch (e) {
    console.error('Failed to parse global settings', e);
  }
  return defaultGlobalSettings;
};

interface LiveContextType {
  liveState: LiveState;
  setLiveState: React.Dispatch<React.SetStateAction<LiveState>>;
  bibleSettings: BibleSettings;
  updateBibleSettings: (settings: Partial<BibleSettings>) => void;
  defaultSongSettings: SongSettings;
  updateDefaultSongSettings: (settings: Partial<SongSettings>) => void;
  globalSettings: GlobalDisplaySettings;
  updateGlobalSettings: (settings: Partial<GlobalDisplaySettings>) => void;
  projectBible: (title: string, text: string) => void;
  projectSong: (title: string, text: string, songSettings?: Partial<SongSettings>) => void;
  projectLive: (newState: Partial<LiveState>) => void;
  clearLive: () => void;
  saveGlobalSettings: (customSettings?: SuperSettingsPayload) => Promise<boolean>;
}

const LiveContext = createContext<LiveContextType | undefined>(undefined);

export function LiveProvider({ children }: { children: ReactNode }) {
  const [bibleSettings, setBibleSettings] = useState<BibleSettings>(getStoredBibleSettings);
  const [defaultSongSettingsState, setDefaultSongSettingsState] = useState<SongSettings>(getStoredDefaultSongSettings);
  const [globalSettings, setGlobalSettings] = useState<GlobalDisplaySettings>(getStoredGlobalSettings);

  const [liveState, setLiveState] = useState<LiveState>(() =>
    buildLiveState('clear', { title: '', text: '' }, getStoredGlobalSettings(), getStoredBibleSettings(), getStoredDefaultSongSettings())
  );

  const bibleSettingsRef = useRef(bibleSettings);
  const defaultSongSettingsRef = useRef(defaultSongSettingsState);
  const globalSettingsRef = useRef(globalSettings);
  const liveStateRef = useRef(liveState);

  useEffect(() => { bibleSettingsRef.current = bibleSettings; }, [bibleSettings]);
  useEffect(() => { defaultSongSettingsRef.current = defaultSongSettingsState; }, [defaultSongSettingsState]);
  useEffect(() => { globalSettingsRef.current = globalSettings; }, [globalSettings]);
  useEffect(() => { liveStateRef.current = liveState; }, [liveState]);

  useEffect(() => {
    // 1. Fetch super_settings.json from server on startup so settings persist across IP/device changes
    const loadSuperSettings = async () => {
      try {
        const remote = await settingsService.getSuperSettings();
        if (remote) {
          if (remote.bibleSettings) {
            setBibleSettings((prev) => ({ ...prev, ...remote.bibleSettings }));
            try {
              localStorage.setItem('webProjectorBibleSettings', JSON.stringify({ ...defaultBibleSettings, ...remote.bibleSettings }));
            } catch (e) {}
          }
          if (remote.defaultSongSettings) {
            setDefaultSongSettingsState((prev) => ({ ...prev, ...remote.defaultSongSettings }));
            try {
              localStorage.setItem('webProjectorDefaultSongSettings', JSON.stringify({ ...defaultSongSettings, ...remote.defaultSongSettings }));
            } catch (e) {}
          }
          if (remote.globalSettings) {
            setGlobalSettings((prev) => ({ ...prev, ...remote.globalSettings }));
            try {
              localStorage.setItem('webProjectorGlobalSettings', JSON.stringify({ ...defaultGlobalSettings, ...remote.globalSettings }));
            } catch (e) {}
          }
          if (remote.liveState) {
            setLiveState((prev) => ({ ...prev, ...remote.liveState }));
          }
        }
      } catch (e) {
        console.error('Failed to load super_settings.json from server', e);
      }
    };
    loadSuperSettings();

    // Subscribe to Local SSE Server for cross-device/OBS syncing
    const unsubscribe = subscribeToLiveState((state) => {
      if (state) {
        if (state.timestamp) {
          console.warn('Ignoring old RTDB state format to prevent crash.');
        } else {
          setLiveState(state);
        }
      }
    });
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  const updateBibleSettings = (settings: Partial<BibleSettings>) => {
    setBibleSettings((prev) => {
      const updated = { ...prev, ...settings };
      localStorage.setItem('webProjectorBibleSettings', JSON.stringify(updated));
      return updated;
    });

    setLiveState((prev) => {
      if (prev.type === 'bible') {
        const next = { ...prev, ...settings, enableKineticTypography: false };
        updateLiveState(next);
        return next;
      }
      return prev;
    });
  };

  const updateDefaultSongSettings = (settings: Partial<SongSettings>) => {
    setDefaultSongSettingsState((prev) => {
      const updated = { ...prev, ...settings };
      localStorage.setItem('webProjectorDefaultSongSettings', JSON.stringify(updated));
      return updated;
    });

    setLiveState((prev) => {
      if (prev.type === 'song') {
        const next = { ...prev, ...settings };
        updateLiveState(next);
        return next;
      }
      return prev;
    });
  };

  const updateGlobalSettings = (settings: Partial<GlobalDisplaySettings>) => {
    setGlobalSettings((prev) => {
      const updated = { ...prev, ...settings };
      localStorage.setItem('webProjectorGlobalSettings', JSON.stringify(updated));
      return updated;
    });

    setLiveState((prev) => {
      const next = { ...prev, ...settings };
      updateLiveState(next);
      return next;
    });
  };

  const projectBible = (title: string, text: string) => {
    const nextLive = buildLiveState('bible', { title, text }, globalSettings, bibleSettings, defaultSongSettingsState);
    setLiveState(nextLive);
    updateLiveState(nextLive);
  };

  const projectSong = (title: string, text: string, songSettings?: Partial<SongSettings>) => {
    // Individual songs always strictly follow the master song styling in Settings.
    // The ONLY property that can change per-song is animation (kinetic typography, tempo, template):
    const effectiveSongSettings: SongSettings = {
      ...defaultSongSettingsState,
      enableKineticTypography: !!songSettings?.enableKineticTypography,
      kineticTempo: songSettings?.kineticTempo ?? defaultSongSettingsState.kineticTempo ?? 'fast',
      animation: songSettings?.animation ?? defaultSongSettingsState.animation ?? 'none',
      animationTemplate: songSettings?.animationTemplate ?? defaultSongSettingsState.animationTemplate ?? 'guessing-kinetic',
    };
    const nextLive = buildLiveState('song', { title, text }, globalSettings, bibleSettings, effectiveSongSettings);
    setLiveState(nextLive);
    updateLiveState(nextLive);
  };

  const projectLive = (newState: Partial<LiveState>) => {
    setLiveState((prev) => {
      const updated = { ...prev, ...newState };
      updateLiveState(updated);
      return updated;
    });
  };

  const clearLive = () => {
    setLiveState((prev) => {
      const updated: LiveState = {
        ...prev,
        type: 'clear',
        title: '',
        text: '',
        enableKineticTypography: false,
      };
      updateLiveState(updated);
      return updated;
    });
  };

  const saveGlobalSettings = async (customSettings?: SuperSettingsPayload): Promise<boolean> => {
    const payload: SuperSettingsPayload = {
      bibleSettings: customSettings?.bibleSettings || bibleSettingsRef.current,
      defaultSongSettings: customSettings?.defaultSongSettings || defaultSongSettingsRef.current,
      globalSettings: customSettings?.globalSettings || globalSettingsRef.current,
      liveState: customSettings?.liveState || liveStateRef.current,
    };

    try {
      localStorage.setItem('webProjectorBibleSettings', JSON.stringify(payload.bibleSettings));
      localStorage.setItem('webProjectorDefaultSongSettings', JSON.stringify(payload.defaultSongSettings));
      localStorage.setItem('webProjectorGlobalSettings', JSON.stringify(payload.globalSettings));
      localStorage.setItem('webProjectorSettings', JSON.stringify(payload.liveState));
    } catch (e) {}

    const success = await settingsService.saveSuperSettings(payload);
    if (success) {
      import('react-hot-toast').then((m) => m.toast.success('Settings saved to super_settings.json!'));
    } else {
      import('react-hot-toast').then((m) => m.toast.error('Failed to update super_settings.json on server'));
    }
    return success;
  };

  return (
    <LiveContext.Provider
      value={{
        liveState,
        setLiveState,
        bibleSettings,
        updateBibleSettings,
        defaultSongSettings: defaultSongSettingsState,
        updateDefaultSongSettings,
        globalSettings,
        updateGlobalSettings,
        projectBible,
        projectSong,
        projectLive,
        clearLive,
        saveGlobalSettings,
      }}
    >
      {children}
    </LiveContext.Provider>
  );
}

export function useLive() {
  const context = useContext(LiveContext);
  if (context === undefined) {
    throw new Error('useLive must be used within a LiveProvider');
  }
  return context;
}
