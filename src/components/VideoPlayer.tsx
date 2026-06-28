import React, { useRef, useState, useEffect } from "react";
import { Play, Pause, RotateCcw, Volume2, VolumeX, Maximize2, SkipForward, ArrowLeft, FastForward, Sliders, Languages } from "lucide-react";
import { Episode, Anime } from "../types";

interface VideoPlayerProps {
  anime: Anime;
  episode: Episode;
  allEpisodes: Episode[];
  onBack: () => void;
  onEpisodeSelect: (ep: Episode) => void;
  userId: string | undefined;
}

export default function VideoPlayer({
  anime,
  episode,
  allEpisodes,
  onBack,
  onEpisodeSelect,
  userId
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSkipIntro, setShowSkipIntro] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [subtitleOn, setSubtitleOn] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [quality, setQuality] = useState("1080p");

  // Load saved continue watching time from DB on load
  useEffect(() => {
    // We can fetch from local cache or API
    const loadProgress = async () => {
      try {
        const res = await fetch("/api/user/continue");
        if (res.ok) {
          const list = await res.json();
          const match = list.find((item: any) => item.animeId === anime.id && item.episodeId === episode.id);
          if (match && videoRef.current) {
            videoRef.current.currentTime = match.progressSeconds;
          }
        }
      } catch (err) {
        console.warn("Could not load playback progress", err);
      }
    };
    loadProgress();
  }, [anime.id, episode.id]);

  // Periodic Save Progress trigger (runs every 4 seconds)
  useEffect(() => {
    if (!videoRef.current) return;
    const interval = setInterval(async () => {
      if (videoRef.current && isPlaying) {
        const cur = videoRef.current.currentTime;
        try {
          await fetch("/api/user/continue", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              animeId: anime.id,
              episodeId: episode.id,
              episodeNumber: episode.episodeNumber,
              progressSeconds: Math.floor(cur)
            })
          });
        } catch (e) {
          // silent error for offline/disconnected
        }
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [isPlaying, anime.id, episode.id]);

  // Handle skip intro overlays
  useEffect(() => {
    const hasIntro = episode.skipIntroStart && episode.skipIntroEnd;
    if (hasIntro) {
      const isWithinRange =
        currentTime >= (episode.skipIntroStart || 0) &&
        currentTime <= (episode.skipIntroEnd || 0);
      setShowSkipIntro(isWithinRange);
    } else {
      setShowSkipIntro(false);
    }
  }, [currentTime, episode]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(err => console.log("Play failed", err));
    }
  };

  const handleSkipIntroClick = () => {
    if (videoRef.current && episode.skipIntroEnd) {
      videoRef.current.currentTime = episode.skipIntroEnd;
      setShowSkipIntro(false);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration || episode.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (videoRef.current) {
      const seekTo = Number(e.target.value);
      videoRef.current.currentTime = seekTo;
      setCurrentTime(seekTo);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    setVolume(v);
    setIsMuted(v === 0);
    if (videoRef.current) {
      videoRef.current.volume = v;
      videoRef.current.muted = v === 0;
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      const nextMute = !isMuted;
      setIsMuted(nextMute);
      videoRef.current.muted = nextMute;
    }
  };

  const handleSpeedChange = (rate: number) => {
    setPlaybackRate(rate);
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(err => console.log(err));
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const currentIdx = allEpisodes.findIndex((e) => e.id === episode.id);
  const nextEp = currentIdx !== -1 && currentIdx < allEpisodes.length - 1 ? allEpisodes[currentIdx + 1] : null;

  return (
    <div id="immersive-watch-container" className="bg-[#09090b] min-h-screen py-6 px-4">
      <div className="max-w-6xl mx-auto">
        
        {/* Breadcrumb / Exit control */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-sm font-semibold text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Details
          </button>
          <div className="text-right">
            <span className="text-xs font-mono text-rose-500 uppercase font-semibold tracking-wider">
              Watching Episode {episode.episodeNumber}
            </span>
            <h2 className="text-sm font-sans font-bold text-white line-clamp-1">{episode.title}</h2>
          </div>
        </div>

        {/* Video stage container */}
        <div
          ref={containerRef}
          className="relative aspect-video rounded-2xl overflow-hidden bg-black border border-zinc-800 shadow-2xl group select-none"
          onMouseMove={() => {
            setShowControls(true);
          }}
          onMouseLeave={() => {
            if (isPlaying) {
              setShowControls(false);
            }
          }}
        >
          {/* Native HTML5 Video Element */}
          <video
            ref={videoRef}
            src={episode.videoUrl}
            className="w-full h-full object-contain"
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onClick={togglePlay}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />

          {/* Skip Intro Overlay Popup */}
          {showSkipIntro && (
            <button
              onClick={handleSkipIntroClick}
              className="absolute bottom-20 left-6 z-30 flex items-center gap-2 px-5 py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs sm:text-sm tracking-wide shadow-2xl shadow-rose-600/30 border border-rose-400 animate-bounce cursor-pointer"
            >
              <FastForward className="w-4 h-4" />
              Skip Opening Intro
            </button>
          )}

          {/* Subtitles Simulation overlay */}
          {subtitleOn && isPlaying && (
            <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-20 text-center pointer-events-none px-4">
              <p className="bg-black/80 text-white text-sm sm:text-base font-semibold px-4 py-2 rounded-xl border border-zinc-800 shadow-lg inline-block font-sans max-w-xl">
                {currentTime < 10 
                  ? "[Opening Theme playing in Hindi dub...]" 
                  : `[Voiceover]: (Dialogue sync) Episode ${episode.episodeNumber} continues...`}
              </p>
            </div>
          )}

          {/* Controls Overlay container */}
          <div
            className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/70 to-transparent p-4 flex flex-col gap-3 transition-opacity duration-300 z-40 ${
              showControls ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
          >
            {/* Progress range bar */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-zinc-400">{formatTime(currentTime)}</span>
              <input
                type="range"
                min="0"
                max={duration || episode.duration}
                value={currentTime}
                onChange={handleSeek}
                className="flex-1 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
              />
              <span className="text-xs font-mono text-zinc-400">
                {formatTime(duration || episode.duration)}
              </span>
            </div>

            {/* Utility and actions bar */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <button
                  onClick={togglePlay}
                  className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-white transition-all cursor-pointer"
                >
                  {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white" />}
                </button>
                
                {/* Volume bar */}
                <div className="flex items-center gap-1">
                  <button onClick={toggleMute} className="text-zinc-400 hover:text-white p-1">
                    {isMuted ? <VolumeX className="w-4 h-4 text-rose-500" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="w-16 h-1 bg-zinc-800 accent-rose-500 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>

              {/* Advanced Player parameters */}
              <div className="flex items-center gap-2">
                {/* Speed selector */}
                <div className="flex items-center gap-1 bg-zinc-950 px-2 py-1 rounded border border-zinc-800">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase mr-1">Speed</span>
                  {[1, 1.25, 1.5].map((rate) => (
                    <button
                      key={rate}
                      onClick={() => handleSpeedChange(rate)}
                      className={`text-[10px] font-semibold px-1.5 py-0.5 rounded transition-all ${
                        playbackRate === rate ? "bg-rose-600 text-white" : "text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      {rate}x
                    </button>
                  ))}
                </div>

                {/* Subtitle toggle */}
                <button
                  onClick={() => setSubtitleOn(!subtitleOn)}
                  className={`text-[10px] font-semibold px-2 py-1 rounded border transition-all ${
                    subtitleOn 
                      ? "bg-emerald-600/10 border-emerald-500/20 text-emerald-400" 
                      : "bg-zinc-950 border-zinc-800 text-zinc-500"
                  }`}
                >
                  Subtitles: {subtitleOn ? "ON" : "OFF"}
                </button>

                {/* Resolution selector */}
                <select
                  value={quality}
                  onChange={(e) => setQuality(e.target.value)}
                  className="bg-zinc-950 border border-zinc-800 text-[10px] font-bold text-zinc-300 rounded px-1.5 py-1 focus:outline-none"
                >
                  <option value="1080p">1080p HD</option>
                  <option value="720p">720p SD</option>
                  <option value="Auto">Auto</option>
                </select>

                {/* Next episode link */}
                {nextEp && (
                  <button
                    onClick={() => onEpisodeSelect(nextEp)}
                    className="flex items-center gap-1 text-xs font-bold text-amber-400 hover:text-amber-300 bg-zinc-950/90 border border-zinc-800 px-2.5 py-1 rounded-lg"
                  >
                    Next Ep
                    <SkipForward className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  </button>
                )}

                {/* Fullscreen control */}
                <button
                  onClick={toggleFullscreen}
                  className="p-1 text-zinc-400 hover:text-white"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Episode selector playlist rail */}
        <div className="mt-8 bg-zinc-900/40 border border-zinc-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4 border-b border-zinc-800 pb-3">
            <h3 className="text-base font-sans font-extrabold text-white">
              Episode Playlist ({allEpisodes.length})
            </h3>
            {anime.isHindiDubbed && (
              <span className="text-[10px] bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-mono uppercase font-bold tracking-wider flex items-center gap-1">
                <Languages className="w-3 h-3" />
                Hindi Local Sync Active
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {allEpisodes.map((ep) => (
              <div
                key={ep.id}
                onClick={() => onEpisodeSelect(ep)}
                className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                  ep.id === episode.id
                    ? "bg-gradient-to-r from-amber-500/10 to-rose-600/10 border-rose-500/50 text-rose-400"
                    : "bg-zinc-950 border-zinc-850 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                }`}
              >
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase">
                    Episode {ep.episodeNumber}
                  </span>
                  <span className="text-xs font-sans font-bold line-clamp-1">{ep.title}</span>
                </div>
                <div className="text-[10px] font-mono text-zinc-500">
                  {Math.floor(ep.duration / 60)}m
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
