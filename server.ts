import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

// Support large payload for base64 image data (up to 25MB)
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));

let aiClient: GoogleGenAI | null = null;

function getAI(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY is not set. Please add it to Settings > Secrets.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Convert raw 16-bit little-endian PCM to a valid WAV buffer with standard 44-byte RIFF header
function pcmToWav(pcmBuffer: Buffer, sampleRate = 24000, numChannels = 1, bitsPerSample = 16): Buffer {
  // If it already has a RIFF header, return as-is
  if (pcmBuffer.length > 12 && pcmBuffer.toString("utf8", 0, 4) === "RIFF") {
    return pcmBuffer;
  }

  const header = Buffer.alloc(44);
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = pcmBuffer.length;
  const chunkSize = 36 + dataSize;

  header.write("RIFF", 0);
  header.writeUInt32LE(chunkSize, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
  header.writeUInt16LE(1, 20); // AudioFormat (1 for PCM)
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write("data", 36);
  header.writeUInt32LE(dataSize, 40);

  return Buffer.concat([header, pcmBuffer]);
}

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

// 1. Analyze Image & Ghostwrite Opening Paragraph
app.post("/api/analyze-and-ghostwrite", async (req, res) => {
  try {
    const { image, genre = "Literary Speculative", pov = "Third Person Limited", tone = "Atmospheric & Immersive", customPrompt = "" } = req.body;

    if (!image || !image.data) {
      return res.status(400).json({ error: "Image data is required." });
    }

    const ai = getAI();
    const cleanBase64 = image.data.replace(/^data:[^;]+;base64,/, "");
    const mimeType = image.mimeType || "image/jpeg";

    const promptText = `
You are a master literary ghostwriter and atmospheric worldbuilder.
Analyze this uploaded image in depth and write a compelling, vivid, world-class opening paragraph to a story set directly within this scene.

Parameters:
- Genre / Style: ${genre}
- Perspective (POV): ${pov}
- Target Mood / Tone: ${tone}
${customPrompt ? `- Additional Author Direction: ${customPrompt}` : ""}

Provide your analysis and ghostwritten story opening in clean JSON format matching the schema.
Requirements:
1. "sceneTitle": A poetic, memorable title for this scene or chapter.
2. "mood": 2-4 evocative adjectives characterizing the atmospheric mood (e.g., "Hauntingly expectant, neon-drenched melancholy").
3. "visualAnalysis": Detailed breakdown of:
   - "setting": The physical environment and time (era, weather, architectural/natural features).
   - "lightingAndAtmosphere": How light, shadow, fog, or color play across the scene.
   - "keyFocalElements": Array of 3-5 visual focal points that anchor the scene.
   - "sensoryDetails": Suggested sounds, scents, and tactile textures that the viewer feels intuitively.
4. "openingParagraph": A single, richly crafted opening paragraph (around 120-220 words). It should NOT merely describe the picture like a caption; it must immediately ground the reader in a living, breathing moment with narrative tension, character sensory awareness, and an irresistible voice.
5. "narrativeHook": A 1-2 sentence compelling question or impending conflict emerging from the scene.
6. "recommendedVoice": The best matching narrator voice from: 'Kore' (warm, narrative), 'Charon' (deep, mysterious, gothic), 'Puck' (lively, wry, conversational), 'Fenrir' (resonant, rugged, gritty), 'Zephyr' (soft, lyrical, ethereal).
7. "narratorToneGuidance": Brief expressive direction for the speech synthesis model (e.g. "Speak with measured, hushed intrigue, pausing slightly as the shadows deepen.").
`;

    const contents = {
      parts: [
        {
          inlineData: {
            mimeType: mimeType,
            data: cleanBase64,
          },
        },
        { text: promptText },
      ],
    };

    // Primary model: gemini-3.1-pro-preview as specified for image understanding. Fallback to gemini-3.8-flash if unavailable.
    let response;
    try {
      response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              sceneTitle: { type: Type.STRING },
              mood: { type: Type.STRING },
              visualAnalysis: {
                type: Type.OBJECT,
                properties: {
                  setting: { type: Type.STRING },
                  lightingAndAtmosphere: { type: Type.STRING },
                  keyFocalElements: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  sensoryDetails: {
                    type: Type.OBJECT,
                    properties: {
                      sounds: { type: Type.STRING },
                      scents: { type: Type.STRING },
                      textures: { type: Type.STRING },
                    },
                    required: ["sounds", "scents", "textures"],
                  },
                },
                required: ["setting", "lightingAndAtmosphere", "keyFocalElements", "sensoryDetails"],
              },
              openingParagraph: { type: Type.STRING },
              narrativeHook: { type: Type.STRING },
              recommendedVoice: { type: Type.STRING },
              narratorToneGuidance: { type: Type.STRING },
            },
            required: ["sceneTitle", "mood", "visualAnalysis", "openingParagraph", "narrativeHook", "recommendedVoice", "narratorToneGuidance"],
          },
        },
      });
    } catch (primaryErr: any) {
      console.warn("Primary model gemini-3.1-pro-preview encountered error, attempting fallback to gemini-3.8-flash:", primaryErr?.message);
      response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents,
        config: {
          responseMimeType: "application/json",
        },
      });
    }

    const textOutput = response.text || "{}";
    let parsedData;
    try {
      parsedData = JSON.parse(textOutput);
    } catch {
      // Fallback extraction
      const jsonMatch = textOutput.match(/\{[\s\S]*\}/);
      parsedData = jsonMatch ? JSON.parse(jsonMatch[0]) : { openingParagraph: textOutput };
    }

    res.json(parsedData);
  } catch (error: any) {
    console.error("Error in /api/analyze-and-ghostwrite:", error);
    res.status(500).json({ error: error.message || "Failed to analyze image and generate story." });
  }
});

