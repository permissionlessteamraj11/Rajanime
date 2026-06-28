import React, { useState, useEffect } from "react";
import { Play, Info, Eye, Star, ChevronLeft, ChevronRight, Languages } from "lucide-react";
import { Anime } from "../types";

interface HeroProps {
  featured: Anime[];
  onPlay: (animeId: string) => void;
  onDetails: (animeId: string) => void;
}

export default function Hero({ featured, onPlay, onDetails }: HeroProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (featured.length === 0) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % featured.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [featured]);

  if (featured.length === 0) return null;

  const current = featured[currentIndex];

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % featured.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + featured.length) % featured.length);
  };

  return (
    <section id="hero-banner-slider" className="relative h-[420px] md:h-[520px] overflow-hidden bg-black select-none">
      {/* Background Banner with deep black cinematic gradients */}
      <div className="absolute inset-0 transition-all duration-1000 ease-in-out">
        <img
          src={current.banner}
          alt={current.title}
          className="w-full h-full object-cover opacity-60 scale-105 blur-[1px] md:blur-0 transition-transform duration-[10000ms]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-[#09090b]/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#09090b] via-transparent to-transparent" />
      </div>

      {/* Content overlays */}
      <div className="absolute inset-0 flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex flex-col items-start gap-4 md:gap-5">
          
          {/* Tag labels */}
          <div className="flex items-center gap-2 flex-wrap">
            {current.isHindiDubbed && (
              <span className="bg-rose-600 text-white text-[10px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-md shadow-rose-600/20">
                <Languages className="w-3 h-3" />
                Hindi Dubbed
              </span>
            )}
            <span className="bg-zinc-800/90 text-zinc-300 text-[10px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider">
              {current.type}
            </span>
            <span className="bg-zinc-800/90 text-zinc-300 text-[10px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider">
              {current.studio}
            </span>
          </div>

          {/* Heading */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-sans font-extrabold tracking-tight text-white max-w-3xl drop-shadow-xl">
            {current.title}
          </h1>

          {/* Metadata counts */}
          <div className="flex items-center gap-4 text-xs font-medium text-zinc-300">
            <span className="flex items-center gap-1.5 text-amber-400">
              <Star className="w-4 h-4 fill-amber-400" />
              {current.rating} Rating
            </span>
            <span className="text-zinc-600">|</span>
            <span className="flex items-center gap-1.5">
              <Eye className="w-4 h-4" />
              {current.views.toLocaleString()} Views
            </span>
            <span className="text-zinc-600">|</span>
            <span className="text-zinc-300 font-mono">{current.year}</span>
          </div>

          {/* Synopsis */}
          <p className="text-sm md:text-base text-zinc-400 max-w-2xl line-clamp-3 leading-relaxed drop-shadow">
            {current.synopsis}
          </p>

          {/* Action triggers */}
          <div className="flex items-center gap-3 mt-2 w-full sm:w-auto">
            <button
              onClick={() => onPlay(current.id)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-black font-semibold rounded-xl text-sm transition-all shadow-lg shadow-rose-600/10 cursor-pointer active:scale-95"
            >
              <Play className="w-4 h-4 fill-black text-black" />
              Watch Now
            </button>
            <button
              onClick={() => onDetails(current.id)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-zinc-900/90 hover:bg-zinc-800 text-white font-semibold rounded-xl text-sm border border-zinc-800 transition-all cursor-pointer active:scale-95"
            >
              <Info className="w-4 h-4" />
              More Info
            </button>
          </div>

        </div>
      </div>

      {/* Manual slide controllers */}
      <div className="absolute right-4 bottom-4 md:right-8 md:bottom-8 flex items-center gap-2">
        <button
          onClick={handlePrev}
          className="p-2 rounded-lg bg-zinc-900/80 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-xs font-mono text-zinc-400 bg-zinc-950/80 px-2 py-1 rounded border border-zinc-900">
          {currentIndex + 1} / {featured.length}
        </span>
        <button
          onClick={handleNext}
          className="p-2 rounded-lg bg-zinc-900/80 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </section>
  );
}
