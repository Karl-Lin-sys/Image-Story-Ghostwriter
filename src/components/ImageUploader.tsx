import React, { useState, useRef } from "react";
import { Upload, Sparkles, Image as ImageIcon, CheckCircle2, SlidersHorizontal, RefreshCw } from "lucide-react";
import { PRESET_IMAGES, GENRE_OPTIONS, POV_OPTIONS, TONE_OPTIONS } from "../data/presets";
import { PresetImage } from "../types";
import { fileToBase64, urlToBase64 } from "../lib/imageUtils";

interface ImageUploaderProps {
  onAnalyze: (imageData: { data: string; mimeType: string }, options: {
    genre: string;
    pov: string;
    tone: string;
    customPrompt: string;
  }) => Promise<void>;
  isLoading: boolean;
  selectedImage: string | null;
  setSelectedImage: (dataUrl: string | null) => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  onAnalyze,
  isLoading,
  selectedImage,
  setSelectedImage,
}) => {
  const [currentImageData, setCurrentImageData] = useState<{ data: string; mimeType: string } | null>(null);
  const [genre, setGenre] = useState<string>("Literary Speculative");
  const [pov, setPov] = useState<string>("Third Person Limited");
  const [tone, setTone] = useState<string>("Atmospheric & Immersive");
  const [customPrompt, setCustomPrompt] = useState<string>("");
  const [activePresetId, setActivePresetId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(true);
  const [loadingPreset, setLoadingPreset] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const converted = await fileToBase64(file);
        setCurrentImageData(converted);
        setSelectedImage(converted.data);
        setActivePresetId(null);
      } catch (err) {
        console.error("Failed to read file:", err);
      }
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      try {
        const converted = await fileToBase64(file);
        setCurrentImageData(converted);
        setSelectedImage(converted.data);
        setActivePresetId(null);
      } catch (err) {
        console.error("Failed to process dropped image:", err);
      }
    }
  };

  const handleSelectPreset = async (preset: PresetImage) => {
    try {
      setLoadingPreset(true);
      setActivePresetId(preset.id);
      setGenre(preset.genre);
      const converted = await urlToBase64(preset.url);
      setCurrentImageData(converted);
      setSelectedImage(converted.data);
    } catch (err) {
      console.error("Failed to load preset:", err);
    } finally {
      setLoadingPreset(false);
    }
  };

  const handleSubmit = () => {
    if (!currentImageData) return;
    onAnalyze(currentImageData, {
      genre,
      pov,
      tone,
      customPrompt,
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-stone-200/90 shadow-xs p-5 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-serif font-semibold text-stone-900 flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-amber-700" />
            Visual World Seed
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Upload an image or choose an atmospheric scene to ignite your story
          </p>
        </div>
      </div>

      {/* Upload Zone / Active Preview */}
      <div className="mb-5">
        {selectedImage ? (
          <div className="relative group rounded-xl overflow-hidden border border-stone-200 bg-stone-900 max-h-[360px] flex items-center justify-center">
            <img
              src={selectedImage}
              alt="Visual prompt"
              className="w-full h-auto max-h-[360px] object-cover transition-transform duration-500 group-hover:scale-[1.01]"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-stone-950/70 via-transparent to-transparent pointer-events-none" />
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
              <span className="text-xs font-medium text-white/90 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-md border border-white/10 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Image ready for analysis
              </span>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs font-medium text-white bg-stone-800/90 hover:bg-stone-700 px-3 py-1.5 rounded-md border border-white/20 shadow-xs transition-colors flex items-center gap-1.5"
              >
                <RefreshCw className="w-3 h-3" />
                Change Image
              </button>
            </div>
          </div>
        ) : (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
              isDragging
                ? "border-amber-600 bg-amber-50/50"
                : "border-stone-300 hover:border-stone-400 bg-stone-50/50 hover:bg-stone-50"
            }`}
          >
            <div className="w-12 h-12 rounded-full bg-amber-100/80 text-amber-800 flex items-center justify-center mx-auto mb-3">
              <Upload className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium text-stone-800">
              Drag and drop your image here, or{" "}
              <span className="text-amber-800 underline underline-offset-2">browse</span>
            </p>
            <p className="text-xs text-stone-500 mt-1">
              Supports JPG, PNG, WEBP, GIF (landscapes, cityscapes, concept art, interiors)
            </p>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {/* Preset Gallery */}
      <div className="mb-5">
        <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wider mb-2">
          Or Select an Evocative Scene Preset
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          {PRESET_IMAGES.map((preset) => {
            const isSelected = activePresetId === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                disabled={loadingPreset || isLoading}
                onClick={() => handleSelectPreset(preset)}
                className={`group relative rounded-lg overflow-hidden border text-left transition-all p-1 ${
                  isSelected
                    ? "border-amber-700 ring-2 ring-amber-600/30 bg-amber-50/40"
                    : "border-stone-200 hover:border-stone-300 bg-white"
                }`}
              >
                <div className="aspect-video w-full rounded overflow-hidden bg-stone-100">
                  <img
                    src={preset.url}
                    alt={preset.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="p-1.5">
                  <div className="text-[11px] font-semibold text-stone-800 truncate leading-tight">
                    {preset.title}
                  </div>
                  <div className="text-[10px] text-amber-800 font-medium truncate mt-0.5">
                    {preset.genre}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Writing Parameters Toggle */}
      <div className="border-t border-stone-100 pt-4">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center justify-between w-full text-xs font-medium text-stone-600 hover:text-stone-900 py-1"
        >
          <span className="flex items-center gap-1.5 font-semibold text-stone-700">
            <SlidersHorizontal className="w-3.5 h-3.5 text-amber-700" />
            Ghostwriting Parameters (Style, POV & Tone)
          </span>
          <span className="text-stone-400">{showAdvanced ? "Collapse" : "Customize"}</span>
        </button>

        {showAdvanced && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3 pt-2">
            <div>
              <label className="block text-[11px] font-medium text-stone-600 mb-1">
                Story Genre / Style
              </label>
              <select
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="w-full text-xs bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-2 text-stone-800 focus:outline-none focus:ring-1 focus:ring-amber-600"
              >
                {GENRE_OPTIONS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-stone-600 mb-1">
                Narrative Perspective (POV)
              </label>
              <select
                value={pov}
                onChange={(e) => setPov(e.target.value)}
                className="w-full text-xs bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-2 text-stone-800 focus:outline-none focus:ring-1 focus:ring-amber-600"
              >
                {POV_OPTIONS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-stone-600 mb-1">
                Target Mood & Tone
              </label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="w-full text-xs bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-2 text-stone-800 focus:outline-none focus:ring-1 focus:ring-amber-600"
              >
                {TONE_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-3">
              <label className="block text-[11px] font-medium text-stone-600 mb-1">
                Author's Direction / Secret Hook (Optional)
              </label>
              <input
                type="text"
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="e.g., Focus on the lone figure in the shadows, or emphasize the smell of copper and salt rain..."
                className="w-full text-xs bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-amber-600"
              />
            </div>
          </div>
        )}
      </div>

      {/* Primary Action Button */}
      <div className="mt-5">
        <button
          type="button"
          disabled={!currentImageData || isLoading}
          onClick={handleSubmit}
          className={`w-full py-3 px-4 rounded-xl text-sm font-medium transition-all shadow-sm flex items-center justify-center gap-2 ${
            !currentImageData || isLoading
              ? "bg-stone-200 text-stone-400 cursor-not-allowed"
              : "bg-stone-900 hover:bg-stone-800 text-amber-50 hover:shadow-md cursor-pointer active:scale-[0.99]"
          }`}
        >
          {isLoading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-amber-300" />
              <span>Analyzing Scene Mood & Ghostwriting Opening...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Ghostwrite Story Opening from Scene</span>
            </>
          )}
        </button>
        {!currentImageData && (
          <p className="text-center text-[11px] text-stone-400 mt-2">
            Please upload an image or click a preset above to begin
          </p>
        )}
      </div>
    </div>
  );
};
