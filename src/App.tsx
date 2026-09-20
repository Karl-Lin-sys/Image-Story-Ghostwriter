import React, { useState, useEffect } from "react";
import { Header } from "./components/Header";
import { ImageUploader } from "./components/ImageUploader";
import { StoryManuscript } from "./components/StoryManuscript";
import { CreativeChatbot } from "./components/CreativeChatbot";
import { StoryAnalysisResponse } from "./types";
import { PRESET_IMAGES } from "./data/presets";
import { urlToBase64 } from "./lib/imageUtils";
import { Sparkles, AlertCircle, BookOpen, MessageSquare, SplitSquareVertical } from "lucide-react";

export default function App() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<StoryAnalysisResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRegenerating, setIsRegenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastOptions, setLastOptions] = useState<{
    genre: string;
    pov: string;
    tone: string;
    customPrompt: string;
  }>({
    genre: "Gothic Mystery",
    pov: "Third Person Limited",
    tone: "Atmospheric & Immersive",
    customPrompt: "",
  });

  // Load a starter preset story on initial mount so the user has an instant experience
  useEffect(() => {
    const loadInitialStarter = async () => {
      try {
        const starter = PRESET_IMAGES[2]; // Beacon on the Black Crags
        const converted = await urlToBase64(starter.url);
        setSelectedImage(converted.data);

        // Populate with an evocative starter manuscript
        setAnalysis({
          sceneTitle: "The Beacon of the Black Crags",
          mood: "Hauntingly expectant, storm-lashed solitude",
          visualAnalysis: {
            setting: "A weathered Victorian granite lighthouse clinging to jagged basalt sea-cliffs amidst churning Atlantic spray.",
            lightingAndAtmosphere: "Sulfur-yellow lantern light slicing through churning fog bank, reflecting off black wet stone.",
            keyFocalElements: [
              "Solitary stone spire",
              "Crashing foam against serrated black reefs",
              "Lone oil lamp burning on the upper catwalk",
              "Distant thunderheads rolling in from the open ocean",
            ],
            sensoryDetails: {
              sounds: "The thunderous bass of breakers crashing into hollow sea caves, screaming gales, and the rhythmic groan of the brass clockwork pendulum.",
              scents: "Brine, ozone, wet lichen, and stale whale oil simmering in the lantern wick.",
              textures: "Coarse sea-salt crusting cold iron railings, slick wet granite under heavy boots.",
            },
          },
          openingParagraph:
            "No ship had dared the shoals of Black Crag in twenty years, yet every nightfall Silas stoked the beacon until the brass reflector spun with a low, bone-deep hum. Tonight, however, the fog smelled not of kelp and winter brine, but of scorched copper—and two hundred feet below the catwalk, where only drowning men and barnacles ever kept watch, something massive and rhythmic had begun knocking three deliberate times against the iron cellar door.",
          narrativeHook: "What is knocking on the cellar door beneath the crushing waves, and why does the fog carry the scent of scorched copper?",
          recommendedVoice: "Charon",
          narratorToneGuidance: "Speak with deep, measured gothic dread, lowering your pitch on the final knock.",
        });
      } catch (err) {
        console.warn("Could not pre-load starter image:", err);
      }
    };

    loadInitialStarter();
  }, []);

  const handleAnalyze = async (
    imageData: { data: string; mimeType: string },
    options: {
      genre: string;
      pov: string;
      tone: string;
      customPrompt: string;
    }
  ) => {
    setIsLoading(true);
    setError(null);
    setLastOptions(options);

    try {
      const response = await fetch("/api/analyze-and-ghostwrite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: imageData,
          genre: options.genre,
          pov: options.pov,
          tone: options.tone,
          customPrompt: options.customPrompt,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to analyze image.");
      }

      setAnalysis(data);
    } catch (err: any) {
      console.error("Analysis error:", err);
      setError(err.message || "Failed to analyze image and ghostwrite story opening.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerate = async () => {
    if (!selectedImage) return;
    setIsRegenerating(true);
    setError(null);

    try {
      const response = await fetch("/api/analyze-and-ghostwrite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: { data: selectedImage, mimeType: "image/jpeg" },
          genre: lastOptions.genre,
          pov: lastOptions.pov,
          tone: lastOptions.tone,
          customPrompt: lastOptions.customPrompt,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to regenerate story opening.");
      }

      setAnalysis(data);
    } catch (err: any) {
      console.error("Regenerate error:", err);
      setError(err.message || "Failed to regenerate story opening.");
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleUpdateParagraph = (newText: string) => {
    if (!analysis) return;
    setAnalysis({
      ...analysis,
      openingParagraph: newText,
    });
  };

  const handleAppendToStory = (passage: string) => {
    if (!analysis) return;
    const separator = "\n\n";
    const updated = `${analysis.openingParagraph.trim()}${separator}${passage.trim()}`;
    setAnalysis({
      ...analysis,
      openingParagraph: updated,
    });
  };

  return (
    <div className="min-h-screen bg-stone-100/70 text-stone-900 font-sans flex flex-col antialiased selection:bg-amber-200">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs sm:text-sm flex items-start gap-2.5 shadow-2xs">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-semibold block">Generation Notice</span>
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Visual Seed Uploader */}
        <section id="uploader-section">
          <ImageUploader
            onAnalyze={handleAnalyze}
            isLoading={isLoading}
            selectedImage={selectedImage}
            setSelectedImage={setSelectedImage}
          />
        </section>

        {/* Two-Column Studio Workspace: Manuscript on Left/Center, AI Co-Author Chat on Right */}
        <section id="studio-workspace" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Manuscript & Speech Section */}
          <div className="lg:col-span-7 space-y-6">
            {analysis ? (
              <StoryManuscript
                analysis={analysis}
                onUpdateParagraph={handleUpdateParagraph}
                onRegenerate={handleRegenerate}
                isRegenerating={isRegenerating}
              />
            ) : (
              <div className="bg-white rounded-2xl border border-stone-200/90 shadow-xs p-10 text-center">
                <div className="w-12 h-12 rounded-full bg-amber-100/70 text-amber-800 flex items-center justify-center mx-auto mb-3">
                  <BookOpen className="w-6 h-6" />
                </div>
                <h3 className="text-base font-serif font-bold text-stone-800">
                  Awaiting Visual Inspiration
                </h3>
                <p className="text-xs text-stone-500 max-w-sm mx-auto mt-1">
                  Upload an image or pick an atmospheric scene preset above, then click "Ghostwrite Story Opening" to generate your opening prose.
                </p>
              </div>
            )}
          </div>

          {/* AI Creative Co-Author & Lorekeeper Multi-Turn Chatbot */}
          <div className="lg:col-span-5">
            <CreativeChatbot
              storyContext={{
                title: analysis?.sceneTitle || "Untitled Scene",
                paragraph: analysis?.openingParagraph || "",
                mood: analysis?.mood || "Atmospheric",
                setting: analysis?.visualAnalysis?.setting || "Visual environment",
              }}
              onAppendToStory={handleAppendToStory}
            />
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-200/80 bg-stone-50/80 py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-stone-500 flex flex-wrap items-center justify-between gap-2">
          <span>
            StoryForge Ghostwriter Studio • Built with Gemini 3.1 Pro, Gemini 3.1 TTS, and Gemini 3.5 Flash
          </span>
          <span className="text-stone-400">
            Expressive voice narration powered by gemini-3.1-flash-tts-preview
          </span>
        </div>
      </footer>
    </div>
  );
}
