export type VoiceName = "Kore" | "Charon" | "Puck" | "Fenrir" | "Zephyr";

export interface VoiceOption {
  id: VoiceName;
  name: string;
  description: string;
  genderOrTone: string;
}

export interface SensoryDetails {
  sounds: string;
  scents: string;
  textures: string;
}

export interface VisualAnalysis {
  setting: string;
  lightingAndAtmosphere: string;
  keyFocalElements: string[];
  sensoryDetails: SensoryDetails;
}

export interface StoryAnalysisResponse {
  sceneTitle: string;
  mood: string;
  visualAnalysis: VisualAnalysis;
  openingParagraph: string;
  narrativeHook: string;
  recommendedVoice: VoiceName;
  narratorToneGuidance: string;
}

export interface PresetImage {
  id: string;
  title: string;
  description: string;
  genre: string;
  url: string;
}

export type ChatRole = "muse" | "editor" | "lorekeeper" | "pacing";

export type GeminiModelChoice = "gemini-3.5-flash" | "gemini-3.1-pro-preview" | "gemini-3.1-flash-lite";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  modelUsed?: string;
  roleUsed?: ChatRole;
}
