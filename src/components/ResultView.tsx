import React from "react";
import { ArrowLeft, Check, Leaf, AlertCircle, RefreshCw, UtensilsCrossed } from "lucide-react";
import { ScannedFood } from "../types";
import { MacroCard } from "./MacroCard";

interface ResultViewProps {
  foodItem: ScannedFood | null;
  loading: boolean;
  error: string;
  onBack: () => void;
}

export const ResultView: React.FC<ResultViewProps> = ({
  foodItem,
  loading,
  error,
  onBack,
}) => {
  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-white text-center">
        <div className="relative flex items-center justify-center">
          {/* Circular Spinner */}
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <UtensilsCrossed size={24} className="absolute text-emerald-500 animate-pulse" />
        </div>
        <h2 className="text-lg font-extrabold text-gray-900 mt-6 animate-pulse">
          Menganalisis Makanan...
        </h2>
        <p className="text-xs text-gray-500 max-w-xs mt-2 leading-relaxed">
          Kecerdasan Buatan sedang menganalisis gambar untuk mengidentifikasi bahan, resep, dan info nutrisi.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-white text-center">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4 shadow-sm shadow-red-100">
          <AlertCircle size={32} />
        </div>
        <h2 className="text-lg font-bold text-gray-900">Terjadi Kesalahan</h2>
        <p className="text-xs text-red-500 max-w-xs mt-2 bg-red-50/50 p-3 rounded-xl border border-red-100 leading-relaxed font-medium">
          {error}
        </p>
        <button
          onClick={onBack}
          className="mt-6 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 active:scale-98 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-100 transition-all cursor-pointer"
        >
          Kembali
        </button>
      </div>
    );
  }

  if (!foodItem) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-white text-center">
        <p className="text-sm text-gray-500 font-medium">Tidak ada data pemindaian aktif</p>
        <button
          onClick={onBack}
          className="mt-4 px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
        >
          Kembali ke Beranda
        </button>
      </div>
    );
  }

  const ingredientsList = foodItem.recipeIngredients
    ? foodItem.recipeIngredients.split("; ").filter(Boolean)
    : [];

  return (
    <div className="flex-1 flex flex-col bg-gray-50 overflow-y-auto pb-12">
      {/* Top Navbar */}
      <div className="sticky top-0 bg-white border-b border-gray-100 p-4 flex items-center shrink-0 z-10 shadow-xs">
        <button
          onClick={onBack}
          className="p-2 text-gray-700 hover:bg-gray-100 rounded-full transition-colors mr-3"
          aria-label="Kembali"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-extrabold text-gray-900 text-base">Hasil Deteksi Makanan</h1>
      </div>

      {/* Main Details Body */}
      <div className="flex-1 max-w-xl mx-auto w-full">
        {/* 1. Food Picture Header */}
        <div className="relative w-full h-64 bg-gray-900 overflow-hidden">
          {foodItem.imagePath ? (
            <img
              src={foodItem.imagePath}
              alt={foodItem.name}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : foodItem.recipeThumb ? (
            <img
              src={foodItem.recipeThumb}
              alt={foodItem.name}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-full h-full bg-emerald-500/10 flex items-center justify-center">
              <UtensilsCrossed size={64} className="text-emerald-500/30" />
            </div>
          )}

          {/* Dark picture bottom gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/65 to-transparent"></div>

          {/* Overlapping floating card */}
          <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-xs p-4 rounded-2xl border border-gray-100/50 shadow-lg flex items-center justify-between">
            <div className="flex-1 min-w-0 pr-4">
              <h2 className="text-lg font-black text-gray-900 truncate leading-tight">
                {foodItem.name}
              </h2>
              <span className="text-[10px] font-semibold text-gray-400 mt-0.5 block">
                Akurasi Klasifikasi ML
              </span>
            </div>

            {/* Confidence progress */}
            <div className="flex flex-col items-end shrink-0">
              <span className="text-lg font-black text-emerald-600 leading-none mb-1">
                {Math.round(foodItem.confidence * 100)}%
              </span>
              <div className="w-16 h-1.5 bg-emerald-50 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500"
                  style={{ width: `${foodItem.confidence * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Nutrition Section */}
        <div className="mt-4 px-4">
          <h3 className="text-xs font-black tracking-wider text-emerald-600 uppercase mb-3">
            Kandungan Nutrisi (Gemini AI)
          </h3>

          <div className="flex gap-2">
            <MacroCard
              label="KALORI"
              value={`${foodItem.calories}`}
              labelColor="text-emerald-500"
              valueColor="text-emerald-600 text-lg"
              emoji="🔥"
            />
            <MacroCard
              label="PROTEIN"
              value={`${foodItem.protein}g`}
              labelColor="text-gray-400"
              valueColor="text-gray-900 text-sm"
              emoji="🍗"
            />
            <MacroCard
              label="KARBO"
              value={`${foodItem.carbs}g`}
              labelColor="text-gray-400"
              valueColor="text-gray-900 text-sm"
              emoji="🍞"
            />
            <MacroCard
              label="LEMAK"
              value={`${foodItem.fat}g`}
              labelColor="text-gray-400"
              valueColor="text-gray-900 text-sm"
              emoji="🥑"
            />
          </div>

          {/* Fiber badge */}
          {foodItem.fiber > 0 && (
            <div className="mt-3 bg-white rounded-xl border border-gray-100 p-3 flex items-center justify-between shadow-xs">
              <div className="flex items-center text-xs font-semibold text-gray-700">
                <Leaf size={16} className="text-emerald-500 mr-2 shrink-0" />
                <span>Serat Makanan (Fiber)</span>
              </div>
              <span className="text-sm font-bold text-emerald-600">{foodItem.fiber}g</span>
            </div>
          )}
        </div>

        {/* 3. Recipe Section */}
        <div className="mt-6 px-4">
          <h3 className="text-xs font-black tracking-wider text-sky-600 uppercase mb-3">
            Resep & Cara Memasak
          </h3>

          {foodItem.hasRecipe ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-xs">
              <div className="flex items-center mb-4 pb-4 border-b border-gray-50">
                {foodItem.recipeThumb ? (
                  <img
                    src={foodItem.recipeThumb}
                    alt={foodItem.recipeTitle}
                    className="w-12 h-12 rounded-lg object-cover shrink-0 border border-gray-100"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-12 h-12 bg-sky-50 text-sky-500 rounded-lg flex items-center justify-center shrink-0 border border-sky-100">
                    <UtensilsCrossed size={20} />
                  </div>
                )}
                <div className="ml-3 min-w-0">
                  <h4 className="text-sm font-bold text-gray-900 truncate">
                    {foodItem.recipeTitle}
                  </h4>
                  <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full inline-block mt-0.5">
                    Resep Tersedia
                  </span>
                </div>
              </div>

              {/* Ingredients block */}
              {ingredientsList.length > 0 && (
                <div className="mb-4">
                  <h5 className="text-xs font-extrabold text-gray-800 mb-2">Bahan-bahan:</h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
                    {ingredientsList.map((ing, idx) => (
                      <div key={idx} className="flex items-center text-xs text-gray-600">
                        <Check size={14} className="text-emerald-500 mr-2 shrink-0" />
                        <span className="truncate">{ing}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Instructions steps */}
              {foodItem.recipeInstructions && (
                <div className="mt-4 pt-4 border-t border-gray-50">
                  <h5 className="text-xs font-extrabold text-gray-800 mb-2">
                    Langkah Pembuatan:
                  </h5>
                  <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-line">
                    {foodItem.recipeInstructions}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs text-center">
              <div className="w-10 h-10 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-3">
                <UtensilsCrossed size={18} />
              </div>
              <h4 className="text-xs font-bold text-gray-700">Resep Tidak Ditemukan</h4>
              <p className="text-[11px] text-gray-400 mt-1 max-w-xs mx-auto leading-relaxed">
                Tidak dapat menemukan atau menyusun resep untuk "{foodItem.name}".
                Silakan coba memindai makanan umum lainnya.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
