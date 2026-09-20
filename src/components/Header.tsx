import React from "react";
import { Feather, Sparkles, Volume2, Bot } from "lucide-react";

export const Header: React.FC = () => {
  return (
    <header className="border-b border-stone-200 bg-stone-50/80 backdrop-blur-md sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-900 text-amber-100 flex items-center justify-center shadow-sm">
            <Feather className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-serif font-bold text-stone-900 tracking-tight">
                StoryForge
              </h1>
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-medium">
                Ghostwriter Studio
              </span>
            </div>
            <p className="text-xs text-stone-500 font-sans">
              Visual prompt to evocative story opening & expressive AI voice narration
            </p>
          </div>
        </div>

        {/* Feature Badges */}
        <div className="flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-stone-200 text-stone-600 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Image Scene Analysis</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-stone-200 text-stone-600 shadow-2xs">
            <Volume2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Expressive AI Voice</span>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-stone-200 text-stone-600 shadow-2xs">
            <Bot className="w-3.5 h-3.5 text-indigo-600" />
            <span>Co-Author Chat</span>
          </div>
        </div>
      </div>
    </header>
  );
};