// 2. Read Aloud Text-to-Speech using gemini-3.1-flash-tts-preview
app.post("/api/tts", async (req, res) => {
  try {
    const { text, voiceName = "Kore", toneGuidance = "" } = req.body;

    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "Text is required for TTS." });
    }

    const ai = getAI();
    const validVoices = ["Kore", "Charon", "Puck", "Fenrir", "Zephyr"];
    const chosenVoice = validVoices.includes(voiceName) ? voiceName : "Kore";

    const prompt = toneGuidance
      ? `Read expressively following this tone: ${toneGuidance}. Story: "${text.trim()}"`
      : `Read expressively and cinematically with great dramatic rhythm: "${text.trim()}"`;

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-tts-preview",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: chosenVoice },
          },
        },
      },
    });

    const candidate = response.candidates?.[0];
    const part = candidate?.content?.parts?.[0];
    const inlineData = part?.inlineData;

    if (!inlineData || !inlineData.data) {
      return res.status(500).json({ error: "No audio generated from TTS model." });
    }

    const rawBuffer = Buffer.from(inlineData.data, "base64");
    // Ensure it's packaged with a valid WAV header
    const wavBuffer = pcmToWav(rawBuffer, 24000, 1, 16);
    const base64Wav = wavBuffer.toString("base64");

    res.json({
      audioDataUrl: `data:audio/wav;base64,${base64Wav}`,
      mimeType: "audio/wav",
      voiceUsed: chosenVoice,
    });
  } catch (error: any) {
    console.error("Error in /api/tts:", error);
    res.status(500).json({ error: error.message || "Failed to generate speech." });
  }
});

// 3. Multi-turn Chat for Creative Collaboration
app.post("/api/chat", async (req, res) => {
  try {
    const {
      messages = [],
      roleId = "muse",
      model = "gemini-3.5-flash",
      storyContext = {},
    } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "Messages array is required." });
    }

    const ai = getAI();

    // Select model according to user preference / task need:
    // gemini-3.1-pro-preview for complex tasks, gemini-3.5-flash for general, gemini-3.1-flash-lite for fast
    let selectedModel = model;
    if (!["gemini-3.5-flash", "gemini-3.1-pro-preview", "gemini-3.1-flash-lite"].includes(selectedModel)) {
      selectedModel = "gemini-3.5-flash";
    }

    let roleDescription = "";
    switch (roleId) {
      case "editor":
        roleDescription = `You are a meticulous Line Editor and Prose Stylist. You specialize in cadence, vivid sensory metaphors, cutting cliches, and enhancing prose rhythm without losing the author's authentic voice.`;
        break;
      case "lorekeeper":
        roleDescription = `You are an imaginative Lorekeeper and Worldbuilding Architect. You specialize in developing historical depth, hidden cultural factions, geography, architecture, and technology or mystical laws rooted in the visual setting.`;
        break;
      case "pacing":
        roleDescription = `You are a Dramatic Pacing and Tension Specialist. You analyze stakes, plot momentum, subtext, character motives, unexpected reveals, and cliffhanger hooks.`;
        break;
      case "muse":
      default:
        roleDescription = `You are a Collaborative Creative Writing Muse and Co-Author. You help the writer draft subsequent paragraphs, explore protagonist decisions, brainstorm sensory details, and overcome writer's block with captivating ideas.`;
        break;
    }

    const contextSummary = `
CURRENT STORY CONTEXT:
- Title: ${storyContext.title || "Untitled Scene"}
- Setting: ${storyContext.setting || "Visual environment as established"}
- Mood: ${storyContext.mood || "Atmospheric"}
- Current Opening Paragraph:
"""
${storyContext.paragraph || "(No opening paragraph yet)"}
"""
`;

    const systemInstruction = `${roleDescription}

${contextSummary}

GUIDELINES:
- Always stay deeply attuned to the established mood, sensory atmosphere, and world details.
- When suggesting text continuations or revisions, write with rich literary flair and immediate immersion.
- Format responses clearly with markdown, bullet points for ideas, and blockquotes for suggested story passages so the user can easily copy or insert them into their manuscript.
- Be supportive, collaborative, and inspiring.`;

    // Build Gemini contents format from message history
    const contents = messages.map((m: { role: string; content: string }) => ({
      role: m.role === "assistant" || m.role === "model" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    let response;
    try {
      response = await ai.models.generateContent({
        model: selectedModel,
        contents,
        config: {
          systemInstruction,
          temperature: 0.85,
        },
      });
    } catch (err: any) {
      // If gemini-3.1-pro-preview failed due to permissions, fallback to gemini-3.5-flash
      if (selectedModel !== "gemini-3.5-flash") {
        console.warn(`Model ${selectedModel} failed, falling back to gemini-3.5-flash:`, err?.message);
        response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents,
          config: {
            systemInstruction,
            temperature: 0.85,
          },
        });
      } else {
        throw err;
      }
    }

    res.json({
      reply: response.text || "I was unable to generate a response. Please try again.",
      modelUsed: selectedModel,
    });
  } catch (error: any) {
    console.error("Error in /api/chat:", error);
    res.status(500).json({ error: error.message || "Failed to generate chat response." });
  }
});

// Vite middleware setup
async function setupServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

setupServer();
