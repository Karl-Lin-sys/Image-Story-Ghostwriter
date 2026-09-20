import { PresetImage, VoiceOption } from "../types";

export const PRESET_IMAGES: PresetImage[] = [
  {
    id: "foggy-cyberpunk",
    title: "Neon Rain in Sector 4",
    description: "Steam rising from glowing asphalt beneath towering holographic kanji",
    genre: "Cyberpunk Noir",
    url: "https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=1000&q=80",
  },
  {
    id: "ancient-overgrown",
    title: "The Forgotten Sanctuary",
    description: "Sunlight piercing emerald canopy over moss-clad stone arches",
    genre: "High Fantasy",
    url: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1000&q=80",
  },
  {
    id: "solitary-lighthouse",
    title: "Beacon on the Black Crags",
    description: "Fierce North Atlantic swells smashing against a lonely Victorian lighthouse",
    genre: "Gothic Mystery",
    url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1000&q=80",
  },
  {
    id: "starry-desert",
    title: "Dunes of the Starlit Void",
    description: "Bioluminescent ripples through endless midnight desert sands",
    genre: "Literary Speculative",
    url: "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1000&q=80",
  },
  {
    id: "victorian-library",
    title: "Archive of the Forbidden Index",
    description: "Dust motes dancing across spiral mahogany stairs and towering leather tomes",
    genre: "Dark Academia",
    url: "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=1000&q=80",
  },
];

export const VOICE_OPTIONS: VoiceOption[] = [
  {
    id: "Kore",
    name: "Kore",
    description: "Warm, poised, and immersive storytelling voice with delicate pacing.",
    genderOrTone: "Warm & Literary",
  },
  {
    id: "Charon",
    name: "Charon",
    description: "Deep, gravelly, atmospheric timbre ideal for gothic, noir, or high suspense.",
    genderOrTone: "Deep & Atmospheric",
  },
  {
    id: "Puck",
    name: "Puck",
    description: "Wry, rhythmic, and expressive cadence with subtle dramatic irony.",
    genderOrTone: "Lively & Dramatic",
  },
  {
    id: "Fenrir",
    name: "Fenrir",
    description: "Resonant, rugged baritone carrying weight, battle-weary grit, and grandeur.",
    genderOrTone: "Resonant & Gritty",
  },
  {
    id: "Zephyr",
    name: "Zephyr",
    description: "Gentle, lyrical, ethereal tone that feels whispered from another realm.",
    genderOrTone: "Soft & Lyrical",
  },
];

export const GENRE_OPTIONS = [
  "Literary Speculative",
  "Cyberpunk Noir",
  "Gothic Mystery",
  "High Fantasy",
  "Dark Academia",
  "Cosmic Horror",
  "Solarpunk / Hopepunk",
  "Magical Realism",
  "Post-Apocalyptic Survival",
];

export const POV_OPTIONS = [
  "Third Person Limited",
  "First Person (\"I\")",
  "Third Person Omniscient",
  "Second Person (\"You\")",
];

export const TONE_OPTIONS = [
  "Atmospheric & Immersive",
  "Eerie & Suspenseful",
  "Poetic & Melancholic",
  "Tense & Cinematic",
  "Wonder & Mystical Awe",
  "Gritty & Hard-boiled",
];
