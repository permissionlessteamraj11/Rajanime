import React, { useState } from "react";
import { Sparkles, MessageSquare, ArrowRight, User, HelpCircle, Film, Languages, Loader2 } from "lucide-react";

interface AiChatProps {
  onPlayAnime: (id: string) => void;
}

export default function AiChat({ onPlayAnime }: AiChatProps) {
  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [references, setReferences] = useState<string[]>([]);
  const [isFallback, setIsFallback] = useState(false);

  const recommendedPrompts = [
    "What is AnimeHub?",
    "Which are the best Hindi dubbed anime?",
    "Which anime movies are available in Hindi dubbed?",
    "Best anime for beginners"
  ];

  const handleAsk = async (text: string) => {
    if (!text.trim()) return;
    setLoading(true);
    setQuery(text);
    setAnswer(null);
    setReferences([]);
    setIsFallback(false);

    try {
      const res = await fetch("/api/aeo/ask-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: text })
      });
      if (res.ok) {
        const data = await res.json();
        setAnswer(data.answer);
        setReferences(data.references || []);
        setIsFallback(!!data.isFallback);
      } else {
        setAnswer("Sorry, our AI search engine encountered a processing error. Please try again soon!");
      }
    } catch (err) {
      setAnswer("Could not reach our AEO indexing server. Please check your network connection.");
    } finally {
      setLoading(false);
    }
  };

  const parseText = (text: string) => {
    // Basic bullet points parser
    return text.split("\n").map((line, idx) => {
      if (line.trim().startsWith("*") || line.trim().startsWith("-")) {
        return (
          <li key={idx} className="ml-4 list-disc text-sm text-zinc-300 leading-relaxed mb-1">
            {line.replace(/^[\s*-]+/, "").trim()}
          </li>
        );
      }
      return (
        <p key={idx} className="text-sm text-zinc-300 leading-relaxed mb-2">
          {line}
        </p>
      );
    });
  };

  return (
    <section id="aeo-answer-engine" className="bg-[#09090b] min-h-[calc(100vh-4rem)] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto flex flex-col gap-6">
        
        {/* Title branding */}
        <div className="text-center flex flex-col items-center gap-2">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-amber-500/10 to-rose-600/10 border border-rose-500/30 rounded-full text-xs font-semibold text-rose-400">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            AI Search, Voice & Answer Engine (AEO-optimized)
          </div>
          <h2 className="text-2xl sm:text-3xl font-sans font-extrabold tracking-tight text-white mt-1">
            Discover Anime Hub Knowledge
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500 max-w-xl">
            Ask any questions about the best Hindi dubbed series, watch orders, movie lists, and more. Our Gemini-powered system outputs structured, feature-snippet-ready answers instantly.
          </p>
        </div>

        {/* Prompts/Question Launcher Box */}
        <div className="bg-zinc-900/40 border border-zinc-850 p-5 rounded-2xl flex flex-col gap-4">
          <h3 className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-rose-500" />
            Click to Ask Recommended Questions:
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {recommendedPrompts.map((p, idx) => (
              <button
                key={idx}
                disabled={loading}
                onClick={() => handleAsk(p)}
                className="flex items-center justify-between text-left px-4 py-3 bg-zinc-950 hover:bg-zinc-900 border border-zinc-850 hover:border-zinc-700 rounded-xl text-xs text-zinc-300 hover:text-white transition-all cursor-pointer select-none"
              >
                <span>{p}</span>
                <ArrowRight className="w-3.5 h-3.5 text-zinc-500" />
              </button>
            ))}
          </div>
        </div>

        {/* Input Text Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAsk(query);
          }}
          className="relative"
        >
          <input
            type="text"
            placeholder="Ask anything, e.g. 'What is the best Hindi dubbed movie for beginners?'"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={loading}
            className="w-full bg-zinc-900 border-2 border-zinc-800 focus:border-rose-500/50 rounded-2xl py-3.5 pl-5 pr-12 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none transition-all shadow-xl shadow-black/30"
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="absolute right-3.5 top-2.5 p-2 bg-gradient-to-tr from-amber-500 to-rose-600 text-black hover:from-amber-400 hover:to-rose-500 rounded-xl disabled:opacity-55 transition-all cursor-pointer"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin text-black" /> : <ArrowRight className="w-4 h-4 text-black" />}
          </button>
        </form>

        {/* AI Answer & Citation Board */}
        {(loading || answer) && (
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 sm:p-8 flex flex-col gap-6 shadow-2xl animate-fade-in">
            
            {/* Header meta */}
            <div className="flex items-center justify-between gap-4 border-b border-zinc-850 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-rose-600/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                  <Sparkles className="w-4 h-4 text-amber-400 animate-spin" style={{ animationDuration: '3s' }} />
                </div>
                <div>
                  <h4 className="text-xs font-sans font-extrabold text-white">AnimeHub AI Engine</h4>
                  <span className="text-[10px] font-mono text-emerald-400">Answer-First Feature Snippet</span>
                </div>
              </div>
              <span className="text-[10px] bg-zinc-950 border border-zinc-800 px-2 py-0.5 rounded text-zinc-500 uppercase font-mono">
                Model: Gemini 3.5 Flash
              </span>
            </div>

            {/* Answer body */}
            {loading ? (
              <div className="flex flex-col gap-3 py-6 items-center justify-center text-center">
                <Loader2 className="w-8 h-8 text-rose-500 animate-spin" />
                <p className="text-xs font-mono text-zinc-400">Indexing search entities and generating structured answers...</p>
              </div>
            ) : (
              <div className="text-zinc-300 font-sans leading-relaxed">
                {isFallback && (
                  <div className="mb-4 p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-400 leading-relaxed">
                    <strong>Demo Notice:</strong> This is a cached structured response. Configure your real <strong>GEMINI_API_KEY</strong> secret key in the Secrets Panel to query live AI models on the fly!
                  </div>
                )}
                {answer && parseText(answer)}
              </div>
            )}

            {/* Citations & Related Entity blocks */}
            {!loading && references.length > 0 && (
              <div className="mt-2 border-t border-zinc-850 pt-5 flex flex-col gap-3">
                <span className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Film className="w-3.5 h-3.5 text-amber-500" />
                  Cited Entities in AnimeHub:
                </span>
                <div className="flex flex-wrap gap-2">
                  {references.map((ref, idx) => (
                    <div
                      key={idx}
                      className="px-3.5 py-2 bg-zinc-950 hover:bg-zinc-900 border border-zinc-850 hover:border-zinc-700 rounded-xl text-xs text-zinc-300 font-semibold flex items-center gap-2 transition-colors select-none"
                    >
                      <Languages className="w-3.5 h-3.5 text-rose-500" />
                      <span>{ref}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}

      </div>
    </section>
  );
}
