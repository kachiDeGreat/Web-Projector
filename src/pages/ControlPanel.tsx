import { useState, useEffect, useRef, useMemo } from "react";
import toast from "react-hot-toast";
import {
  Settings,
  MonitorPlay,
  BookOpen,
  Wand2,
  Type,
  Search,
  Upload,
  Database,
  FileText,
  Play,
  X,
  Loader,
  ChevronLeft,
  ChevronRight,
  Plus,
  Sparkles,
  RotateCcw,
  Check,
  Trash2,
  Eye,
  History,
} from "lucide-react";
import "../styles/panel.css";
import { bibleService, BibleVersion, Verse } from "../services/bibleService";
import { useLive, SongSettings } from "../store/LiveContext";
import { AnimatedLyric } from "../components/AnimatedLyric";
import OutputView from "./OutputView";
import {
  getSongs,
  addSong,
  deleteSong,
  updateSong,
  deleteAllSongs,
} from "../services/dbService";

export interface BibleHistoryItem {
  id: string;
  reference: string;
  text: string;
  bookNumber: number;
  chapterNumber: number;
  verseNumber: number;
  bibleId: string;
  bibleName: string;
  timestamp: number;
}

const BOOK_ALIASES: Record<string, string> = {
  gen: "Genesis",
  ge: "Genesis",
  ex: "Exodus",
  exo: "Exodus",
  lev: "Leviticus",
  le: "Leviticus",
  num: "Numbers",
  nu: "Numbers",
  deut: "Deuteronomy",
  dt: "Deuteronomy",
  josh: "Joshua",
  jos: "Joshua",
  judg: "Judges",
  jdg: "Judges",
  ruth: "Ruth",
  ru: "Ruth",
  "1sam": "1 Samuel",
  "2sam": "2 Samuel",
  "1ki": "1 Kings",
  "2ki": "2 Kings",
  "1kin": "1 Kings",
  "2kin": "2 Kings",
  "1chr": "1 Chronicles",
  "2chr": "2 Chronicles",
  ezr: "Ezra",
  neh: "Nehemiah",
  ne: "Nehemiah",
  est: "Esther",
  es: "Esther",
  job: "Job",
  jb: "Job",
  ps: "Psalms",
  psa: "Psalms",
  psalm: "Psalms",
  prov: "Proverbs",
  pro: "Proverbs",
  pr: "Proverbs",
  prv: "Proverbs",
  eccl: "Ecclesiastes",
  ecc: "Ecclesiastes",
  ec: "Ecclesiastes",
  song: "Song of Solomon",
  sos: "Song of Solomon",
  songs: "Song of Solomon",
  isa: "Isaiah",
  is: "Isaiah",
  jer: "Jeremiah",
  je: "Jeremiah",
  lam: "Lamentations",
  la: "Lamentations",
  ezek: "Ezekiel",
  eze: "Ezekiel",
  dan: "Daniel",
  da: "Daniel",
  hos: "Hosea",
  ho: "Hosea",
  joel: "Joel",
  joe: "Joel",
  amos: "Amos",
  am: "Amos",
  obad: "Obadiah",
  ob: "Obadiah",
  jon: "Jonah",
  jnh: "Jonah",
  mic: "Micah",
  mc: "Micah",
  nah: "Nahum",
  na: "Nahum",
  hab: "Habakkuk",
  zeph: "Zephaniah",
  zep: "Zephaniah",
  hag: "Haggai",
  zech: "Zechariah",
  zec: "Zechariah",
  mal: "Malachi",
  ml: "Malachi",
  mat: "Matthew",
  matt: "Matthew",
  mt: "Matthew",
  mk: "Mark",
  mrk: "Mark",
  lk: "Luke",
  luk: "Luke",
  lu: "Luke",
  jn: "John",
  jhn: "John",
  joh: "John",
  act: "Acts",
  ac: "Acts",
  rom: "Romans",
  ro: "Romans",
  rm: "Romans",
  "1cor": "1 Corinthians",
  "2cor": "2 Corinthians",
  gal: "Galatians",
  ga: "Galatians",
  eph: "Ephesians",
  phil: "Philippians",
  php: "Philippians",
  col: "Colossians",
  "1thess": "1 Thessalonians",
  "2thess": "2 Thessalonians",
  "1th": "1 Thessalonians",
  "2th": "2 Thessalonians",
  "1tim": "1 Timothy",
  "2tim": "2 Timothy",
  tit: "Titus",
  ti: "Titus",
  philem: "Philemon",
  phm: "Philemon",
  heb: "Hebrews",
  jas: "James",
  jam: "James",
  jm: "James",
  "1pet": "1 Peter",
  "2pet": "2 Peter",
  "1pe": "1 Peter",
  "2pe": "2 Peter",
  "1pt": "1 Peter",
  "2pt": "2 Peter",
  "1jn": "1 John",
  "2jn": "2 John",
  "3jn": "3 John",
  jud: "Jude",
  jd: "Jude",
  rev: "Revelation",
  re: "Revelation",
};

