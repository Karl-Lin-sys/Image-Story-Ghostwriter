import React, { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Sparkles, Copy, Check, PlusCircle, Trash2, Cpu, Feather } from "lucide-react";
import { ChatMessage, ChatRole, GeminiModelChoice, StoryAnalysisResponse } from "../types";

interface CreativeChatbotProps {
  storyContext: {
    title: string;
    paragraph: string;
    mood: string;
    setting: string;
  };
  onAppendToStory?: (passage: string) => void;
}

const ROLES: { id: ChatRole; label: string; icon: string; description: string }[] = [
  {
    id: "muse",
    label: "Creative Muse",
    icon: "🎭",
    description: "Brainstorm plot twists, continue the next scene, or explore character choices.",
  },
  {
    id: "editor",
    label: "Line Editor",
    icon: "✍️",
    description: "Polish prose cadence, enhance sensory metaphors, and strengthen verbs.",
  },
  {
    id: "lorekeeper",
    label: "Lorekeeper",
    icon: "🗺️",
    description: "Expand history, political factions, technology, and mystical laws.",
  },
  {
    id: "pacing",
    label: "Pacing Architect",
    icon: "⚡",
    description: "Escalate stakes, craft suspenseful reveals, and build narrative tension.",
  },
];

const MODELS: { id: GeminiModelChoice; name: string; badge: string; desc: string }[] = [
  {
    id: "gemini-3.5-flash",
    name: "Gemini 3.5 Flash",
    badge: "General Tasks",
    desc: "Balanced speed & rich storytelling (Recommended)",
  },
  {
    id: "gemini-3.1-pro-preview",
    name: "Gemini 3.1 Pro",
    badge: "Complex Tasks",
    desc: "Deep reasoning, intricate lore & nuanced worldbuilding",
  },
  {
    id: "gemini-3.1-flash-lite",
    name: "Gemini 3.1 Flash-Lite",
    badge: "Fast Tasks",
    desc: "Lightning quick line edits & rapid brainstorming",
  },
];

const PROMPT_SUGGESTIONS: Record<ChatRole, string[]> = {
  muse: [
    "Write the immediate next paragraph continuing this moment.",
    "Introduce a second character who steps into the scene.",
    "Give me 3 unexpected directions the story could take next.",
  ],
  editor: [
    "Highlight the strongest sentence and suggest 2 sensory revisions.",
    "Make the opening sentence punchier and more arresting.",
    "Suggest 3 vivid metaphors replacing generic adjectives.",
  ],
  lorekeeper: [
    "Who built the architecture seen in this world and why is it in this state?",
    "What taboo or ancient law governs this specific location?",
    "What factions are fighting for control over this region?",
  ],
  pacing: [
    "Introduce a sudden sensory shock or disturbance that breaks the silence.",
    "What ticking clock or impending deadline threatens the protagonist?",
    "How can we raise the emotional stakes of this opening scene?",
  ],
};

