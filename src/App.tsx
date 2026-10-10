import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import OutputView from "./pages/OutputView";
import ControlPanel from "./pages/ControlPanel";
import { Toaster } from "react-hot-toast";

function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="bottom-right"
        toastOptions={{
          success: {
            style: {
              background: "green",
              color: "white",
            },
          },
          error: {
            style: {
              background: "red",
              color: "white",
            },
          },
        }}
      />
      <Routes>
        <Route path="/" element={<ControlPanel />} />
        <Route path="/panel" element={<Navigate to="/" replace />} />
        <Route path="/dashboard" element={<Navigate to="/" replace />} />
        <Route path="/output" element={<OutputView />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
