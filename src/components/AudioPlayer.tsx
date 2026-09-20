import React, { useState, useRef, useEffect } from "react";
import { Play, Pause, RotateCcw, Volume2, VolumeX, Download, Sparkles, Wand2, Mic } from "lucide-react";
import { VoiceName } from "../types";
import { VOICE_OPTIONS } from "../data/presets";

interface AudioPlayerProps {
  text: string;
  recommendedVoice?: VoiceName;
  narratorToneGuidance?: string;
  onVoiceChange?: (voice: VoiceName) => void;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  text,
  recommendedVoice = "Kore",
  narratorToneGuidance = "Read expressively and cinematically",
  onVoiceChange,
}) => {
  const [selectedVoice, setSelectedVoice] = useState<VoiceName>(recommendedVoice);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Sync recommended voice if it changes
  useEffect(() => {
    if (recommendedVoice) {
      setSelectedVoice(recommendedVoice);
    }
  }, [recommendedVoice]);

  // Handle generation of TTS audio
  const handleGenerateAudio = async () => {
    if (!text.trim()) return;
    setIsLoading(true);
    setErrorMsg(null);

    // Stop current audio if playing
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }

    try {
      const response = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: text.trim(),
          voiceName: selectedVoice,
          toneGuidance: narratorToneGuidance,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to generate voice narration.");
      }

      setAudioUrl(data.audioDataUrl);

      // Auto play once audio is ready
      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.playbackRate = playbackRate;
          audioRef.current.play().catch((err) => console.warn("Auto-play prevented:", err));
        }
      }, 100);
    } catch (err: any) {
      console.error("TTS generation error:", err);
      setErrorMsg(err.message || "Could not generate speech.");
    } finally {
      setIsLoading(false);
    }
  };

  const togglePlayPause = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const handleRateChange = (rate: number) => {
    setPlaybackRate(rate);
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleRestart = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
    }
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds <= 0) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <div className="rounded-xl border border-amber-900/10 bg-amber-50/40 p-4 md:p-5">
      {/* Audio Element */}
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => {
            setIsPlaying(false);
            setCurrentTime(0);
          }}
        />
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-amber-900/10">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-serif font-bold text-stone-900 flex items-center gap-1.5">
              <Mic className="w-4 h-4 text-amber-800" />
              Expressive Narration (Gemini 3.1 TTS)
            </h3>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-medium">
              gemini-3.1-flash-tts-preview
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            Expressive dramatic reading tuned to this story's atmosphere
          </p>
        </div>

        {/* Voice Selector */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-stone-600 whitespace-nowrap">Voice:</label>
          <select
            value={selectedVoice}
            onChange={(e) => {
              const v = e.target.value as VoiceName;
              setSelectedVoice(v);
              onVoiceChange?.(v);
            }}
            className="text-xs bg-white border border-stone-200 rounded-lg px-2.5 py-1.5 font-medium text-stone-800 focus:outline-none focus:ring-1 focus:ring-amber-700"
          >
            {VOICE_OPTIONS.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.name} — {opt.genderOrTone}
              </option>
            ))}
          </select>
        </div>
      </div>

      {errorMsg && (
        <div className="my-3 p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
          {errorMsg}
        </div>
      )}

      {/* Main Action or Player Bar */}
      {!audioUrl ? (
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-stone-600">
            <span className="font-semibold text-stone-700">Tone Guidance:</span>{" "}
            <span className="italic text-stone-500">"{narratorToneGuidance}"</span>
          </div>
          <button
            type="button"
            disabled={isLoading || !text.trim()}
            onClick={handleGenerateAudio}
            className={`w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-xs ${
              isLoading || !text.trim()
                ? "bg-stone-200 text-stone-400 cursor-not-allowed"
                : "bg-amber-900 hover:bg-amber-800 text-amber-50 cursor-pointer active:scale-95"
            }`}
          >
            {isLoading ? (
              <>
                <Wand2 className="w-3.5 h-3.5 animate-spin text-amber-300" />
                <span>Synthesizing Expressive Voice...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Read Aloud</span>
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="pt-4 space-y-3">
          {/* Controls + Timeline */}
          <div className="flex items-center gap-3">
            {/* Play/Pause Button */}
            <button
              type="button"
              onClick={togglePlayPause}
              className="w-10 h-10 rounded-full bg-amber-900 text-amber-50 hover:bg-amber-800 flex items-center justify-center transition-all shadow-sm shrink-0 active:scale-95 cursor-pointer"
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 fill-current" />
              ) : (
                <Play className="w-4 h-4 fill-current ml-0.5" />
              )}
            </button>

            {/* Restart */}
            <button
              type="button"
              onClick={handleRestart}
              className="p-2 text-stone-500 hover:text-stone-800 rounded-lg hover:bg-stone-200/50 transition-colors"
              title="Restart from beginning"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Seek bar */}
            <div className="flex-1 flex items-center gap-2">
              <span className="text-[11px] font-mono text-stone-500 w-8 text-right">
                {formatTime(currentTime)}
              </span>
              <input
                type="range"
                min="0"
                max={duration || 100}
                step="0.1"
                value={currentTime}
                onChange={handleSeek}
                className="flex-1 h-1.5 bg-stone-300 rounded-lg appearance-none cursor-pointer accent-amber-800"
              />
              <span className="text-[11px] font-mono text-stone-500 w-8">
                {formatTime(duration)}
              </span>
            </div>

            {/* Sound wave visualizer bars */}
            <div className="hidden md:flex items-center gap-0.5 h-6 px-1">
              {[40, 70, 90, 60, 100, 50, 80, 45, 95, 30].map((height, i) => (
                <div
                  key={i}
                  className={`w-1 rounded-full bg-amber-800/80 transition-all duration-150 ${
                    isPlaying ? "animate-pulse" : "opacity-30"
                  }`}
                  style={{
                    height: isPlaying ? `${Math.max(15, height * 0.22)}px` : "4px",
                    animationDelay: `${i * 90}ms`,
                  }}
                />
              ))}
            </div>

            {/* Mute toggle */}
            <button
              type="button"
              onClick={toggleMute}
              className="p-2 text-stone-500 hover:text-stone-800 rounded-lg hover:bg-stone-200/50 transition-colors"
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-red-600" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>

          {/* Secondary Controls Bar: Speed, Re-narrate, Download */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-amber-900/5 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-stone-500 text-[11px]">Speed:</span>
              {[0.8, 1.0, 1.25, 1.5].map((rate) => (
                <button
                  key={rate}
                  type="button"
                  onClick={() => handleRateChange(rate)}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                    playbackRate === rate
                      ? "bg-amber-900 text-amber-50"
                      : "bg-white border border-stone-200 text-stone-600 hover:bg-stone-100"
                  }`}
                >
                  {rate}x
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleGenerateAudio}
                disabled={isLoading}
                className="flex items-center gap-1 text-[11px] font-medium text-amber-800 hover:text-amber-950 px-2 py-1 rounded hover:bg-amber-100/60 transition-colors"
              >
                <Sparkles className="w-3 h-3" />
                <span>Re-narrate with {selectedVoice}</span>
              </button>

              <a
                href={audioUrl}
                download={`story-narration-${selectedVoice.toLowerCase()}.wav`}
                className="flex items-center gap-1 text-[11px] font-medium text-stone-600 hover:text-stone-900 px-2 py-1 rounded border border-stone-200 bg-white hover:bg-stone-50 transition-colors"
              >
                <Download className="w-3 h-3" />
                <span>WAV</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