export const CreativeChatbot: React.FC<CreativeChatbotProps> = ({
  storyContext,
  onAppendToStory,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "initial-welcome",
      role: "assistant",
      content: `I am your **Creative Writing Muse**. I've absorbed the mood and atmosphere of your scene. \n\nAsk me to write the next paragraph, explore what lurks in the shadows, or refine your story opening!`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      roleUsed: "muse",
      modelUsed: "gemini-3.5-flash",
    },
  ]);

  const [inputPrompt, setInputPrompt] = useState<string>("");
  const [currentRole, setCurrentRole] = useState<ChatRole>("muse");
  const [selectedModel, setSelectedModel] = useState<GeminiModelChoice>("gemini-3.5-flash");
  const [isSending, setIsSending] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const threadContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isSending]);

  const handleSendMessage = async (textToSend?: string) => {
    const prompt = textToSend || inputPrompt;
    if (!prompt.trim() || isSending) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: prompt.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const updatedHistory = [...messages, userMessage];
    setMessages(updatedHistory);
    setInputPrompt("");
    setIsSending(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedHistory.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          roleId: currentRole,
          model: selectedModel,
          storyContext,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to communicate with AI.");
      }

      const botMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        modelUsed: data.modelUsed || selectedModel,
        roleUsed: currentRole,
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err: any) {
      console.error("Chat error:", err);
      const errorMessage: ChatMessage = {
        id: `err-${Date.now()}`,
        role: "assistant",
        content: `*Error: ${err.message || "Unable to reach the Gemini storyteller server. Please try again."}*`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        roleUsed: currentRole,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsSending(false);
    }
  };

  const handleCopyMessage = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: "assistant",
        content: `Thread refreshed. Ready to continue writing or exploring the world of "${storyContext.title || "your story"}".`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        roleUsed: currentRole,
        modelUsed: selectedModel,
      },
    ]);
  };

  // Extracts potential story prose from blockquotes or paragraphs for insertion into manuscript
  const extractProseToAppend = (content: string) => {
    // Check for blockquote first > text
    const quoteMatches = content.match(/^>(.*?)$/gm);
    if (quoteMatches && quoteMatches.length > 0) {
      return quoteMatches.map((q) => q.replace(/^>\s*/, "")).join(" ");
    }
    // Otherwise return trimmed content without leading asterisks or markdown headers
    return content.replace(/^#+.*$/gm, "").trim();
  };

  return (
    <div className="bg-white rounded-2xl border border-stone-200/90 shadow-xs flex flex-col h-[640px] overflow-hidden">
      {/* Top Header with Roles and Models */}
      <div className="p-4 border-b border-stone-200 bg-stone-50/70">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-stone-900 text-amber-100 flex items-center justify-center text-sm font-bold shadow-xs">
              <Bot className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h3 className="text-sm font-serif font-bold text-stone-900 flex items-center gap-1.5">
                AI Story Co-Author
              </h3>
              <p className="text-[11px] text-stone-500">
                Multi-turn creative writing partner & manuscript collaborator
              </p>
            </div>
          </div>

          {/* Model Selector */}
          <div className="flex items-center gap-2">
            <Cpu className="w-3.5 h-3.5 text-stone-400" />
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value as GeminiModelChoice)}
              className="text-xs bg-white border border-stone-200 rounded-lg px-2.5 py-1 text-stone-800 font-medium focus:outline-none focus:ring-1 focus:ring-amber-700"
              title="Select task-optimized Gemini model"
            >
              {MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.badge})
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={clearChat}
              className="p-1.5 text-stone-400 hover:text-stone-700 rounded-md hover:bg-stone-200/50 transition-colors"
              title="Reset conversation thread"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Role Selector Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          {ROLES.map((role) => {
            const isActive = currentRole === role.id;
            return (
              <button
                key={role.id}
                type="button"
                onClick={() => setCurrentRole(role.id)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all text-left ${
                  isActive
                    ? "bg-amber-900 text-amber-50 shadow-xs"
                    : "bg-white border border-stone-200/80 text-stone-600 hover:bg-stone-100/70"
                }`}
                title={role.description}
              >
                <span>{role.icon}</span>
                <span className="truncate">{role.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Scrollable Conversation Thread */}
      <div
        ref={threadContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-stone-50/30"
      >
        {messages.map((msg) => {
          const isUser = msg.role === "user";
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-2.5 ${isUser ? "flex-row-reverse" : "flex-row"}`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs ${
                  isUser
                    ? "bg-stone-800 text-white"
                    : "bg-amber-100 text-amber-900 border border-amber-200"
                }`}
              >
                {isUser ? <User className="w-3.5 h-3.5" /> : <Feather className="w-3.5 h-3.5" />}
              </div>

              <div
                className={`max-w-[85%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed ${
                  isUser
                    ? "bg-stone-900 text-stone-100 rounded-tr-xs"
                    : "bg-white border border-stone-200 text-stone-800 rounded-tl-xs shadow-2xs"
                }`}
              >
                {/* Assistant metadata header */}
                {!isUser && (
                  <div className="flex items-center justify-between gap-3 text-[10px] text-stone-400 border-b border-stone-100 pb-1.5 mb-2">
                    <span className="font-semibold text-amber-900">
                      {ROLES.find((r) => r.id === msg.roleUsed)?.label || "Story Muse"}
                    </span>
                    <span className="font-mono text-[9px] bg-stone-100 px-1.5 py-0.5 rounded text-stone-500">
                      {msg.modelUsed || selectedModel}
                    </span>
                  </div>
                )}

                {/* Message text with basic paragraph formatting */}
                <div className="space-y-2 whitespace-pre-wrap font-sans">
                  {msg.content}
                </div>

                {/* Assistant Action Tools: Copy & Append to Story */}
                {!isUser && (
                  <div className="flex items-center justify-end gap-2 mt-3 pt-2 border-t border-stone-100 text-xs">
                    <button
                      type="button"
                      onClick={() => handleCopyMessage(msg.content, msg.id)}
                      className="text-[11px] font-medium text-stone-500 hover:text-stone-800 flex items-center gap-1 transition-colors"
                    >
                      {copiedId === msg.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span className="text-emerald-700">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>

                    {onAppendToStory && (
                      <button
                        type="button"
                        onClick={() => onAppendToStory(extractProseToAppend(msg.content))}
                        className="text-[11px] font-semibold text-amber-900 hover:text-amber-950 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 flex items-center gap-1 transition-colors"
                        title="Append suggested prose directly into story opening"
                      >
                        <PlusCircle className="w-3 h-3" />
                        <span>Insert into Manuscript</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isSending && (
          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-900 border border-amber-200 flex items-center justify-center shrink-0">
              <Sparkles className="w-3.5 h-3.5 animate-spin text-amber-700" />
            </div>
            <div className="bg-white border border-stone-200 rounded-2xl rounded-tl-xs p-3.5 text-xs text-stone-500 flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-amber-600 animate-pulse" />
              <span>Weaving story with {selectedModel}...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Suggestion Chips */}
      <div className="px-4 py-2 bg-stone-50/70 border-t border-stone-200 overflow-x-auto flex items-center gap-1.5 shrink-0 no-scrollbar">
        <span className="text-[10px] uppercase tracking-wider font-semibold text-stone-400 shrink-0 mr-1">
          Suggestions:
        </span>
        {PROMPT_SUGGESTIONS[currentRole].map((suggestion, idx) => (
          <button
            key={idx}
            type="button"
            disabled={isSending}
            onClick={() => handleSendMessage(suggestion)}
            className="text-[11px] whitespace-nowrap bg-white hover:bg-amber-50 text-stone-700 hover:text-amber-900 border border-stone-200 rounded-full px-2.5 py-1 transition-colors shadow-2xs disabled:opacity-50"
          >
            {suggestion}
          </button>
        ))}
      </div>

      {/* Input Composer */}
      <div className="p-3 bg-white border-t border-stone-200">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            disabled={isSending}
            placeholder={`Ask your ${ROLES.find((r) => r.id === currentRole)?.label}... (e.g. "What happens next?")`}
            className="flex-1 text-xs bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-amber-700 focus:bg-white transition-all"
          />
          <button
            type="submit"
            disabled={isSending || !inputPrompt.trim()}
            className={`p-2.5 rounded-xl transition-all shadow-2xs flex items-center justify-center shrink-0 ${
              isSending || !inputPrompt.trim()
                ? "bg-stone-200 text-stone-400 cursor-not-allowed"
                : "bg-amber-900 hover:bg-amber-800 text-amber-50 cursor-pointer active:scale-95"
            }`}
            title="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
