import React, { useState } from "react";
import { Copy, Check, Edit3, Sparkles, BookOpen, Compass, Wind, Eye, Music2 } from "lucide-react";
import { StoryAnalysisResponse, VoiceName } from "../types";
import { AudioPlayer } from "./AudioPlayer";

interface StoryManuscriptProps {
  analysis: StoryAnalysisResponse;
  onUpdateParagraph: (newText: string) => void;
  onRegenerate: () => void;
  isRegenerating: boolean;
}

export const StoryManuscript: React.FC<StoryManuscriptProps> = ({
  analysis,
  onUpdateParagraph,
  onRegenerate,
  isRegenerating,
}) => {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editedText, setEditedText] = useState<string>(analysis.openingParagraph);
  const [copied, setCopied] = useState<boolean>(false);
  const [showAtmosphereDetails, setShowAtmosphereDetails] = useState<boolean>(true);

  // Keep local edited text in sync if parent updates analysis
  React.useEffect(() => {
    setEditedText(analysis.openingParagraph);
  }, [analysis.openingParagraph]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(editedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleSaveEdit = () => {
    setIsEditing(false);
    onUpdateParagraph(editedText);
  };

  const wordCount = editedText.trim().split(/\s+/).filter(Boolean).length;
  const estimatedReadSecs = Math.max(15, Math.round((wordCount / 130) * 60));

  return (
    <div className="space-y-5">
      {/* Scene Header & Title */}
      <div className="bg-white rounded-2xl border border-stone-200/90 shadow-xs p-5 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-stone-100 pb-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold tracking-wider uppercase text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-md border border-amber-200/60">
                Ghostwritten Opening
              </span>
              <span className="text-xs text-stone-400">•</span>
              <span className="text-xs text-stone-500 font-medium">
                {wordCount} words (~{estimatedReadSecs}s read)
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 mt-1.5 tracking-tight">
              {analysis.sceneTitle || "The Unnamed World"}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="text-xs font-medium text-stone-600 hover:text-stone-900 px-3 py-1.5 rounded-lg border border-stone-200 hover:bg-stone-50 transition-colors flex items-center gap-1.5"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                if (isEditing) {
                  handleSaveEdit();
                } else {
                  setIsEditing(true);
                }
              }}
              className="text-xs font-medium text-stone-700 hover:text-stone-900 px-3 py-1.5 rounded-lg border border-stone-200 hover:bg-stone-50 transition-colors flex items-center gap-1.5"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{isEditing ? "Save Edits" : "Edit Paragraph"}</span>
            </button>

            <button
              type="button"
              disabled={isRegenerating}
              onClick={onRegenerate}
              className="text-xs font-medium text-amber-900 hover:text-amber-950 px-3 py-1.5 rounded-lg border border-amber-200 bg-amber-50/70 hover:bg-amber-100/70 transition-colors flex items-center gap-1.5"
              title="Regenerate opening with current parameters"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-700" />
              <span>Regenerate</span>
            </button>
          </div>
        </div>

        {/* Atmospheric Mood Banner */}
        <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/70 mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-amber-700 shrink-0" />
            <span className="text-xs text-stone-500 font-medium">Atmospheric Mood:</span>
            <span className="text-xs font-serif italic text-stone-900 font-semibold">
              "{analysis.mood}"
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowAtmosphereDetails(!showAtmosphereDetails)}
            className="text-[11px] font-medium text-stone-600 hover:text-stone-900 underline underline-offset-2"
          >
            {showAtmosphereDetails ? "Hide World Sensory Matrix" : "View World Sensory Matrix"}
          </button>
        </div>

        {/* Deep Sensory & World Analysis Matrix */}
        {showAtmosphereDetails && analysis.visualAnalysis && (
          <div className="mb-6 p-4 rounded-xl bg-stone-50/90 border border-stone-200/80 space-y-3.5 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="font-semibold text-stone-800 flex items-center gap-1.5 mb-1">
                  <BookOpen className="w-3.5 h-3.5 text-amber-800" />
                  Setting & Architecture
                </span>
                <p className="text-stone-600 leading-relaxed">
                  {analysis.visualAnalysis.setting}
                </p>
              </div>
              <div>
                <span className="font-semibold text-stone-800 flex items-center gap-1.5 mb-1">
                  <Wind className="w-3.5 h-3.5 text-sky-700" />
                  Lighting & Ambiance
                </span>
                <p className="text-stone-600 leading-relaxed">
                  {analysis.visualAnalysis.lightingAndAtmosphere}
                </p>
              </div>
            </div>

            {/* Sensory Details */}
            {analysis.visualAnalysis.sensoryDetails && (
              <div className="pt-2 border-t border-stone-200/60 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-2.5 rounded-lg bg-white border border-stone-200/60">
                  <span className="font-semibold text-stone-700 block mb-0.5">Auditory Cues</span>
                  <p className="text-stone-600 text-[11px]">{analysis.visualAnalysis.sensoryDetails.sounds}</p>
                </div>
                <div className="p-2.5 rounded-lg bg-white border border-stone-200/60">
                  <span className="font-semibold text-stone-700 block mb-0.5">Scents & Air</span>
                  <p className="text-stone-600 text-[11px]">{analysis.visualAnalysis.sensoryDetails.scents}</p>
                </div>
                <div className="p-2.5 rounded-lg bg-white border border-stone-200/60">
                  <span className="font-semibold text-stone-700 block mb-0.5">Tactile Textures</span>
                  <p className="text-stone-600 text-[11px]">{analysis.visualAnalysis.sensoryDetails.textures}</p>
                </div>
              </div>
            )}

            {/* Narrative Hook */}
            {analysis.narrativeHook && (
              <div className="pt-2 border-t border-stone-200/60 flex items-start gap-2 text-stone-700">
                <span className="font-semibold text-amber-900 shrink-0">Looming Hook:</span>
                <span className="italic">{analysis.narrativeHook}</span>
              </div>
            )}
          </div>
        )}

        {/* The Manuscript Canvas */}
        <div className="relative">
          {isEditing ? (
            <div className="space-y-2">
              <textarea
                value={editedText}
                onChange={(e) => setEditedText(e.target.value)}
                rows={7}
                className="w-full font-serif text-base sm:text-lg leading-relaxed p-4 border border-amber-300 rounded-xl bg-amber-50/20 text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-700"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditedText(analysis.openingParagraph);
                    setIsEditing(false);
                  }}
                  className="px-3 py-1 text-xs text-stone-500 hover:text-stone-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-amber-900 text-amber-50 hover:bg-amber-800"
                >
                  Apply Revisions
                </button>
              </div>
            </div>
          ) : (
            <div className="relative group py-2">
              <div className="prose prose-stone max-w-none">
                <p className="font-serif text-lg sm:text-xl text-stone-800 leading-[1.8] tracking-normal selection:bg-amber-200 first-letter:text-4xl first-letter:font-bold first-letter:text-amber-900 first-letter:float-left first-letter:mr-2.5 first-letter:leading-none">
                  {editedText}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Read Aloud Audio Player Component */}
        <div className="mt-6 pt-5 border-t border-stone-100">
          <AudioPlayer
            text={editedText}
            recommendedVoice={analysis.recommendedVoice}
            narratorToneGuidance={analysis.narratorToneGuidance}
          />
        </div>
      </div>
    </div>
  );
};
