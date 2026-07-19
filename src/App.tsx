import React, { useState, useEffect } from "react";
import { Trash2, Utensils, Sparkles } from "lucide-react";
import { ScannedFood } from "./types";
import { UploadCard } from "./components/UploadCard";
import { HistoryList } from "./components/HistoryList";
import { WebcamScanner } from "./components/WebcamScanner";
import { ResultView } from "./components/ResultView";
import { motion, AnimatePresence } from "motion/react";

// Image Resizing Helper to keep uploads fast & localStorage footprint small
const resizeImage = (
  base64Str: string,
  maxWidth = 400,
  maxHeight = 400
): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", 0.8));
    };
    img.onerror = () => {
      resolve(base64Str);
    };
  });
};

const App: React.FC = () => {
  // Navigation / Screen States
  const [screen, setScreen] = useState<"home" | "webcam" | "result">("home");

  // History State
  const [history, setHistory] = useState<ScannedFood[]>([]);

  // Scan Active Pipeline States
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [activeItem, setActiveItem] = useState<ScannedFood | null>(null);

  // Load history from localStorage on startup
  useEffect(() => {
    const saved = localStorage.getItem("food_recognizer_history");
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (err) {
        console.error("Failed to parse saved history:", err);
      }
    }
  }, []);

  // Save history to localStorage on change
  const saveHistory = (newHistory: ScannedFood[]) => {
    setHistory(newHistory);
    localStorage.setItem("food_recognizer_history", JSON.stringify(newHistory));
  };

  // Trigger food scan process
  const processScan = async (base64Image: string) => {
    setLoading(true);
    setError("");
    setActiveItem(null);
    setScreen("result");

    try {
      // 1. Compress Image client-side to keep payloads extremely fast and lightweight
      const compressedBase64 = await resizeImage(base64Image, 400, 400);

      // 2. Call backend scan API
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: compressedBase64 }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Gagal mengidentifikasi makanan");
      }

      const scannedItem: ScannedFood = await res.json();

      // 3. Attach local compressed image so it shows up beautifully in the history list
      const finalItem: ScannedFood = {
        ...scannedItem,
        imagePath: compressedBase64,
      };

      // 4. Save to history (prepend latest item)
      const updatedHistory = [finalItem, ...history];
      saveHistory(updatedHistory);
      setActiveItem(finalItem);
    } catch (err: any) {
      console.error("Scanning Error:", err);
      setError(err.message || "Gagal mengidentifikasi gambar makanan");
    } finally {
      setLoading(false);
    }
  };

  // Process File Selection
  const handleImageSelected = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      processScan(base64);
    };
    reader.onerror = () => {
      setError("Gagal membaca file gambar.");
      setScreen("result");
    };
    reader.readAsDataURL(file);
  };

  // Delete individual history item
  const handleDeleteItem = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Hapus item riwayat pemindaian ini?")) {
      const updated = history.filter((item) => item.id !== id);
      saveHistory(updated);
    }
  };

  // Clear entire history
  const handleClearHistory = () => {
    if (confirm("Hapus seluruh riwayat pemindaian makanan Anda?")) {
      saveHistory([]);
    }
  };

  const viewHistoryItem = (item: ScannedFood) => {
    setActiveItem(item);
    setScreen("result");
  };

  const handleBackToHome = () => {
    setScreen("home");
    setActiveItem(null);
    setError("");
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center">
      <div className="w-full max-w-md bg-white shadow-xl min-h-screen flex flex-col relative overflow-hidden">
        <AnimatePresence mode="wait">
          {screen === "home" && (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="flex-grow flex flex-col pb-10"
            >
              {/* App Bar / Top Navigation */}
              <div className="bg-white sticky top-0 z-10 border-b border-gray-50 p-4 flex items-center justify-between shadow-xs">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-500 mr-2 shadow-xs">
                    <Utensils size={18} />
                  </div>
                  <h1 className="text-base font-black tracking-tight text-gray-900">
                    Food Recognizer
                  </h1>
                </div>

                {history.length > 0 && (
                  <button
                    onClick={handleClearHistory}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    title="Hapus Semua Riwayat"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>

              {/* Home Banner section */}
              <div className="px-4 mt-4">
                <div className="relative h-44 rounded-3xl overflow-hidden shadow-md">
                  {/* High Quality Food Photo Banner */}
                  <img
                    src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=600"
                    alt="Food Banner"
                    className="w-full h-full object-cover"
                  />
                  {/* dark shade gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 to-transparent"></div>

                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <div className="flex items-center gap-1.5">
                      <Sparkles size={14} className="text-amber-300 animate-pulse" />
                      <h2 className="text-base font-black leading-tight">
                        Kenali Makanan Anda
                      </h2>
                    </div>
                    <p className="text-[10px] text-gray-200 mt-1 leading-relaxed max-w-[90%]">
                      Dapatkan informasi resep dan nutrisi lengkap dengan kecerdasan buatan
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Upload Card Section */}
              <div className="mt-5 px-4">
                <UploadCard
                  onImageSelected={handleImageSelected}
                  onCameraClick={() => setScreen("webcam")}
                  onLiveCameraClick={() => setScreen("webcam")}
                />
              </div>

              {/* History Header Title */}
              <div className="mt-6 px-4 mb-3 flex items-center justify-between">
                <h3 className="text-xs font-black tracking-wider text-gray-400 uppercase">
                  Riwayat Pemindaian
                </h3>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full shrink-0">
                  {history.length} Item
                </span>
              </div>

              {/* History List Content */}
              <div className="flex-1 overflow-y-auto">
                <HistoryList
                  history={history}
                  onDeleteItem={handleDeleteItem}
                  onItemClick={viewHistoryItem}
                />
              </div>
            </motion.div>
          )}

          {screen === "webcam" && (
            <motion.div
              key="webcam"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 z-50 bg-black"
            >
              <WebcamScanner onCapture={processScan} onBack={handleBackToHome} />
            </motion.div>
          )}

          {screen === "result" && (
            <motion.div
              key="result"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="flex-grow flex flex-col"
            >
              <ResultView
                foodItem={activeItem}
                loading={loading}
                error={error}
                onBack={handleBackToHome}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default App;
