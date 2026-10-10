import { useState, useEffect, useRef, useMemo } from "react";
import toast from "react-hot-toast";
import {
  Palette,
  Image as ImageIcon,
  Video as VideoIcon,
  Settings,
  MonitorPlay,
  BookOpen,
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
  RotateCcw,
  Check,
  Trash2,
  Eye,
  History,
  Sliders,
  Layout,
  Type,
  Music,
  Download,
} from "lucide-react";
import "../styles/panel.css";
import { bibleService, BibleVersion, Verse } from "../services/bibleService";
import { useLive, SongSettings } from "../store/LiveContext";
import { AnimatedLyric } from "../components/AnimatedLyric";
import OutputView from "./OutputView";
import {
  getSongs,
  getCachedSongsFast,
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

export interface SongQueueItem {
  id: string;
  songId: string;
  title: string;
  artist: string;
  lyrics: string;
  settings?: any;
  filename?: string;
  addedAt: number;
}

export const BACKGROUND_COLOR_PRESETS = [
  { label: "Stage Black", color: "#000000" },
  { label: "Midnight Blue", color: "#0a192f" },
  { label: "Royal Navy", color: "#0f2b5c" },
  { label: "Deep Maroon", color: "#2a0815" },
  { label: "Royal Purple", color: "#1e1035" },
  { label: "Charcoal Slate", color: "#18181b" },
  { label: "Forest Sanctuary", color: "#06231a" },
  { label: "Warm Chocolate", color: "#23160a" },
  { label: "Deep Indigo", color: "#1e1b4b" },
  { label: "Crimson Velvet", color: "#450a0a" },
];

export const BACKGROUND_IMAGE_PRESETS = [
  {
    name: "Midnight Nebula",
    url: "/backgrounds/midnight-nebula.svg",
  },
  {
    name: "Sanctuary Warmth",
    url: "/backgrounds/sanctuary-warmth.svg",
  },
  {
    name: "Majesty Blue",
    url: "/backgrounds/majesty-blue.svg",
  },
  {
    name: "Celestial Glow",
    url: "/backgrounds/celestial-glow.svg",
  },
  {
    name: "Stage Texture",
    url: "/uploads/rpkzzktv6hp2enlqxanj3wd4e.png",
  },
];

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
  const [activeSongFilename, setActiveSongFilename] = useState("");
  const [savedSongSearchQuery, setSavedSongSearchQuery] = useState("");

  const filteredSavedSongs = useMemo(() => {
    if (!savedSongSearchQuery.trim()) return savedSongs;
    const q = savedSongSearchQuery.toLowerCase().trim();
    return savedSongs.filter((s) => {
      return (
        s.title?.toLowerCase().includes(q) ||
        s.artist?.toLowerCase().includes(q) ||
        s.lyrics?.toLowerCase().includes(q)
      );
    });
  }, [savedSongs, savedSongSearchQuery]);

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
  const [settingsModalTab, setSettingsModalTab] = useState<
    "display" | "typography" | "backup"
  >("display");
  const [isThemesModalOpen, setIsThemesModalOpen] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportModalTab, setExportModalTab] = useState<"songs" | "settings">(
    "songs",
  );
  const [exportSearchQuery, setExportSearchQuery] = useState("");
  const [selectedExportSongIds, setSelectedExportSongIds] = useState<
    Set<string | number>
  >(new Set());
  const [isBackgroundModalOpen, setIsBackgroundModalOpen] = useState(false);
  const [backgroundModalTab, setBackgroundModalTab] = useState<
    "solid" | "image" | "video"
  >("solid");

  // Bible State
  const [bibles, setBibles] = useState<BibleVersion[]>([]);

  const [isAppBooting, setIsAppBooting] = useState<boolean>(true);
  const [bootStatus, setBootStatus] = useState<string>("Initializing Web Projector...");
  const [bootProgress, setBootProgress] = useState<number>(20);
  const [isSongsLoading, setIsSongsLoading] = useState<boolean>(true);
  const [isUploadingBible, setIsUploadingBible] = useState<boolean>(false);

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

  // Song Service Queue (Setlist)
  const [songQueue, setSongQueue] = useState<SongQueueItem[]>(() => {
    try {
      const saved = localStorage.getItem("webProjectorSongQueue");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error("Error loading song queue:", e);
    }
    return [];
  });

  const addToSongQueue = (song: any) => {
    const newItem: SongQueueItem = {
      id: "q_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
      songId: song.id || "song_" + Date.now(),
      title: song.title,
      artist: song.artist || "",
      lyrics: song.lyrics || "",
      settings: song.settings,
      filename: song.filename,
      addedAt: Date.now(),
    };
    setSongQueue((prev) => {
      const updated = [...prev, newItem];
      try {
        localStorage.setItem("webProjectorSongQueue", JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
    toast.success(`Added "${song.title}" to Song Queue!`);
  };

  const removeFromSongQueue = (queueItemId: string) => {
    setSongQueue((prev) => {
      const updated = prev.filter((item) => item.id !== queueItemId);
      try {
        localStorage.setItem("webProjectorSongQueue", JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const clearSongQueue = () => {
    setSongQueue([]);
    try {
      localStorage.removeItem("webProjectorSongQueue");
    } catch (e) {}
    toast.success("Song Queue cleared");
  };

  const moveQueueItem = (fromIdx: number, toIdx: number) => {
    setSongQueue((prev) => {
      if (toIdx < 0 || toIdx >= prev.length) return prev;
      const copy = [...prev];
      const [moved] = copy.splice(fromIdx, 1);
      copy.splice(toIdx, 0, moved);
      try {
        localStorage.setItem("webProjectorSongQueue", JSON.stringify(copy));
      } catch (e) {}
      return copy;
    });
  };

  const addToBibleHistory = (newItem: BibleHistoryItem) => {
    setBibleHistory((prev) => {
      let updated: BibleHistoryItem[];
      // If the top history entry is in the same book & chapter, update it to the newly clicked verse
      // so clicking multiple verses in the same chapter doesn't flood the history
      if (
        prev.length > 0 &&
        prev[0].bookNumber === newItem.bookNumber &&
        prev[0].chapterNumber === newItem.chapterNumber &&
        prev[0].bibleId === newItem.bibleId
      ) {
        updated = [newItem, ...prev.slice(1)];
      } else {
        const filtered = prev.filter(
          (item) =>
            item.reference.toLowerCase() !== newItem.reference.toLowerCase(),
        );
        updated = [newItem, ...filtered];
      }
      const sliced = updated.slice(0, 50);
      try {
        localStorage.setItem(
          "webProjectorBibleHistory",
          JSON.stringify(sliced),
        );
      } catch (e) {
        console.error("Failed to save bible history to localStorage", e);
      }
      return sliced;
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
      const updated = [{ ...item, timestamp: Date.now() }, ...filtered].slice(
        0,
        50,
      );
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
    filename?: string;
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

  const handleMediaUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    mode?: "image" | "video",
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const targetMode =
      mode ||
      (file.type.startsWith("video/")
        ? "video"
        : file.type.startsWith("image/")
          ? "image"
          : globalSettings.backgroundMode === "solid"
            ? "image"
            : globalSettings.backgroundMode);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        if (data.url) {
          updateGlobalSettings({
            backgroundMode: targetMode,
            backgroundUrl: data.url,
          });
          toast.success(
            `${targetMode === "video" ? "Video" : "Image"} background applied!`,
          );
          return;
        }
      }
      throw new Error("Upload failed");
    } catch (err) {
      console.warn("Upload endpoint failed, falling back to FileReader", err);
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        if (dataUrl) {
          updateGlobalSettings({
            backgroundMode: targetMode,
            backgroundUrl: dataUrl,
          });
          toast.success(
            `${targetMode === "video" ? "Video" : "Image"} background loaded!`,
          );
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClearBackgroundMedia = () => {
    updateGlobalSettings({
      backgroundMode: "solid",
      backgroundUrl: "",
    });
    toast.success("Background media cleared (switched to solid color)");
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
      setIsSongsLoading(true);
      const cached = getCachedSongsFast();
      if (cached && cached.length > 0) {
        setSavedSongs(cached);
        setIsSongsLoading(false);
      }
      const songs = await getSongs();
      setSavedSongs(songs);
    } catch (err) {
      console.error("Failed to load songs from DB", err);
    } finally {
      setIsSongsLoading(false);
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
      await deleteSong(
        songToDelete.id,
        songToDelete.filename,
        songToDelete.title,
      );
      await loadSongs();
      if (activeSongId === songToDelete.id) {
        setActiveSongId("");
        setActiveSongTitle("");
        setActiveSongArtist("");
        setActiveSongFilename("");
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
    // 1. Electron Desktop Native Multi-Display Routing
    if ((window as any).electronAPI?.launchProjector) {
      try {
        const res = await (window as any).electronAPI.launchProjector();
        if (res?.isExternal) {
          toast.success("Projector launched fullscreen on extended display!");
        } else {
          toast.success("Projector preview window launched (single screen mode).");
        }
        return;
      } catch (err) {
        console.error("Electron launch projector failed:", err);
      }
    }

    // 2. Web browser: Window Management API
    try {
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
          toast.success("Projector launched on extended display!");
          return;
        }
      }
    } catch (err) {
      console.error("Window Management API failed:", err);
    }

    // 3. Fallback if API not supported or popup blocked
    window.open("/output?autoFullscreen=true", "_blank");
    toast.success("Projector opened in new tab.");
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey && e.altKey && e.key.toLowerCase() === "p") ||
        (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "p")
      ) {
        e.preventDefault();
        launchProjector();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    const initData = async () => {
      try {
        setBootStatus("Loading songs cache...");
        setBootProgress(35);
        await loadSongs();

        setBootStatus("Loading scripture database...");
        setBootProgress(70);
        await loadBibles();

        setBootStatus("Ready");
        setBootProgress(100);
      } catch (err) {
        console.error("Initialization error:", err);
      } finally {
        setTimeout(() => {
          setIsAppBooting(false);
        }, 350);
      }
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

  const openExportModal = (tab: "songs" | "settings" = "songs") => {
    setExportModalTab(tab);
    setExportSearchQuery("");
    // Pre-select all songs initially so user can immediately export all, or deselect/search as desired
    setSelectedExportSongIds(new Set(savedSongs.map((s) => s.id)));
    setShowExportModal(true);
  };

  const filteredExportSongs = useMemo(() => {
    if (!exportSearchQuery.trim()) return savedSongs;
    const q = exportSearchQuery.toLowerCase().trim();
    return savedSongs.filter((s) => {
      return (
        s.title?.toLowerCase().includes(q) ||
        s.artist?.toLowerCase().includes(q) ||
        s.lyrics?.toLowerCase().includes(q)
      );
    });
  }, [savedSongs, exportSearchQuery]);

  const toggleSongExportSelection = (id: string | number) => {
    setSelectedExportSongIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAllFilteredExportSongs = () => {
    setSelectedExportSongIds((prev) => {
      const next = new Set(prev);
      filteredExportSongs.forEach((s) => next.add(s.id));
      return next;
    });
  };

  const deselectAllFilteredExportSongs = () => {
    setSelectedExportSongIds((prev) => {
      const next = new Set(prev);
      filteredExportSongs.forEach((s) => next.delete(s.id));
      return next;
    });
  };

  const handleExportSongs = async (songIdsToExport?: (string | number)[]) => {
    try {
      const allSongs = await getSongs();
      const songsToExport =
        songIdsToExport && songIdsToExport.length > 0
          ? allSongs.filter((s: any) =>
              songIdsToExport.some((id) => String(id) === String(s.id)),
            )
          : allSongs;

      if (songsToExport.length === 0) {
        toast.error("No songs selected for export");
        return;
      }

      const exportData = {
        version: "1.0",
        exportDate: new Date().toISOString(),
        type: "songs",
        songs: songsToExport,
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
      toast.success(
        `Exported ${songsToExport.length} song${songsToExport.length === 1 ? "" : "s"} successfully!`,
      );
    } catch (e) {
      toast.error("Failed to export songs");
    }
  };

  const handleExportSettings = async () => {
    try {
      const exportData = {
        version: "1.0",
        exportDate: new Date().toISOString(),
        type: "settings",
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
      toast.success("Settings exported successfully!");
    } catch (e) {
      toast.error("Failed to export settings");
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

      if (loadedBibles.length > 0 && !selectedBibleId) {
        setSelectedBibleId(loadedBibles[0].id);
      }

      const serverBibles = await bibleService.getAvailableServerBibles();

      const toLoad = serverBibles.filter(
        (filename) =>
          !loadedBibles.some(
            (b) => b.id === "bible_" + filename.replace(".xml", ""),
          ),
      );

      if (toLoad.length > 0) {
        // If no bibles are cached in IndexedDB yet, load the first one immediately so user has scriptures right away
        if (loadedBibles.length === 0) {
          const firstFile = toLoad[0];
          try {
            const parsed = await bibleService.loadBibleFromServer(firstFile);
            if (parsed) {
              loadedBibles = [parsed];
              setBibles(loadedBibles);
              setSelectedBibleId(parsed.id);
            }
          } catch (e) {
            console.error(`Failed to load initial bible ${firstFile}`, e);
          }
        }

        // Remaining server bibles are parsed in background non-blocking chunks
        const remaining = toLoad.filter(
          (filename) =>
            !loadedBibles.some(
              (b) => b.id === "bible_" + filename.replace(".xml", ""),
            ),
        );

        if (remaining.length > 0) {
          setBibleLoadingProgress({ current: 0, total: remaining.length });
          // Background queue with setTimeout yield: ZERO UI freezing!
          (async () => {
            for (let i = 0; i < remaining.length; i++) {
              const filename = remaining[i];
              await new Promise((r) => setTimeout(r, 60)); // cooperative yield
              try {
                const parsed = await bibleService.loadBibleFromServer(filename);
                if (parsed) {
                  setBibles((prev) => {
                    if (prev.some((b) => b.id === parsed.id)) return prev;
                    return [...prev, parsed];
                  });
                }
              } catch (e) {
                console.error(`Failed to load bible ${filename}`, e);
              }
              setBibleLoadingProgress({ current: i + 1, total: remaining.length });
            }
            setBibleLoadingProgress(null);
          })();
        }
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

    setIsUploadingBible(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      try {
        const name = file.name.replace(/\.xml$/i, "");
        const id = "bible_" + name.replace(/[^a-zA-Z0-9_-]/g, "_");

        // 1. Save directly into BIBLE/ folder on disk (works on web & packaged exe)
        await bibleService.saveBibleToServer(file.name, text);

        // 2. Parse and cache in IndexedDB
        await bibleService.parseZefaniaXML(text, id, name);
        toast.success(`Successfully saved ${name} to BIBLE folder!`);
        await loadBibles();
        setSelectedBibleId(id);
      } catch (err) {
        toast.error("Failed to parse Zefania XML. Make sure it is valid.");
        console.error(err);
      } finally {
        setIsUploadingBible(false);
        if (event.target) event.target.value = "";
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
          (d: any) => !d.instrumental && (d.plainLyrics || d.syncedLyrics),
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
              !item.instrumental && (item.plainLyrics || item.syncedLyrics),
          )
          .map((item: any) => ({
            id: item.id,
            title: item.trackName || item.name || title,
            artist: item.artistName || artist || "Unknown",
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
      setActiveSongFilename(`${selected.title.trim().replace(/[<>:"/\\|?*]/g, '_')}.txt`);
      setLyrics(selected.lyrics);
      setActiveSongChunkIndex(null);
      setSongViewMode("play");
      setShowSearchResultsModal(false);
      setHoveredSearchResult(null);
      toast.success(`Imported "${selected.title}" & saved to songs folder`);
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

  const handleProjectVerse = (
    verse: Verse,
    overrideChapNum?: number,
    overrideBookNum?: number,
    addToHistory: boolean = true,
  ) => {
    const bookNum =
      overrideBookNum !== undefined ? overrideBookNum : Number(selectedBookNum);
    const chapNum =
      overrideChapNum !== undefined
        ? overrideChapNum
        : Number(selectedChapterNum);

    const curBook =
      activeBible?.books.find((b) => b.number === bookNum) || activeBook;
    const curChap =
      curBook?.chapters.find((c) => c.number === chapNum) || activeChapter;

    setActiveProjectedRef({
      book: bookNum,
      chap: chapNum,
      verse: verse.number,
    });
    setActiveSongChunkIndex(null);
    const refString = `${curBook?.name || "Bible"} ${curChap?.number || chapNum}:${verse.number} (${activeBible?.name || ""})`;
    projectBible(refString, verse.text);

    if (addToHistory && curBook && activeBible && curChap) {
      addToBibleHistory({
        id: `${curBook.number}_${curChap.number}_${verse.number}_${activeBible.id}_${Date.now()}`,
        reference: refString,
        text: verse.text,
        bookNumber: curBook.number,
        chapterNumber: curChap.number,
        verseNumber: verse.number,
        bibleId: activeBible.id,
        bibleName: activeBible.name,
        timestamp: Date.now(),
      });
    }
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
          const refString = `${newBook.name} ${newChap.number}:${newVerse.number} (${newBible.name})`;
          projectBible(refString, newVerse.text);
          addToBibleHistory({
            id: `${newBook.number}_${newChap.number}_${newVerse.number}_${newBible.id}_${Date.now()}`,
            reference: refString,
            text: newVerse.text,
            bookNumber: newBook.number,
            chapterNumber: newChap.number,
            verseNumber: newVerse.number,
            bibleId: newBible.id,
            bibleName: newBible.name,
            timestamp: Date.now(),
          });
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
    setActiveSongFilename(s.filename || "");
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
            handleProjectVerse(
              activeChapter.verses[currentIndex + 1],
              undefined,
              undefined,
              false,
            );
          } else if (
            currentIndex === activeChapter.verses.length - 1 &&
            activeBook
          ) {
            const nextChap = activeBook.chapters.find(
              (c) => c.number === activeChapter.number + 1,
            );
            if (nextChap && nextChap.verses.length > 0) {
              setSelectedChapterNum(nextChap.number);
              handleProjectVerse(
                nextChap.verses[0],
                nextChap.number,
                undefined,
                true,
              );
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
          handleProjectVerse(
            activeChapter.verses[currentIndex - 1],
            undefined,
            undefined,
            false,
          );
        } else if (currentIndex === 0 && activeBook) {
          const prevChap = activeBook.chapters.find(
            (c) => c.number === activeChapter.number - 1,
          );
          if (prevChap && prevChap.verses.length > 0) {
            setSelectedChapterNum(prevChap.number);
            handleProjectVerse(
              prevChap.verses[prevChap.verses.length - 1],
              prevChap.number,
              undefined,
              true,
            );
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
      // 1. Ctrl+S or Cmd+S: Save Settings shortcut
      if ((e.ctrlKey || e.metaKey) && (e.key === "s" || e.key === "S")) {
        e.preventDefault();
        saveGlobalSettings();
        return;
      }

      // 2. Escape key handling:
      // If ANY modal/overlay is open, close it without clearing the live projector screen!
      if (e.key === "Escape") {
        e.preventDefault();
        if (isSettingsOpen) {
          setIsSettingsOpen(false);
          return;
        }
        if (isBackgroundModalOpen) {
          setIsBackgroundModalOpen(false);
          return;
        }
        if (isThemesModalOpen) {
          setIsThemesModalOpen(false);
          return;
        }
        if (showExportModal) {
          setShowExportModal(false);
          return;
        }
        if (showSearchResultsModal) {
          setShowSearchResultsModal(false);
          return;
        }
        if (showDeleteAllConfirm) {
          setShowDeleteAllConfirm(false);
          return;
        }
        if (songToDelete) {
          setSongToDelete(null);
          return;
        }

        // Only clear the live program window when no modal is open
        handleClear();
        return;
      }

      // Do not trigger hotkeys if user is typing in an input or textarea
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
    isSettingsOpen,
    isBackgroundModalOpen,
    isThemesModalOpen,
    showExportModal,
    showSearchResultsModal,
    showDeleteAllConfirm,
    songToDelete,
    handleClear,
    handleProjectVerse,
    handleProjectSongChunk,
    saveGlobalSettings,
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
      {/* App Startup Loading Screen */}
      {isAppBooting && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 999999,
            backgroundColor: "#0d1117",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            color: "#ffffff",
            userSelect: "none",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              padding: "32px 40px",
              borderRadius: "16px",
              background: "#161b22",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.5)",
              textAlign: "center",
              minWidth: "280px",
            }}
          >
            {/* App Icon */}
            <img
              src="/icon.png"
              alt="Web Projector"
              style={{
                width: "72px",
                height: "72px",
                borderRadius: "14px",
                boxShadow: "0 6px 16px rgba(0, 0, 0, 0.4)",
                marginBottom: "16px",
              }}
            />

            {/* Title */}
            <div
              style={{
                fontSize: "1.2rem",
                fontWeight: 700,
                color: "#f0f6fc",
                letterSpacing: "0.3px",
              }}
            >
              Web Projector
            </div>
            <div
              style={{
                fontSize: "0.78rem",
                color: "#8b949e",
                marginTop: "4px",
                marginBottom: "24px",
              }}
            >
              Stage & Screen Output
            </div>

            {/* Circular Spinner */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "12px",
              }}
            >
              <div
                style={{
                  width: "28px",
                  height: "28px",
                  border: "3px solid rgba(255, 255, 255, 0.12)",
                  borderTopColor: "#58a6ff",
                  borderRadius: "50%",
                  animation: "spin 0.75s linear infinite",
                }}
              />
              <span
                style={{
                  fontSize: "0.75rem",
                  color: "#8b949e",
                }}
              >
                {bootStatus}
              </span>
            </div>
          </div>
        </div>
      )}
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
          style={{ justifyContent: "center", alignItems: "center", padding: "1.5rem" }}
          onClick={() => setIsSettingsOpen(false)}
        >
          <div
            className="modal-content"
            style={{
              maxHeight: "92vh",
              overflowY: "auto",
              background: "rgba(10, 15, 25, 0.98)",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.85)",
              border: "1px solid rgba(255,255,255,0.15)",
              width: "680px",
              padding: "0",
              borderRadius: "14px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              className="modal-title"
              style={{
                padding: "16px 24px",
                margin: 0,
                borderBottom: "1px solid var(--border-subtle)",
                background: "rgba(0,0,0,0.35)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Settings size={20} style={{ color: "var(--primary)" }} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: "1.1rem", color: "white" }}>
                    Stage Display & System Settings
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    Configure projection positioning, typography, layout, and backups
                  </div>
                </div>
              </div>
              <button
                className="icon-btn"
                onClick={() => setIsSettingsOpen(false)}
                title="Close settings (Esc)"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Tabs Navigation */}
            <div style={{ padding: "16px 24px 0 24px" }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: "6px",
                  background: "rgba(15, 23, 42, 0.6)",
                  padding: "4px",
                  borderRadius: "8px",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                <button
                  className={`seg-btn ${settingsModalTab === "display" ? "active" : ""}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    padding: "8px",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                  }}
                  onClick={() => setSettingsModalTab("display")}
                >
                  <Layout size={14} /> Display & Layout
                </button>
                <button
                  className={`seg-btn ${settingsModalTab === "typography" ? "active" : ""}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    padding: "8px",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                  }}
                  onClick={() => setSettingsModalTab("typography")}
                >
                  <Type size={14} /> Typography & Style
                </button>
                <button
                  className={`seg-btn ${settingsModalTab === "backup" ? "active" : ""}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    padding: "8px",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                  }}
                  onClick={() => setSettingsModalTab("backup")}
                >
                  <Database size={14} /> Library & Backup
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div
              style={{
                padding: "20px 24px",
                display: "flex",
                flexDirection: "column",
                gap: "20px",
              }}
            >
              {/* TAB 1: DISPLAY & LAYOUT */}
              {settingsModalTab === "display" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  {/* Vertical & Horizontal Positioning */}
                  <div>
                    <h4
                      style={{
                        color: "var(--primary)",
                        fontSize: "0.85rem",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        margin: "0 0 12px 0",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <Sliders size={14} /> Screen Positioning & Alignment
                    </h4>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "16px",
                        background: "rgba(0,0,0,0.25)",
                        padding: "16px",
                        borderRadius: "8px",
                        border: "1px solid rgba(255,255,255,0.08)",
                      }}
                    >
                      <div className="control-group">
                        <span className="control-label" style={{ fontWeight: 600 }}>
                          Vertical Position (Pos Y)
                        </span>
                        <div className="segmented-picker" style={{ display: "flex", width: "100%" }}>
                          <button
                            className={`seg-btn ${activeVerticalAlign === "top" ? "active" : ""}`}
                            style={{ flex: 1, padding: "8px 4px" }}
                            onClick={() => {
                              handleVerticalAlignChange("top");
                              updateBibleSettings({ verticalAlign: "top" });
                              updateActiveSongSettings({ verticalAlign: "top" });
                            }}
                          >
                            Top
                          </button>
                          <button
                            className={`seg-btn ${activeVerticalAlign === "middle" ? "active" : ""}`}
                            style={{ flex: 1, padding: "8px 4px" }}
                            onClick={() => {
                              handleVerticalAlignChange("middle");
                              updateBibleSettings({ verticalAlign: "middle" });
                              updateActiveSongSettings({ verticalAlign: "middle" });
                            }}
                          >
                            Middle
                          </button>
                          <button
                            className={`seg-btn ${activeVerticalAlign === "bottom" ? "active" : ""}`}
                            style={{ flex: 1, padding: "8px 4px" }}
                            onClick={() => {
                              handleVerticalAlignChange("bottom");
                              updateBibleSettings({ verticalAlign: "bottom" });
                              updateActiveSongSettings({ verticalAlign: "bottom" });
                            }}
                          >
                            Bottom
                          </button>
                        </div>
                      </div>

                      <div className="control-group">
                        <span className="control-label" style={{ fontWeight: 600 }}>
                          Horizontal Alignment (Pos X)
                        </span>
                        <div className="segmented-picker" style={{ display: "flex", width: "100%" }}>
                          <button
                            className={`seg-btn ${activeHorizontalAlign === "left" ? "active" : ""}`}
                            style={{ flex: 1, padding: "8px 4px" }}
                            onClick={() => {
                              handleHorizontalAlignChange("left");
                              updateBibleSettings({ horizontalAlign: "left" });
                              updateActiveSongSettings({ horizontalAlign: "left" });
                            }}
                          >
                            Left
                          </button>
                          <button
                            className={`seg-btn ${activeHorizontalAlign === "center" ? "active" : ""}`}
                            style={{ flex: 1, padding: "8px 4px" }}
                            onClick={() => {
                              handleHorizontalAlignChange("center");
                              updateBibleSettings({ horizontalAlign: "center" });
                              updateActiveSongSettings({ horizontalAlign: "center" });
                            }}
                          >
                            Center
                          </button>
                          <button
                            className={`seg-btn ${activeHorizontalAlign === "right" ? "active" : ""}`}
                            style={{ flex: 1, padding: "8px 4px" }}
                            onClick={() => {
                              handleHorizontalAlignChange("right");
                              updateBibleSettings({ horizontalAlign: "right" });
                              updateActiveSongSettings({ horizontalAlign: "right" });
                            }}
                          >
                            Right
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Font Sizes & Shadow Controls */}
                  <div>
                    <h4
                      style={{
                        color: "var(--primary)",
                        fontSize: "0.85rem",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        margin: "0 0 12px 0",
                      }}
                    >
                      Font Sizes & Shadow Controls
                    </h4>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "16px",
                        background: "rgba(0,0,0,0.25)",
                        padding: "16px",
                        borderRadius: "8px",
                        border: "1px solid rgba(255,255,255,0.08)",
                      }}
                    >
                      <div className="control-group">
                        <span className="control-label">Bible Verse Font Size (cqi)</span>
                        <input
                          type="number"
                          className="input"
                          step="0.1"
                          min="1"
                          max="15"
                          value={bibleSettings.bibleFontSize}
                          onChange={(e) =>
                            updateBibleSettings({
                              bibleFontSize: Number(e.target.value),
                            })
                          }
                        />
                      </div>

                      <div className="control-group">
                        <span className="control-label">Song Lyrics Font Size (cqi)</span>
                        <input
                          type="number"
                          className="input"
                          step="0.1"
                          min="1"
                          max="15"
                          value={activeSongSettings.songFontSize}
                          onChange={(e) =>
                            updateActiveSongSettings({
                              songFontSize: Number(e.target.value),
                            })
                          }
                        />
                      </div>

                      <div className="control-group">
                        <span className="control-label">Bible Reference Font Size (cqi)</span>
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
                        <span className="control-label">Side Padding (FS & LT) (%)</span>
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
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                          <span className="control-label" style={{ fontWeight: 600 }}>Text Shadow Intensity</span>
                          <span style={{ fontSize: "0.85rem", color: "var(--primary)", fontWeight: 700 }}>
                            {globalSettings.shadowIntensity ?? 80}%
                          </span>
                        </div>
                        <input
                          type="range"
                          style={{ width: "100%" }}
                          min="0"
                          max="100"
                          value={globalSettings.shadowIntensity ?? 80}
                          onChange={(e) =>
                            updateGlobalSettings({
                              shadowIntensity: parseInt(e.target.value),
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>

                  {/* Lower Third Styling & Options */}
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                      <h4
                        style={{
                          color: "var(--primary)",
                          fontSize: "0.85rem",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          margin: 0,
                        }}
                      >
                        Lower Third (LT) Configuration
                      </h4>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: "4px 12px", fontSize: "0.8rem", borderRadius: "6px" }}
                        onClick={() => setIsThemesModalOpen(true)}
                      >
                        Browse LT Themes...
                      </button>
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "16px",
                        background: "rgba(0,0,0,0.25)",
                        padding: "16px",
                        borderRadius: "8px",
                        border: "1px solid rgba(255,255,255,0.08)",
                      }}
                    >
                      <div className="control-group">
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

                      <div className="control-group">
                        <span className="control-label">Vertical Padding (vw)</span>
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
                          Enable Lower Third Background Banner
                        </label>
                      </div>

                      {bibleSettings.enableLowerThirdBg && (
                        <>
                          <div className="control-group">
                            <span className="control-label">Banner Color</span>
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
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                              <span className="control-label">Banner Opacity</span>
                              <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                                {bibleSettings.lowerThirdBgOpacity ?? 50}%
                              </span>
                            </div>
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
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Bible Reference Position */}
                  <div>
                    <h4
                      style={{
                        color: "var(--primary)",
                        fontSize: "0.85rem",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        margin: "0 0 12px 0",
                      }}
                    >
                      Bible Reference Position
                    </h4>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "16px",
                        background: "rgba(0,0,0,0.25)",
                        padding: "16px",
                        borderRadius: "8px",
                        border: "1px solid rgba(255,255,255,0.08)",
                      }}
                    >
                      <div className="control-group">
                        <span className="control-label">Vertical Position</span>
                        <div className="segmented-picker" style={{ display: "flex", width: "100%" }}>
                          <button
                            className={`seg-btn ${bibleSettings.refPosition === "top" ? "active" : ""}`}
                            style={{ flex: 1, padding: "8px 4px" }}
                            onClick={() =>
                              updateBibleSettings({ refPosition: "top" })
                            }
                          >
                            Top (Above Verse)
                          </button>
                          <button
                            className={`seg-btn ${bibleSettings.refPosition === "bottom" ? "active" : ""}`}
                            style={{ flex: 1, padding: "8px 4px" }}
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
                        <div className="segmented-picker" style={{ display: "flex", width: "100%" }}>
                          <button
                            className={`seg-btn ${bibleSettings.refAlign === "left" ? "active" : ""}`}
                            style={{ flex: 1, padding: "8px 4px" }}
                            onClick={() => updateBibleSettings({ refAlign: "left" })}
                          >
                            Left
                          </button>
                          <button
                            className={`seg-btn ${bibleSettings.refAlign === "center" ? "active" : ""}`}
                            style={{ flex: 1, padding: "8px 4px" }}
                            onClick={() =>
                              updateBibleSettings({ refAlign: "center" })
                            }
                          >
                            Center
                          </button>
                          <button
                            className={`seg-btn ${bibleSettings.refAlign === "right" ? "active" : ""}`}
                            style={{ flex: 1, padding: "8px 4px" }}
                            onClick={() => updateBibleSettings({ refAlign: "right" })}
                          >
                            Right
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: TYPOGRAPHY & STYLE */}
              {settingsModalTab === "typography" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
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

                  {/* Song Typography */}
                  <div
                    style={{
                      padding: "16px",
                      background: "rgba(0,0,0,0.25)",
                      borderRadius: "8px",
                      border: "1px solid rgba(255,255,255,0.08)",
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
                      Song Lyrics Typography
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
                      padding: "16px",
                      background: "rgba(0,0,0,0.25)",
                      borderRadius: "8px",
                      border: "1px solid rgba(255,255,255,0.08)",
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
                      Bible Verses Typography
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
                      padding: "16px",
                      background: "rgba(0,0,0,0.25)",
                      borderRadius: "8px",
                      border: "1px solid rgba(255,255,255,0.08)",
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
                      Bible References Typography
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

                  {/* Colors */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "20px",
                      padding: "16px",
                      background: "rgba(0,0,0,0.25)",
                      borderRadius: "8px",
                      border: "1px solid rgba(255,255,255,0.08)",
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
                </div>
              )}

              {/* TAB 3: LIBRARY & BACKUP */}
              {settingsModalTab === "backup" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  {/* Song Library Data */}
                  <div
                    style={{
                      padding: "16px",
                      background: "rgba(0,0,0,0.25)",
                      borderRadius: "8px",
                      border: "1px solid rgba(255,255,255,0.08)",
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
                      Delete all songs currently saved in your local database.
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
                      <Trash2 size={14} /> Delete All Saved Songs (
                      {savedSongs.length})
                    </button>
                  </div>

                  {/* Backup & Restore */}
                  <div
                    style={{
                      padding: "16px",
                      background: "rgba(0,0,0,0.25)",
                      borderRadius: "8px",
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    <h4 style={{ color: "white", marginBottom: "8px", fontSize: "0.95rem" }}>
                      Backup & Restore
                    </h4>
                    <p
                      style={{
                        fontSize: "0.8rem",
                        color: "var(--text-muted)",
                        margin: "0 0 16px 0",
                        lineHeight: 1.4,
                      }}
                    >
                      Export or import your saved songs, settings, and custom configurations.
                    </p>

                    <div style={{ display: "flex", gap: "10px" }}>
                      <button
                        className="btn btn-primary"
                        onClick={() => openExportModal("songs")}
                        style={{ display: "flex", alignItems: "center", gap: "6px" }}
                      >
                        <Download size={14} /> Export Data...
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
                </div>
              )}

              {/* Modal Footer */}
              <div
                style={{
                  borderTop: "1px solid var(--border-subtle)",
                  marginTop: "10px",
                  paddingTop: "16px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "10px",
                }}
              >
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "8px" }}>
                  <span>
                    <kbd style={{ background: "rgba(255,255,255,0.1)", padding: "2px 6px", borderRadius: "4px", color: "white" }}>Esc</kbd> Close without clearing
                  </span>
                  <span>&bull;</span>
                  <span>
                    <kbd style={{ background: "rgba(255,255,255,0.1)", padding: "2px 6px", borderRadius: "4px", color: "white" }}>Ctrl+S</kbd> Save
                  </span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <button
                    className="btn btn-secondary"
                    onClick={() => setIsSettingsOpen(false)}
                    style={{ padding: "8px 18px" }}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={() => {
                      updateDefaultSongSettings(activeSongSettings);
                      saveGlobalSettings();
                      setIsSettingsOpen(false);
                    }}
                    style={{ padding: "8px 24px", fontWeight: "bold" }}
                  >
                    Save Settings (Ctrl+S)
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Background Studio Modal */}
      {isBackgroundModalOpen && (
        <div
          className="modal-overlay"
          style={{
            zIndex: 10000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1.5rem",
          }}
          onClick={() => setIsBackgroundModalOpen(false)}
        >
          <div
            className="modal-content"
            style={{
              maxHeight: "92vh",
              overflowY: "auto",
              background: "rgba(10, 15, 25, 0.98)",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.85)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              width: "720px",
              padding: "0",
              borderRadius: "14px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              className="modal-title"
              style={{
                padding: "16px 24px",
                margin: 0,
                borderBottom: "1px solid var(--border-subtle)",
                background: "rgba(0,0,0,0.4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "10px" }}
              >
                <Palette size={20} style={{ color: "var(--primary)" }} />
                <div>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: "1.1rem",
                      color: "white",
                    }}
                  >
                    Stage Background Studio
                  </div>
                  <div
                    style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}
                  >
                    Configure live projector colors, images, and video motion
                    loops
                  </div>
                </div>
              </div>
              <button
                className="icon-btn"
                onClick={() => setIsBackgroundModalOpen(false)}
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div
              style={{
                padding: "20px 24px",
                display: "flex",
                flexDirection: "column",
                gap: "20px",
              }}
            >
              {/* Live Mini Preview Box with Sample Verse */}
              <div
                style={{
                  borderRadius: "10px",
                  overflow: "hidden",
                  border: "1px solid var(--border-subtle)",
                  position: "relative",
                  aspectRatio: "16 / 9",
                  maxHeight: "220px",
                  width: "100%",
                  backgroundColor:
                    globalSettings.backgroundMode === "solid"
                      ? globalSettings.transparentBackground
                        ? "#000000"
                        : globalSettings.backgroundColor || "#050505"
                      : "#000000",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {/* Background rendering inside preview */}
                {globalSettings.backgroundMode === "solid" &&
                  globalSettings.transparentBackground && (
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        backgroundImage:
                          "linear-gradient(45deg, rgba(255,255,255,0.06) 25%, transparent 25%, transparent 75%, rgba(255,255,255,0.06) 75%, rgba(255,255,255,0.06)), linear-gradient(45deg, rgba(255,255,255,0.06) 25%, transparent 25%, transparent 75%, rgba(255,255,255,0.06) 75%, rgba(255,255,255,0.06))",
                        backgroundSize: "20px 20px",
                        backgroundPosition: "0 0, 10px 10px",
                      }}
                    />
                  )}
                {globalSettings.backgroundMode === "image" &&
                  globalSettings.backgroundUrl && (
                    <>
                      <img
                        src={globalSettings.backgroundUrl}
                        alt="preview"
                        style={{
                          position: "absolute",
                          inset: 0,
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          backgroundColor: `rgba(0,0,0, ${(globalSettings.backgroundDim ?? 25) / 100})`,
                        }}
                      />
                    </>
                  )}
                {globalSettings.backgroundMode === "video" &&
                  globalSettings.backgroundUrl && (
                    <>
                      <video
                        key={globalSettings.backgroundUrl}
                        src={globalSettings.backgroundUrl}
                        autoPlay
                        loop
                        muted
                        playsInline
                        style={{
                          position: "absolute",
                          inset: 0,
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          backgroundColor: `rgba(0,0,0, ${(globalSettings.backgroundDim ?? 25) / 100})`,
                        }}
                      />
                    </>
                  )}

                {/* Sample overlay text to test readability */}
                <div
                  style={{
                    position: "relative",
                    zIndex: 2,
                    textAlign: "center",
                    padding: "0 24px",
                    textShadow: "0 2px 10px rgba(0,0,0,0.8)",
                  }}
                >
                  <p
                    style={{
                      margin: 0,
                      fontSize: "1.05rem",
                      fontWeight: 600,
                      color: "white",
                      lineHeight: 1.4,
                    }}
                  >
                    "Thy word is a lamp unto my feet, and a light unto my
                    path."
                  </p>
                  <span
                    style={{
                      display: "block",
                      marginTop: "6px",
                      fontSize: "0.8rem",
                      fontWeight: 700,
                      color: "rgba(255,255,255,0.9)",
                    }}
                  >
                    Psalm 119:105
                  </span>
                </div>

                {/* Status Pill in corner */}
                <div
                  style={{
                    position: "absolute",
                    top: "10px",
                    right: "10px",
                    zIndex: 3,
                    background: "rgba(0,0,0,0.7)",
                    backdropFilter: "blur(6px)",
                    padding: "3px 8px",
                    borderRadius: "6px",
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    color: "white",
                    border: "1px solid rgba(255,255,255,0.15)",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  {globalSettings.backgroundMode === "solid"
                    ? globalSettings.transparentBackground
                      ? "OBS Transparent"
                      : `Solid: ${globalSettings.backgroundColor}`
                    : `${globalSettings.backgroundMode.toUpperCase()} BACKGROUND`}
                </div>
              </div>

              {/* Tab Navigation */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: "6px",
                  background: "rgba(15, 23, 42, 0.6)",
                  padding: "4px",
                  borderRadius: "8px",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                <button
                  className={`seg-btn ${backgroundModalTab === "solid" ? "active" : ""}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    padding: "8px",
                    fontSize: "0.85rem",
                  }}
                  onClick={() => {
                    setBackgroundModalTab("solid");
                    updateGlobalSettings({ backgroundMode: "solid" });
                  }}
                >
                  <Palette size={15} />
                  Solid Color
                </button>
                <button
                  className={`seg-btn ${backgroundModalTab === "image" ? "active" : ""}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    padding: "8px",
                    fontSize: "0.85rem",
                  }}
                  onClick={() => {
                    setBackgroundModalTab("image");
                    updateGlobalSettings({ backgroundMode: "image" });
                  }}
                >
                  <ImageIcon size={15} />
                  Image Background
                </button>
                <button
                  className={`seg-btn ${backgroundModalTab === "video" ? "active" : ""}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    padding: "8px",
                    fontSize: "0.85rem",
                  }}
                  onClick={() => {
                    setBackgroundModalTab("video");
                    updateGlobalSettings({ backgroundMode: "video" });
                  }}
                >
                  <VideoIcon size={15} />
                  Video Motion
                </button>
              </div>

              {/* TAB 1: SOLID COLOR */}
              {backgroundModalTab === "solid" && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "16px",
                  }}
                >
                  <div>
                    <span
                      style={{
                        display: "block",
                        fontSize: "0.8rem",
                        fontWeight: 600,
                        color: "var(--text-muted)",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        marginBottom: "10px",
                      }}
                    >
                      Curated Stage Colors
                    </span>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(5, 1fr)",
                        gap: "10px",
                      }}
                    >
                      {BACKGROUND_COLOR_PRESETS.map((preset) => {
                        const isSelected =
                          globalSettings.backgroundMode === "solid" &&
                          !globalSettings.transparentBackground &&
                          globalSettings.backgroundColor.toLowerCase() ===
                            preset.color.toLowerCase();
                        return (
                          <button
                            key={preset.color}
                            onClick={() =>
                              updateGlobalSettings({
                                backgroundMode: "solid",
                                backgroundColor: preset.color,
                                transparentBackground: false,
                              })
                            }
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              gap: "8px",
                              padding: "10px 6px",
                              borderRadius: "8px",
                              background: isSelected
                                ? "rgba(99, 102, 241, 0.15)"
                                : "rgba(255, 255, 255, 0.03)",
                              border: isSelected
                                ? "2px solid var(--primary)"
                                : "1px solid var(--border-subtle)",
                              cursor: "pointer",
                              transition: "all 0.2s",
                            }}
                          >
                            <div
                              style={{
                                width: "36px",
                                height: "36px",
                                borderRadius: "6px",
                                backgroundColor: preset.color,
                                border: "1px solid rgba(255,255,255,0.2)",
                                boxShadow: "0 2px 5px rgba(0,0,0,0.5)",
                              }}
                            />
                            <span
                              style={{
                                fontSize: "0.75rem",
                                color: isSelected
                                  ? "white"
                                  : "var(--text-secondary)",
                                fontWeight: isSelected ? 700 : 500,
                                textAlign: "center",
                              }}
                            >
                              {preset.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Custom Color & Transparency */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "16px",
                      padding: "14px 16px",
                      background: "rgba(0,0,0,0.25)",
                      borderRadius: "8px",
                      border: "1px solid var(--border-subtle)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "0.85rem",
                          fontWeight: 600,
                          color: "white",
                        }}
                      >
                        Custom Color:
                      </span>
                      <div
                        style={{
                          position: "relative",
                          width: "38px",
                          height: "32px",
                          borderRadius: "6px",
                          overflow: "hidden",
                          border: "1px solid rgba(255,255,255,0.2)",
                        }}
                      >
                        <input
                          type="color"
                          value={globalSettings.backgroundColor}
                          onChange={(e) =>
                            updateGlobalSettings({
                              backgroundMode: "solid",
                              backgroundColor: e.target.value,
                              transparentBackground: false,
                            })
                          }
                          style={{
                            position: "absolute",
                            inset: "-5px",
                            width: "140%",
                            height: "140%",
                            cursor: "pointer",
                            border: "none",
                            background: "transparent",
                          }}
                        />
                      </div>
                      <span
                        style={{
                          fontFamily: "monospace",
                          fontSize: "0.85rem",
                          color: "var(--text-secondary)",
                        }}
                      >
                        {globalSettings.backgroundColor}
                      </span>
                    </div>

                    <button
                      className={`seg-btn ${globalSettings.transparentBackground ? "active" : ""}`}
                      style={{
                        padding: "6px 14px",
                        fontSize: "0.8rem",
                        borderRadius: "6px",
                        border: "1px solid var(--border-subtle)",
                      }}
                      onClick={() =>
                        updateGlobalSettings({
                          backgroundMode: "solid",
                          transparentBackground:
                            !globalSettings.transparentBackground,
                        })
                      }
                    >
                      {globalSettings.transparentBackground
                        ? "OBS TRANSPARENT: ACTIVE"
                        : "ENABLE OBS TRANSPARENT"}
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 2: IMAGE BACKGROUND */}
              {backgroundModalTab === "image" && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "18px",
                  }}
                >
                  {/* Upload Card */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "16px",
                      padding: "16px",
                      background: "rgba(0,0,0,0.25)",
                      borderRadius: "8px",
                      border: "1px dashed rgba(255,255,255,0.2)",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: "0.9rem",
                          color: "white",
                        }}
                      >
                        Upload Custom Background Image
                      </div>
                      <div
                        style={{
                          fontSize: "0.75rem",
                          color: "var(--text-muted)",
                          marginTop: "2px",
                        }}
                      >
                        Supports JPG, PNG, WebP, SVG (1920x1080 recommended)
                      </div>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        gap: "8px",
                        alignItems: "center",
                      }}
                    >
                      <label
                        className="btn btn-primary"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          margin: 0,
                          cursor: "pointer",
                          padding: "8px 16px",
                          fontSize: "0.85rem",
                        }}
                      >
                        <Upload size={14} />
                        Choose File
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: "none" }}
                          onChange={(e) => handleMediaUpload(e, "image")}
                        />
                      </label>
                      {globalSettings.backgroundMode === "image" &&
                        globalSettings.backgroundUrl && (
                          <button
                            className="btn btn-secondary"
                            style={{
                              color: "#ef4444",
                              padding: "8px 12px",
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                              fontSize: "0.85rem",
                            }}
                            onClick={handleClearBackgroundMedia}
                            title="Remove active image"
                          >
                            <Trash2 size={14} />
                            Remove
                          </button>
                        )}
                    </div>
                  </div>

                  {/* Curated Presets */}
                  <div>
                    <span
                      style={{
                        display: "block",
                        fontSize: "0.8rem",
                        fontWeight: 600,
                        color: "var(--text-muted)",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        marginBottom: "10px",
                      }}
                    >
                      Preset Worship Backgrounds
                    </span>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(5, 1fr)",
                        gap: "10px",
                      }}
                    >
                      {BACKGROUND_IMAGE_PRESETS.map((preset) => {
                        const isSelected =
                          globalSettings.backgroundMode === "image" &&
                          globalSettings.backgroundUrl === preset.url;
                        return (
                          <div
                            key={preset.url}
                            onClick={() =>
                              updateGlobalSettings({
                                backgroundMode: "image",
                                backgroundUrl: preset.url,
                              })
                            }
                            style={{
                              borderRadius: "8px",
                              overflow: "hidden",
                              cursor: "pointer",
                              border: isSelected
                                ? "2px solid var(--primary)"
                                : "1px solid var(--border-subtle)",
                              position: "relative",
                              aspectRatio: "16 / 10",
                              background: "#050505",
                              transition: "all 0.2s",
                            }}
                          >
                            <img
                              src={preset.url}
                              alt={preset.name}
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                display: "block",
                              }}
                            />
                            <div
                              style={{
                                position: "absolute",
                                bottom: 0,
                                left: 0,
                                right: 0,
                                padding: "4px 6px",
                                background: "rgba(0,0,0,0.75)",
                                fontSize: "0.7rem",
                                fontWeight: 600,
                                color: "white",
                                textAlign: "center",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              {preset.name}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Readability Dimming Slider */}
                  <div
                    style={{
                      padding: "14px 16px",
                      background: "rgba(0,0,0,0.25)",
                      borderRadius: "8px",
                      border: "1px solid var(--border-subtle)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "0.85rem",
                          fontWeight: 600,
                          color: "white",
                        }}
                      >
                        Text Readability Dimming Overlay
                      </span>
                      <span
                        style={{
                          fontSize: "0.85rem",
                          fontWeight: 700,
                          color: "var(--primary)",
                        }}
                      >
                        {globalSettings.backgroundDim ?? 25}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="80"
                      value={globalSettings.backgroundDim ?? 25}
                      onChange={(e) =>
                        updateGlobalSettings({
                          backgroundDim: parseInt(e.target.value, 10),
                        })
                      }
                      style={{
                        width: "100%",
                        cursor: "pointer",
                        accentColor: "var(--primary)",
                      }}
                    />
                    <span
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--text-muted)",
                      }}
                    >
                      Darkens image backgrounds so projected lyrics and
                      scripture remain crisp and legible on stage.
                    </span>
                  </div>
                </div>
              )}

              {/* TAB 3: VIDEO MOTION */}
              {backgroundModalTab === "video" && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "18px",
                  }}
                >
                  {/* Upload Card */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "16px",
                      padding: "16px",
                      background: "rgba(0,0,0,0.25)",
                      borderRadius: "8px",
                      border: "1px dashed rgba(255,255,255,0.2)",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: "0.9rem",
                          color: "white",
                        }}
                      >
                        Upload Video Motion Loop
                      </div>
                      <div
                        style={{
                          fontSize: "0.75rem",
                          color: "var(--text-muted)",
                          marginTop: "2px",
                        }}
                      >
                        Supports MP4, WebM, MOV. Loops seamlessly in background.
                      </div>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        gap: "8px",
                        alignItems: "center",
                      }}
                    >
                      <label
                        className="btn btn-primary"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          margin: 0,
                          cursor: "pointer",
                          padding: "8px 16px",
                          fontSize: "0.85rem",
                        }}
                      >
                        <Upload size={14} />
                        Choose Video
                        <input
                          type="file"
                          accept="video/*"
                          style={{ display: "none" }}
                          onChange={(e) => handleMediaUpload(e, "video")}
                        />
                      </label>
                      {globalSettings.backgroundMode === "video" &&
                        globalSettings.backgroundUrl && (
                          <button
                            className="btn btn-secondary"
                            style={{
                              color: "#ef4444",
                              padding: "8px 12px",
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                              fontSize: "0.85rem",
                            }}
                            onClick={handleClearBackgroundMedia}
                            title="Remove active video"
                          >
                            <Trash2 size={14} />
                            Remove
                          </button>
                        )}
                    </div>
                  </div>

                  {/* Active Video Status */}
                  {globalSettings.backgroundMode === "video" &&
                  globalSettings.backgroundUrl ? (
                    <div
                      style={{
                        padding: "12px 16px",
                        background: "rgba(16, 185, 129, 0.1)",
                        borderRadius: "8px",
                        border: "1px solid rgba(16, 185, 129, 0.3)",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                      }}
                    >
                      <Check size={18} style={{ color: "#10b981" }} />
                      <div style={{ flex: 1, overflow: "hidden" }}>
                        <span
                          style={{
                            fontSize: "0.8rem",
                            color: "#10b981",
                            fontWeight: 700,
                            display: "block",
                          }}
                        >
                          Active Motion Loop Playing
                        </span>
                        <span
                          style={{
                            fontSize: "0.75rem",
                            color: "var(--text-muted)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            display: "block",
                          }}
                        >
                          {globalSettings.backgroundUrl}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div
                      style={{
                        padding: "20px",
                        textAlign: "center",
                        background: "rgba(255, 255, 255, 0.02)",
                        borderRadius: "8px",
                        border: "1px solid var(--border-subtle)",
                      }}
                    >
                      <VideoIcon
                        size={28}
                        style={{
                          opacity: 0.3,
                          color: "var(--text-muted)",
                          margin: "0 auto 8px",
                        }}
                      />
                      <div
                        style={{
                          fontSize: "0.85rem",
                          fontWeight: 600,
                          color: "var(--text-secondary)",
                        }}
                      >
                        No video loop currently uploaded
                      </div>
                      <div
                        style={{
                          fontSize: "0.75rem",
                          color: "var(--text-muted)",
                          marginTop: "4px",
                        }}
                      >
                        Upload an MP4 or WebM motion loop above to play
                        continuous ambient background motion on your live
                        screen.
                      </div>
                    </div>
                  )}

                  {/* Readability Dimming Slider */}
                  <div
                    style={{
                      padding: "14px 16px",
                      background: "rgba(0,0,0,0.25)",
                      borderRadius: "8px",
                      border: "1px solid var(--border-subtle)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "0.85rem",
                          fontWeight: 600,
                          color: "white",
                        }}
                      >
                        Text Readability Dimming Overlay
                      </span>
                      <span
                        style={{
                          fontSize: "0.85rem",
                          fontWeight: 700,
                          color: "var(--primary)",
                        }}
                      >
                        {globalSettings.backgroundDim ?? 25}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="80"
                      value={globalSettings.backgroundDim ?? 25}
                      onChange={(e) =>
                        updateGlobalSettings({
                          backgroundDim: parseInt(e.target.value, 10),
                        })
                      }
                      style={{
                        width: "100%",
                        cursor: "pointer",
                        accentColor: "var(--primary)",
                      }}
                    />
                    <span
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--text-muted)",
                      }}
                    >
                      Darkens video loops so lyrics and verses stand out with
                      high contrast.
                    </span>
                  </div>
                </div>
              )}

              {/* Bottom Actions */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  borderTop: "1px solid var(--border-subtle)",
                  paddingTop: "16px",
                }}
              >
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    saveGlobalSettings();
                    setIsBackgroundModalOpen(false);
                    toast.success("Background settings saved!");
                  }}
                  style={{ padding: "8px 20px" }}
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Export Modal with Song Selection & Settings Option */}
      {showExportModal && (
        <div
          className="modal-overlay"
          style={{ justifyContent: "center", alignItems: "center", padding: "1.5rem", zIndex: 10000 }}
          onClick={() => setShowExportModal(false)}
        >
          <div
            className="modal-content"
            style={{
              maxHeight: "90vh",
              overflowY: "auto",
              background: "rgba(10, 15, 25, 0.98)",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.85)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              width: "560px",
              padding: "0",
              borderRadius: "14px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              className="modal-title"
              style={{
                padding: "16px 20px",
                margin: 0,
                borderBottom: "1px solid var(--border-subtle)",
                background: "rgba(0,0,0,0.35)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Download size={20} style={{ color: "var(--primary)" }} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: "1.05rem", color: "white" }}>
                    Export Projector Data
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    Select specific songs to export or back up global stage settings
                  </div>
                </div>
              </div>
              <button
                className="icon-btn"
                onClick={() => setShowExportModal(false)}
                title="Close (Esc)"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Tabs: Songs vs Global Settings */}
            <div style={{ padding: "16px 20px 0 20px" }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "6px",
                  background: "rgba(15, 23, 42, 0.6)",
                  padding: "4px",
                  borderRadius: "8px",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                <button
                  className={`seg-btn ${exportModalTab === "songs" ? "active" : ""}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    padding: "8px",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                  }}
                  onClick={() => setExportModalTab("songs")}
                >
                  <Music size={14} /> Export Songs ({savedSongs.length})
                </button>
                <button
                  className={`seg-btn ${exportModalTab === "settings" ? "active" : ""}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    padding: "8px",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                  }}
                  onClick={() => setExportModalTab("settings")}
                >
                  <Settings size={14} /> Export Global Settings
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div style={{ padding: "16px 20px 20px 20px" }}>
              {exportModalTab === "songs" ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {/* Search Bar for Songs */}
                  <div style={{ position: "relative" }}>
                    <Search
                      size={15}
                      style={{
                        position: "absolute",
                        left: "12px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "var(--text-muted)",
                        pointerEvents: "none",
                      }}
                    />
                    <input
                      type="text"
                      className="input"
                      placeholder="Search songs to export by title or lyrics..."
                      value={exportSearchQuery}
                      onChange={(e) => setExportSearchQuery(e.target.value)}
                      style={{
                        paddingLeft: "36px",
                        paddingRight: exportSearchQuery ? "32px" : "12px",
                        width: "100%",
                        borderRadius: "8px",
                        fontSize: "0.85rem",
                      }}
                    />
                    {exportSearchQuery && (
                      <button
                        className="icon-btn"
                        style={{
                          position: "absolute",
                          right: "8px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          width: "20px",
                          height: "20px",
                          padding: 0,
                        }}
                        onClick={() => setExportSearchQuery("")}
                        title="Clear search"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>

                  {/* Selection Status & Batch Controls */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "0 2px",
                    }}
                  >
                    <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                      Selected:{" "}
                      <strong style={{ color: "white" }}>
                        {selectedExportSongIds.size}
                      </strong>{" "}
                      of {savedSongs.length} songs
                    </span>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: "3px 8px", fontSize: "0.75rem", borderRadius: "5px" }}
                        onClick={selectAllFilteredExportSongs}
                        title="Select all matching songs"
                      >
                        Select All {exportSearchQuery ? `(${filteredExportSongs.length})` : ""}
                      </button>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: "3px 8px", fontSize: "0.75rem", borderRadius: "5px" }}
                        onClick={deselectAllFilteredExportSongs}
                        title="Clear song selection"
                      >
                        Deselect All
                      </button>
                    </div>
                  </div>

                  {/* Scrollable Songs Checklist */}
                  <div
                    style={{
                      maxHeight: "280px",
                      overflowY: "auto",
                      display: "flex",
                      flexDirection: "column",
                      gap: "6px",
                      border: "1px solid var(--border-subtle)",
                      borderRadius: "8px",
                      padding: "8px",
                      background: "rgba(0,0,0,0.3)",
                    }}
                  >
                    {savedSongs.length === 0 ? (
                      <div
                        style={{
                          padding: "2rem",
                          textAlign: "center",
                          color: "var(--text-muted)",
                          fontSize: "0.85rem",
                        }}
                      >
                        No songs found in local database.
                      </div>
                    ) : filteredExportSongs.length === 0 ? (
                      <div
                        style={{
                          padding: "2rem",
                          textAlign: "center",
                          color: "var(--text-muted)",
                          fontSize: "0.85rem",
                        }}
                      >
                        No songs matching "{exportSearchQuery}".
                      </div>
                    ) : (
                      filteredExportSongs.map((song) => {
                        const isChecked = selectedExportSongIds.has(song.id);
                        return (
                          <div
                            key={song.id}
                            onClick={() => toggleSongExportSelection(song.id)}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "10px",
                              padding: "8px 12px",
                              borderRadius: "6px",
                              background: isChecked
                                ? "rgba(79, 70, 229, 0.15)"
                                : "rgba(255, 255, 255, 0.02)",
                              border: `1px solid ${
                                isChecked
                                  ? "rgba(79, 70, 229, 0.45)"
                                  : "rgba(255, 255, 255, 0.06)"
                              }`,
                              cursor: "pointer",
                              transition: "all 0.15s ease",
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {}}
                              style={{ cursor: "pointer", accentColor: "var(--primary)" }}
                            />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "8px",
                                }}
                              >
                                <span
                                  style={{
                                    fontWeight: 600,
                                    color: "white",
                                    fontSize: "0.85rem",
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                  }}
                                >
                                  {song.title}
                                </span>
                                {song.artist && song.artist !== "Unknown" && (
                                  <span
                                    style={{
                                      fontSize: "0.75rem",
                                      color: "var(--primary-light)",
                                      opacity: 0.85,
                                    }}
                                  >
                                    &bull; {song.artist}
                                  </span>
                                )}
                              </div>
                              {song.lyrics && (
                                <p
                                  style={{
                                    margin: "2px 0 0 0",
                                    fontSize: "0.72rem",
                                    color: "var(--text-muted)",
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                  }}
                                >
                                  {song.lyrics.split("\n").filter(Boolean)[0] || ""}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Songs Tab Footer */}
                  <div
                    style={{
                      borderTop: "1px solid var(--border-subtle)",
                      marginTop: "6px",
                      paddingTop: "14px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <button
                      className="btn btn-secondary"
                      onClick={() => setShowExportModal(false)}
                    >
                      Cancel
                    </button>
                    <button
                      className="btn btn-primary"
                      disabled={selectedExportSongIds.size === 0}
                      onClick={() => {
                        handleExportSongs(Array.from(selectedExportSongIds));
                        setShowExportModal(false);
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "8px 20px",
                        fontWeight: 600,
                        opacity: selectedExportSongIds.size === 0 ? 0.5 : 1,
                        cursor:
                          selectedExportSongIds.size === 0
                            ? "not-allowed"
                            : "pointer",
                      }}
                    >
                      <Download size={14} />
                      Export {selectedExportSongIds.size}{" "}
                      {selectedExportSongIds.size === 1 ? "Song" : "Songs"}
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {/* Global Settings Export Details */}
                  <div
                    style={{
                      padding: "16px",
                      background: "rgba(0,0,0,0.25)",
                      borderRadius: "8px",
                      border: "1px solid rgba(255,255,255,0.08)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px",
                    }}
                  >
                    <div style={{ fontWeight: 600, color: "white", fontSize: "0.95rem" }}>
                      System Presentation & Stage Settings
                    </div>
                    <p
                      style={{
                        margin: 0,
                        fontSize: "0.82rem",
                        color: "var(--text-muted)",
                        lineHeight: 1.5,
                      }}
                    >
                      Exports a portable JSON backup containing all stage layout preferences,
                      including:
                    </p>
                    <ul
                      style={{
                        margin: "0 0 0 16px",
                        padding: 0,
                        fontSize: "0.8rem",
                        color: "var(--text-secondary)",
                        lineHeight: 1.6,
                      }}
                    >
                      <li>Stage background presets (Solid colors, uploaded images, video loops)</li>
                      <li>Screen positioning (Pos Y, Pos X, and side margins)</li>
                      <li>Typography fonts, line modes, and text shadow intensities</li>
                      <li>Lower-Third theme configurations, widths, and opacities</li>
                      <li>Scripture presentation settings and reference alignments</li>
                    </ul>
                  </div>

                  {/* Settings Tab Footer */}
                  <div
                    style={{
                      borderTop: "1px solid var(--border-subtle)",
                      marginTop: "6px",
                      paddingTop: "14px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <button
                      className="btn btn-secondary"
                      onClick={() => setShowExportModal(false)}
                    >
                      Cancel
                    </button>
                    <button
                      className="btn btn-primary"
                      onClick={() => {
                        handleExportSettings();
                        setShowExportModal(false);
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "8px 20px",
                        fontWeight: 600,
                      }}
                    >
                      <Download size={14} />
                      Export Global Settings (JSON)
                    </button>
                  </div>
                </div>
              )}
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
            className="btn btn-secondary"
            title="Launch Projector (Ctrl+Alt+P / Ctrl+Shift+P)"
            onClick={launchProjector}
            style={{
              height: "34px",
              padding: "0 12px",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "0.8rem",
              fontWeight: 600,
              borderRadius: "6px",
              color: "var(--primary)",
              borderColor: "rgba(99, 102, 241, 0.4)",
              background: "rgba(99, 102, 241, 0.08)",
            }}
          >
            <MonitorPlay size={15} />
            <span>Launch Projector</span>
          </button>
          <button
            className="icon-btn"
            title="Settings"
            onClick={() => setIsSettingsOpen(true)}
            style={{
              height: "34px",
              width: "34px",
              borderRadius: "6px",
              border: "1px solid var(--border-subtle)",
              background: "rgba(255, 255, 255, 0.04)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Settings size={16} />
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
            >
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
                    cursor: isUploadingBible ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                  }}
                >
                  {isUploadingBible ? (
                    <>
                      <Loader size={16} style={{ animation: "spin 1.5s linear infinite" }} />
                      Saving to BIBLE folder...
                    </>
                  ) : (
                    <>
                      <Upload size={16} /> Import Bible XML
                    </>
                  )}
                  <input
                    type="file"
                    accept=".xml"
                    hidden
                    disabled={isUploadingBible}
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
                                    await bibleService.deleteBibleFromServer(`${b.name}.xml`);
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
                        <Music size={15} color="var(--primary)" />
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
                      Hover to preview full lyrics. Click any song to import
                      into your library.
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
                    setActiveSongFilename("");
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
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px",
                      }}
                      onClick={handleOnlineSongSearch}
                      disabled={!songSearchTitle || isSearchingSong}
                    >
                      <Search size={15} />
                      <span>{isSearchingSong ? "Searching..." : "Get Lyrics Online"}</span>
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
                  {/* Local Saved Songs Search Bar */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      background: "rgba(15, 23, 42, 0.7)",
                      border: "1px solid var(--border-subtle)",
                      borderRadius: "6px",
                      padding: "6px 10px",
                      gap: "8px",
                      marginBottom: "10px",
                      flexShrink: 0,
                    }}
                  >
                    <Search
                      size={13}
                      style={{ color: "var(--primary)", flexShrink: 0 }}
                    />
                    <input
                      type="text"
                      placeholder="Search songs (e.g. 'Way Maker')..."
                      value={savedSongSearchQuery}
                      onChange={(e) => setSavedSongSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && filteredSavedSongs.length > 0) {
                          handleSelectSong(filteredSavedSongs[0], "none");
                        }
                      }}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "white",
                        fontSize: "0.82rem",
                        flex: 1,
                        outline: "none",
                      }}
                    />
                    {savedSongSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setSavedSongSearchQuery("")}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "var(--text-muted)",
                          cursor: "pointer",
                          padding: 0,
                          display: "flex",
                        }}
                        title="Clear search"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>

                  {isSongsLoading ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", padding: "6px 0" }}>
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div
                          key={i}
                          style={{
                            height: "44px",
                            borderRadius: "6px",
                            background: "rgba(255, 255, 255, 0.05)",
                            display: "flex",
                            alignItems: "center",
                            padding: "0 12px",
                            gap: "10px",
                          }}
                        >
                          <div style={{ width: "24px", height: "24px", borderRadius: "4px", background: "rgba(255,255,255,0.08)" }} />
                          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
                            <div style={{ width: "65%", height: "10px", borderRadius: "3px", background: "rgba(255,255,255,0.1)" }} />
                            <div style={{ width: "40%", height: "8px", borderRadius: "3px", background: "rgba(255,255,255,0.06)" }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : savedSongs.length === 0 ? (
                    <p
                      style={{
                        fontSize: "0.8rem",
                        color: "var(--text-muted)",
                      }}
                    >
                      No songs saved yet. Add or import songs in the Songs tab.
                    </p>
                  ) : filteredSavedSongs.length === 0 ? (
                    <div
                      style={{
                        padding: "1rem",
                        textAlign: "center",
                        color: "var(--text-muted)",
                        fontSize: "0.8rem",
                      }}
                    >
                      No songs match "{savedSongSearchQuery}"
                    </div>
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
                      {filteredSavedSongs.map((s, idx) => (
                        <div
                          key={s.id || idx}
                          style={{
                            padding: "8px 10px",
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
                            alignItems: "center",
                            gap: "8px",
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
                                  fontSize: "0.72rem",
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
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                          >
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectSong(s, "first");
                              }}
                              style={{
                                background: "rgba(99, 102, 241, 0.2)",
                                border: "1px solid rgba(99, 102, 241, 0.4)",
                                color: "#a5b4fc",
                                borderRadius: "4px",
                                width: "24px",
                                height: "24px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer",
                                padding: 0,
                              }}
                              title="Play Direct (Go Live)"
                            >
                              <Play size={10} fill="currentColor" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                addToSongQueue(s);
                              }}
                              style={{
                                background: songQueue.some((q) => q.songId === s.id)
                                  ? "rgba(34, 197, 94, 0.2)"
                                  : "rgba(255, 255, 255, 0.08)",
                                border: songQueue.some((q) => q.songId === s.id)
                                  ? "1px solid rgba(34, 197, 94, 0.4)"
                                  : "1px solid rgba(255, 255, 255, 0.15)",
                                color: songQueue.some((q) => q.songId === s.id)
                                  ? "#4ade80"
                                  : "#e2e8f0",
                                borderRadius: "4px",
                                width: "24px",
                                height: "24px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer",
                                padding: 0,
                              }}
                              title={
                                songQueue.some((q) => q.songId === s.id)
                                  ? "In Queue (Click to Add Again)"
                                  : "Add to Song Queue"
                              }
                            >
                              <Plus size={12} />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSongToDelete({
                                  id: s.id,
                                  title: s.title,
                                  filename: s.filename,
                                });
                              }}
                              style={{
                                background: "transparent",
                                border: "none",
                                color: "var(--text-muted)",
                                cursor: "pointer",
                                padding: "4px",
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
                              title="Delete Song"
                            >
                              <X size={14} />
                            </button>
                          </div>
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
                    <Sliders size={18} color="var(--primary)" />
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
                    style={{ flex: 2, padding: "8px 12px", height: "38px", fontSize: "0.9rem" }}
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
                    style={{ flex: 1, padding: "8px 12px", height: "38px", fontSize: "0.9rem" }}
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
                            padding: "10px 14px",
                            borderRadius: "6px",
                            cursor: "pointer",
                            backgroundColor: isLive
                              ? "var(--primary-light)"
                              : "transparent",
                            border: "1px solid",
                            borderColor: isLive
                              ? "var(--primary)"
                              : "transparent",
                            transition: "all 0.15s",
                            display: "flex",
                            alignItems: "flex-start",
                            gap: "12px",
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
                              fontWeight: 700,
                              fontSize: "0.85rem",
                              lineHeight: "1.5",
                              minWidth: "24px",
                              flexShrink: 0,
                            }}
                          >
                            {verse.number}
                          </span>
                          <span style={{ fontSize: "0.95rem", lineHeight: "1.55", color: "var(--text-main)" }}>
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
                      className="input"
                      style={{
                        height: "38px",
                        flex: "none",
                        fontSize: "0.95rem",
                        fontWeight: 600,
                        padding: "8px 12px",
                      }}
                    />
                    <input
                      type="text"
                      placeholder="Artist (Optional)"
                      value={activeSongArtist}
                      onChange={(e) => setActiveSongArtist(e.target.value)}
                      className="input"
                      style={{
                        height: "38px",
                        flex: "none",
                        fontSize: "0.9rem",
                        padding: "8px 12px",
                      }}
                    />
                    <textarea
                      className="lyric-textarea"
                      placeholder="Type or paste lyrics here. You can also import a .txt file from the sidebar!"
                      value={lyrics}
                      onChange={(e) => setLyrics(e.target.value)}
                      style={{
                        flex: 1,
                        background: "rgba(15, 23, 42, 0.5)",
                        border: "1px solid var(--border-subtle)",
                        borderRadius: "8px",
                        padding: "12px",
                        color: "white",
                        fontFamily: "inherit",
                        fontSize: "1rem",
                        lineHeight: 1.5,
                      }}
                    />
                    <button
                      className="btn btn-primary"
                      style={{
                        alignSelf: "flex-end",
                        flex: "none",
                        padding: "8px 20px",
                        fontSize: "0.9rem",
                        fontWeight: 600,
                        borderRadius: "6px",
                      }}
                      onClick={async () => {
                        if (!activeSongTitle.trim()) {
                          toast.error("Please enter a song title.");
                          return;
                        }
                        try {
                          if (activeSongId) {
                            await updateSong(
                              activeSongId,
                              activeSongTitle,
                              activeSongArtist,
                              lyrics,
                              activeSongSettings,
                              activeSongFilename,
                            );
                            toast.success("Song updated in songs folder!");
                          } else {
                            const newId = await addSong(
                              activeSongTitle,
                              activeSongArtist,
                              lyrics,
                              activeSongSettings,
                            );
                            setActiveSongId(newId);
                            setActiveSongFilename(
                              `${activeSongTitle.trim().replace(/[<>:"/\\|?*]/g, "_")}.txt`,
                            );
                            toast.success("Song saved to songs folder!");
                          }
                          await loadSongs();
                          setSongViewMode("play");
                        } catch (e) {
                          toast.error("Failed to save song");
                        }
                      }}
                    >
                      Save Song
                    </button>
                  </div>
                ) : (
                  <div
                    style={{
                      height: "100%",
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
                        padding: "8px 14px",
                        background: "rgba(15, 23, 42, 0.6)",
                        borderRadius: "8px",
                        border: "1px solid var(--border-subtle)",
                        flexShrink: 0,
                        gap: "12px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          minWidth: 0,
                          flex: 1,
                        }}
                      >
                        <Music
                          size={16}
                          style={{ color: "var(--primary)", flexShrink: 0 }}
                        />
                        <span
                          style={{
                            fontWeight: 700,
                            fontSize: "0.95rem",
                            color: "var(--text-main)",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {activeSongTitle || "Untitled Song"}
                        </span>
                        {activeSongArtist && (
                          <span
                            style={{
                              fontSize: "0.8rem",
                              color: "var(--text-muted)",
                              whiteSpace: "nowrap",
                            }}
                          >
                            • {activeSongArtist}
                          </span>
                        )}
                        <span
                          style={{
                            fontSize: "0.72rem",
                            background: "rgba(255,255,255,0.08)",
                            padding: "2px 8px",
                            borderRadius: "10px",
                            color: "var(--text-muted)",
                            fontWeight: 600,
                            flexShrink: 0,
                          }}
                        >
                          {songChunks.length} slide
                          {songChunks.length === 1 ? "" : "s"}
                        </span>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          flexShrink: 0,
                        }}
                      >
                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{
                            padding: "5px 12px",
                            fontSize: "0.78rem",
                            borderRadius: "6px",
                          }}
                          onClick={() => setSongViewMode("edit")}
                        >
                          Edit Song
                        </button>
                        {songChunks.length > 0 && (
                          <button
                            type="button"
                            className="btn btn-primary"
                            style={{
                              padding: "5px 12px",
                              fontSize: "0.78rem",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "5px",
                              borderRadius: "6px",
                            }}
                            onClick={() =>
                              handleProjectSongChunk(songChunks[0], 0)
                            }
                          >
                            <Play size={11} fill="currentColor" /> Project First
                            Slide
                          </button>
                        )}
                      </div>
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fill, minmax(200px, 1fr))",
                        gap: "12px",
                        overflowY: "auto",
                        alignContent: "start",
                        padding: "4px",
                        flex: 1,
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
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Streamlined Live Controls Bar */}
          <div className="live-controls-bar">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "12px",
                flexWrap: "wrap",
                width: "100%",
              }}
            >
              {/* Primary Actions: Clear (Esc) & Project Live */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <button
                  className="btn"
                  style={{
                    background: "transparent",
                    border: "1px solid var(--border-subtle)",
                    color: "white",
                    height: "36px",
                    padding: "0 18px",
                    fontWeight: 600,
                    borderRadius: "6px",
                    transition: "all 0.2s",
                    fontSize: "0.85rem",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  onClick={handleClear}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background =
                      "rgba(255,255,255,0.1)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                  title="Clear live output (Esc)"
                >
                  Clear (Esc)
                </button>
                <button
                  className="btn btn-primary"
                  style={{
                    background: "var(--primary)",
                    borderColor: "var(--primary)",
                    height: "36px",
                    padding: "0 24px",
                    fontWeight: "bold",
                    fontSize: "0.95rem",
                    borderRadius: "6px",
                    boxShadow: "0 4px 12px rgba(79, 70, 229, 0.4)",
                    transition: "transform 0.2s",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
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
                    (e.currentTarget.style.transform = "scale(1.03)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.transform = "scale(1)")
                  }
                  title="Send selected item live to stage / OBS"
                >
                  Project Live
                </button>
              </div>

              {/* Quick Live Selectors: Mode & Lines */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "14px",
                  background: "rgba(15, 23, 42, 0.5)",
                  height: "36px",
                  padding: "0 12px",
                  borderRadius: "6px",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                {/* Mode Selector */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.75rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      color: "var(--text-muted)",
                      fontWeight: 600,
                    }}
                  >
                    Mode
                  </span>
                  <div
                    className="segmented-picker"
                    style={{ display: "flex", gap: "2px" }}
                  >
                    <button
                      className={`seg-btn ${activeLayout === "FS" ? "active" : ""}`}
                      style={{ padding: "4px 12px", fontSize: "0.82rem" }}
                      onClick={() => handleLayoutChange("FS")}
                      title="Fullscreen projection mode"
                    >
                      FS
                    </button>
                    <button
                      className={`seg-btn ${activeLayout === "LT" ? "active" : ""}`}
                      style={{ padding: "4px 12px", fontSize: "0.82rem" }}
                      onClick={() => handleLayoutChange("LT")}
                      title="Lower-third overlay projection mode"
                    >
                      LT
                    </button>
                  </div>
                  {activeLayout === "LT" && isBibleContext && (
                    <button
                      className="action-btn"
                      style={{
                        padding: "4px 10px",
                        fontSize: "0.78rem",
                        borderRadius: "6px",
                      }}
                      onClick={() => setIsThemesModalOpen(true)}
                      title="Choose Lower Third Theme"
                    >
                      Themes
                    </button>
                  )}
                </div>

                <div
                  style={{
                    width: "1px",
                    height: "18px",
                    background: "rgba(255,255,255,0.15)",
                  }}
                />

                {/* Lines Selector */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.75rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      color: "var(--text-muted)",
                      fontWeight: 600,
                    }}
                  >
                    Lines
                  </span>
                  <div
                    className="segmented-picker"
                    style={{ display: "flex", gap: "2px" }}
                  >
                    {([1, 2, 3, 4] as const).map((num) => (
                      <button
                        key={num}
                        className={`seg-btn ${activeLinesMode === num ? "active" : ""}`}
                        style={{
                          padding: "4px 10px",
                          fontSize: "0.82rem",
                          minWidth: "26px",
                          opacity: isCurrentKinetic && num > 2 ? 0.3 : 1,
                          cursor:
                            isCurrentKinetic && num > 2
                              ? "not-allowed"
                              : "pointer",
                        }}
                        onClick={() => {
                          if (isCurrentKinetic && num > 2) return;
                          handleLinesModeChange(num);
                        }}
                        title={`${num} line${num > 1 ? "s" : ""} per slide`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Direct Studio & Settings Access */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <button
                  className="btn"
                  style={{
                    background: "rgba(15, 23, 42, 0.6)",
                    border: "1px solid var(--border-subtle)",
                    color: "white",
                    height: "36px",
                    padding: "0 14px",
                    borderRadius: "6px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "0.82rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                  onClick={() => {
                    setBackgroundModalTab(globalSettings.backgroundMode);
                    setIsBackgroundModalOpen(true);
                  }}
                  title="Stage Background Studio (Solids, Images, Motion Video loops)"
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background =
                      "rgba(255,255,255,0.08)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background =
                      "rgba(15, 23, 42, 0.6)")
                  }
                >
                  <Palette size={14} style={{ color: "var(--primary)" }} />
                  <span>Background Studio</span>
                </button>

                <button
                  className="btn"
                  style={{
                    background: "rgba(15, 23, 42, 0.6)",
                    border: "1px solid var(--border-subtle)",
                    color: "white",
                    height: "36px",
                    padding: "0 14px",
                    borderRadius: "6px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "0.82rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                  onClick={() => {
                    setSettingsModalTab("display");
                    setIsSettingsOpen(true);
                  }}
                  title="Display & Layout Settings (Positioning, Font sizes, Shadows)"
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background =
                      "rgba(255,255,255,0.08)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background =
                      "rgba(15, 23, 42, 0.6)")
                  }
                >
                  <Sliders size={14} style={{ color: "var(--primary)" }} />
                  <span>Display Settings</span>
                </button>
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
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span>Program Output</span>
              {liveState.backgroundMode !== "solid" ? (
                <span
                  style={{
                    fontSize: "10px",
                    padding: "2px 6px",
                    borderRadius: "4px",
                    background: "rgba(99, 102, 241, 0.2)",
                    color: "var(--primary)",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                  }}
                >
                  {liveState.backgroundMode} BG
                </span>
              ) : liveState.transparentBackground ? (
                <span
                  style={{
                    fontSize: "10px",
                    padding: "2px 6px",
                    borderRadius: "4px",
                    background: "rgba(234, 179, 8, 0.2)",
                    color: "#eab308",
                    fontWeight: 700,
                  }}
                >
                  OBS Transparent
                </span>
              ) : liveState.backgroundColor &&
                liveState.backgroundColor.toLowerCase() !== "#000000" &&
                liveState.backgroundColor.toLowerCase() !== "#050505" ? (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    fontSize: "10px",
                    padding: "2px 6px",
                    borderRadius: "4px",
                    background: "rgba(255, 255, 255, 0.08)",
                    color: "var(--text-secondary)",
                    fontFamily: "monospace",
                  }}
                >
                  <span
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      backgroundColor: liveState.backgroundColor,
                      display: "inline-block",
                      border: "1px solid rgba(255,255,255,0.4)",
                    }}
                  />
                  {liveState.backgroundColor}
                </span>
              ) : null}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <button
                className="btn btn-secondary"
                style={{
                  height: "26px",
                  padding: "0 8px",
                  fontSize: "11px",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  fontWeight: 600,
                }}
                title="Stage & Output Background Studio (Colors, Images, Videos)"
                onClick={() => {
                  setBackgroundModalTab(globalSettings.backgroundMode);
                  setIsBackgroundModalOpen(true);
                }}
              >
                <Palette size={12} style={{ color: "var(--primary)" }} />
                Background
              </button>
              <button
                className="icon-btn"
                style={{ width: "26px", height: "26px" }}
                title="Copy OBS URL"
                onClick={handleCopyOBSUrl}
              >
                <MonitorPlay size={13} />
              </button>
            </div>
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
                    ? liveState.backgroundColor || "#000000"
                    : "#000000",
                backgroundImage:
                  liveState.backgroundMode === "solid" &&
                  liveState.transparentBackground
                    ? "linear-gradient(45deg, rgba(255,255,255,0.03) 25%, transparent 25%, transparent 75%, rgba(255,255,255,0.03) 75%, rgba(255,255,255,0.03)), linear-gradient(45deg, rgba(255,255,255,0.03) 25%, transparent 25%, transparent 75%, rgba(255,255,255,0.03) 75%, rgba(255,255,255,0.03))"
                    : "none",
                backgroundSize: "20px 20px",
                backgroundPosition: "0 0, 10px 10px",
                containerType: "inline-size",
              }}
            >
              <OutputView isPreview={true} />
            </div>
          </div>

          {/* Under Program Window: switches based on activeTab */}
          {activeTab === "bible" ? (
            /* Scripture Search History Box */
            <div className="program-history-container">
              <div className="program-history-header">
                <div className="program-history-title">
                  <History size={13} style={{ color: "var(--primary)" }} />
                  <span>Scripture History</span>
                  <span className="program-history-badge">
                    {bibleHistory.length}/50
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
                      Projected verses will show here (last 50)
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
                        title={`Click to project ${item.reference}: ${item.text}`}
                        style={{ padding: "7px 10px" }}
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
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ) : (
            /* Song Service Queue Box (for Songs and Animation tabs) */
            <div className="program-history-container">
              <div className="program-history-header">
                <div className="program-history-title">
                  <Music size={13} style={{ color: "var(--primary)" }} />
                  <span>Song Service Queue</span>
                  <span className="program-history-badge">
                    {songQueue.length}
                  </span>
                </div>
                {songQueue.length > 0 && (
                  <button
                    className="program-history-clear-btn"
                    onClick={clearSongQueue}
                    title="Clear song queue"
                  >
                    <Trash2 size={11} /> Clear
                  </button>
                )}
              </div>

              <div className="program-history-list">
                {songQueue.length === 0 ? (
                  <div className="program-history-empty">
                    <Music
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
                      No Songs in Service Queue
                    </span>
                    <span
                      style={{
                        fontSize: "0.7rem",
                        color: "var(--text-muted)",
                        opacity: 0.8,
                        lineHeight: 1.35,
                      }}
                    >
                      Search songs on the left and click (+) to add them to your service setlist
                    </span>
                  </div>
                ) : (
                  songQueue.map((item, idx) => {
                    const isCurrentLive =
                      liveState.type === "song" &&
                      liveState.title?.toLowerCase().trim() ===
                        item.title.toLowerCase().trim();
                    const isSelectedInEditor = activeSongId === item.songId;

                    return (
                      <div
                        key={item.id}
                        className={`program-history-item ${isCurrentLive ? "is-live" : isSelectedInEditor ? "is-active" : ""}`}
                        onClick={() => {
                          const fullSong = savedSongs.find((s) => s.id === item.songId) || item;
                          handleSelectSong(fullSong, "none");
                        }}
                        title={`Click to load "${item.title}" into Program`}
                        style={{
                          padding: "7px 10px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: "8px",
                          borderLeft: isCurrentLive
                            ? "3px solid #22c55e"
                            : isSelectedInEditor
                              ? "3px solid var(--primary)"
                              : "3px solid transparent",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            minWidth: 0,
                            flex: 1,
                          }}
                        >
                          <span
                            style={{
                              fontSize: "0.7rem",
                              fontWeight: 700,
                              color: isCurrentLive ? "#22c55e" : "var(--primary)",
                              background: "rgba(99, 102, 241, 0.15)",
                              padding: "1px 5px",
                              borderRadius: "4px",
                              flexShrink: 0,
                            }}
                          >
                            #{idx + 1}
                          </span>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div
                              style={{
                                fontWeight: 600,
                                fontSize: "0.8rem",
                                color: isCurrentLive ? "#22c55e" : "#fff",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {item.title}
                            </div>
                            {item.artist && (
                              <div
                                style={{
                                  fontSize: "0.7rem",
                                  color: "var(--text-muted)",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {item.artist}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Action buttons on queued song */}
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                            flexShrink: 0,
                          }}
                        >
                          {isCurrentLive && (
                            <span
                              style={{
                                fontSize: "0.62rem",
                                fontWeight: 700,
                                color: "#22c55e",
                                background: "rgba(34, 197, 94, 0.2)",
                                border: "1px solid rgba(34, 197, 94, 0.5)",
                                padding: "1px 5px",
                                borderRadius: "4px",
                                marginRight: "2px",
                              }}
                            >
                              LIVE
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              const fullSong =
                                savedSongs.find((s) => s.id === item.songId) || item;
                              handleSelectSong(fullSong, "first");
                            }}
                            style={{
                              background: "rgba(99, 102, 241, 0.25)",
                              border: "1px solid rgba(99, 102, 241, 0.5)",
                              color: "#a5b4fc",
                              borderRadius: "4px",
                              width: "22px",
                              height: "22px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              cursor: "pointer",
                              padding: 0,
                            }}
                            title="Play Direct (Go Live)"
                          >
                            <Play size={10} fill="currentColor" />
                          </button>
                          {idx > 0 && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                moveQueueItem(idx, idx - 1);
                              }}
                              style={{
                                background: "transparent",
                                border: "none",
                                color: "var(--text-muted)",
                                cursor: "pointer",
                                padding: "2px",
                                display: "flex",
                              }}
                              title="Move up"
                            >
                              <ChevronLeft
                                size={13}
                                style={{ transform: "rotate(90deg)" }}
                              />
                            </button>
                          )}
                          {idx < songQueue.length - 1 && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                moveQueueItem(idx, idx + 1);
                              }}
                              style={{
                                background: "transparent",
                                border: "none",
                                color: "var(--text-muted)",
                                cursor: "pointer",
                                padding: "2px",
                                display: "flex",
                              }}
                              title="Move down"
                            >
                              <ChevronRight
                                size={13}
                                style={{ transform: "rotate(90deg)" }}
                              />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeFromSongQueue(item.id);
                            }}
                            style={{
                              background: "transparent",
                              border: "none",
                              color: "var(--text-muted)",
                              cursor: "pointer",
                              padding: "2px",
                              display: "flex",
                            }}
                            title="Remove from queue"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

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