export default function ControlPanel() {
  const [savedSongs, setSavedSongs] = useState<any[]>([]);

  const [activeTab, setActiveTab] = useState<"bible" | "songs" | "animation">(
    "bible",
  );
  const [lyrics, setLyrics] = useState("");
  const [activeSongId, setActiveSongId] = useState("");
  const [activeSongTitle, setActiveSongTitle] = useState("");
  const [activeSongArtist, setActiveSongArtist] = useState("");

  const {
    liveState,
    projectLive,
    clearLive,
    saveGlobalSettings,
    bibleSettings,
    updateBibleSettings,
    defaultSongSettings,
    updateDefaultSongSettings,
    globalSettings,
    updateGlobalSettings,
    projectBible,
    projectSong,
  } = useLive();

  const [activeSongSettings, setActiveSongSettings] =
    useState<SongSettings>(defaultSongSettings);
  const [previewAnimationKey, setPreviewAnimationKey] = useState(0);

  const [sidebarWidth, setSidebarWidth] = useState(380);
  const [programWidth, setProgramWidth] = useState(550);
  const isResizingSidebar = useRef(false);
  const isResizingProgram = useRef(false);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isThemesModalOpen, setIsThemesModalOpen] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  // Bible State
  const [bibles, setBibles] = useState<BibleVersion[]>([]);

  const [bibleLoadingProgress, setBibleLoadingProgress] = useState<{
    current: number;
    total: number;
  } | null>(null);
  const [selectedBibleId, setSelectedBibleId] = useState<string>("");
  const [selectedBookNum, setSelectedBookNum] = useState<number | "">("");
  const [selectedChapterNum, setSelectedChapterNum] = useState<number | "">("");
  const [fastSearchQuery, setFastSearchQuery] = useState("");
  const [bibleHistory, setBibleHistory] = useState<BibleHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem("webProjectorBibleHistory");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed.slice(0, 8);
      }
    } catch (e) {
      console.error("Error loading bible history:", e);
    }
    return [];
  });

  const addToBibleHistory = (newItem: BibleHistoryItem) => {
    setBibleHistory((prev) => {
      const filtered = prev.filter(
        (item) =>
          item.reference.toLowerCase() !== newItem.reference.toLowerCase(),
      );
      const updated = [newItem, ...filtered].slice(0, 8);
      try {
        localStorage.setItem(
          "webProjectorBibleHistory",
          JSON.stringify(updated),
        );
      } catch (e) {
        console.error("Failed to save bible history to localStorage", e);
      }
      return updated;
    });
  };

  const handleSelectHistoryItem = (item: BibleHistoryItem) => {
    if (item.bibleId && item.bibleId !== selectedBibleId) {
      setSelectedBibleId(item.bibleId);
    }
    setSelectedBookNum(item.bookNumber);
    setSelectedChapterNum(item.chapterNumber);
    setActiveProjectedRef({
      book: item.bookNumber,
      chap: item.chapterNumber,
      verse: item.verseNumber,
    });
    setActiveSongChunkIndex(null);
    projectBible(item.reference, item.text);

    // Bump to top of history
    setBibleHistory((prev) => {
      const filtered = prev.filter(
        (h) =>
          h.id !== item.id &&
          h.reference.toLowerCase() !== item.reference.toLowerCase(),
      );
      const updated = [
        { ...item, timestamp: Date.now() },
        ...filtered,
      ].slice(0, 8);
      try {
        localStorage.setItem(
          "webProjectorBibleHistory",
          JSON.stringify(updated),
        );
      } catch (e) {}
      return updated;
    });
  };

  const handleRemoveHistoryItem = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setBibleHistory((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      try {
        localStorage.setItem(
          "webProjectorBibleHistory",
          JSON.stringify(updated),
        );
      } catch (e) {}
      return updated;
    });
  };

  const [activeProjectedRef, setActiveProjectedRef] = useState<{
    book: number;
    chap: number;
    verse: number;
  } | null>(null);

  const [songSearchArtist, setSongSearchArtist] = useState("");
  const [songSearchTitle, setSongSearchTitle] = useState("");
  const [isSearchingSong, setIsSearchingSong] = useState(false);
  const [songSearchResults, setSongSearchResults] = useState<
    Array<{
      id: number | string;
      title: string;
      artist: string;
      album?: string;
      lyrics: string;
      duration?: number;
    }>
  >([]);
  const [hoveredSearchResult, setHoveredSearchResult] = useState<{
    id: number | string;
    title: string;
    artist: string;
    album?: string;
    lyrics: string;
    duration?: number;
  } | null>(null);
  const [showSearchResultsModal, setShowSearchResultsModal] = useState(false);
  const [tooltipTop, setTooltipTop] = useState(120);
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [songToDelete, setSongToDelete] = useState<{
    id: string;
    title: string;
  } | null>(null);

  const [songViewMode, setSongViewMode] = useState<"edit" | "play">("edit");
  const [activeSongChunkIndex, setActiveSongChunkIndex] = useState<
    number | null
  >(null);

  const updateActiveSongSettings = (updates: Partial<SongSettings>) => {
    setActiveSongSettings((prev) => {
      const updated = { ...prev, ...updates };

      if (activeSongId) {
        updateSong(
          activeSongId,
          activeSongTitle,
          activeSongArtist,
          lyrics,
          updated,
        );
        setTimeout(() => {
          setSavedSongs((list) =>
            list.map((s) =>
              s.id === activeSongId ? { ...s, settings: updated } : s,
            ),
          );
        }, 0);
      } else {
        setTimeout(() => {
          updateDefaultSongSettings(updates);
        }, 0);
      }

      if (liveState.type === "song") {
        setTimeout(() => {
          projectLive(updated);
        }, 0);
      }

      return updated;
    });
  };

  const [obsUrl, setObsUrl] = useState<string>(
    `${window.location.protocol}//${window.location.host}/output`,
  );

  useEffect(() => {
    fetch("/api/local-ip")
      .then((res) => res.json())
      .then((data) => {
        if (data.ip) {
          const port = window.location.port || "5173";
          setObsUrl(`http://${data.ip}:${port}/output`);
        }
      })
      .catch((err) =>
        console.error("Could not fetch local IP for OBS URL", err),
      );
  }, []);

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Upload failed");
      }

      const data = await res.json();
      if (data.url) {
        updateGlobalSettings({ backgroundUrl: data.url });
      }
    } catch (err) {
      console.error("Failed to save media", err);
      toast.error(
        "Failed to save media to local server. Make sure you restarted the dev server.",
      );
    }
  };

  const handleCopyOBSUrl = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(obsUrl);
      } else {
        // Fallback for non-HTTPS local IPs
        const textArea = document.createElement("textarea");
        textArea.value = obsUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      import("react-hot-toast").then((module) =>
        module.toast.success("OBS URL copied to clipboard!"),
      );
    } catch (err) {
      console.error(err);
      import("react-hot-toast").then((module) =>
        module.toast.error("Failed to copy URL"),
      );
    }
  };

  const loadSongs = async () => {
    try {
      const songs = await getSongs();
      setSavedSongs(songs);
    } catch (err) {
      console.error("Failed to load songs from DB", err);
    }
  };

  const handleDeleteAllSongs = () => {
    if (savedSongs.length === 0) return;
    setShowDeleteAllConfirm(true);
  };

  const executeDeleteAllSongs = async () => {
    if (savedSongs.length === 0) {
      setShowDeleteAllConfirm(false);
      return;
    }
    setIsDeletingAll(true);
    try {
      await deleteAllSongs();
      setSavedSongs([]);
      setActiveSongId("");
      setActiveSongTitle("");
      setActiveSongArtist("");
      setLyrics("");
      setActiveSongChunkIndex(null);
      if (liveState.type === "song") {
        clearLive();
      }
      setShowDeleteAllConfirm(false);
      toast.success("All saved songs have been deleted.");
    } catch (err) {
      console.error("Failed to delete all songs from DB", err);
      toast.error("Failed to delete songs from database.");
    } finally {
      setIsDeletingAll(false);
    }
  };

  const executeDeleteSingleSong = async () => {
    if (!songToDelete) return;
    try {
      await deleteSong(songToDelete.id);
      await loadSongs();
      if (activeSongId === songToDelete.id) {
        setActiveSongId("");
        setActiveSongTitle("");
        setActiveSongArtist("");
        setLyrics("");
        setActiveSongChunkIndex(null);
        if (liveState.type === "song") {
          clearLive();
        }
      }
      toast.success(`Deleted "${songToDelete.title}"`);
    } catch (err) {
      console.error("Failed to delete song", err);
      toast.error("Failed to delete song.");
    } finally {
      setSongToDelete(null);
    }
  };

  const launchProjector = async () => {
    try {
      // Check if Window Management API is supported
      if ("getScreenDetails" in window) {
        const screenDetails = await (window as any).getScreenDetails();

        // Find an extended screen, fallback to the current screen if none exists
        const externalScreen =
          screenDetails.screens.find(
            (s: any) => s.isExtended && s !== screenDetails.currentScreen,
          ) || screenDetails.screens[0];

        const win = window.open(
          "/output?autoFullscreen=true",
          "WebProjectorOutput",
          `left=${externalScreen.left},top=${externalScreen.top},width=${externalScreen.width},height=${externalScreen.height},popup=yes,menubar=no,toolbar=no,location=no,status=no`,
        );

        if (win) {
          import("react-hot-toast").then((module) =>
            module.toast.success("Projector launched on extended display!"),
          );
          return;
        }
      }
    } catch (err) {
      console.error("Window Management API failed:", err);
      // Fallback
    }

    // Fallback if API not supported or popup blocked
    window.open("/output?autoFullscreen=true", "_blank");
    import("react-hot-toast").then((module) =>
      module.toast.success("Projector opened in new tab."),
    );
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.altKey && e.key.toLowerCase() === "p") {
        e.preventDefault();
        launchProjector();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    const initData = async () => {
      await loadBibles();
      await loadSongs();
    };
    initData();
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizingSidebar.current) {
        setSidebarWidth(
          Math.max(200, Math.min(e.clientX, window.innerWidth / 2)),
        );
      }
      if (isResizingProgram.current) {
        setProgramWidth(
          Math.max(
            300,
            Math.min(window.innerWidth - e.clientX, window.innerWidth / 1.5),
          ),
        );
      }
    };
    const handleMouseUp = () => {
      isResizingSidebar.current = false;
      isResizingProgram.current = false;
      document.body.style.cursor = "default";
      document.body.style.userSelect = "auto";
    };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  const handleExportSongs = async () => {
    try {
      const songs = await getSongs();
      const exportData = {
        songs,
      };
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `web-projector-songs-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      import("react-hot-toast").then((module) =>
        module.toast.success("Songs exported successfully!"),
      );
    } catch (e) {
      import("react-hot-toast").then((module) =>
        module.toast.error("Failed to export songs"),
      );
    }
  };

  const handleExportSettings = async () => {
    try {
      const exportData = {
        liveState,
        bibleSettings,
        defaultSongSettings,
        globalSettings,
      };
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `web-projector-settings-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      import("react-hot-toast").then((module) =>
        module.toast.success("Settings exported successfully!"),
      );
    } catch (e) {
      import("react-hot-toast").then((module) =>
        module.toast.error("Failed to export settings"),
      );
    }
  };

  const handleUnifiedImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);

        let importedSongsCount = 0;
        let importedSettings = false;

        // If it's a global export containing liveState or specific settings
        if (data.liveState) {
          projectLive(data.liveState);
          importedSettings = true;
        }
        if (data.bibleSettings) {
          updateBibleSettings(data.bibleSettings);
          importedSettings = true;
        }
        if (data.defaultSongSettings) {
          updateDefaultSongSettings(data.defaultSongSettings);
          importedSettings = true;
        }
        if (data.globalSettings) {
          updateGlobalSettings(data.globalSettings);
          importedSettings = true;
        }

        // If it's an export containing a songs array
        if (data.songs && Array.isArray(data.songs)) {
          for (const s of data.songs) {
            await addSong(
              s.title,
              s.artist || "Unknown",
              s.lyrics,
              s.settings,
              s.id,
            );
            importedSongsCount++;
          }
        } else if (Array.isArray(data)) {
          // Fallback for older export formats where the root is an array
          for (const s of data) {
            if (s.title && s.lyrics) {
              await addSong(
                s.title,
                s.artist || "Unknown",
                s.lyrics,
                s.settings,
                s.id,
              );
              importedSongsCount++;
            }
          }
        }

        if (importedSongsCount > 0) {
          loadSongs();
        }

        if (importedSongsCount > 0 && importedSettings) {
          import("react-hot-toast").then((module) =>
            module.toast.success("Settings and songs imported successfully!"),
          );
        } else if (importedSongsCount > 0) {
          import("react-hot-toast").then((module) =>
            module.toast.success(
              `${importedSongsCount} songs imported successfully!`,
            ),
          );
        } else if (importedSettings) {
          import("react-hot-toast").then((module) =>
            module.toast.success("Settings imported successfully!"),
          );
        } else {
          import("react-hot-toast").then((module) =>
            module.toast.error("No valid data found in file"),
          );
        }
      } catch (err) {
        import("react-hot-toast").then((module) =>
          module.toast.error("Invalid JSON file"),
        );
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const loadBibles = async () => {
    try {
      let loadedBibles = await bibleService.getAllBibles();
      setBibles(loadedBibles);

      const serverBibles = await bibleService.getAvailableServerBibles();

      const toLoad = serverBibles.filter(
        (filename) =>
          !loadedBibles.some(
            (b) => b.id === "bible_" + filename.replace(".xml", ""),
          ),
      );

      if (toLoad.length > 0) {
        setBibleLoadingProgress({ current: 0, total: toLoad.length });
        for (let i = 0; i < toLoad.length; i++) {
          const filename = toLoad[i];
          try {
            const parsed = await bibleService.loadBibleFromServer(filename);
            if (parsed) {
              loadedBibles = [...loadedBibles, parsed];
              setBibles(loadedBibles);
            }
          } catch (e) {
            console.error(`Failed to load ${filename}`, e);
          }
          setBibleLoadingProgress({ current: i + 1, total: toLoad.length });
        }
        setBibleLoadingProgress(null);
      }

      if (loadedBibles.length > 0 && !selectedBibleId) {
        setSelectedBibleId(loadedBibles[0].id);
      }
    } catch (e) {
      console.error("Failed to load bibles", e);
    }
  };

  const handleBibleUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      try {
        const id = "bible_" + Date.now();
        const name = file.name.replace(".xml", "");
        await bibleService.parseZefaniaXML(text, id, name);
        toast.success(`Successfully imported ${name}!`);
        loadBibles();
      } catch (err) {
        toast.error("Failed to parse Zefania XML. Make sure it is valid.");
        console.error(err);
      }
    };
    reader.readAsText(file);
  };

  const handleLyricsFileUpload = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      setLyrics(text);
      setActiveTab("songs");
      setSongViewMode("edit");

      const songName = file.name.replace(".txt", "");
      try {
        await addSong(songName, "Unknown", text, {
          layout: "LT",
          linesMode: 1,
          fontSize: 5.5,
        });
        loadSongs();
        toast.success(`Imported and saved ${songName}`);
      } catch (err) {
        console.error("Failed to save imported song to local DB", err);
      }
    };
    reader.readAsText(file);
  };

  const cleanLyricsText = (
    plainLyrics?: string | null,
    syncedLyrics?: string | null,
  ): string => {
    if (plainLyrics && plainLyrics.trim()) {
      return plainLyrics.trim();
    }
    if (syncedLyrics && syncedLyrics.trim()) {
      return syncedLyrics
        .split("\n")
        .map((line) =>
          line.replace(/\[\d{2}:\d{2}(?:\.\d{1,3})?\]/g, "").trim(),
        )
        .filter((line) => line.length > 0)
        .join("\n");
    }
    return "";
  };

  const handleOnlineSongSearch = async () => {
    const title = songSearchTitle.trim();
    const artist = songSearchArtist.trim();
    if (!title) {
      toast.error("Please enter a song title to search.");
      return;
    }
    setIsSearchingSong(true);
    setHoveredSearchResult(null);

    try {
      let url = `https://lrclib.net/api/search?track_name=${encodeURIComponent(title)}`;
      if (artist) {
        url += `&artist_name=${encodeURIComponent(artist)}`;
      }

      let res = await fetch(url);
      let data = await res.json();

      const hasLyrics =
        Array.isArray(data) &&
        data.some(
          (d: any) =>
            !d.instrumental && (d.plainLyrics || d.syncedLyrics),
        );

      if (!hasLyrics) {
        const queryTerm = `${title} ${artist}`.trim();
        const fallbackRes = await fetch(
          `https://lrclib.net/api/search?q=${encodeURIComponent(queryTerm)}`,
        );
        data = await fallbackRes.json();
      }

      if (Array.isArray(data)) {
        const parsed = data
          .filter(
            (item: any) =>
              !item.instrumental &&
              (item.plainLyrics || item.syncedLyrics),
          )
          .map((item: any) => ({
            id: item.id,
            title: item.trackName || item.name || title,
            artist: item.artistName || (artist || "Unknown"),
            album: item.albumName || "",
            lyrics: cleanLyricsText(item.plainLyrics, item.syncedLyrics),
            duration: item.duration,
          }))
          .filter((item) => item.lyrics.length > 0);

        const unique: typeof parsed = [];
        const seen = new Set<string>();
        for (const item of parsed) {
          const key = `${item.title.toLowerCase().trim()}___${item.artist.toLowerCase().trim()}`;
          if (!seen.has(key)) {
            seen.add(key);
            unique.push(item);
          }
          if (unique.length >= 6) break;
        }

        if (unique.length > 0) {
          setSongSearchResults(unique);
          setShowSearchResultsModal(true);
          setHoveredSearchResult(unique[0]);
          toast.success(
            `Found ${unique.length} lyrics match${unique.length > 1 ? "es" : ""}. Hover to preview!`,
          );
        } else {
          toast.error(
            "No lyrics found. Try checking the song title or artist name.",
          );
        }
      } else {
        toast.error("Lyrics service returned unexpected response format.");
      }
    } catch (err) {
      console.error("Error fetching lyrics from LRCLIB", err);
      toast.error(
        "Could not fetch lyrics. Please check your internet connection.",
      );
    } finally {
      setIsSearchingSong(false);
    }
  };

  const handleSelectSearchResult = async (selected: {
    id: number | string;
    title: string;
    artist: string;
    album?: string;
    lyrics: string;
  }) => {
    try {
      const newId = await addSong(
        selected.title,
        selected.artist,
        selected.lyrics,
        { layout: "LT", linesMode: 1, fontSize: 5.5 },
      );
      await loadSongs();
      setActiveSongId(newId);
      setActiveSongTitle(selected.title);
      setActiveSongArtist(selected.artist);
      setLyrics(selected.lyrics);
      setActiveSongChunkIndex(null);
      setSongViewMode("play");
      setShowSearchResultsModal(false);
      setHoveredSearchResult(null);
      toast.success(`Imported and selected "${selected.title}"`);
    } catch (err) {
      console.error("Failed to save selected song to DB", err);
      toast.error("Failed to save song to database.");
    }
  };

  const songChunks = useMemo(() => {
    if (!lyrics) return [];
    const lines = lyrics
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    const chunks: string[] = [];
    const mode = activeSongSettings.linesMode || 1;
    let i = 0;
    while (i < lines.length) {
      if (lines[i].includes("_1")) {
        chunks.push(lines[i]);
        i += 1;
      } else {
        const group: string[] = [];
        for (let j = 0; j < mode && i + j < lines.length; j++) {
          if (lines[i + j].includes("_1")) break; // Do not group _1 lines with normal text
          group.push(lines[i + j]);
        }
        if (group.length > 0) {
          chunks.push(group.join("\n"));
          i += group.length;
        } else {
          chunks.push(lines[i]);
          i += 1;
        }
      }
    }
    return chunks;
  }, [lyrics, activeSongSettings.linesMode]);

  const handleProjectSongChunk = (chunkText: string, index: number) => {
    setActiveSongChunkIndex(index);
    setActiveProjectedRef(null);
    projectSong(activeSongTitle || "Lyrics", chunkText, activeSongSettings);
  };

  const activeBible = bibles.find((b) => b.id === selectedBibleId);
  const activeBook = activeBible?.books.find(
    (b) => b.number === Number(selectedBookNum),
  );
  const activeChapter = activeBook?.chapters.find(
    (c) => c.number === Number(selectedChapterNum),
  );

  const handleFastSearch = (query: string, shouldProject: boolean = false) => {
    setFastSearchQuery(query);
    if (!activeBible && bibles.length === 0) return;
    if (query.trim().length < 2) return;

    let cleanQuery = query.trim();
    let requestedVersion: string | null = null;

    // Check for version in parentheses: e.g. "mat 3:3 (niv)" or "mat 3:3(kjv)"
    const parenMatch = cleanQuery.match(/\(([^)]+)\)/);
    if (parenMatch) {
      requestedVersion = parenMatch[1].trim();
      cleanQuery = cleanQuery.replace(/\([^)]+\)/g, " ").trim();
    }

    const rawParts = cleanQuery.split(/[\s:]+/).filter(Boolean);
    if (rawParts.length >= 2) {
      let bookQuery = rawParts[0];
      let chapterStr = rawParts[1];
      let verseStr = rawParts[2];

      if (!isNaN(Number(rawParts[0])) && rawParts.length >= 3) {
        bookQuery = `${rawParts[0]} ${rawParts[1]}`;
        chapterStr = rawParts[2];
        verseStr = rawParts[3];
        if (!requestedVersion && rawParts.length >= 5) {
          requestedVersion = rawParts.slice(4).join(" ");
        }
      } else {
        if (!requestedVersion && rawParts.length >= 4) {
          requestedVersion = rawParts.slice(3).join(" ");
        }
      }

      // Resolve targeted Bible version
      let targetBible = activeBible || bibles[0];
      if (requestedVersion && bibles.length > 0) {
        const reqVerLower = requestedVersion.toLowerCase();
        const matchedVer = bibles.find(
          (b) =>
            b.id.toLowerCase() === reqVerLower ||
            b.name.toLowerCase() === reqVerLower ||
            b.name.toLowerCase().includes(reqVerLower) ||
            b.id.toLowerCase().includes(reqVerLower),
        );
        if (matchedVer) {
          targetBible = matchedVer;
          if (selectedBibleId !== matchedVer.id) {
            setSelectedBibleId(matchedVer.id);
          }
        }
      }

      if (!targetBible) return;

      const cleanBookQuery = bookQuery.toLowerCase().replace(/\s+/g, "");
      const aliasedName =
        BOOK_ALIASES[cleanBookQuery] || BOOK_ALIASES[bookQuery.toLowerCase()];

      const matchedBook = targetBible.books.find((b) => {
        const bLower = b.name.toLowerCase();
        if (aliasedName && bLower === aliasedName.toLowerCase()) return true;
        if (bLower.startsWith(bookQuery.toLowerCase())) return true;
        if (bLower.includes(bookQuery.toLowerCase())) return true;
        if (bLower.replace(/\s+/g, "").startsWith(cleanBookQuery)) return true;
        return false;
      });

      if (matchedBook) {
        if (selectedBookNum !== matchedBook.number) {
          setSelectedBookNum(matchedBook.number);
        }

        const chapNum = parseInt(chapterStr);
        if (!isNaN(chapNum)) {
          if (selectedChapterNum !== chapNum) {
            setSelectedChapterNum(chapNum);
          }

          if (verseStr) {
            const verseNum = parseInt(verseStr);
            if (!isNaN(verseNum)) {
              const matchedChapter = matchedBook.chapters.find(
                (c) => c.number === chapNum,
              );
              const matchedVerse = matchedChapter?.verses.find(
                (v) => v.number === verseNum,
              );
              if (matchedVerse) {
                setActiveProjectedRef({
                  book: matchedBook.number,
                  chap: chapNum,
                  verse: verseNum,
                });

                if (shouldProject) {
                  setActiveSongChunkIndex(null);
                  const refString = `${matchedBook.name} ${chapNum}:${verseNum} (${targetBible.name})`;
                  projectBible(refString, matchedVerse.text);

                  // Add to history (only when hit enter & sent to program)
                  addToBibleHistory({
                    id: `${matchedBook.number}_${chapNum}_${verseNum}_${targetBible.id}_${Date.now()}`,
                    reference: refString,
                    text: matchedVerse.text,
                    bookNumber: matchedBook.number,
                    chapterNumber: chapNum,
                    verseNumber: verseNum,
                    bibleId: targetBible.id,
                    bibleName: targetBible.name,
                    timestamp: Date.now(),
                  });
                }
              }
            }
          }
        }
      }
    }
  };

  const handleProjectVerse = (verse: Verse) => {
    setActiveProjectedRef({
      book: Number(selectedBookNum),
      chap: Number(selectedChapterNum),
      verse: verse.number,
    });
    setActiveSongChunkIndex(null);
    projectBible(
      `${activeBook?.name} ${activeChapter?.number}:${verse.number} (${activeBible?.name})`,
      verse.text,
    );
  };

  const handleClear = () => {
    setActiveProjectedRef(null);
    setActiveSongChunkIndex(null);
    clearLive();
  };

  const handleVersionChange = async (newBibleId: string) => {
    setSelectedBibleId(newBibleId);
    if (liveState.type === "bible" && activeProjectedRef) {
      const newBible = bibles.find((b) => b.id === newBibleId);
      if (newBible) {
        const newBook = newBible.books.find(
          (b) => b.number === activeProjectedRef.book,
        );
        const newChap = newBook?.chapters.find(
          (c) => c.number === activeProjectedRef.chap,
        );
        const newVerse = newChap?.verses.find(
          (v) => v.number === activeProjectedRef.verse,
        );

        if (newBook && newChap && newVerse) {
          projectBible(
            `${newBook.name} ${newChap.number}:${newVerse.number} (${newBible.name})`,
            newVerse.text,
          );
        }
      }
    }
  };

  const handleSelectSong = (
    s: any,
    projectOption: "none" | "first" | "last" = "none",
  ) => {
    setActiveSongId(s.id);
    setActiveSongTitle(s.title || "");
    setActiveSongArtist(s.artist || "");
    setLyrics(s.lyrics);
    const loadedSettings: SongSettings = {
      ...defaultSongSettings,
      ...(s.settings || {}),
    };
    setActiveSongSettings(loadedSettings);
    setSongViewMode("play");

    // Clean lines and chunk them
    const cleanLines = (s.lyrics || "")
      .split("\n")
      .map((l: string) => l.trim())
      .filter((l: string) => l.length > 0);
    const linesPerSlide = loadedSettings.linesMode || 2;
    const newChunks: string[] = [];
    for (let i = 0; i < cleanLines.length; i += linesPerSlide) {
      newChunks.push(cleanLines.slice(i, i + linesPerSlide).join("\n"));
    }

    if (projectOption === "first" && newChunks.length > 0) {
      setActiveSongChunkIndex(0);
      setActiveProjectedRef(null);
      projectSong(s.title || "Lyrics", newChunks[0], loadedSettings);
    } else if (projectOption === "last" && newChunks.length > 0) {
      const lastIdx = newChunks.length - 1;
      setActiveSongChunkIndex(lastIdx);
      setActiveProjectedRef(null);
      projectSong(s.title || "Lyrics", newChunks[lastIdx], loadedSettings);
    } else {
      setActiveSongChunkIndex(null);
    }
  };

  const goToNextSong = (autoProject: boolean = true) => {
    if (savedSongs.length === 0) return;
    const currentIdx = savedSongs.findIndex((s) => s.id === activeSongId);
    if (currentIdx !== -1 && currentIdx < savedSongs.length - 1) {
      handleSelectSong(
        savedSongs[currentIdx + 1],
        autoProject ? "first" : "none",
      );
    } else if (currentIdx === -1 && savedSongs.length > 0) {
      handleSelectSong(savedSongs[0], autoProject ? "first" : "none");
    }
  };

  const goToPrevSong = (autoProject: boolean = true) => {
    if (savedSongs.length === 0) return;
    const currentIdx = savedSongs.findIndex((s) => s.id === activeSongId);
    if (currentIdx > 0) {
      handleSelectSong(
        savedSongs[currentIdx - 1],
        autoProject ? "last" : "none",
      );
    } else if (currentIdx === -1 && savedSongs.length > 0) {
      handleSelectSong(savedSongs[0], autoProject ? "first" : "none");
    }
  };

  const goToNext = () => {
    if (activeTab === "bible") {
      if (activeChapter) {
        if (!activeProjectedRef) {
          if (activeChapter.verses.length > 0) {
            handleProjectVerse(activeChapter.verses[0]);
          }
        } else {
          const currentIndex = activeChapter.verses.findIndex(
            (v) => v.number === activeProjectedRef.verse,
          );
          if (
            currentIndex !== -1 &&
            currentIndex < activeChapter.verses.length - 1
          ) {
            handleProjectVerse(activeChapter.verses[currentIndex + 1]);
          } else if (
            currentIndex === activeChapter.verses.length - 1 &&
            activeBook
          ) {
            const nextChap = activeBook.chapters.find(
              (c) => c.number === activeChapter.number + 1,
            );
            if (nextChap && nextChap.verses.length > 0) {
              setSelectedChapterNum(nextChap.number);
              handleProjectVerse(nextChap.verses[0]);
            }
          }
        }
      }
    } else {
      // Song context (works in songs, animation, or active song)
      if (songChunks.length > 0) {
        if (activeSongChunkIndex === null) {
          handleProjectSongChunk(songChunks[0], 0);
        } else if (activeSongChunkIndex < songChunks.length - 1) {
          handleProjectSongChunk(
            songChunks[activeSongChunkIndex + 1],
            activeSongChunkIndex + 1,
          );
        } else {
          // Reached the end of this song's chunks -> advance to next song!
          goToNextSong(true);
        }
      } else if (savedSongs.length > 0) {
        goToNextSong(true);
      }
    }
  };

  const goToPrev = () => {
    if (activeTab === "bible") {
      if (activeChapter && activeProjectedRef) {
        const currentIndex = activeChapter.verses.findIndex(
          (v) => v.number === activeProjectedRef.verse,
        );
        if (currentIndex > 0) {
          handleProjectVerse(activeChapter.verses[currentIndex - 1]);
        } else if (currentIndex === 0 && activeBook) {
          const prevChap = activeBook.chapters.find(
            (c) => c.number === activeChapter.number - 1,
          );
          if (prevChap && prevChap.verses.length > 0) {
            setSelectedChapterNum(prevChap.number);
            handleProjectVerse(prevChap.verses[prevChap.verses.length - 1]);
          }
        }
      }
    } else {
      // Song context
      if (songChunks.length > 0) {
        if (activeSongChunkIndex === null) {
          handleProjectSongChunk(songChunks[0], 0);
        } else if (activeSongChunkIndex > 0) {
          handleProjectSongChunk(
            songChunks[activeSongChunkIndex - 1],
            activeSongChunkIndex - 1,
          );
        } else {
          // At chunk 0 of this song -> go to previous song!
          goToPrevSong(true);
        }
      } else if (savedSongs.length > 0) {
        goToPrevSong(true);
      }
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClear();
        return;
      }

      // Do not trigger if user is typing in an input or textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      // Explicit song changing hotkeys: PageDown / PageUp, [ / ], or Ctrl+Arrow
      if (
        e.key === "PageDown" ||
        e.key === "]" ||
        ((e.ctrlKey || e.metaKey) &&
          (e.key === "ArrowRight" || e.key === "ArrowDown"))
      ) {
        e.preventDefault();
        goToNextSong(true);
        return;
      }

      if (
        e.key === "PageUp" ||
        e.key === "[" ||
        ((e.ctrlKey || e.metaKey) &&
          (e.key === "ArrowLeft" || e.key === "ArrowUp"))
      ) {
        e.preventDefault();
        goToPrevSong(true);
        return;
      }

      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        goToNext();
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        goToPrev();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    activeTab,
    activeChapter,
    activeBook,
    activeProjectedRef,
    songChunks,
    activeSongChunkIndex,
    activeSongId,
    savedSongs,
    handleClear,
    handleProjectVerse,
    handleProjectSongChunk,
  ]);

  useEffect(() => {
    if (activeTab === "bible" && activeProjectedRef) {
      const el = document.getElementById(`verse-${activeProjectedRef.verse}`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "nearest" });
    } else if (activeTab === "songs" && activeSongChunkIndex !== null) {
      const el = document.getElementById(`song-chunk-${activeSongChunkIndex}`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [activeProjectedRef, activeSongChunkIndex, activeTab]);

  const isBibleContext = activeTab === "bible";
  const activeLayout = isBibleContext
    ? bibleSettings.layout
    : activeSongSettings.layout;
  const activeVerticalAlign = isBibleContext
    ? bibleSettings.verticalAlign
    : activeSongSettings.verticalAlign;
  const activeHorizontalAlign = isBibleContext
    ? bibleSettings.horizontalAlign
    : activeSongSettings.horizontalAlign;
  const activeLinesMode = isBibleContext
    ? bibleSettings.linesMode
    : activeSongSettings.linesMode;
  const isCurrentKinetic =
    !isBibleContext && activeSongSettings.enableKineticTypography;

  const handleLayoutChange = (layout: "FS" | "LT") => {
    if (isBibleContext) {
      updateBibleSettings({ layout });
    } else {
      updateActiveSongSettings({ layout });
    }
  };

  const handleVerticalAlignChange = (
    verticalAlign: "top" | "middle" | "bottom",
  ) => {
    if (isBibleContext) {
      updateBibleSettings({ verticalAlign });
    } else {
      updateActiveSongSettings({ verticalAlign });
    }
  };

  const handleHorizontalAlignChange = (
    horizontalAlign: "left" | "center" | "right",
  ) => {
    if (isBibleContext) {
      updateBibleSettings({ horizontalAlign });
    } else {
      updateActiveSongSettings({ horizontalAlign });
    }
  };

  const handleLinesModeChange = (mode: 1 | 2 | 3 | 4) => {
    if (isBibleContext) {
      updateBibleSettings({ linesMode: mode });
    } else {
      updateActiveSongSettings({ linesMode: mode });
      setActiveSongChunkIndex(null);
    }
  };

  return (
    <div className="panel-layout">
      {/* Themes Modal */}
      {isThemesModalOpen && (
        <div
          className="modal-overlay"
          onClick={() => setIsThemesModalOpen(false)}
        >
          <div
            className="modal-content"
            style={{
              width: "600px",
              padding: "20px",
              background: "rgba(10, 15, 25, 0.98)",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: "12px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "20px",
                alignItems: "center",
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontSize: "1.2rem",
                  color: "var(--text-primary)",
                }}
              >
                Select Theme
              </h2>
              <button
                className="icon-btn"
                onClick={() => setIsThemesModalOpen(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "16px",
              }}
            >
              {[
                { id: "none", name: "Standard (No Theme)" },
                { id: "torn-edge", name: "Torn Edge" },
                { id: "theme-1", name: "Theme 1 (Left Pill)" },
                { id: "theme-2", name: "Theme 2 (Centered Pill)" },
                { id: "theme-3", name: "Theme 3 (Left Edge Pill)" },
                { id: "theme-4", name: "Theme 4 (Full Width)" },
                { id: "theme-5", name: "Theme 5 (Transparent)" },
              ].map((theme) => (
                <div
                  key={theme.id}
                  style={{
                    background:
                      bibleSettings.bibleLowerThirdStyle === theme.id
                        ? "rgba(59, 130, 246, 0.2)"
                        : "rgba(255,255,255,0.05)",
                    border: `1px solid ${bibleSettings.bibleLowerThirdStyle === theme.id ? "var(--primary)" : "rgba(255,255,255,0.1)"}`,
                    borderRadius: "8px",
                    padding: "16px",
                    cursor: "pointer",
                    textAlign: "center",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "12px",
                    transition: "all 0.2s",
                  }}
                  onClick={() => {
                    updateBibleSettings({
                      bibleLowerThirdStyle: theme.id as any,
                    });
                    setIsThemesModalOpen(false);
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.9rem",
                      color: "white",
                      fontWeight: "bold",
                    }}
                  >
                    {theme.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div
          className="modal-overlay"
          style={{ justifyContent: "flex-start", paddingLeft: "2rem" }}
          onClick={() => setIsSettingsOpen(false)}
        >
          <div
            className="modal-content"
            style={{
              maxHeight: "95vh",
              overflowY: "auto",
              background: "rgba(10, 15, 25, 0.98)",
              boxShadow: "0 20px 40px rgba(0,0,0,0.8)",
              border: "1px solid rgba(255,255,255,0.15)",
              width: "640px",
              padding: "0",
              borderRadius: "12px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="modal-title"
              style={{
                padding: "16px 24px",
                margin: 0,
                borderBottom: "1px solid var(--border-subtle)",
                background: "rgba(0,0,0,0.3)",
              }}
            >
              Typography & Style Settings
              <button
                className="icon-btn"
                onClick={() => setIsSettingsOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div
              style={{
                padding: "24px",
                display: "flex",
                flexDirection: "column",
                gap: "20px",
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "20px",
                }}
              >
                <div className="control-group">
                  <span className="control-label" style={{ fontWeight: 600 }}>
                    Font Family
                  </span>
                  <select
                    className="input"
                    value={globalSettings.fontFamily}
                    onChange={(e) =>
                      updateGlobalSettings({ fontFamily: e.target.value })
                    }
                  >
                    <option value="Inter">Inter (Sans Serif)</option>
                    <option value="Outfit">Outfit (Modern)</option>
                    <option value="'Times New Roman', serif">
                      Times New Roman (Serif)
                    </option>
                    <option value="Arial, sans-serif">Arial</option>
                  </select>
                </div>

                <div className="control-group">
                  <span className="control-label" style={{ fontWeight: 600 }}>
                    Transition Animation
                  </span>
                  <select
                    className="input"
                    value={bibleSettings.animation}
                    onChange={(e) => {
                      updateBibleSettings({ animation: e.target.value as any });
                      updateActiveSongSettings({
                        animation: e.target.value as any,
                      });
                    }}
                  >
                    <option value="none">None (Instant)</option>
                    <option value="fade">Fade In</option>
                    <option value="slide">Slide Up</option>
                    <option value="zoom">Zoom In</option>
                  </select>
                </div>
              </div>

              <div
                style={{
                  marginTop: "20px",
                  borderTop: "1px solid rgba(255,255,255,0.1)",
                  paddingTop: "20px",
                }}
              >
                <h4 style={{ color: "white", marginBottom: "16px" }}>
                  Typography Options
                </h4>

                {/* Song Typography */}
                <div
                  style={{
                    marginBottom: "16px",
                    padding: "12px",
                    background: "rgba(0,0,0,0.2)",
                    borderRadius: "8px",
                  }}
                >
                  <span
                    style={{
                      color: "white",
                      fontWeight: 600,
                      display: "block",
                      marginBottom: "12px",
                    }}
                  >
                    Song Lyrics
                  </span>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "20px",
                    }}
                  >
                    <div className="control-group">
                      <span className="control-label">Transform</span>
                      <select
                        className="input"
                        value={activeSongSettings.songTextTransform}
                        onChange={(e) =>
                          updateActiveSongSettings({
                            songTextTransform: e.target.value as any,
                          })
                        }
                      >
                        <option value="none">Normal</option>
                        <option value="uppercase">UPPERCASE</option>
                        <option value="lowercase">lowercase</option>
                        <option value="capitalize">Capitalize</option>
                      </select>
                    </div>
                    <div className="control-group">
                      <span className="control-label">Weight</span>
                      <select
                        className="input"
                        value={activeSongSettings.songFontWeight}
                        onChange={(e) =>
                          updateActiveSongSettings({
                            songFontWeight: e.target.value,
                          })
                        }
                      >
                        <option value="400">Normal</option>
                        <option value="500">Medium</option>
                        <option value="600">Semi-Bold</option>
                        <option value="700">Bold</option>
                        <option value="800">Extra-Bold</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Bible Verse Typography */}
                <div
                  style={{
                    marginBottom: "16px",
                    padding: "12px",
                    background: "rgba(0,0,0,0.2)",
                    borderRadius: "8px",
                  }}
                >
                  <span
                    style={{
                      color: "white",
                      fontWeight: 600,
                      display: "block",
                      marginBottom: "12px",
                    }}
                  >
                    Bible Verses
                  </span>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "20px",
                    }}
                  >
                    <div className="control-group">
                      <span className="control-label">Transform</span>
                      <select
                        className="input"
                        value={bibleSettings.bibleTextTransform}
                        onChange={(e) =>
                          updateBibleSettings({
                            bibleTextTransform: e.target.value as any,
                          })
                        }
                      >
                        <option value="none">Normal</option>
                        <option value="uppercase">UPPERCASE</option>
                        <option value="lowercase">lowercase</option>
                        <option value="capitalize">Capitalize</option>
                      </select>
                    </div>
                    <div className="control-group">
                      <span className="control-label">Weight</span>
                      <select
                        className="input"
                        value={bibleSettings.bibleFontWeight}
                        onChange={(e) =>
                          updateBibleSettings({
                            bibleFontWeight: e.target.value,
                          })
                        }
                      >
                        <option value="400">Normal</option>
                        <option value="500">Medium</option>
                        <option value="600">Semi-Bold</option>
                        <option value="700">Bold</option>
                        <option value="800">Extra-Bold</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Reference Typography */}
                <div
                  style={{
                    marginBottom: "20px",
                    padding: "12px",
                    background: "rgba(0,0,0,0.2)",
                    borderRadius: "8px",
                  }}
                >
                  <span
                    style={{
                      color: "white",
                      fontWeight: 600,
                      display: "block",
                      marginBottom: "12px",
                    }}
                  >
                    Bible References
                  </span>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "20px",
                    }}
                  >
                    <div className="control-group">
                      <span className="control-label">Transform</span>
                      <select
                        className="input"
                        value={bibleSettings.refTextTransform}
                        onChange={(e) =>
                          updateBibleSettings({
                            refTextTransform: e.target.value as any,
                          })
                        }
                      >
                        <option value="none">Normal</option>
                        <option value="uppercase">UPPERCASE</option>
                        <option value="lowercase">lowercase</option>
                        <option value="capitalize">Capitalize</option>
                      </select>
                    </div>
                    <div className="control-group">
                      <span className="control-label">Weight</span>
                      <select
                        className="input"
                        value={bibleSettings.refFontWeight}
                        onChange={(e) =>
                          updateBibleSettings({ refFontWeight: e.target.value })
                        }
                      >
                        <option value="400">Normal</option>
                        <option value="500">Medium</option>
                        <option value="600">Semi-Bold</option>
                        <option value="700">Bold</option>
                        <option value="800">Extra-Bold</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "20px",
                }}
              >
                <div className="control-group">
                  <span className="control-label" style={{ fontWeight: 600 }}>
                    Reference Font Color
                  </span>
                  <div
                    style={{
                      display: "flex",
                      gap: "8px",
                      alignItems: "center",
                    }}
                  >
                    <input
                      type="color"
                      value={bibleSettings.refColor}
                      onChange={(e) =>
                        updateBibleSettings({ refColor: e.target.value })
                      }
                      style={{
                        width: "40px",
                        height: "40px",
                        border: "1px solid var(--border-subtle)",
                        borderRadius: "6px",
                        cursor: "pointer",
                        background: "transparent",
                      }}
                    />
                    <span
                      style={{
                        fontSize: "0.85rem",
                        color: "var(--text-secondary)",
                      }}
                    >
                      {bibleSettings.refColor.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="control-group">
                  <span className="control-label" style={{ fontWeight: 600 }}>
                    Main Text Font Color
                  </span>
                  <div
                    style={{
                      display: "flex",
                      gap: "8px",
                      alignItems: "center",
                    }}
                  >
                    <input
                      type="color"
                      value={globalSettings.textColor}
                      onChange={(e) =>
                        updateGlobalSettings({ textColor: e.target.value })
                      }
                      style={{
                        width: "40px",
                        height: "40px",
                        border: "1px solid var(--border-subtle)",
                        borderRadius: "6px",
                        cursor: "pointer",
                        background: "transparent",
                      }}
                    />
                    <span
                      style={{
                        fontSize: "0.85rem",
                        color: "var(--text-secondary)",
                      }}
                    >
                      {globalSettings.textColor.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

              <div
                style={{
                  borderTop: "1px solid var(--border-subtle)",
                  margin: "10px 0",
                }}
              ></div>
              <div
                style={{
                  fontSize: "0.9rem",
                  color: "var(--primary)",
                  textTransform: "uppercase",
                  fontWeight: 700,
                  letterSpacing: "0.05em",
                }}
              >
                Sizes & Dimensions
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "20px",
                }}
              >
                <div className="control-group">
                  <span className="control-label">
                    Bible Reference Font Size (cqi)
                  </span>
                  <input
                    type="number"
                    className="input"
                    min="1"
                    max="10"
                    step="0.1"
                    value={bibleSettings.refFontSize}
                    onChange={(e) =>
                      updateBibleSettings({
                        refFontSize: Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="control-group">
                  <span className="control-label">
                    Side Padding (FS & LT) (%)
                  </span>
                  <input
                    type="number"
                    className="input"
                    min="0"
                    max="40"
                    step="1"
                    value={globalSettings.paddingLR}
                    onChange={(e) =>
                      updateGlobalSettings({
                        paddingLR: Number(e.target.value),
                      })
                    }
                  />
                </div>

                <div className="control-group" style={{ gridColumn: "1 / -1" }}>
                  <span className="control-label">Lower Third Width (%)</span>
                  <input
                    type="number"
                    className="input"
                    min="30"
                    max="100"
                    step="1"
                    value={bibleSettings.lowerThirdWidth}
                    onChange={(e) =>
                      updateBibleSettings({
                        lowerThirdWidth: Number(e.target.value),
                      })
                    }
                  />
                </div>

                <div className="control-group" style={{ gridColumn: "1 / -1" }}>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      color: "white",
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={bibleSettings.enableLowerThirdBg}
                      onChange={(e) =>
                        updateBibleSettings({
                          enableLowerThirdBg: e.target.checked,
                        })
                      }
                    />
                    Enable Lower Third Background
                  </label>
                </div>

                <div className="control-group">
                  <span className="control-label">Lower Third Bg Color</span>
                  <input
                    type="color"
                    className="input"
                    style={{ padding: "0", height: "40px" }}
                    value={bibleSettings.lowerThirdBgColor || "#000000"}
                    onChange={(e) =>
                      updateBibleSettings({ lowerThirdBgColor: e.target.value })
                    }
                  />
                </div>

                <div className="control-group">
                  <span className="control-label">
                    Lower Third Bg Opacity (%)
                  </span>
                  <input
                    type="range"
                    style={{ width: "100%" }}
                    min="0"
                    max="100"
                    step="1"
                    value={bibleSettings.lowerThirdBgOpacity ?? 50}
                    onChange={(e) =>
                      updateBibleSettings({
                        lowerThirdBgOpacity: Number(e.target.value),
                      })
                    }
                  />
                  <div
                    style={{
                      textAlign: "right",
                      fontSize: "0.8rem",
                      color: "var(--text-secondary)",
                    }}
                  >
                    {bibleSettings.lowerThirdBgOpacity ?? 50}%
                  </div>
                </div>

                <div className="control-group" style={{ gridColumn: "1 / -1" }}>
                  <span className="control-label">
                    Lower Third Top/Bottom Padding (vw)
                  </span>
                  <input
                    type="number"
                    className="input"
                    min="0"
                    max="20"
                    step="0.5"
                    value={bibleSettings.lowerThirdPadding ?? 3}
                    onChange={(e) =>
                      updateBibleSettings({
                        lowerThirdPadding: Number(e.target.value),
                      })
                    }
                  />
                </div>
              </div>

              <div
                style={{
                  borderTop: "1px solid var(--border-subtle)",
                  margin: "10px 0",
                }}
              ></div>
              <div
                style={{
                  fontSize: "0.9rem",
                  color: "var(--primary)",
                  textTransform: "uppercase",
                  fontWeight: 700,
                  letterSpacing: "0.05em",
                }}
              >
                Reference Position (Bible)
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "20px",
                }}
              >
                <div className="control-group">
                  <span className="control-label">Vertical Position</span>
                  <div
                    className="segmented-picker"
                    style={{ display: "flex", width: "100%" }}
                  >
                    <button
                      className={`seg-btn ${bibleSettings.refPosition === "top" ? "active" : ""}`}
                      onClick={() =>
                        updateBibleSettings({ refPosition: "top" })
                      }
                    >
                      Top (Above Verse)
                    </button>
                    <button
                      className={`seg-btn ${bibleSettings.refPosition === "bottom" ? "active" : ""}`}
                      onClick={() =>
                        updateBibleSettings({ refPosition: "bottom" })
                      }
                    >
                      Bottom (Below Verse)
                    </button>
                  </div>
                </div>

                <div className="control-group">
                  <span className="control-label">Horizontal Alignment</span>
                  <div
                    className="segmented-picker"
                    style={{ display: "flex", width: "100%" }}
                  >
                    <button
                      className={`seg-btn ${bibleSettings.refAlign === "left" ? "active" : ""}`}
                      onClick={() => updateBibleSettings({ refAlign: "left" })}
                    >
                      Left
                    </button>
                    <button
                      className={`seg-btn ${bibleSettings.refAlign === "center" ? "active" : ""}`}
                      onClick={() =>
                        updateBibleSettings({ refAlign: "center" })
                      }
                    >
                      Center
                    </button>
                    <button
                      className={`seg-btn ${bibleSettings.refAlign === "right" ? "active" : ""}`}
                      onClick={() => updateBibleSettings({ refAlign: "right" })}
                    >
                      Right
                    </button>
                  </div>
                </div>
              </div>

              <div
                style={{
                  borderTop: "1px solid var(--border-subtle)",
                  marginTop: "20px",
                  paddingTop: "20px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "8px",
                  }}
                >
                  <h4
                    style={{
                      color: "#ef4444",
                      margin: 0,
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      fontSize: "0.95rem",
                    }}
                  >
                    <Trash2 size={16} /> Song Library Data
                  </h4>
                  <span
                    style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}
                  >
                    {savedSongs.length}{" "}
                    {savedSongs.length === 1 ? "song" : "songs"} saved
                  </span>
                </div>
                <p
                  style={{
                    fontSize: "0.8rem",
                    color: "var(--text-muted)",
                    margin: "0 0 12px 0",
                    lineHeight: 1.4,
                  }}
                >
                  Delete all current songs from your local database at once.
                </p>
                <button
                  className="btn"
                  style={{
                    background: "rgba(239, 68, 68, 0.15)",
                    border: "1px solid rgba(239, 68, 68, 0.4)",
                    color: "#fca5a5",
                    fontWeight: 600,
                    padding: "8px 16px",
                    borderRadius: "6px",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    cursor: savedSongs.length === 0 ? "not-allowed" : "pointer",
                    opacity: savedSongs.length === 0 ? 0.5 : 1,
                  }}
                  disabled={savedSongs.length === 0}
                  onClick={() => {
                    setIsSettingsOpen(false);
                    setShowDeleteAllConfirm(true);
                  }}
                >
                  <Trash2 size={14} /> Delete All Saved Songs ({savedSongs.length})
                </button>
              </div>

              <div
                style={{
                  borderTop: "1px solid var(--border-subtle)",
                  marginTop: "20px",
                  paddingTop: "20px",
                }}
              >
                <h4 style={{ color: "white", marginBottom: "16px" }}>
                  Backup & Restore
                </h4>

                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    className="btn btn-primary"
                    onClick={() => setShowExportModal(true)}
                  >
                    Export...
                  </button>
                  <label
                    className="btn btn-secondary"
                    style={{
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    Import
                    <input
                      type="file"
                      accept=".json"
                      hidden
                      onChange={handleUnifiedImport}
                    />
                  </label>
                </div>
              </div>

              <div
                style={{
                  borderTop: "1px solid var(--border-subtle)",
                  marginTop: "10px",
                  paddingTop: "20px",
                  display: "flex",
                  justifyContent: "flex-end",
                }}
              >
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    saveGlobalSettings();
                    setIsSettingsOpen(false);
                  }}
                  style={{ padding: "10px 24px", fontWeight: "bold" }}
                >
                  Save Global Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {showExportModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.7)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onClick={() => setShowExportModal(false)}
        >
          <div
            style={{
              background: "var(--surface)",
              padding: "24px",
              borderRadius: "8px",
              width: "400px",
              maxWidth: "90vw",
              border: "1px solid var(--border)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "20px",
              }}
            >
              <h3 style={{ margin: 0, color: "white" }}>Export Data</h3>
              <button
                className="btn btn-secondary"
                style={{ padding: "4px" }}
                onClick={() => setShowExportModal(false)}
              >
                <X size={16} />
              </button>
            </div>

            <div
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              <button
                className="btn btn-primary"
                style={{ padding: "16px", justifyContent: "flex-start" }}
                onClick={() => {
                  handleExportSongs();
                  setShowExportModal(false);
                }}
              >
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontWeight: 600, marginBottom: "4px" }}>
                    Export Songs Only
                  </div>
                  <div style={{ fontSize: "0.8rem", opacity: 0.8 }}>
                    Exports your songs, including their individual presentation
                    settings.
                  </div>
                </div>
              </button>

              <button
                className="btn btn-secondary"
                style={{ padding: "16px", justifyContent: "flex-start" }}
                onClick={() => {
                  handleExportSettings();
                  setShowExportModal(false);
                }}
              >
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontWeight: 600, marginBottom: "4px" }}>
                    Export Global Settings
                  </div>
                  <div style={{ fontSize: "0.8rem", opacity: 0.8 }}>
                    Exports your global layout templates, bibles, and active
                    state.
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete All Saved Songs Confirmation Modal */}
      {showDeleteAllConfirm && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(6px)",
            zIndex: 99999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
          onClick={() => setShowDeleteAllConfirm(false)}
        >
          <div
            style={{
              background: "var(--surface, #1e222d)",
              border: "1px solid rgba(239, 68, 68, 0.35)",
              borderRadius: "12px",
              padding: "24px",
              width: "420px",
              maxWidth: "92vw",
              boxShadow: "0 20px 50px rgba(0, 0, 0, 0.6)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                marginBottom: "16px",
              }}
            >
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "10px",
                  background: "rgba(239, 68, 68, 0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#ef4444",
                  flexShrink: 0,
                }}
              >
                <Trash2 size={24} />
              </div>
              <div>
                <h3
                  style={{
                    margin: 0,
                    fontSize: "1.1rem",
                    color: "#fff",
                    fontWeight: 600,
                  }}
                >
                  Clear All Saved Songs?
                </h3>
                <span
                  style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}
                >
                  This action cannot be undone.
                </span>
              </div>
            </div>

            <p
              style={{
                fontSize: "0.85rem",
                color: "var(--text-muted)",
                lineHeight: 1.5,
                margin: "0 0 20px 0",
              }}
            >
              Are you sure you want to delete all{" "}
              <strong>{savedSongs.length}</strong> saved song
              {savedSongs.length > 1 ? "s" : ""} from your database? All stored
              lyrics, custom styles, and song records will be permanently wiped.
            </p>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "10px",
              }}
            >
              <button
                type="button"
                className="btn btn-secondary"
                style={{ padding: "8px 16px", fontSize: "0.85rem" }}
                onClick={() => setShowDeleteAllConfirm(false)}
                disabled={isDeletingAll}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                style={{
                  padding: "8px 16px",
                  fontSize: "0.85rem",
                  background: "#dc2626",
                  borderColor: "#dc2626",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
                onClick={executeDeleteAllSongs}
                disabled={isDeletingAll}
              >
                <Trash2 size={15} />
                {isDeletingAll
                  ? "Deleting..."
                  : `Delete All (${savedSongs.length}) Songs`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Single Song Confirmation Modal */}
      {songToDelete && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(6px)",
            zIndex: 99999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
          onClick={() => setSongToDelete(null)}
        >
          <div
            style={{
              background: "var(--surface, #1e222d)",
              border: "1px solid rgba(239, 68, 68, 0.35)",
              borderRadius: "12px",
              padding: "22px",
              width: "380px",
              maxWidth: "92vw",
              boxShadow: "0 20px 50px rgba(0, 0, 0, 0.6)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginBottom: "14px",
              }}
            >
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "8px",
                  background: "rgba(239, 68, 68, 0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#ef4444",
                  flexShrink: 0,
                }}
              >
                <Trash2 size={20} />
              </div>
              <div>
                <h3
                  style={{
                    margin: 0,
                    fontSize: "1rem",
                    color: "#fff",
                    fontWeight: 600,
                  }}
                >
                  Delete Song?
                </h3>
                <span
                  style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}
                >
                  Remove from saved library
                </span>
              </div>
            </div>

            <p
              style={{
                fontSize: "0.85rem",
                color: "var(--text-muted)",
                lineHeight: 1.5,
                margin: "0 0 18px 0",
              }}
            >
              Are you sure you want to delete{" "}
              <strong>"{songToDelete.title}"</strong>?
            </p>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "10px",
              }}
            >
              <button
                type="button"
                className="btn btn-secondary"
                style={{ padding: "6px 14px", fontSize: "0.82rem" }}
                onClick={() => setSongToDelete(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                style={{
                  padding: "6px 14px",
                  fontSize: "0.82rem",
                  background: "#dc2626",
                  borderColor: "#dc2626",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
                onClick={executeDeleteSingleSong}
              >
                <Trash2 size={13} /> Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Lyrics Preview Tooltip Plane */}
      {showSearchResultsModal && hoveredSearchResult && (
        <div
          style={{
            position: "fixed",
            left: `${sidebarWidth + 12}px`,
            top: `${tooltipTop}px`,
            width: "380px",
            maxWidth: "calc(100vw - 420px)",
            maxHeight: "480px",
            background: "rgba(18, 22, 34, 0.96)",
            backdropFilter: "blur(16px)",
            border: "1px solid rgba(99, 102, 241, 0.35)",
            borderRadius: "10px",
            boxShadow:
              "0 14px 40px rgba(0, 0, 0, 0.6), 0 0 25px rgba(99, 102, 241, 0.15)",
            zIndex: 10000,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            pointerEvents: "auto",
            animation: "fadeIn 0.15s ease-out",
          }}
          onMouseEnter={() => {
            // Keep preview active if cursor enters tooltip plane
          }}
          onMouseLeave={() => {
            setHoveredSearchResult(null);
          }}
        >
          {/* Tooltip Header */}
          <div
            style={{
              padding: "10px 14px",
              background: "rgba(255, 255, 255, 0.04)",
              borderBottom: "1px solid var(--border-subtle)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ minWidth: 0, flex: 1, paddingRight: "8px" }}>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: "0.9rem",
                  color: "#fff",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {hoveredSearchResult.title}
              </div>
              <div
                style={{
                  fontSize: "0.75rem",
                  color: "var(--primary)",
                  fontWeight: 500,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {hoveredSearchResult.artist}
                {hoveredSearchResult.album
                  ? ` • ${hoveredSearchResult.album}`
                  : ""}
              </div>
            </div>
            <span
              style={{
                fontSize: "0.7rem",
                background: "rgba(99, 102, 241, 0.15)",
                color: "var(--primary)",
                padding: "2px 8px",
                borderRadius: "10px",
                fontWeight: 600,
                whiteSpace: "nowrap",
              }}
            >
              Full Lyrics Preview
            </span>
          </div>

          {/* Tooltip Scrollable Lyrics Plane */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "12px 14px",
              fontSize: "0.82rem",
              lineHeight: 1.6,
              color: "var(--text-main)",
              whiteSpace: "pre-line",
              fontFamily: "var(--font-mono, monospace)",
              background: "rgba(0, 0, 0, 0.25)",
            }}
          >
            {hoveredSearchResult.lyrics}
          </div>

          {/* Tooltip Footer action */}
          <div
            style={{
              padding: "8px 14px",
              background: "rgba(255, 255, 255, 0.03)",
              borderTop: "1px solid var(--border-subtle)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
              Click to import into workspace:
            </span>
            <button
              type="button"
              className="btn btn-primary"
              style={{
                fontSize: "0.78rem",
                padding: "5px 12px",
                display: "flex",
                alignItems: "center",
                gap: "5px",
              }}
              onClick={() => handleSelectSearchResult(hoveredSearchResult)}
            >
              <Check size={13} /> Select & Add
            </button>
          </div>
        </div>
      )}

      {/* Topbar */}
      <header className="panel-topbar">
        <div className="panel-logo">
          <BookOpen size={20} color="var(--primary)" />
          WEB <span>PROJECTOR</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div className="status-indicator">
            <div className="status-dot online"></div>
            <span>Connected (Local IP)</span>
          </div>
          <button
            className="icon-btn-2 icon-btn"
            title="Launch Projector (Ctrl+Alt+P)"
            onClick={launchProjector}
            style={{
              color: "var(--primary)",
              borderColor: "var(--primary)",
              border: "1px solid",
              padding: "4px 8px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              borderRadius: "4px",
              width: "auto",
            }}
          >
            <MonitorPlay size={16} />
            <span style={{ fontSize: "0.8rem", fontWeight: 500 }}>
              Launch Projector
            </span>
          </button>
          <button
            className="icon-btn"
            title="Settings"
            onClick={() => setIsSettingsOpen(true)}
          >
            <Settings size={18} />
          </button>
        </div>
      </header>

      {/* Main Body Splitter */}
      <div className="panel-body">
        {/* Left Sidebar */}
        <aside className="panel-sidebar" style={{ width: sidebarWidth }}>
          <div className="sidebar-tabs">
            <div
              className={`sidebar-tab ${activeTab === "bible" ? "active" : ""}`}
              onClick={() => setActiveTab("bible")}
            >
              Bible
            </div>
            <div
              className={`sidebar-tab ${activeTab === "songs" ? "active" : ""}`}
              onClick={() => setActiveTab("songs")}
            >
              Songs
            </div>
            <div
              className={`sidebar-tab ${activeTab === "animation" ? "active" : ""}`}
              onClick={() => setActiveTab("animation")}
              style={{ display: "flex", alignItems: "center", gap: "5px" }}
            >
              <Sparkles size={14} />
              Animation
            </div>
          </div>

          <div className="sidebar-content">
            {activeTab === "bible" && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                  height: "100%",
                }}
              >
                <label
                  className="btn btn-primary"
                  style={{
                    padding: "8px",
                    fontSize: "0.85rem",
                    cursor: "pointer",
                    display: "flex",
                    justifyContent: "center",
                  }}
                >
                  <Upload size={16} /> &nbsp; Import Zefania XML
                  <input
                    type="file"
                    accept=".xml"
                    hidden
                    onChange={handleBibleUpload}
                  />
                </label>

                <div>
                  <h4
                    style={{
                      fontSize: "0.8rem",
                      color: "var(--text-muted)",
                      textTransform: "uppercase",
                      marginBottom: "8px",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <Database size={12} /> Local Bible Database
                  </h4>
                  {bibleLoadingProgress && (
                    <div
                      style={{
                        fontSize: "0.85rem",
                        color: "var(--secondary)",
                        marginBottom: "8px",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <Loader
                        size={14}
                        style={{ animation: "spin 2s linear infinite" }}
                      />{" "}
                      Loading Bibles... ({bibleLoadingProgress.current}/
                      {bibleLoadingProgress.total})
                    </div>
                  )}
                  {bibles.length === 0 ? (
                    <div
                      style={{
                        fontSize: "0.85rem",
                        color: "var(--text-muted)",
                        fontStyle: "italic",
                      }}
                    >
                      No bibles imported yet.
                    </div>
                  ) : (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "6px",
                      }}
                    >
                      {bibles.map((b) => (
                        <div
                          key={b.id}
                          onClick={() => handleVersionChange(b.id)}
                          style={{
                            padding: "8px 12px",
                            background:
                              selectedBibleId === b.id
                                ? "rgba(255,255,255,0.1)"
                                : "rgba(0,0,0,0.2)",
                            borderRadius: "6px",
                            border:
                              selectedBibleId === b.id
                                ? "1px solid var(--primary)"
                                : "1px solid var(--border-subtle)",
                            fontSize: "0.85rem",
                            display: "flex",
                            justifyContent: "space-between",
                            cursor: "pointer",
                            transition: "all 0.2s",
                          }}
                          onMouseEnter={(e) => {
                            if (selectedBibleId !== b.id)
                              e.currentTarget.style.borderColor =
                                "var(--primary-hover)";
                          }}
                          onMouseLeave={(e) => {
                            if (selectedBibleId !== b.id)
                              e.currentTarget.style.borderColor =
                                "var(--border-subtle)";
                          }}
                        >
                          <span
                            style={{
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {b.name}
                          </span>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                            }}
                          >
                            {selectedBibleId === b.id && (
                              <span
                                style={{
                                  color: "var(--secondary)",
                                  fontSize: "0.7rem",
                                  flexShrink: 0,
                                }}
                              >
                                ACTIVE
                              </span>
                            )}
                            <button
                              onClick={async (e) => {
                                e.stopPropagation();
                                if (
                                  window.confirm(
                                    `Delete Bible version: ${b.name}?`,
                                  )
                                ) {
                                  try {
                                    await bibleService.deleteBible(b.id);
                                    if (selectedBibleId === b.id)
                                      setSelectedBibleId("");
                                    loadBibles();
                                    import("react-hot-toast").then((module) =>
                                      module.toast.success(`Deleted ${b.name}`),
                                    );
                                  } catch (err) {
                                    console.error(
                                      "Failed to delete bible",
                                      err,
                                    );
                                  }
                                }
                              }}
                              style={{
                                background: "transparent",
                                border: "none",
                                color: "var(--text-muted)",
                                cursor: "pointer",
                                padding: "2px",
                                display: "flex",
                                alignItems: "center",
                              }}
                              onMouseEnter={(e) =>
                                (e.currentTarget.style.color = "#ef4444")
                              }
                              onMouseLeave={(e) =>
                                (e.currentTarget.style.color =
                                  "var(--text-muted)")
                              }
                              title="Delete Bible"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "songs" && (
              <div
                style={{
                  position: "relative",
                  display: "flex",
                  flexDirection: "column",
                  gap: "14px",
                  height: "100%",
                  minHeight: 0,
                }}
              >
                {/* Search Results Overlay Modal Plane in Sidebar */}
                {showSearchResultsModal && (
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: "rgba(15, 23, 42, 0.94)",
                      backdropFilter: "blur(8px)",
                      zIndex: 35,
                      padding: "14px 12px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px",
                      borderRadius: "8px",
                      border: "1px solid rgba(99, 102, 241, 0.35)",
                      boxShadow: "0 10px 30px rgba(0, 0, 0, 0.5)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        borderBottom: "1px solid var(--border-subtle)",
                        paddingBottom: "8px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        <Sparkles size={16} color="var(--primary)" />
                        <span
                          style={{
                            fontWeight: 600,
                            fontSize: "0.85rem",
                            color: "var(--text-main)",
                          }}
                        >
                          Lyrics Matches ({songSearchResults.length})
                        </span>
                      </div>
                      <button
                        type="button"
                        className="icon-btn"
                        style={{
                          background: "rgba(255,255,255,0.06)",
                          border: "1px solid var(--border-subtle)",
                          color: "var(--text-muted)",
                          borderRadius: "4px",
                          padding: "2px 6px",
                          cursor: "pointer",
                        }}
                        onClick={() => {
                          setShowSearchResultsModal(false);
                          setHoveredSearchResult(null);
                        }}
                        title="Close search results"
                      >
                        <X size={14} />
                      </button>
                    </div>

                    <div
                      style={{
                        fontSize: "0.74rem",
                        color: "var(--text-muted)",
                        lineHeight: 1.3,
                      }}
                    >
                      Hover to preview full lyrics. Click any song to import into your library.
                    </div>

                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px",
                        overflowY: "auto",
                        flex: 1,
                        minHeight: 0,
                        paddingRight: "2px",
                      }}
                    >
                      {songSearchResults.map((res, idx) => {
                        const isHovered = hoveredSearchResult?.id === res.id;
                        return (
                          <div
                            key={res.id || idx}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "10px",
                              padding: "10px",
                              background: isHovered
                                ? "rgba(99, 102, 241, 0.22)"
                                : "rgba(255, 255, 255, 0.04)",
                              border: isHovered
                                ? "1px solid var(--primary)"
                                : "1px solid rgba(255, 255, 255, 0.08)",
                              borderRadius: "8px",
                              cursor: "pointer",
                              transition: "all 0.15s ease",
                            }}
                            onMouseEnter={(e) => {
                              const rect =
                                e.currentTarget.getBoundingClientRect();
                              setTooltipTop(
                                Math.max(
                                  60,
                                  Math.min(window.innerHeight - 440, rect.top),
                                ),
                              );
                              setHoveredSearchResult(res);
                            }}
                            onClick={() => handleSelectSearchResult(res)}
                          >
                            <div
                              style={{
                                width: "24px",
                                height: "24px",
                                borderRadius: "50%",
                                background: isHovered
                                  ? "var(--primary)"
                                  : "rgba(99, 102, 241, 0.2)",
                                color: isHovered ? "#fff" : "var(--primary)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontWeight: 700,
                                fontSize: "0.75rem",
                                flexShrink: 0,
                              }}
                            >
                              {idx + 1}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div
                                style={{
                                  fontWeight: 600,
                                  fontSize: "0.82rem",
                                  color: isHovered
                                    ? "#fff"
                                    : "var(--text-main)",
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                }}
                              >
                                {res.title}
                              </div>
                              <div
                                style={{
                                  fontSize: "0.72rem",
                                  color: "var(--text-muted)",
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                }}
                              >
                                {res.artist}
                                {res.album ? ` • ${res.album}` : ""}
                              </div>
                            </div>
                            <Eye
                              size={14}
                              style={{
                                color: isHovered
                                  ? "var(--primary)"
                                  : "var(--text-muted)",
                                flexShrink: 0,
                              }}
                            />
                          </div>
                        );
                      })}
                    </div>

                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{
                        fontSize: "0.78rem",
                        padding: "7px 10px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px",
                      }}
                      onClick={() => {
                        setShowSearchResultsModal(false);
                        setHoveredSearchResult(null);
                      }}
                    >
                      Back to Saved Songs
                    </button>
                  </div>
                )}

                <button
                  className="btn btn-primary"
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    padding: "8px",
                  }}
                  onClick={() => {
                    setActiveSongId("");
                    setActiveSongTitle("");
                    setActiveSongArtist("");
                    setLyrics("");
                    setActiveSongSettings(defaultSongSettings);
                    setSongViewMode("edit");
                  }}
                >
                  <Plus size={16} /> New Song
                </button>

                <label
                  className="btn btn-secondary"
                  style={{
                    padding: "8px",
                    fontSize: "0.85rem",
                    cursor: "pointer",
                    display: "flex",
                    justifyContent: "center",
                  }}
                >
                  <FileText size={16} /> &nbsp; Import Lyrics (.txt)
                  <input
                    type="file"
                    accept=".txt"
                    hidden
                    onChange={handleLyricsFileUpload}
                  />
                </label>

                <hr
                  style={{
                    border: 0,
                    borderBottom: "1px solid var(--border-subtle)",
                  }}
                />

                <div>
                  <h4
                    style={{
                      fontSize: "0.8rem",
                      color: "var(--text-muted)",
                      textTransform: "uppercase",
                      marginBottom: "8px",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <Search size={12} /> Search Online
                  </h4>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                    }}
                  >
                    <input
                      type="text"
                      className="input"
                      placeholder="Artist (Optional)"
                      value={songSearchArtist}
                      onChange={(e) => setSongSearchArtist(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleOnlineSongSearch();
                      }}
                    />
                    <input
                      type="text"
                      className="input"
                      placeholder="Song Title"
                      value={songSearchTitle}
                      onChange={(e) => setSongSearchTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleOnlineSongSearch();
                      }}
                    />
                    <button
                      className="btn btn-primary"
                      style={{
                        width: "100%",
                        fontSize: "0.85rem",
                        marginTop: "4px",
                      }}
                      onClick={handleOnlineSongSearch}
                      disabled={!songSearchTitle || isSearchingSong}
                    >
                      <Wand2 size={16} /> &nbsp;
                      {isSearchingSong ? "Searching..." : "Get Lyrics Online"}
                    </button>
                  </div>
                </div>

                <hr
                  style={{
                    border: 0,
                    borderBottom: "1px solid var(--border-subtle)",
                    margin: "8px 0",
                  }}
                />

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    flex: 1,
                    minHeight: 0,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: "10px",
                      flexShrink: 0,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <h4
                        style={{
                          fontSize: "0.82rem",
                          fontWeight: 600,
                          color: "var(--text-main)",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                          margin: 0,
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        <Database
                          size={13}
                          style={{ color: "var(--primary)" }}
                        />{" "}
                        Saved Songs
                      </h4>
                      <span
                        style={{
                          fontSize: "0.72rem",
                          padding: "2px 8px",
                          borderRadius: "10px",
                          background: "rgba(255, 255, 255, 0.08)",
                          color: "var(--text-muted)",
                          fontWeight: 600,
                        }}
                      >
                        {savedSongs.length}
                      </span>
                    </div>
                  </div>
                  {savedSongs.length === 0 ? (
                    <p
                      style={{
                        fontSize: "0.8rem",
                        color: "var(--text-muted)",
                      }}
                    >
                      No songs saved yet. Add them in the Dashboard.
                    </p>
                  ) : (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "6px",
                        flex: 1,
                        overflowY: "auto",
                        paddingRight: "4px",
                        minHeight: 0,
                      }}
                    >
                      {savedSongs.map((s, idx) => (
                        <div
                          key={s.id || idx}
                          style={{
                            padding: "8px",
                            background:
                              s.id === activeSongId
                                ? "rgba(79, 70, 229, 0.2)"
                                : "rgba(255,255,255,0.05)",
                            borderRadius: "6px",
                            fontSize: "0.85rem",
                            cursor: "pointer",
                            border:
                              s.id === activeSongId
                                ? "1px solid var(--primary)"
                                : "1px solid transparent",
                            transition: "all 0.2s",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                          }}
                          onClick={() => handleSelectSong(s, "none")}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.borderColor =
                              "var(--primary)")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.borderColor =
                              s.id === activeSongId
                                ? "var(--primary)"
                                : "transparent")
                          }
                        >
                          <div style={{ flex: 1, overflow: "hidden" }}>
                            <div
                              style={{
                                fontWeight: 600,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {s.title}
                            </div>
                            {s.artist && (
                              <div
                                style={{
                                  fontSize: "0.75rem",
                                  color: "var(--text-muted)",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {s.artist}
                              </div>
                            )}
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSongToDelete({ id: s.id, title: s.title });
                            }}
                            style={{
                              background: "transparent",
                              border: "none",
                              color: "var(--text-muted)",
                              cursor: "pointer",
                              padding: "2px",
                              display: "flex",
                              alignItems: "center",
                              marginLeft: "8px",
                            }}
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.color = "#ef4444")
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.color =
                                "var(--text-muted)")
                            }
                            title="Delete Song"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {savedSongs.length > 0 && (
                    <div
                      style={{
                        marginTop: "10px",
                        paddingTop: "10px",
                        borderTop: "1px solid var(--border-subtle)",
                        flexShrink: 0,
                      }}
                    >
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{
                          width: "100%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "8px",
                          color: "#ef4444",
                          background: "rgba(239, 68, 68, 0.08)",
                          borderColor: "rgba(239, 68, 68, 0.25)",
                          fontSize: "0.8rem",
                          fontWeight: 500,
                          padding: "8px 12px",
                          borderRadius: "6px",
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background =
                            "rgba(239, 68, 68, 0.16)";
                          e.currentTarget.style.borderColor =
                            "rgba(239, 68, 68, 0.4)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background =
                            "rgba(239, 68, 68, 0.08)";
                          e.currentTarget.style.borderColor =
                            "rgba(239, 68, 68, 0.25)";
                        }}
                        onClick={handleDeleteAllSongs}
                        title="Delete all saved songs from database"
                      >
                        <Trash2 size={13} /> Clear All Saved Songs (
                        {savedSongs.length})
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "animation" && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                  height: "100%",
                  overflowY: "auto",
                  paddingRight: "4px",
                }}
              >
                {/* Header */}
                <div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginBottom: "4px",
                    }}
                  >
                    <Sparkles size={18} color="var(--primary)" />
                    <h3
                      style={{ fontSize: "1rem", fontWeight: 700, margin: 0 }}
                    >
                      Lyric Animations
                    </h3>
                  </div>
                  <p
                    style={{
                      fontSize: "0.8rem",
                      color: "var(--text-muted)",
                      margin: 0,
                      lineHeight: 1.4,
                    }}
                  >
                    Configure animated typography and motion presets for lyrics.
                  </p>
                </div>

                {/* Target Song Context Card */}
                <div
                  style={{
                    padding: "10px 12px",
                    background: activeSongTitle
                      ? "rgba(59, 130, 246, 0.12)"
                      : "rgba(255, 255, 255, 0.05)",
                    border: `1px solid ${activeSongTitle ? "rgba(59, 130, 246, 0.3)" : "rgba(255, 255, 255, 0.1)"}`,
                    borderRadius: "8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "8px",
                  }}
                >
                  <div style={{ overflow: "hidden" }}>
                    <span
                      style={{
                        fontSize: "0.7rem",
                        textTransform: "uppercase",
                        fontWeight: 700,
                        letterSpacing: "0.05em",
                        color: activeSongTitle
                          ? "var(--primary)"
                          : "var(--text-muted)",
                        display: "block",
                        marginBottom: "2px",
                      }}
                    >
                      {activeSongTitle
                        ? "Active Song Settings"
                        : "Default Song Profile"}
                    </span>
                    <div
                      style={{
                        fontSize: "0.85rem",
                        fontWeight: 600,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {activeSongTitle || "Global Default (No song selected)"}
                    </div>
                  </div>
                  {activeSongTitle && (
                    <button
                      className="btn btn-secondary"
                      style={{
                        padding: "4px 8px",
                        fontSize: "0.75rem",
                        flexShrink: 0,
                      }}
                      onClick={() => setActiveTab("songs")}
                      title="Switch Song"
                    >
                      Switch
                    </button>
                  )}
                </div>

                {/* Master Kinetic Animation Toggle */}
                <div
                  style={{
                    padding: "14px",
                    background: activeSongSettings.enableKineticTypography
                      ? "linear-gradient(135deg, rgba(37, 99, 235, 0.2), rgba(16, 185, 129, 0.15))"
                      : "rgba(255, 255, 255, 0.03)",
                    border: activeSongSettings.enableKineticTypography
                      ? "1px solid rgba(59, 130, 246, 0.4)"
                      : "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: "10px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                  onClick={() =>
                    updateActiveSongSettings({
                      enableKineticTypography:
                        !activeSongSettings.enableKineticTypography,
                    })
                  }
                >
                  <div>
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: "0.9rem",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <span>Enable Kinetic Typography</span>
                    </div>
                    <div
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--text-muted)",
                        marginTop: "2px",
                      }}
                    >
                      {activeSongSettings.enableKineticTypography
                        ? "Active — Animated lyrics during projection"
                        : "Off — Standard static lyric projection"}
                    </div>
                  </div>

                  <div
                    style={{
                      width: "44px",
                      height: "24px",
                      background: activeSongSettings.enableKineticTypography
                        ? "var(--primary)"
                        : "rgba(255, 255, 255, 0.2)",
                      borderRadius: "12px",
                      position: "relative",
                      transition: "background 0.2s",
                      flexShrink: 0,
                    }}
                  >
                    <div
                      style={{
                        width: "18px",
                        height: "18px",
                        borderRadius: "50%",
                        background: "white",
                        position: "absolute",
                        top: "3px",
                        left: activeSongSettings.enableKineticTypography
                          ? "23px"
                          : "3px",
                        transition: "left 0.2s",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
                      }}
                    />
                  </div>
                </div>

                {/* Tempo / Speed selector */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                    opacity: activeSongSettings.enableKineticTypography
                      ? 1
                      : 0.6,
                  }}
                >
                  <label
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      color: "var(--text-muted)",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Animation Tempo / Speed
                  </label>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr 1fr",
                      gap: "6px",
                    }}
                  >
                    {(["slow", "medium", "fast"] as const).map((tempo) => {
                      const isSelected =
                        (activeSongSettings.kineticTempo || "fast") === tempo;
                      return (
                        <button
                          key={tempo}
                          type="button"
                          className={`btn ${isSelected ? "btn-primary" : "btn-secondary"}`}
                          style={{
                            padding: "8px 4px",
                            fontSize: "0.8rem",
                            fontWeight: isSelected ? 700 : 500,
                            textAlign: "center",
                            borderRadius: "6px",
                            border: isSelected
                              ? "1px solid var(--primary)"
                              : "1px solid rgba(255,255,255,0.1)",
                          }}
                          onClick={() =>
                            updateActiveSongSettings({ kineticTempo: tempo })
                          }
                        >
                          {tempo === "slow" && "🐢 Slow"}
                          {tempo === "medium" && "⚡ Medium"}
                          {tempo === "fast" && "🚀 Fast"}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Animation Templates Section */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        color: "var(--text-muted)",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      Animation Templates (1 Available)
                    </span>
                  </div>

                  {/* Template 1: Dynamic AI Kinetic */}
                  <div
                    style={{
                      background: "rgba(15, 23, 42, 0.75)",
                      border: "2px solid var(--primary)",
                      borderRadius: "10px",
                      padding: "12px",
                      position: "relative",
                      boxShadow: "0 4px 15px rgba(59, 130, 246, 0.15)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: "6px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        <span style={{ fontWeight: 700, fontSize: "0.9rem" }}>
                          Dynamic AI Kinetic
                        </span>
                      </div>
                      <span
                        style={{
                          padding: "2px 8px",
                          background: "var(--primary)",
                          color: "white",
                          borderRadius: "12px",
                          fontSize: "0.7rem",
                          fontWeight: 700,
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <Check size={12} /> Active
                      </span>
                    </div>
                    <p
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--text-muted)",
                        margin: "0 0 10px 0",
                        lineHeight: 1.4,
                      }}
                    >
                      Varies animation style dynamically per phrase — guessing
                      stomp, whip pan, bounce, 3D flip, and roll animations
                      word-by-word.
                    </p>

                    {/* Interactive Live Preview */}
                    <div
                      style={{
                        background: "#05070f",
                        borderRadius: "8px",
                        padding: "16px 12px",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                        minHeight: "85px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        position: "relative",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          position: "absolute",
                          top: "4px",
                          right: "6px",
                          zIndex: 2,
                        }}
                      >
                        <button
                          className="icon-btn"
                          style={{
                            padding: "3px 6px",
                            fontSize: "0.7rem",
                            background: "rgba(255,255,255,0.08)",
                            borderRadius: "4px",
                            display: "flex",
                            alignItems: "center",
                            gap: "3px",
                          }}
                          onClick={() => setPreviewAnimationKey((k) => k + 1)}
                          title="Replay Animation Preview"
                        >
                          <RotateCcw size={11} /> Replay
                        </button>
                      </div>

                      <div
                        key={previewAnimationKey}
                        style={{
                          width: "100%",
                          textAlign: "center",
                          fontSize: "1.1rem",
                          fontWeight: 700,
                        }}
                      >
                        <AnimatedLyric
                          text={
                            songChunks[activeSongChunkIndex ?? 0] ||
                            "Amazing grace how sweet the sound"
                          }
                          isEnabled={activeSongSettings.enableKineticTypography}
                          kineticTempo={
                            activeSongSettings.kineticTempo || "fast"
                          }
                        />
                      </div>
                    </div>
                  </div>

                  {/* Upcoming Templates (Placeholders) */}
                  <div
                    style={{
                      marginTop: "4px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.7rem",
                        fontWeight: 600,
                        color: "var(--text-muted)",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      Upcoming Templates (In Development)
                    </span>

                    {[
                      {
                        title: "Template 2: Uniform Kinetic Stomp",
                        desc: "Follows a single synchronized stomp rhythm for high-energy songs.",
                      },
                      {
                        title: "Template 3: Smooth Word Reveal",
                        desc: "Linear word-by-word reveal along a steady, gentle worship cadence.",
                      },
                      {
                        title: "Template 4: Cinematic Drift",
                        desc: "Subtle majestic float with soft blur and graceful fade transitions.",
                      },
                    ].map((t) => (
                      <div
                        key={t.title}
                        style={{
                          padding: "10px 12px",
                          background: "rgba(255, 255, 255, 0.02)",
                          border: "1px dashed rgba(255, 255, 255, 0.12)",
                          borderRadius: "8px",
                          opacity: 0.65,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: "4px",
                          }}
                        >
                          <span
                            style={{
                              fontWeight: 600,
                              fontSize: "0.8rem",
                              color: "#ddd",
                            }}
                          >
                            {t.title}
                          </span>
                          <span
                            style={{
                              fontSize: "0.65rem",
                              padding: "1px 6px",
                              borderRadius: "4px",
                              background: "rgba(255, 255, 255, 0.1)",
                              color: "var(--text-muted)",
                              fontWeight: 600,
                            }}
                          >
                            Coming Soon
                          </span>
                        </div>
                        <div
                          style={{
                            fontSize: "0.7rem",
                            color: "var(--text-muted)",
                          }}
                        >
                          {t.desc}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Resizer 1 */}
        <div
          className="resizer-x"
          onMouseDown={(e) => {
            e.preventDefault();
            isResizingSidebar.current = true;
            document.body.style.cursor = "col-resize";
            document.body.style.userSelect = "none";
          }}
        ></div>

        {/* Middle Workspace */}
        <main className="panel-workspace">
          <div className="workspace-toolbar">
            <button className="icon-btn" title="Text Mode">
              <Type size={18} />
            </button>
            <div
              style={{
                width: "1px",
                height: "24px",
                background: "var(--border-subtle)",
                margin: "0 4px",
              }}
            ></div>
            <button className="icon-btn active" title="AI Helper">
              <Wand2 size={18} />
            </button>
            <div style={{ flex: 1 }}></div>

            {activeTab !== "bible" && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  background: "rgba(0,0,0,0.3)",
                  borderRadius: "6px",
                  padding: "4px",
                  marginRight: "1rem",
                  gap: "4px",
                }}
              >
                <button
                  className={`btn ${songViewMode === "edit" ? "btn-primary" : "btn-secondary"}`}
                  style={{
                    padding: "4px 12px",
                    fontSize: "0.8rem",
                    border: "none",
                    background:
                      songViewMode === "edit"
                        ? "var(--primary)"
                        : "transparent",
                  }}
                  onClick={() => setSongViewMode("edit")}
                >
                  Editor
                </button>
                <button
                  className={`btn ${songViewMode === "play" ? "btn-primary" : "btn-secondary"}`}
                  style={{
                    padding: "4px 12px",
                    fontSize: "0.8rem",
                    border: "none",
                    background:
                      songViewMode === "play"
                        ? "var(--primary)"
                        : "transparent",
                  }}
                  onClick={() => setSongViewMode("play")}
                >
                  <Play size={14} style={{ marginRight: "4px" }} /> Play
                </button>
                <div
                  style={{
                    width: "1px",
                    height: "16px",
                    background: "rgba(255,255,255,0.2)",
                    margin: "0 2px",
                  }}
                />
                <button
                  className="btn btn-secondary"
                  style={{
                    padding: "4px 8px",
                    fontSize: "0.8rem",
                    border: "none",
                    background: "transparent",
                    display: "flex",
                    alignItems: "center",
                    gap: "2px",
                  }}
                  onClick={() => goToPrevSong(true)}
                  title="Previous Song (PageUp or [)"
                  disabled={savedSongs.length <= 1}
                >
                  <ChevronLeft size={14} /> Song
                </button>
                <button
                  className="btn btn-secondary"
                  style={{
                    padding: "4px 8px",
                    fontSize: "0.8rem",
                    border: "none",
                    background: "transparent",
                    display: "flex",
                    alignItems: "center",
                    gap: "2px",
                  }}
                  onClick={() => goToNextSong(true)}
                  title="Next Song (PageDown or ])"
                  disabled={savedSongs.length <= 1}
                >
                  Song <ChevronRight size={14} />
                </button>
                <div
                  style={{
                    width: "1px",
                    height: "16px",
                    background: "rgba(255,255,255,0.2)",
                    margin: "0 2px",
                  }}
                />
                <button
                  className={`btn ${activeSongSettings.enableKineticTypography ? "btn-primary" : "btn-secondary"}`}
                  style={{
                    padding: "4px 10px",
                    fontSize: "0.8rem",
                    border: "none",
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                    background: activeSongSettings.enableKineticTypography
                      ? "var(--primary)"
                      : "transparent",
                  }}
                  onClick={() => setActiveTab("animation")}
                  title="Configure Lyric Animations in Animation Tab"
                >
                  <Sparkles size={13} />
                  {activeSongSettings.enableKineticTypography
                    ? "Kinetic ON"
                    : "Animation"}
                </button>
              </div>
            )}
          </div>

          <div className="workspace-editor">
            {activeTab === "bible" ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  height: "100%",
                  gap: "12px",
                }}
              >
                <div className="fast-search-container">
                  <button
                    type="button"
                    onClick={() => handleFastSearch(fastSearchQuery, true)}
                    title="Search and Project Live (Enter)"
                    aria-label="Search and Project Live"
                    style={{
                      background: "transparent",
                      border: "none",
                      padding: 0,
                      display: "flex",
                      alignItems: "center",
                      cursor: "pointer",
                      marginRight: "12px",
                    }}
                  >
                    <Search size={20} color="var(--primary)" />
                  </button>
                  <input
                    type="text"
                    className="fast-search-input"
                    placeholder="Fast Search (e.g. 'mat 3:3 (niv)' or 'gen 1 1') — Enter to Project"
                    value={fastSearchQuery}
                    onChange={(e) => handleFastSearch(e.target.value, false)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter")
                        handleFastSearch(fastSearchQuery, true);
                    }}
                  />
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <select
                    className="input"
                    style={{ flex: 2, padding: "8px" }}
                    value={selectedBookNum}
                    onChange={(e) => {
                      setSelectedBookNum(
                        e.target.value ? Number(e.target.value) : "",
                      );
                      setSelectedChapterNum("");
                    }}
                  >
                    <option value="">Select Book...</option>
                    {activeBible?.books.map((book) => (
                      <option key={book.number} value={book.number}>
                        {book.name}
                      </option>
                    ))}
                  </select>
                  <select
                    className="input"
                    style={{ flex: 1, padding: "8px" }}
                    value={selectedChapterNum}
                    onChange={(e) =>
                      setSelectedChapterNum(
                        e.target.value ? Number(e.target.value) : "",
                      )
                    }
                  >
                    <option value="">Chapter...</option>
                    {activeBook?.chapters.map((chap) => (
                      <option key={chap.number} value={chap.number}>
                        {chap.number}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="verses-list">
                  {!activeChapter ? (
                    <div
                      style={{
                        padding: "2rem",
                        textAlign: "center",
                        color: "var(--text-muted)",
                      }}
                    >
                      Select a book and chapter or type in the fast search box
                      above.
                    </div>
                  ) : (
                    activeChapter.verses.map((verse) => {
                      const isLive =
                        liveState.type === "bible" &&
                        activeProjectedRef?.verse === verse.number &&
                        activeProjectedRef?.chap === activeChapter.number &&
                        activeProjectedRef?.book === activeBook?.number;
                      return (
                        <div
                          key={verse.number}
                          id={`verse-${verse.number}`}
                          onClick={() => handleProjectVerse(verse)}
                          style={{
                            padding: "12px",
                            borderRadius: "6px",
                            cursor: "pointer",
                            backgroundColor: isLive
                              ? "var(--primary-light)"
                              : "transparent",
                            border: "1px solid transparent",
                            borderColor: isLive
                              ? "var(--primary)"
                              : "transparent",
                            transition: "all 0.15s",
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.backgroundColor = isLive
                              ? "var(--primary-light)"
                              : "rgba(255,255,255,0.05)")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.backgroundColor = isLive
                              ? "var(--primary-light)"
                              : "transparent")
                          }
                        >
                          <span
                            style={{
                              color: "var(--primary)",
                              fontWeight: "bold",
                              marginRight: "12px",
                              fontSize: "0.9rem",
                            }}
                          >
                            {verse.number}
                          </span>
                          <span style={{ fontSize: "1rem", lineHeight: "1.5" }}>
                            {verse.text}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            ) : (
              <div
                style={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                {songViewMode === "edit" ? (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px",
                      height: "100%",
                    }}
                  >
                    <input
                      type="text"
                      placeholder="Song Title"
                      value={activeSongTitle}
                      onChange={(e) => setActiveSongTitle(e.target.value)}
                      className="lyric-textarea"
                      style={{
                        height: "40px",
                        flex: "none",
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "4px",
                        padding: "8px",
                        color: "white",
                      }}
                    />
                    <input
                      type="text"
                      placeholder="Artist"
                      value={activeSongArtist}
                      onChange={(e) => setActiveSongArtist(e.target.value)}
                      className="lyric-textarea"
                      style={{
                        height: "40px",
                        flex: "none",
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "4px",
                        padding: "8px",
                        color: "white",
                      }}
                    />
                    <textarea
                      className="lyric-textarea"
                      placeholder="Type or paste lyrics here. You can also import a .txt file from the sidebar!"
                      value={lyrics}
                      onChange={(e) => setLyrics(e.target.value)}
                      style={{
                        flex: 1,
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "4px",
                        padding: "8px",
                        color: "white",
                      }}
                    />
                    <button
                      className="btn btn-primary"
                      style={{ alignSelf: "flex-end", flex: "none" }}
                      onClick={async () => {
                        if (activeSongId) {
                          await updateSong(
                            activeSongId,
                            activeSongTitle,
                            activeSongArtist,
                            lyrics,
                            activeSongSettings,
                          );
                          import("react-hot-toast").then((module) =>
                            module.toast.success("Song updated!"),
                          );
                        } else {
                          const newId = await addSong(
                            activeSongTitle,
                            activeSongArtist,
                            lyrics,
                            activeSongSettings,
                          );
                          setActiveSongId(newId);
                          import("react-hot-toast").then((module) =>
                            module.toast.success("Song saved!"),
                          );
                        }
                        loadSongs();
                      }}
                    >
                      Save Song
                    </button>
                  </div>
                ) : (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fill, minmax(200px, 1fr))",
                      gap: "12px",
                      overflowY: "auto",
                      alignContent: "start",
                      padding: "4px",
                    }}
                  >
                    {songChunks.length === 0 ? (
                      <div
                        style={{
                          padding: "2rem",
                          color: "var(--text-muted)",
                          gridColumn: "1 / -1",
                          textAlign: "center",
                        }}
                      >
                        No song lyrics. Switch to the Editor to paste some
                        lyrics!
                      </div>
                    ) : (
                      songChunks.map((chunk, index) => {
                        const isLive =
                          liveState.type === "song" &&
                          activeSongChunkIndex === index;
                        return (
                          <div
                            key={index}
                            id={`song-chunk-${index}`}
                            onClick={() => handleProjectSongChunk(chunk, index)}
                            style={{
                              containerType: "inline-size",
                              background: isLive
                                ? "var(--primary-light)"
                                : "rgba(0,0,0,0.3)",
                              border: `2px solid ${isLive ? "var(--primary)" : "var(--border-subtle)"}`,
                              borderRadius: "8px",
                              padding: "12px",
                              cursor: "pointer",
                              color: isLive ? "#fff" : "var(--text-primary)",
                              boxShadow: isLive
                                ? "0 0 12px rgba(79, 70, 229, 0.4)"
                                : "none",
                              transition: "all 0.15s ease",
                            }}
                            onMouseEnter={(e) => {
                              if (!isLive)
                                e.currentTarget.style.borderColor =
                                  "var(--primary-hover)";
                            }}
                            onMouseLeave={(e) => {
                              if (!isLive)
                                e.currentTarget.style.borderColor =
                                  "var(--border-subtle)";
                            }}
                          >
                            <div
                              style={{
                                fontSize: "clamp(11px, 6.5cqi, 16px)",
                                lineHeight: "1.4",
                                whiteSpace: "pre",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              {chunk}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Settings & Live Controls */}
          <div className="live-controls-bar">
            <div
              className="nav-row"
              style={{ justifyContent: "flex-start", gap: "12px" }}
            >
              <button
                className="btn"
                style={{
                  background: "transparent",
                  border: "1px solid var(--border-subtle)",
                  color: "white",
                  padding: "8px 24px",
                  fontWeight: 600,
                  borderRadius: "8px",
                  transition: "all 0.2s",
                }}
                onClick={handleClear}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "rgba(255,255,255,0.1)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                Clear (Esc)
              </button>
              <button
                className="btn btn-primary"
                style={{
                  background: "var(--primary)",
                  borderColor: "var(--primary)",
                  padding: "8px 32px",
                  fontWeight: "bold",
                  fontSize: "1.1rem",
                  borderRadius: "8px",
                  boxShadow: "0 4px 12px rgba(79, 70, 229, 0.4)",
                  transition: "transform 0.2s",
                }}
                onClick={() => {
                  if (activeTab === "songs" && songChunks.length > 0) {
                    const idx =
                      activeSongChunkIndex !== null ? activeSongChunkIndex : 0;
                    handleProjectSongChunk(songChunks[idx], idx);
                  } else if (activeTab === "bible" && activeChapter) {
                    const verse = activeProjectedRef
                      ? activeChapter.verses.find(
                          (v) => v.number === activeProjectedRef.verse,
                        )
                      : activeChapter.verses[0];
                    if (verse) handleProjectVerse(verse);
                  }
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.transform = "scale(1.05)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.transform = "scale(1)")
                }
              >
                Project Live
              </button>
            </div>

            <div className="main-panel-stacks">
              <div className="control-stack">
                <span className="control-stack-label">
                  Lines {isBibleContext ? "(Bible)" : "(Song)"}
                </span>
                <div
                  className="segmented-picker"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: "2px",
                    width: "100%",
                  }}
                >
                  <button
                    className={`seg-btn ${activeLinesMode === 1 ? "active" : ""}`}
                    onClick={() => handleLinesModeChange(1)}
                  >
                    1
                  </button>
                  <button
                    className={`seg-btn ${activeLinesMode === 2 ? "active" : ""}`}
                    onClick={() => handleLinesModeChange(2)}
                  >
                    2
                  </button>
                  <button
                    className={`seg-btn ${activeLinesMode === 3 ? "active" : ""}`}
                    onClick={() => {
                      if (isCurrentKinetic) return;
                      handleLinesModeChange(3);
                    }}
                    style={{
                      opacity: isCurrentKinetic ? 0.3 : 1,
                      cursor: isCurrentKinetic ? "not-allowed" : "pointer",
                    }}
                  >
                    3
                  </button>
                  <button
                    className={`seg-btn ${activeLinesMode === 4 ? "active" : ""}`}
                    onClick={() => {
                      if (isCurrentKinetic) return;
                      handleLinesModeChange(4);
                    }}
                    style={{
                      opacity: isCurrentKinetic ? 0.3 : 1,
                      cursor: isCurrentKinetic ? "not-allowed" : "pointer",
                    }}
                  >
                    4
                  </button>
                  <button
                    className="seg-btn"
                    onClick={() => {}}
                    style={{
                      opacity: isCurrentKinetic ? 0.3 : 1,
                      cursor: isCurrentKinetic ? "not-allowed" : "pointer",
                    }}
                  >
                    5
                  </button>
                  <button
                    className="seg-btn"
                    onClick={() => {}}
                    style={{
                      opacity: isCurrentKinetic ? 0.3 : 1,
                      cursor: isCurrentKinetic ? "not-allowed" : "pointer",
                    }}
                  >
                    6
                  </button>
                </div>
              </div>

              <div className="control-stack">
                <span className="control-stack-label">
                  Mode {isBibleContext ? "(Bible)" : "(Song)"}
                </span>
                <div
                  className="segmented-picker"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "2px",
                    width: "100%",
                  }}
                >
                  <button
                    className={`seg-btn ${activeLayout === "FS" ? "active" : ""}`}
                    onClick={() => handleLayoutChange("FS")}
                  >
                    FS
                  </button>
                  <button
                    className={`seg-btn ${activeLayout === "LT" ? "active" : ""}`}
                    onClick={() => handleLayoutChange("LT")}
                  >
                    LT
                  </button>
                </div>
                {activeLayout === "LT" && isBibleContext && (
                  <button
                    className="action-btn"
                    style={{
                      marginTop: "8px",
                      padding: "6px 8px",
                      fontSize: "0.8rem",
                      width: "100%",
                    }}
                    onClick={() => setIsThemesModalOpen(true)}
                    title="Choose Lower Third Theme"
                  >
                    Themes
                  </button>
                )}
              </div>

              <div className="control-stack">
                <span className="control-stack-label">
                  Pos Y {isBibleContext ? "(Bible)" : "(Song)"}
                </span>
                <div
                  className="segmented-picker"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "2px",
                    width: "100%",
                  }}
                >
                  <button
                    className={`seg-btn ${activeVerticalAlign === "top" ? "active" : ""}`}
                    onClick={() => handleVerticalAlignChange("top")}
                  >
                    Top
                  </button>
                  <button
                    className={`seg-btn ${activeVerticalAlign === "middle" ? "active" : ""}`}
                    onClick={() => handleVerticalAlignChange("middle")}
                  >
                    Mid
                  </button>
                  <button
                    className={`seg-btn ${activeVerticalAlign === "bottom" ? "active" : ""}`}
                    onClick={() => handleVerticalAlignChange("bottom")}
                  >
                    Bot
                  </button>
                </div>
              </div>

              <div className="control-stack">
                <span className="control-stack-label">
                  Pos X {isBibleContext ? "(Bible)" : "(Song)"}
                </span>
                <div
                  className="segmented-picker"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: "2px",
                    width: "100%",
                    height: "100%",
                  }}
                >
                  <button
                    className={`seg-btn ${activeHorizontalAlign === "left" ? "active" : ""}`}
                    onClick={() => handleHorizontalAlignChange("left")}
                  >
                    L
                  </button>
                  <button
                    className={`seg-btn ${activeHorizontalAlign === "center" ? "active" : ""}`}
                    onClick={() => handleHorizontalAlignChange("center")}
                  >
                    C
                  </button>
                  <button
                    className={`seg-btn ${activeHorizontalAlign === "right" ? "active" : ""}`}
                    onClick={() => handleHorizontalAlignChange("right")}
                  >
                    R
                  </button>
                </div>
              </div>

              <div className="control-stack" style={{ gap: "0.5rem" }}>
                <span className="control-stack-label">Background</span>
                <div
                  className="segmented-picker"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr",
                    gap: "2px",
                    width: "100%",
                  }}
                >
                  <button
                    className={`seg-btn ${globalSettings.backgroundMode === "solid" ? "active" : ""}`}
                    onClick={() =>
                      updateGlobalSettings({ backgroundMode: "solid" })
                    }
                  >
                    Solid
                  </button>
                  <button
                    className={`seg-btn ${globalSettings.backgroundMode === "image" ? "active" : ""}`}
                    onClick={() =>
                      updateGlobalSettings({ backgroundMode: "image" })
                    }
                  >
                    Image
                  </button>
                  <button
                    className={`seg-btn ${globalSettings.backgroundMode === "video" ? "active" : ""}`}
                    onClick={() =>
                      updateGlobalSettings({ backgroundMode: "video" })
                    }
                  >
                    Video
                  </button>
                </div>

                {globalSettings.backgroundMode === "solid" ? (
                  <div
                    style={{
                      display: "flex",
                      gap: "0.5rem",
                      alignItems: "center",
                    }}
                  >
                    <div
                      style={{
                        position: "relative",
                        width: "36px",
                        height: "30px",
                        flexShrink: 0,
                      }}
                    >
                      <input
                        type="color"
                        value={globalSettings.backgroundColor}
                        onChange={(e) =>
                          updateGlobalSettings({
                            backgroundColor: e.target.value,
                          })
                        }
                        style={{
                          position: "absolute",
                          inset: 0,
                          width: "100%",
                          height: "100%",
                          borderRadius: "6px",
                          border: "1px solid var(--border-subtle)",
                          padding: 0,
                          cursor: "pointer",
                          background: "transparent",
                        }}
                      />
                    </div>
                    <button
                      className={`seg-btn ${globalSettings.transparentBackground ? "active" : ""}`}
                      style={{ flex: 1, height: "30px", fontSize: "11px" }}
                      onClick={() =>
                        updateGlobalSettings({
                          transparentBackground:
                            !globalSettings.transparentBackground,
                        })
                      }
                    >
                      {globalSettings.transparentBackground
                        ? "TRANSPARENT: ON"
                        : "TRANSPARENT: OFF"}
                    </button>
                  </div>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      gap: "0.5rem",
                      alignItems: "center",
                    }}
                  >
                    <label
                      className="btn btn-secondary"
                      style={{
                        flex: 1,
                        height: "30px",
                        fontSize: "11px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        margin: 0,
                      }}
                    >
                      Upload{" "}
                      {globalSettings.backgroundMode === "image"
                        ? "Image"
                        : "Video"}
                      <input
                        type="file"
                        accept={
                          globalSettings.backgroundMode === "image"
                            ? "image/*"
                            : "video/*"
                        }
                        style={{ display: "none" }}
                        onChange={handleMediaUpload}
                      />
                    </label>
                    {globalSettings.backgroundUrl?.startsWith("local:") && (
                      <span style={{ fontSize: "10px", color: "#10b981" }}>
                        Media Active ✓
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="control-stack">
                <span className="control-stack-label">Font Sizes (cqi)</span>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    width: "100%",
                  }}
                >
                  <div
                    style={{
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      gap: "4px",
                    }}
                  >
                    <span
                      style={{ fontSize: "10px", color: "var(--text-muted)" }}
                    >
                      Bible
                    </span>
                    <input
                      type="number"
                      step="0.5"
                      value={bibleSettings.bibleFontSize}
                      onChange={(e) =>
                        updateBibleSettings({
                          bibleFontSize: Number(e.target.value),
                        })
                      }
                      style={{
                        background: "rgba(15, 23, 42, 0.5)",
                        border: "1px solid var(--border-subtle)",
                        borderRadius: "4px",
                        color: "white",
                        padding: "6px",
                        width: "100%",
                        fontSize: "0.85rem",
                      }}
                    />
                  </div>
                  <div
                    style={{
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      gap: "4px",
                    }}
                  >
                    <span
                      style={{ fontSize: "10px", color: "var(--text-muted)" }}
                    >
                      Song
                    </span>
                    <input
                      type="number"
                      step="0.5"
                      value={activeSongSettings.songFontSize}
                      onChange={(e) =>
                        updateActiveSongSettings({
                          songFontSize: Number(e.target.value),
                        })
                      }
                      style={{
                        background: "rgba(15, 23, 42, 0.5)",
                        border: "1px solid var(--border-subtle)",
                        borderRadius: "4px",
                        color: "white",
                        padding: "6px",
                        width: "100%",
                        fontSize: "0.85rem",
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="control-stack">
                <span className="control-stack-label">Text Shadow</span>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    width: "100%",
                    padding: "4px 8px",
                    background: "rgba(15, 23, 42, 0.5)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "6px",
                  }}
                >
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={globalSettings.shadowIntensity ?? 80}
                    onChange={(e) =>
                      updateGlobalSettings({
                        shadowIntensity: parseInt(e.target.value),
                      })
                    }
                    style={{ width: "100%" }}
                  />
                  <span
                    style={{
                      fontSize: "0.75rem",
                      color: "white",
                      minWidth: "24px",
                    }}
                  >
                    {globalSettings.shadowIntensity ?? 80}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Resizer 2 */}
        <div
          className="resizer-x"
          onMouseDown={(e) => {
            e.preventDefault();
            isResizingProgram.current = true;
            document.body.style.cursor = "col-resize";
            document.body.style.userSelect = "none";
          }}
        ></div>

        {/* Right Program Display */}
        <aside className="panel-program" style={{ width: programWidth }}>
          <div className="program-header">
            <span>Program Output</span>
            <button
              className="icon-btn"
              style={{ width: "28px", height: "28px" }}
              title="Copy OBS URL"
              onClick={handleCopyOBSUrl}
            >
              <MonitorPlay size={14} />
            </button>
          </div>

          <div className="program-stage">
            <div
              className="program-preview-box"
              style={{
                position: "relative",
                overflow: "hidden",
                backgroundColor:
                  liveState.backgroundMode === "solid" &&
                  !liveState.transparentBackground
                    ? liveState.backgroundColor
                    : "#050505",
                backgroundImage:
                  liveState.backgroundMode === "solid" &&
                  !liveState.transparentBackground
                    ? "none"
                    : "linear-gradient(45deg, rgba(255,255,255,0.03) 25%, transparent 25%, transparent 75%, rgba(255,255,255,0.03) 75%, rgba(255,255,255,0.03)), linear-gradient(45deg, rgba(255,255,255,0.03) 25%, transparent 25%, transparent 75%, rgba(255,255,255,0.03) 75%, rgba(255,255,255,0.03))",
                backgroundSize: "20px 20px",
                backgroundPosition: "0 0, 10px 10px",
                containerType: "inline-size",
              }}
            >
              <OutputView isPreview={true} />
            </div>
          </div>

          {/* Scripture Search History Box */}
          <div className="program-history-container">
            <div className="program-history-header">
              <div className="program-history-title">
                <History size={13} style={{ color: "var(--primary)" }} />
                <span>Scripture History</span>
                <span className="program-history-badge">
                  {bibleHistory.length}/8
                </span>
              </div>
              {bibleHistory.length > 0 && (
                <button
                  className="program-history-clear-btn"
                  onClick={() => {
                    setBibleHistory([]);
                    try {
                      localStorage.removeItem("webProjectorBibleHistory");
                    } catch (e) {}
                    toast.success("Scripture history cleared");
                  }}
                  title="Clear history"
                >
                  <Trash2 size={11} /> Clear
                </button>
              )}
            </div>

            <div className="program-history-list">
              {bibleHistory.length === 0 ? (
                <div className="program-history-empty">
                  <BookOpen
                    size={22}
                    style={{ opacity: 0.35, color: "var(--text-muted)" }}
                  />
                  <span
                    style={{
                      fontSize: "0.78rem",
                      fontWeight: 600,
                      color: "var(--text-muted)",
                    }}
                  >
                    No Scripture History
                  </span>
                  <span
                    style={{
                      fontSize: "0.7rem",
                      color: "var(--text-muted)",
                      opacity: 0.8,
                      lineHeight: 1.35,
                    }}
                  >
                    Searched verses sent with Enter will show here (last 8)
                  </span>
                </div>
              ) : (
                bibleHistory.map((item, idx) => {
                  const isCurrentLive =
                    liveState.type === "bible" &&
                    liveState.title?.toLowerCase().trim() ===
                      item.reference.toLowerCase().trim();

                  return (
                    <div
                      key={item.id}
                      className={`program-history-item ${isCurrentLive ? "is-live" : ""}`}
                      onClick={() => handleSelectHistoryItem(item)}
                      title={`Click to project ${item.reference}`}
                    >
                      <div className="program-history-item-top">
                        <div className="program-history-ref">
                          <span className="program-history-index">
                            #{idx + 1}
                          </span>
                          <span>{item.reference}</span>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          {isCurrentLive && (
                            <span className="program-history-live-pill">
                              <span className="program-history-live-dot" />
                              LIVE
                            </span>
                          )}
                          <div className="program-history-item-actions">
                            {!isCurrentLive && (
                              <button
                                className="program-history-action-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSelectHistoryItem(item);
                                }}
                                title="Project live"
                              >
                                <Play size={10} />
                              </button>
                            )}
                            <button
                              className="program-history-action-btn delete-btn"
                              onClick={(e) =>
                                handleRemoveHistoryItem(e, item.id)
                              }
                              title="Remove from history"
                            >
                              <X size={10} />
                            </button>
                          </div>
                        </div>
                      </div>
                      <p className="program-history-snippet">{item.text}</p>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div
            style={{
              padding: "1rem",
              borderTop: "1px solid var(--border-subtle)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "8px",
              }}
            >
              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                Output URL (OBS Browser Source)
              </span>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <input
                type="text"
                readOnly
                className="input"
                value={obsUrl}
                style={{ fontSize: "0.75rem", padding: "6px 8px" }}
              />
              <button
                className="btn btn-secondary"
                style={{ padding: "6px 12px", fontSize: "0.75rem" }}
                onClick={handleCopyOBSUrl}
              >
                Copy
              </button>
            </div>
          </div>
        </aside>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <div className="mobile-nav-bar">
        <button className="mobile-nav-btn" onClick={goToPrev}>
          <ChevronLeft size={24} />
          <span>Previous</span>
        </button>
        <button className="mobile-nav-btn" onClick={goToNext}>
          <span>Next</span>
          <ChevronRight size={24} />
        </button>
      </div>
    </div>
  );
}
