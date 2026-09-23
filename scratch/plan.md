Plan:
1. In `LiveContext.tsx`:
   - Remove the auto-saving to `localStorage` inside `projectLive` and the `useEffect` that listens to SSE.
   - Add `saveGlobalSettings` to `LiveContext` which saves the current `liveState` to `localStorage`.
   - Add `restoreGlobalSettings` to `LiveContext` which reads from `localStorage` and updates `liveState` (and propagates via `updateLiveState`).
2. In `ControlPanel.tsx`:
   - In the Settings modal, add a "Save Settings" button that calls `saveGlobalSettings()` and shows a toast.
   - When projecting a Bible verse (`handleProjectVerse` or the chapter selection), call `restoreGlobalSettings()` FIRST, and then `projectLive({ type: "bible", ... })`, so that the Bible verse always uses the globally saved styling, overriding any song-specific styling that was temporarily in `liveState`.
   - (Wait, if they change the styling while on a Bible verse but HAVEN'T clicked Save, and then they click another Bible verse, `restoreGlobalSettings` will wipe out their unsaved changes! Is that expected? Yes, because they explicitly asked to save ONLY when clicking Save.)
