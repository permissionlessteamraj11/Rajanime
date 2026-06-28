import React, { useState, useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Sparkles, Flame, Eye, Star, Search, Filter, Play, Info, Heart, Bookmark,
  MessageSquare, User, Globe, ChevronRight, Languages, Sliders, Calendar, ArrowLeft
} from "lucide-react";
import { Anime, Episode, FAQItem, GEOLandingPage, Comment, Review, User as UserType } from "./types";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import VideoPlayer from "./components/VideoPlayer";
import AiChat from "./components/AiChat";
import AdminPanel from "./components/AdminPanel";

export default function App() {
  // Views navigation state
  const [activeView, setActiveView] = useState<string>("home");
  const [selectedAnimeId, setSelectedAnimeId] = useState<string | null>(null);
  const [selectedEpisode, setSelectedEpisode] = useState<Episode | null>(null);
  const [selectedGeoPage, setSelectedGeoPage] = useState<GEOLandingPage | null>(null);

  // Loaded server resources
  const [animeList, setAnimeList] = useState<Anime[]>([]);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [geoPages, setGeoPages] = useState<GEOLandingPage[]>([]);
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);

  // Watchlist & Favorites caches (client synced)
  const [watchlist, setWatchlist] = useState<Anime[]>([]);
  const [favorites, setFavorites] = useState<Anime[]>([]);
  const [continueWatching, setContinueWatching] = useState<any[]>([]);

  // Search & Catalog Filter states
  const [searchVal, setSearchVal] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [isHindiOnly, setIsHindiOnly] = useState(false);
  const [sortBy, setSortBy] = useState("rating");

  // Detail view comments & reviews list
  const [commentsList, setCommentsList] = useState<Comment[]>([]);
  const [reviewsList, setReviewsList] = useState<Review[]>([]);
  const [newCommentVal, setNewCommentVal] = useState("");
  const [newReviewVal, setNewReviewVal] = useState("");
  const [newReviewRating, setNewReviewRating] = useState(10);

  // Genres constant mapping
  const allGenres = ["Action", "Adventure", "Fantasy", "Drama", "Romance", "Supernatural", "Sci-Fi", "Mystery"];

  // Initialize and load essential datasets
  useEffect(() => {
    fetchMe();
    fetchAnime();
    fetchFaqs();
    fetchGeoPages();
  }, []);

  // Fetch sub-items on detail view loads
  useEffect(() => {
    if (selectedAnimeId) {
      fetchEpisodes(selectedAnimeId);
      fetchComments(selectedAnimeId);
      fetchReviews(selectedAnimeId);
    }
  }, [selectedAnimeId]);

  const fetchAnime = async () => {
    try {
      const queryParams = new URLSearchParams();
      if (searchVal) queryParams.set("search", searchVal);
      if (selectedGenre) queryParams.set("genre", selectedGenre);
      if (selectedType) queryParams.set("type", selectedType);
      if (isHindiOnly) queryParams.set("isHindi", "true");

      const res = await fetch(`/api/anime?${queryParams.toString()}`);
      if (res.ok) {
        setAnimeList(await res.json());
      }
    } catch (err) {
      console.error("Could not fetch anime list", err);
    }
  };

  const fetchMe = async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
        if (data.user) {
          fetchUserBookmarks();
          fetchContinueWatching();
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchEpisodes = async (id: string) => {
    try {
      const res = await fetch(`/api/anime/${id}/episodes`);
      if (res.ok) setEpisodes(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const fetchFaqs = async () => {
    try {
      const res = await fetch("/api/aeo/faqs");
      if (res.ok) setFaqs(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const fetchGeoPages = async () => {
    try {
      const res = await fetch("/api/geo/landing-pages");
      if (res.ok) setGeoPages(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const fetchComments = async (id: string) => {
    try {
      const res = await fetch(`/api/anime/${id}/comments`);
      if (res.ok) setCommentsList(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const fetchReviews = async (id: string) => {
    try {
      const res = await fetch(`/api/anime/${id}/reviews`);
      if (res.ok) setReviewsList(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUserBookmarks = async () => {
    try {
      const resW = await fetch("/api/user/watchlist");
      const resF = await fetch("/api/user/favorites");
      if (resW.ok) setWatchlist(await resW.json());
      if (resF.ok) setFavorites(await resF.json());
    } catch (err) {
      console.error(err);
    }
  };

  const fetchContinueWatching = async () => {
    try {
      const res = await fetch("/api/user/continue");
      if (res.ok) setContinueWatching(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  // Switch Simulator user role for evaluating CMS/Admin panel
  const handleRoleSwitch = async (role: "user" | "editor" | "admin") => {
    try {
      const res = await fetch("/api/auth/switch-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role })
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
        alert(`Simulator role switched to: ${role.toUpperCase()}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Watchlist toggle action
  const handleWatchlistToggle = async (animeId: string) => {
    try {
      const res = await fetch("/api/user/watchlist/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ animeId })
      });
      if (res.ok) {
        fetchUserBookmarks();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Favorites toggle action
  const handleFavoritesToggle = async (animeId: string) => {
    try {
      const res = await fetch("/api/user/favorites/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ animeId })
      });
      if (res.ok) {
        fetchUserBookmarks();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Submit new user comment
  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentVal.trim() || !selectedAnimeId) return;
    try {
      const res = await fetch(`/api/anime/${selectedAnimeId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newCommentVal })
      });
      if (res.ok) {
        setNewCommentVal("");
        fetchComments(selectedAnimeId);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Submit review
  const handlePostReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReviewVal.trim() || !selectedAnimeId) return;
    try {
      const res = await fetch(`/api/anime/${selectedAnimeId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newReviewVal, rating: newReviewRating })
      });
      if (res.ok) {
        setNewReviewVal("");
        fetchReviews(selectedAnimeId);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Navigation callbacks
  const handleNavigate = (view: string, param?: string) => {
    setActiveView(view);
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (view === "details" && param) {
      setSelectedAnimeId(param);
      setSelectedEpisode(null);
      setSelectedGeoPage(null);
    } else if (view === "geo" && param) {
      const match = geoPages.find(p => p.slug === param);
      if (match) {
        setSelectedGeoPage(match);
        setSelectedAnimeId(null);
        setSelectedEpisode(null);
      }
    }
  };

  const handlePlayAnime = (animeId: string) => {
    setSelectedAnimeId(animeId);
    // Fetch episodes and auto play ep 1
    fetch(`/api/anime/${animeId}/episodes`)
      .then(res => res.json())
      .then(epsList => {
        if (epsList.length > 0) {
          setSelectedEpisode(epsList[0]);
          setActiveView("play");
        } else {
          alert("No episodes uploaded for this title yet. Add some via the Super Admin Panel!");
          setActiveView("details");
        }
      });
  };

  const handleSearch = (query: string) => {
    setSearchVal(query);
    fetchAnime();
  };

  // Filter Catalog dynamically
  const filteredCatalog = [...animeList].sort((a, b) => {
    if (sortBy === "rating") return b.rating - a.rating;
    if (sortBy === "views") return b.views - a.views;
    if (sortBy === "year") return b.year - a.year;
    return 0;
  });

  return (
    <div className="bg-[#09090b] min-h-screen text-zinc-100 flex flex-col font-sans selection:bg-rose-600 selection:text-white">
      
      {/* Dynamic Header */}
      <Navbar
        currentUser={currentUser}
        onNavigate={handleNavigate}
        onSearch={handleSearch}
        onRoleSwitch={handleRoleSwitch}
        activeView={activeView}
      />

      {/* Main viewport stage with fade transition */}
      <AnimatePresence mode="wait">
        <motion.main
          key={activeView + (selectedAnimeId || "") + (selectedGeoPage?.slug || "")}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="flex-grow"
        >
          
          {/* VIEW A: HOME SCREEN */}
          {activeView === "home" && (
            <div className="flex flex-col gap-10 pb-16">
              {/* Cinematic carousel slider of Hindi dubbed anime */}
              <Hero
                featured={animeList.filter(a => a.isHindiDubbed).slice(0, 3)}
                onPlay={handlePlayAnime}
                onDetails={(id) => handleNavigate("details", id)}
              />

              {/* GEO Target landing gateway triggers - Extremely unique! */}
              <section id="geo-entrance-banner" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                <div className="bg-gradient-to-r from-indigo-950/40 via-purple-950/20 to-zinc-950 border border-indigo-500/20 p-6 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-6">
                  <div className="flex flex-col gap-1.5 text-center sm:text-left">
                    <span className="text-[10px] bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full font-mono uppercase font-bold tracking-wider w-fit mx-auto sm:mx-0">
                      Regional Portal India
                    </span>
                    <h3 className="text-lg font-sans font-extrabold text-white">Localized India Hub Custom Catalogs</h3>
                    <p className="text-xs text-zinc-400 max-w-xl">Are you in Mumbai, Delhi or the North Indian belt? Switch catalogs to discover high-demand theatrical anime movies optimized for local search patterns.</p>
                  </div>
                  <div className="flex gap-2">
                    {geoPages.map((page) => (
                      <button
                        key={page.id}
                        onClick={() => handleNavigate("geo", page.slug)}
                        className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-xs text-zinc-200 font-bold rounded-xl transition-all cursor-pointer select-none"
                      >
                        {page.regionName} ➔
                      </button>
                    ))}
                  </div>
                </div>
              </section>

              {/* Core catalog listings on home */}
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex flex-col gap-10">
                
                {/* Section 1: Trending Hindi Dubbed Series */}
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg sm:text-xl font-sans font-extrabold text-white flex items-center gap-2">
                        <Flame className="w-5 h-5 text-rose-500 animate-pulse" />
                        Trending Hindi Dubbed Anime
                      </h2>
                      <p className="text-xs text-zinc-500">Peak voice synchronization and localized sound engineering.</p>
                    </div>
                    <button onClick={() => { setIsHindiOnly(true); handleNavigate("catalog"); }} className="text-xs font-bold text-rose-500 hover:text-rose-400">
                      View All
                    </button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {animeList.filter(a => a.isHindiDubbed && a.type === "series").slice(0, 6).map((anime) => (
                      <AnimeCard key={anime.id} anime={anime} onDetails={(id) => handleNavigate("details", id)} onPlay={handlePlayAnime} />
                    ))}
                  </div>
                </div>

                {/* Section 2: Popular Cinematic Movies */}
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg sm:text-xl font-sans font-extrabold text-white">Popular Hindi Dubbed Anime Movies</h2>
                      <p className="text-xs text-zinc-500">Sensational theatrical experiences with direct Hindi translation.</p>
                    </div>
                    <button onClick={() => { setSelectedType("movie"); handleNavigate("catalog"); }} className="text-xs font-bold text-rose-500 hover:text-rose-400">
                      View All Movies
                    </button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {animeList.filter(a => a.type === "movie").slice(0, 6).map((anime) => (
                      <AnimeCard key={anime.id} anime={anime} onDetails={(id) => handleNavigate("details", id)} onPlay={handlePlayAnime} />
                    ))}
                  </div>
                </div>

                {/* AEO Answers Widget right on public index for SEO topical authority */}
                <div className="bg-zinc-950 border border-zinc-850 p-6 rounded-3xl mt-4 flex flex-col gap-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
                    <h3 className="text-sm font-sans font-extrabold text-white uppercase tracking-wider">AEO Snippets & Knowledge Base</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {faqs.slice(0, 2).map((faq) => (
                      <div key={faq.id} className="bg-zinc-900/40 p-4 rounded-xl border border-zinc-850">
                        <h4 className="text-xs font-sans font-extrabold text-rose-400 mb-1">{faq.question}</h4>
                        <p className="text-xs text-zinc-400 leading-relaxed">{faq.answer}</p>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* VIEW B: BROWSE CATALOG SCREEN */}
          {activeView === "catalog" && (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6">
              
              {/* Header */}
              <div>
                <h1 className="text-2xl font-sans font-extrabold text-white">Anime Discovery & Browse Catalog</h1>
                <p className="text-xs text-zinc-500 mt-1">Refine and filter localized archives containing fast-streaming Hindi dubbed source codes.</p>
              </div>

              {/* Filtering Controls panel */}
              <div className="bg-zinc-900/60 border border-zinc-850 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3 flex-wrap">
                  {/* Genre */}
                  <select
                    value={selectedGenre}
                    onChange={(e) => { setSelectedGenre(e.target.value); fetchAnime(); }}
                    className="bg-zinc-950 border border-zinc-850 rounded-xl px-3 py-2 text-xs text-zinc-300 font-semibold focus:outline-none"
                  >
                    <option value="">All Genres</option>
                    {allGenres.map((g) => <option key={g} value={g}>{g}</option>)}
                  </select>

                  {/* Type */}
                  <select
                    value={selectedType}
                    onChange={(e) => { setSelectedType(e.target.value); fetchAnime(); }}
                    className="bg-zinc-950 border border-zinc-850 rounded-xl px-3 py-2 text-xs text-zinc-300 font-semibold focus:outline-none"
                  >
                    <option value="">All Types</option>
                    <option value="series">Series</option>
                    <option value="movie">Movie</option>
                  </select>

                  {/* Sort */}
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-zinc-950 border border-zinc-850 rounded-xl px-3 py-2 text-xs text-zinc-300 font-semibold focus:outline-none"
                  >
                    <option value="rating">Top Rated</option>
                    <option value="views">Most Popular</option>
                    <option value="year">Release Year</option>
                  </select>
                </div>

                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isHindiOnly}
                      onChange={(e) => { setIsHindiOnly(e.target.checked); fetchAnime(); }}
                      className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 accent-rose-600"
                    />
                    <span className="text-xs text-zinc-300 font-bold">Hindi Dubbed Only</span>
                  </label>
                  {(selectedGenre || selectedType || isHindiOnly || searchVal) && (
                    <button
                      onClick={() => {
                        setSelectedGenre("");
                        setSelectedType("");
                        setIsHindiOnly(false);
                        setSearchVal("");
                        fetchAnime();
                      }}
                      className="text-xs font-bold text-rose-500 underline"
                    >
                      Clear Filters
                    </button>
                  )}
                </div>
              </div>

              {/* Grids */}
              {filteredCatalog.length === 0 ? (
                <div className="py-16 text-center text-zinc-500 text-sm border-2 border-dashed border-zinc-850 rounded-2xl">
                  No anime matched your active filtration rules. Try clearing search parameters or adjusting tags.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {filteredCatalog.map((anime) => (
                    <AnimeCard key={anime.id} anime={anime} onDetails={(id) => handleNavigate("details", id)} onPlay={handlePlayAnime} />
                  ))}
                </div>
              )}

            </div>
          )}

          {/* VIEW C: ANIME DETAIL SCREEN */}
          {activeView === "details" && selectedAnimeId && (
            <DetailView
              animeId={selectedAnimeId}
              animeList={animeList}
              episodes={episodes}
              commentsList={commentsList}
              reviewsList={reviewsList}
              newCommentVal={newCommentVal}
              onNewCommentChange={setNewCommentVal}
              onPostComment={handlePostComment}
              newReviewVal={newReviewVal}
              onNewReviewChange={setNewReviewVal}
              newReviewRating={newReviewRating}
              onNewReviewRatingChange={setNewReviewRating}
              onPostReview={handlePostReview}
              onBack={() => handleNavigate("home")}
              onPlay={handlePlayAnime}
              onEpisodeSelect={(ep) => {
                setSelectedEpisode(ep);
                setActiveView("play");
              }}
              onWatchlistToggle={handleWatchlistToggle}
              onFavoritesToggle={handleFavoritesToggle}
              isWatchlisted={watchlist.some(w => w.id === selectedAnimeId)}
              isFavorited={favorites.some(f => f.id === selectedAnimeId)}
            />
          )}

          {/* VIEW D: IMMERSIVE PLAY SCREEN */}
          {activeView === "play" && selectedAnimeId && selectedEpisode && (
            <VideoPlayer
              anime={animeList.find(a => a.id === selectedAnimeId)!}
              episode={selectedEpisode}
              allEpisodes={episodes}
              onBack={() => handleNavigate("details", selectedAnimeId)}
              onEpisodeSelect={setSelectedEpisode}
              userId={currentUser?.id}
            />
          )}

          {/* VIEW E: AI Q&A ENHANCED SEARCH */}
          {activeView === "aeo" && (
            <AiChat onPlayAnime={handlePlayAnime} />
          )}

          {/* VIEW F: WATCHLIST SCREEN */}
          {activeView === "watchlist" && (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6">
              <div>
                <h1 className="text-2xl font-sans font-extrabold text-white">My Collections</h1>
                <p className="text-xs text-zinc-500">Your personalized watchlist and highly-rated favorites.</p>
              </div>

              {watchlist.length === 0 ? (
                <div className="py-16 text-center text-zinc-500 text-xs font-mono border border-dashed border-zinc-800 rounded-2xl">
                  Your watchlist is empty. Add shows via their details pages!
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <h3 className="text-sm font-sans font-extrabold text-white flex items-center gap-2">
                    <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                    Saved Watchlist
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {watchlist.map((anime) => (
                      <AnimeCard key={anime.id} anime={anime} onDetails={(id) => handleNavigate("details", id)} onPlay={handlePlayAnime} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* VIEW G: GEO TARGET CUSTOM VIEW */}
          {activeView === "geo" && selectedGeoPage && (
            <div className="pb-16 flex flex-col gap-10">
              
              {/* Specialized Geo Banner */}
              <section className="relative h-[320px] md:h-[400px] bg-black overflow-hidden select-none">
                <div className="absolute inset-0">
                  <img src={selectedGeoPage.bannerUrl} className="w-full h-full object-cover opacity-50" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-[#09090b]/40 to-transparent" />
                </div>
                <div className="absolute inset-0 flex items-center">
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex flex-col gap-3">
                    <span className="text-[10px] bg-rose-600/15 border border-rose-500/20 text-rose-400 px-3 py-1 rounded-full font-bold uppercase tracking-wider w-fit">
                      GEO Optimized Portal: {selectedGeoPage.regionName}
                    </span>
                    <h1 className="text-2xl sm:text-4xl font-sans font-extrabold text-white max-w-2xl leading-tight">
                      {selectedGeoPage.customTitle}
                    </h1>
                    <p className="text-xs sm:text-sm text-zinc-400 max-w-xl leading-relaxed">
                      {selectedGeoPage.customDescription}
                    </p>
                  </div>
                </div>
              </section>

              {/* GEO Filtered anime collections */}
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex flex-col gap-8">
                <div>
                  <h3 className="text-base font-sans font-extrabold text-white">Recommended for users in {selectedGeoPage.regionName}</h3>
                  <p className="text-xs text-zinc-500 mt-0.5">Highly searched localized tags: {selectedGeoPage.targetKeywords?.join(", ")}</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {animeList.filter(a => selectedGeoPage.priorityAnimeIds?.includes(a.id) || a.isHindiDubbed).map((anime) => (
                    <AnimeCard key={anime.id} anime={anime} onDetails={(id) => handleNavigate("details", id)} onPlay={handlePlayAnime} />
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* VIEW H: SUPER ADMIN CONTROLS */}
          {activeView === "admin" && (
            <AdminPanel
              onBack={() => handleNavigate("home")}
              animeList={animeList}
              onRefreshAnime={fetchAnime}
            />
          )}

        </motion.main>
      </AnimatePresence>

      {/* Footer bar */}
      <footer className="bg-zinc-950 border-t border-zinc-900 py-8 text-center text-xs text-zinc-600 mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 font-bold font-sans text-zinc-500">
            <span>AnimeHub India</span>
            <span className="text-[9px] uppercase border border-zinc-800 px-1 rounded text-zinc-600">AEO v2.0</span>
          </div>
          <p>© 2026 AnimeHub Platform. Fully optimized for high-intent Indian keyword search arrays.</p>
        </div>
      </footer>

    </div>
  );
}

// -----------------------------------------------------------------------------
// SMALL CARD REUSABLE SUB-COMPONENT
// -----------------------------------------------------------------------------
interface CardProps {
  key?: React.Key;
  anime: Anime;
  onDetails: (id: string) => void;
  onPlay: (id: string) => void;
}

function AnimeCard({ anime, onDetails, onPlay }: CardProps) {
  return (
    <div className="bg-zinc-900/40 border border-zinc-850 hover:border-zinc-700/60 rounded-2xl overflow-hidden group transition-all duration-300 flex flex-col relative shadow-lg">
      
      {/* Thumbnail Stage */}
      <div className="relative aspect-[3/4] overflow-hidden bg-zinc-950 select-none">
        <img
          src={anime.poster}
          alt={anime.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        
        {/* Play Action Overlay */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <button
            onClick={() => onPlay(anime.id)}
            className="p-3 rounded-full bg-gradient-to-tr from-amber-500 to-rose-600 hover:scale-110 text-black shadow-lg shadow-rose-600/30 transition-transform active:scale-95 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-black text-black" />
          </button>
        </div>

        {/* Dynamic Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
          {anime.isHindiDubbed && (
            <span className="bg-rose-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider flex items-center gap-0.5">
              <Languages className="w-2.5 h-2.5" />
              Hindi
            </span>
          )}
          <span className="bg-black/75 backdrop-blur-md text-zinc-300 text-[8px] font-mono px-1.5 py-0.5 rounded uppercase">
            {anime.type}
          </span>
        </div>

        {/* Rating overlay badge */}
        <div className="absolute bottom-2 right-2 bg-black/75 backdrop-blur-md border border-zinc-850 text-amber-400 text-[9px] font-extrabold px-1.5 py-0.5 rounded flex items-center gap-0.5 z-10">
          <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
          {anime.rating}
        </div>
      </div>

      {/* Info context */}
      <div className="p-3 flex flex-col gap-1">
        <h3 
          onClick={() => onDetails(anime.id)}
          className="text-xs sm:text-sm font-sans font-extrabold text-zinc-100 group-hover:text-rose-400 transition-colors cursor-pointer line-clamp-1"
        >
          {anime.title}
        </h3>
        <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono">
          <span>{anime.studio}</span>
          <span>{anime.year}</span>
        </div>
      </div>

    </div>
  );
}

// -----------------------------------------------------------------------------
// INTEGRATED DETAIL VIEW PAGE COMPONENT
// -----------------------------------------------------------------------------
interface DetailViewProps {
  animeId: string;
  animeList: Anime[];
  episodes: Episode[];
  commentsList: Comment[];
  reviewsList: Review[];
  newCommentVal: string;
  onNewCommentChange: (v: string) => void;
  onPostComment: (e: React.FormEvent) => void;
  newReviewVal: string;
  onNewReviewChange: (v: string) => void;
  newReviewRating: number;
  onNewReviewRatingChange: (n: number) => void;
  onPostReview: (e: React.FormEvent) => void;
  onBack: () => void;
  onPlay: (id: string) => void;
  onEpisodeSelect: (ep: Episode) => void;
  onWatchlistToggle: (id: string) => void;
  onFavoritesToggle: (id: string) => void;
  isWatchlisted: boolean;
  isFavorited: boolean;
}

function DetailView({
  animeId,
  animeList,
  episodes,
  commentsList,
  reviewsList,
  newCommentVal,
  onNewCommentChange,
  onPostComment,
  newReviewVal,
  onNewReviewChange,
  newReviewRating,
  onNewReviewRatingChange,
  onPostReview,
  onBack,
  onPlay,
  onEpisodeSelect,
  onWatchlistToggle,
  onFavoritesToggle,
  isWatchlisted,
  isFavorited
}: DetailViewProps) {
  const anime = animeList.find((a) => a.id === animeId);
  if (!anime) return <div className="text-center py-12 text-zinc-400 text-xs font-mono">Anime record not found in cache.</div>;

  const similarAnime = animeList.filter(a => a.id !== anime.id && a.genres.some(g => anime.genres.includes(g)));

  return (
    <div id="anime-detail-view" className="relative pb-16">
      
      {/* Backdrop Backdrop with dynamic gradients */}
      <div className="absolute top-0 inset-x-0 h-[260px] md:h-[360px] overflow-hidden select-none z-0">
        <img src={anime.banner} className="w-full h-full object-cover opacity-20 blur-[2px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] to-transparent" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 pt-16 flex flex-col gap-8">
        
        {/* Back Link */}
        <button onClick={onBack} className="flex items-center gap-2 text-xs font-bold text-zinc-400 hover:text-white transition-colors cursor-pointer">
          <ArrowLeft className="w-4 h-4" />
          Back to Browse
        </button>

        {/* Header Block: Poster, Title and Primary actions */}
        <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start">
          <img src={anime.poster} className="w-44 sm:w-56 aspect-[3/4] object-cover rounded-2xl border border-zinc-800 shadow-2xl" />
          
          <div className="flex-1 flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                {anime.isHindiDubbed && (
                  <span className="bg-rose-600 text-white text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider flex items-center gap-0.5">
                    <Languages className="w-3 h-3" />
                    Hindi Dubbed
                  </span>
                )}
                <span className="bg-zinc-800 text-zinc-300 text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                  {anime.type}
                </span>
                <span className="bg-zinc-800 text-zinc-300 text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                  {anime.studio}
                </span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-sans font-extrabold text-white">{anime.title}</h1>
              {anime.languageMetadata?.localTitle && (
                <span className="text-sm font-sans text-rose-500 font-bold">{anime.languageMetadata.localTitle}</span>
              )}
              <span className="text-xs font-mono text-zinc-500 italic">Japanese Name: {anime.originalTitle}</span>
            </div>

            <div className="flex items-center gap-4 text-xs font-medium text-zinc-400">
              <span className="flex items-center gap-1 text-amber-400">
                <Star className="w-4 h-4 fill-amber-400" />
                {anime.rating}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                {anime.views.toLocaleString()} views
              </span>
              <span>•</span>
              <span className="font-mono">{anime.year}</span>
            </div>

            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed max-w-3xl">{anime.synopsis}</p>

            {/* Actions: Play and toggle watchlists */}
            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={() => onPlay(anime.id)}
                className="px-6 py-3 bg-gradient-to-tr from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-black text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer shadow-lg active:scale-95 transition-all"
              >
                <Play className="w-4 h-4 fill-black text-black" />
                Start Stream Play
              </button>
              
              <button
                onClick={() => onWatchlistToggle(anime.id)}
                className={`p-2.5 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                  isWatchlisted 
                    ? "bg-rose-500/15 border-rose-500/40 text-rose-400" 
                    : "bg-zinc-900 border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200"
                }`}
                title="Add to Watchlist"
              >
                <Heart className={`w-4 h-4 ${isWatchlisted ? "fill-rose-500 text-rose-500" : ""}`} />
              </button>

              <button
                onClick={() => onFavoritesToggle(anime.id)}
                className={`p-2.5 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                  isFavorited 
                    ? "bg-amber-500/15 border-amber-500/40 text-amber-400" 
                    : "bg-zinc-900 border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200"
                }`}
                title="Favorite"
              >
                <Bookmark className={`w-4 h-4 ${isFavorited ? "fill-amber-400 text-amber-400" : ""}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Split layout: Episode lists vs user interactions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Column 1 & 2: Episodes */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <div className="bg-zinc-900/40 border border-zinc-850 p-5 sm:p-6 rounded-2xl flex flex-col gap-4">
              <h3 className="text-base font-sans font-extrabold text-white border-b border-zinc-850 pb-3">Available Episodes ({episodes.length})</h3>
              {episodes.length === 0 ? (
                <div className="py-6 text-center text-zinc-500 text-xs font-mono">No episodes registered yet. Switch to Super Admin role and upload via the CMS!</div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {episodes.map((ep) => (
                    <div
                      key={ep.id}
                      onClick={() => onEpisodeSelect(ep)}
                      className="bg-zinc-950 hover:bg-zinc-900/50 border border-zinc-850 hover:border-zinc-700/60 p-3 rounded-xl flex items-center justify-between gap-4 cursor-pointer transition-all"
                    >
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[9px] font-mono font-extrabold text-rose-500 uppercase">Ep {ep.episodeNumber}</span>
                        <h4 className="text-xs font-bold text-zinc-200 line-clamp-1">{ep.title}</h4>
                      </div>
                      <span className="text-[10px] font-mono text-zinc-500">{Math.floor(ep.duration / 60)} mins</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Comment Section */}
            <div className="bg-zinc-900/40 border border-zinc-850 p-6 rounded-2xl flex flex-col gap-4">
              <h3 className="text-base font-sans font-extrabold text-white border-b border-zinc-850 pb-2">User Discussion ({commentsList.length})</h3>
              
              <form onSubmit={onPostComment} className="flex gap-3">
                <input
                  type="text"
                  placeholder="Share your thoughts on Kakashi's Hindi dub or anime plots..."
                  required
                  value={newCommentVal}
                  onChange={(e) => onNewCommentChange(e.target.value)}
                  className="flex-1 bg-zinc-950 border border-zinc-850 focus:border-rose-500 rounded-xl px-3.5 py-2 text-xs focus:outline-none text-zinc-100"
                />
                <button type="submit" className="px-4 py-2 bg-rose-600 text-white text-xs font-bold rounded-xl hover:bg-rose-500 cursor-pointer transition-colors">
                  Post
                </button>
              </form>

              <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto pr-2 mt-2">
                {commentsList.map((c) => (
                  <div key={c.id} className="bg-zinc-950 border border-zinc-850 p-3 rounded-xl text-xs flex flex-col gap-1">
                    <div className="flex justify-between text-zinc-500 font-mono text-[9px]">
                      <span className="font-extrabold text-rose-400">@{c.username}</span>
                      <span>{new Date(c.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-zinc-300 leading-relaxed">{c.content}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Column 3: Ratings and Reviews column */}
          <div className="flex flex-col gap-6">
            
            {/* Review form */}
            <div className="bg-zinc-900/40 border border-zinc-850 p-5 rounded-2xl flex flex-col gap-4">
              <h3 className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">Leave a Review</h3>
              
              <form onSubmit={onPostReview} className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-zinc-400">Score Rating:</span>
                  <select
                    value={newReviewRating}
                    onChange={(e) => onNewReviewRatingChange(Number(e.target.value))}
                    className="bg-zinc-950 border border-zinc-850 text-xs text-zinc-300 font-bold rounded px-1.5 py-0.5 focus:outline-none"
                  >
                    {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((r) => <option key={r} value={r}>{r}/10</option>)}
                  </select>
                </div>
                <textarea
                  placeholder="Explain why this Hindi dub represents absolute quality cinema..."
                  rows={3}
                  required
                  value={newReviewVal}
                  onChange={(e) => onNewReviewChange(e.target.value)}
                  className="bg-zinc-950 border border-zinc-850 focus:border-rose-500 rounded-xl px-3.5 py-2 text-xs focus:outline-none text-zinc-200"
                />
                <button type="submit" className="w-full py-2 bg-zinc-800 hover:bg-zinc-750 text-zinc-200 text-xs font-bold rounded-xl border border-zinc-700 cursor-pointer">
                  Submit Review
                </button>
              </form>
            </div>

            {/* Approved reviews list */}
            <div className="bg-zinc-900/40 border border-zinc-850 p-5 rounded-2xl flex flex-col gap-4">
              <h3 className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">Top Critic Reviews</h3>
              {reviewsList.length === 0 ? (
                <div className="py-4 text-center text-zinc-600 text-xs italic">Be the first to leave a review for this show!</div>
              ) : (
                <div className="flex flex-col gap-3 max-h-[360px] overflow-y-auto">
                  {reviewsList.map((rev) => (
                    <div key={rev.id} className="bg-zinc-950 border border-zinc-850 p-3 rounded-xl flex flex-col gap-1.5 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="font-extrabold text-amber-400 flex items-center gap-1 font-mono text-[10px]">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          {rev.rating}/10
                        </span>
                        <span className="text-zinc-500 font-mono text-[9px]">by @{rev.username}</span>
                      </div>
                      <p className="text-zinc-400 leading-relaxed italic">"{rev.content}"</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
