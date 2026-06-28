import React, { useState, useEffect } from "react";
import {
  ShieldCheck, LayoutDashboard, Film, FileCode, Landmark, Users, MessageSquare, ClipboardList, TrendingUp, HelpCircle,
  Plus, Edit, Trash2, Languages, Globe, Sliders, Check, X, ShieldAlert, Sparkles, UploadCloud, Database
} from "lucide-react";
import { Anime, Episode, FAQItem, GEOLandingPage, Comment, Review, User, AdminLog, Redirect } from "../types";

interface AdminPanelProps {
  onBack: () => void;
  animeList: Anime[];
  onRefreshAnime: () => void;
}

type AdminTab = "dashboard" | "cms" | "seo" | "aeo" | "geo" | "users" | "moderation" | "logs";

export default function AdminPanel({ onBack, animeList, onRefreshAnime }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");
  const [metrics, setMetrics] = useState<any>(null);
  const [geoTraffic, setGeoTraffic] = useState<any>({});
  const [searchQueries, setSearchQueries] = useState<any[]>([]);
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [pendingComments, setPendingComments] = useState<Comment[]>([]);
  const [redirects, setRedirects] = useState<Redirect[]>([]);
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [geoPages, setGeoPages] = useState<GEOLandingPage[]>([]);

  // CMS Anime form states
  const [newAnime, setNewAnime] = useState<Partial<Anime>>({
    title: "", originalTitle: "", type: "series", synopsis: "", poster: "", banner: "",
    genres: [], studio: "", year: 2026, status: "ongoing", rating: 8.5, isHindiDubbed: true
  });
  const [genreInput, setGenreInput] = useState("");
  const [selectedAnimeId, setSelectedAnimeId] = useState<string>("");

  // Episode state form
  const [newEpisode, setNewEpisode] = useState<Partial<Episode>>({
    title: "", episodeNumber: 1, duration: 1320, videoUrl: "", skipIntroStart: 30, skipIntroEnd: 110
  });

  // Redirect state form
  const [newRedirect, setNewRedirect] = useState({ fromPath: "", toPath: "", statusCode: 301 });

  // FAQ state form
  const [newFaq, setNewFaq] = useState<Partial<FAQItem>>({
    question: "", answer: "", category: "general", isFeaturedSnippet: true, entityHighlights: []
  });
  const [faqHighlightInput, setFaqHighlightInput] = useState("");

  // GEO Targeted Page states
  const [newGeoPage, setNewGeoPage] = useState<Partial<GEOLandingPage>>({
    slug: "", regionName: "", customTitle: "", customDescription: "", targetKeywords: []
  });
  const [geoKeywordInput, setGeoKeywordInput] = useState("");

  // Refresh data initially and on tab change
  useEffect(() => {
    fetchMetrics();
    fetchPendingComments();
    fetchUsers();
    fetchLogs();
    fetchRedirects();
    fetchFaqs();
    fetchGeoPages();
  }, [activeTab]);

  const fetchMetrics = async () => {
    try {
      const res = await fetch("/api/admin/analytics");
      if (res.ok) {
        const data = await res.json();
        setMetrics(data.metrics);
        setGeoTraffic(data.geoTraffic);
        setSearchQueries(data.searchQueries);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPendingComments = async () => {
    try {
      const res = await fetch("/api/admin/comments/pending");
      if (res.ok) setPendingComments(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) setUsersList(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await fetch("/api/admin/logs");
      if (res.ok) setLogs(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const fetchRedirects = async () => {
    try {
      const res = await fetch("/api/admin/redirects");
      if (res.ok) setRedirects(await res.json());
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

  // CMS Actions
  const handleAddAnime = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formattedGenres = genreInput.split(",").map(g => g.trim()).filter(Boolean);
      const payload = { ...newAnime, genres: formattedGenres };

      const res = await fetch("/api/admin/anime", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setNewAnime({
          title: "", originalTitle: "", type: "series", synopsis: "", poster: "", banner: "",
          genres: [], studio: "", year: 2026, status: "ongoing", rating: 8.5, isHindiDubbed: true
        });
        setGenreInput("");
        onRefreshAnime();
        alert("Anime added successfully! Automated SEO meta tags generated.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddEpisode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAnimeId) return alert("Please select an anime series first");
    try {
      const res = await fetch(`/api/admin/anime/${selectedAnimeId}/episodes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newEpisode)
      });
      if (res.ok) {
        setNewEpisode({
          title: "", episodeNumber: (newEpisode.episodeNumber || 1) + 1, duration: 1320, videoUrl: "", skipIntroStart: 30, skipIntroEnd: 110
        });
        alert("Episode added successfully!");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteAnime = async (id: string) => {
    if (!confirm("Are you sure you want to delete this anime?")) return;
    try {
      const res = await fetch(`/api/admin/anime/${id}`, { method: "DELETE" });
      if (res.ok) {
        onRefreshAnime();
        alert("Deleted successfully");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Bulk Seed trigger
  const handleBulkImport = async () => {
    const data = [
      { title: "My Hero Academia (Hindi)", originalTitle: "僕のヒーローアカデミア", type: "series", synopsis: "A superhero-loving boy without any superpowers is determined to enroll in a prestigious hero academy.", genres: ["Action", "Sci-Fi"], studio: "Bones", year: 2016, rating: 8.4, isHindiDubbed: true },
      { title: "Death Note (Hindi Dubbed)", originalTitle: "デスノート", type: "series", synopsis: "An intelligent high school student goes on a secret crusade to eliminate criminals after discovering a notebook capable of killing anyone whose name is written in it.", genres: ["Mystery", "Thriller"], studio: "Madhouse", year: 2006, rating: 9.0, isHindiDubbed: true },
      { title: "Weathering With You (Hindi Dubbed Movie)", originalTitle: "天気の子", type: "movie", synopsis: "A high-school boy who has run away to Tokyo befriends a girl who appears to be able to manipulate the weather.", genres: ["Drama", "Romance", "Fantasy"], studio: "CoMix Wave Films", year: 2019, rating: 8.5, isHindiDubbed: true }
    ];
    try {
      const res = await fetch("/api/admin/anime/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data })
      });
      if (res.ok) {
        onRefreshAnime();
        alert("Bulk imported 3 legendary titles successfully!");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // SEO & Redirect actions
  const handleAddRedirect = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/redirects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newRedirect)
      });
      if (res.ok) {
        setNewRedirect({ fromPath: "", toPath: "", statusCode: 301 });
        fetchRedirects();
        alert("Redirect rule created!");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // AEO Actions
  const handleAddFaq = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const highlights = faqHighlightInput.split(",").map(h => h.trim()).filter(Boolean);
      const res = await fetch("/api/admin/aeo/faqs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newFaq, entityHighlights: highlights })
      });
      if (res.ok) {
        setNewFaq({ question: "", answer: "", category: "general", isFeaturedSnippet: true });
        setFaqHighlightInput("");
        fetchFaqs();
        alert("AEO Question created successfully!");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // GEO Actions
  const handleAddGeo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const keywords = geoKeywordInput.split(",").map(k => k.trim()).filter(Boolean);
      const res = await fetch("/api/admin/geo/landing-pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newGeoPage, targetKeywords: keywords })
      });
      if (res.ok) {
        setNewGeoPage({ slug: "", regionName: "", customTitle: "", customDescription: "" });
        setGeoKeywordInput("");
        fetchGeoPages();
        alert("GEO-targeted region landing page configured!");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Moderation approvals
  const handleCommentApproval = async (id: string, action: "approve" | "reject") => {
    try {
      const res = await fetch(`/api/admin/comments/${id}/${action}`, { method: "POST" });
      if (res.ok) {
        fetchPendingComments();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // User role promotions
  const handleRoleChange = async (userId: string, currentRole: string) => {
    const roles: ("user" | "editor" | "admin")[] = ["user", "editor", "admin"];
    const nextIdx = (roles.indexOf(currentRole as any) + 1) % roles.length;
    const nextRole = roles[nextIdx];

    try {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: nextRole })
      });
      if (res.ok) {
        fetchUsers();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div id="super-admin-portal" className="bg-[#09090b] min-h-screen text-zinc-100 flex flex-col md:flex-row border-t border-zinc-850">
      
      {/* Sidebar Controls */}
      <aside className="w-full md:w-64 bg-zinc-950 border-r border-zinc-850 p-6 flex flex-col gap-6">
        <div className="flex items-center gap-2.5 pb-4 border-b border-zinc-850">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 to-rose-600 flex items-center justify-center text-white">
            <ShieldCheck className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-sans font-extrabold text-white">Super Admin</h2>
            <span className="text-[9px] font-mono text-rose-500 font-semibold tracking-widest uppercase">AnimeHub CMS v2.0</span>
          </div>
        </div>

        <nav className="flex flex-col gap-1.5 flex-1">
          {[
            { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
            { id: "cms", label: "Anime CMS & Episodes", icon: Film },
            { id: "seo", label: "SEO Settings & Redirects", icon: FileCode },
            { id: "aeo", label: "AEO Content Manager", icon: Sparkles },
            { id: "geo", label: "GEO Localization", icon: Globe },
            { id: "users", label: "User Accounts", icon: Users },
            { id: "moderation", label: "Moderation Queue", icon: MessageSquare },
            { id: "logs", label: "System Audit Logs", icon: ClipboardList }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as AdminTab)}
                className={`w-full text-left px-3.5 py-2.5 text-xs font-semibold rounded-xl flex items-center gap-3 transition-colors ${
                  activeTab === tab.id
                    ? "bg-gradient-to-r from-amber-500/10 to-rose-600/10 text-rose-400 border border-rose-500/20"
                    : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200 border border-transparent"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>

        <button
          onClick={onBack}
          className="w-full py-2 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-xs font-semibold rounded-xl text-center cursor-pointer transition-colors"
        >
          Exit Dashboard
        </button>
      </aside>

      {/* Main stage */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
        
        {/* TAB 1: EXECUTIVE DASHBOARD */}
        {activeTab === "dashboard" && (
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-sans font-extrabold text-white">Executive Dashboard</h2>
                <p className="text-xs text-zinc-500">Real-time indexing status, crawling health, and localized traffic trends.</p>
              </div>
              <span className="text-xs bg-emerald-600/10 border border-emerald-500/20 px-3 py-1 rounded-full text-emerald-400 font-bold flex items-center gap-1.5 animate-pulse">
                <Check className="w-3.5 h-3.5" />
                Crawl Status: Healthy
              </span>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Total Users", value: metrics?.totalUsers || 0, change: "+24% weekly" },
                { label: "Total Anime Series", value: metrics?.totalAnime || 0, change: "+12 new" },
                { label: "Episodes Count", value: metrics?.totalEpisodes || 0, change: "100% active" },
                { label: "Watch Time", value: `${metrics?.watchTime || 0} Hours`, change: "High engagement" }
              ].map((m, idx) => (
                <div key={idx} className="bg-zinc-900/60 border border-zinc-850 p-5 rounded-2xl flex flex-col gap-1.5">
                  <span className="text-xs text-zinc-500 font-medium">{m.label}</span>
                  <span className="text-2xl font-sans font-extrabold text-white">{m.value}</span>
                  <span className="text-[10px] text-emerald-400 font-bold font-mono">{m.change}</span>
                </div>
              ))}
            </div>

            {/* Simulated Graphs and Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Traffic GEO Distribution Custom SVG Graph */}
              <div className="bg-zinc-900/60 border border-zinc-850 p-6 rounded-2xl flex flex-col gap-4">
                <h3 className="text-sm font-sans font-extrabold text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-rose-500" />
                  Regional Traffic Split (India Accent Belt)
                </h3>
                <div className="flex flex-col gap-3">
                  {Object.entries(geoTraffic).map(([region, pct], idx) => (
                    <div key={idx} className="flex flex-col gap-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-zinc-400">{region}</span>
                        <span className="text-white">{pct as string}</span>
                      </div>
                      <div className="w-full h-2 bg-zinc-950 rounded-full overflow-hidden border border-zinc-900">
                        <div 
                          className="h-full bg-gradient-to-r from-amber-500 to-rose-600 rounded-full" 
                          style={{ width: pct as string }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Crawling Indexing Health Graph */}
              <div className="bg-zinc-900/60 border border-zinc-850 p-6 rounded-2xl flex flex-col gap-4">
                <h3 className="text-sm font-sans font-extrabold text-white">Google & AI Bot Crawl Rate (Last 7 Days)</h3>
                <div className="h-44 flex items-end justify-between gap-1 border-b border-l border-zinc-800 pb-2 pl-2">
                  {[24, 45, 30, 80, 55, 95, 110].map((val, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-1 group">
                      <div 
                        className="w-full bg-gradient-to-t from-indigo-600 to-rose-500 rounded-t hover:brightness-125 transition-all relative" 
                        style={{ height: `${(val / 120) * 100}%` }}
                      >
                        <span className="absolute -top-6 left-1/2 -translate-x-1/2 bg-zinc-950 text-[10px] border border-zinc-800 px-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                          {val} pgs
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-zinc-500">Day {idx + 1}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Keyword Performance Board */}
            <div className="bg-zinc-900/60 border border-zinc-850 p-6 rounded-2xl">
              <h3 className="text-sm font-sans font-extrabold text-white mb-4">High-Intent Organic Search Query Metrics</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-zinc-800 text-zinc-400">
                      <th className="pb-3">Query Keyword</th>
                      <th className="pb-3 text-center">Volume Clicks</th>
                      <th className="pb-3 text-center">Indexed Answers</th>
                      <th className="pb-3 text-right">Target Match Url</th>
                    </tr>
                  </thead>
                  <tbody>
                    {searchQueries.map((sq, idx) => (
                      <tr key={idx} className="border-b border-zinc-900 hover:bg-zinc-900/20">
                        <td className="py-3 font-semibold text-zinc-300">{sq.query}</td>
                        <td className="py-3 text-center font-mono text-zinc-400">{sq.count} clicks</td>
                        <td className="py-3 text-center font-mono text-emerald-400">
                          {sq.resultsCount > 0 ? "Yes (Snippet Live)" : "No (Pending)"}
                        </td>
                        <td className="py-3 text-right text-rose-400 font-mono">/search?q={encodeURIComponent(sq.query)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: ANIME CMS & EPISODES */}
        {activeTab === "cms" && (
          <div className="flex flex-col gap-8 animate-fade-in">
            
            {/* CMS Panel Actions heading */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-sans font-extrabold text-white">Anime & Episode Publishing</h2>
                <p className="text-xs text-zinc-500">Register new animated series, manage video streaming directories and schedule releases.</p>
              </div>
              <button
                onClick={handleBulkImport}
                className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-rose-600 hover:from-indigo-400 hover:to-rose-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-lg active:scale-95 transition-all"
              >
                <UploadCloud className="w-4 h-4" />
                Bulk Seed Popular Anime
              </button>
            </div>

            {/* CMS Form Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Form A: Add Anime */}
              <form onSubmit={handleAddAnime} className="lg:col-span-2 bg-zinc-900/60 border border-zinc-850 p-6 rounded-2xl flex flex-col gap-4">
                <h3 className="text-sm font-sans font-extrabold text-white flex items-center gap-2 border-b border-zinc-850 pb-2">
                  <Plus className="w-4 h-4 text-rose-500" />
                  Publish New Anime Record
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-mono text-zinc-400 uppercase">Title</label>
                    <input
                      type="text"
                      placeholder="e.g. Naruto (Hindi Dubbed)"
                      required
                      value={newAnime.title}
                      onChange={(e) => setNewAnime({ ...newAnime, title: e.target.value })}
                      className="bg-zinc-950 border border-zinc-850 focus:border-rose-500 rounded-xl px-3.5 py-2 text-xs text-zinc-100"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-mono text-zinc-400 uppercase">Original Title</label>
                    <input
                      type="text"
                      placeholder="e.g. ナルト"
                      value={newAnime.originalTitle}
                      onChange={(e) => setNewAnime({ ...newAnime, originalTitle: e.target.value })}
                      className="bg-zinc-950 border border-zinc-850 focus:border-rose-500 rounded-xl px-3.5 py-2 text-xs text-zinc-100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-mono text-zinc-400 uppercase">Type</label>
                    <select
                      value={newAnime.type}
                      onChange={(e) => setNewAnime({ ...newAnime, type: e.target.value as any })}
                      className="bg-zinc-950 border border-zinc-850 focus:border-rose-500 rounded-xl px-3.5 py-2 text-xs text-zinc-100"
                    >
                      <option value="series">Series (Episodes)</option>
                      <option value="movie">Movie</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-mono text-zinc-400 uppercase">Studio</label>
                    <input
                      type="text"
                      placeholder="e.g. MAPPA"
                      value={newAnime.studio}
                      onChange={(e) => setNewAnime({ ...newAnime, studio: e.target.value })}
                      className="bg-zinc-950 border border-zinc-850 focus:border-rose-500 rounded-xl px-3.5 py-2 text-xs text-zinc-100"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-mono text-zinc-400 uppercase">Year</label>
                    <input
                      type="number"
                      placeholder="e.g. 2026"
                      value={newAnime.year}
                      onChange={(e) => setNewAnime({ ...newAnime, year: Number(e.target.value) })}
                      className="bg-zinc-950 border border-zinc-850 focus:border-rose-500 rounded-xl px-3.5 py-2 text-xs text-zinc-100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-mono text-zinc-400 uppercase">Genres (comma separated)</label>
                    <input
                      type="text"
                      placeholder="e.g. Action, Adventure, Fantasy"
                      value={genreInput}
                      onChange={(e) => setGenreInput(e.target.value)}
                      className="bg-zinc-950 border border-zinc-850 focus:border-rose-500 rounded-xl px-3.5 py-2 text-xs text-zinc-100"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-mono text-zinc-400 uppercase">Rating Score</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="e.g. 8.9"
                      value={newAnime.rating}
                      onChange={(e) => setNewAnime({ ...newAnime, rating: Number(e.target.value) })}
                      className="bg-zinc-950 border border-zinc-850 focus:border-rose-500 rounded-xl px-3.5 py-2 text-xs text-zinc-100"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 justify-center pl-2">
                    <label className="flex items-center gap-2 cursor-pointer mt-4">
                      <input
                        type="checkbox"
                        checked={newAnime.isHindiDubbed}
                        onChange={(e) => setNewAnime({ ...newAnime, isHindiDubbed: e.target.checked })}
                        className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 accent-rose-600"
                      />
                      <span className="text-xs text-zinc-300 font-bold">Hindi Dubbed Available</span>
                    </label>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono text-zinc-400 uppercase">Synopsis Narrative</label>
                  <textarea
                    rows={4}
                    placeholder="Provide a detailed description of the anime plot..."
                    required
                    value={newAnime.synopsis}
                    onChange={(e) => setNewAnime({ ...newAnime, synopsis: e.target.value })}
                    className="bg-zinc-950 border border-zinc-850 focus:border-rose-500 rounded-xl px-3.5 py-2 text-xs text-zinc-100 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-lg cursor-pointer transition-colors"
                >
                  Publish and Index on AnimeHub
                </button>
              </form>

              {/* Form B: Add Episode */}
              <div className="flex flex-col gap-6">
                
                <form onSubmit={handleAddEpisode} className="bg-zinc-900/60 border border-zinc-850 p-6 rounded-2xl flex flex-col gap-4">
                  <h3 className="text-sm font-sans font-extrabold text-white flex items-center gap-2 border-b border-zinc-850 pb-2">
                    <Database className="w-4 h-4 text-amber-500" />
                    Episode Uplink Manager
                  </h3>
                  
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-mono text-zinc-400 uppercase">Target Anime Title</label>
                    <select
                      required
                      value={selectedAnimeId}
                      onChange={(e) => setSelectedAnimeId(e.target.value)}
                      className="bg-zinc-950 border border-zinc-850 focus:border-rose-500 rounded-xl px-3.5 py-2 text-xs text-zinc-100"
                    >
                      <option value="">-- Select Series --</option>
                      {animeList.filter(a => a.type === "series").map(a => (
                        <option key={a.id} value={a.id}>{a.title}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-mono text-zinc-400 uppercase">Ep Number</label>
                      <input
                        type="number"
                        value={newEpisode.episodeNumber}
                        onChange={(e) => setNewEpisode({ ...newEpisode, episodeNumber: Number(e.target.value) })}
                        className="bg-zinc-950 border border-zinc-850 focus:border-rose-500 rounded-xl px-3.5 py-2 text-xs text-zinc-100"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-mono text-zinc-400 uppercase">Duration (sec)</label>
                      <input
                        type="number"
                        value={newEpisode.duration}
                        onChange={(e) => setNewEpisode({ ...newEpisode, duration: Number(e.target.value) })}
                        className="bg-zinc-950 border border-zinc-850 focus:border-rose-500 rounded-xl px-3.5 py-2 text-xs text-zinc-100"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-mono text-zinc-400 uppercase">Streaming Video Source URL</label>
                    <input
                      type="text"
                      placeholder="https://..."
                      value={newEpisode.videoUrl}
                      onChange={(e) => setNewEpisode({ ...newEpisode, videoUrl: e.target.value })}
                      className="bg-zinc-950 border border-zinc-850 focus:border-rose-500 rounded-xl px-3.5 py-2 text-xs text-zinc-100"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-mono text-zinc-400 uppercase">Intro Start (sec)</label>
                      <input
                        type="number"
                        value={newEpisode.skipIntroStart}
                        onChange={(e) => setNewEpisode({ ...newEpisode, skipIntroStart: Number(e.target.value) })}
                        className="bg-zinc-950 border border-zinc-850 focus:border-rose-500 rounded-xl px-3.5 py-2 text-xs text-zinc-100"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-mono text-zinc-400 uppercase">Intro End (sec)</label>
                      <input
                        type="number"
                        value={newEpisode.skipIntroEnd}
                        onChange={(e) => setNewEpisode({ ...newEpisode, skipIntroEnd: Number(e.target.value) })}
                        className="bg-zinc-950 border border-zinc-850 focus:border-rose-500 rounded-xl px-3.5 py-2 text-xs text-zinc-100"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold rounded-xl border border-zinc-750 transition-colors cursor-pointer"
                  >
                    Add Episode
                  </button>
                </form>

              </div>
            </div>

            {/* Existing Anime List Manager */}
            <div className="bg-zinc-900/60 border border-zinc-850 p-6 rounded-2xl">
              <h3 className="text-sm font-sans font-extrabold text-white mb-4">Catalog List Management</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {animeList.map((a) => (
                  <div key={a.id} className="bg-zinc-950 border border-zinc-850 p-4 rounded-xl flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img src={a.poster} className="w-10 h-14 object-cover rounded-md" />
                      <div className="flex flex-col">
                        <h4 className="text-xs font-sans font-extrabold text-white line-clamp-1">{a.title}</h4>
                        <span className="text-[10px] font-mono text-zinc-500 capitalize">{a.type} • {a.studio}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteAnime(a.id)}
                      className="p-2 bg-zinc-900 hover:bg-rose-950/40 text-zinc-400 hover:text-rose-400 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* TAB 3: SEO SETTINGS & REDIRECTS */}
        {activeTab === "seo" && (
          <div className="flex flex-col gap-6 animate-fade-in">
            <h2 className="text-xl font-sans font-extrabold text-white">SEO Engine & URL Redirect Manager</h2>
            <p className="text-xs text-zinc-500">Configure search index parameters, preview dynamic sitemap routing priority and map older endpoints.</p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Left Column: Sitemaps / Robots & SEO status */}
              <div className="flex flex-col gap-6">
                <div className="bg-zinc-900/60 border border-zinc-850 p-6 rounded-2xl flex flex-col gap-4">
                  <h3 className="text-sm font-sans font-extrabold text-white border-b border-zinc-850 pb-2">Automated Dynamic Resources</h3>
                  
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-bold text-zinc-400">XML Sitemap:</span>
                    <a 
                      href="/sitemap.xml" 
                      target="_blank" 
                      className="text-xs font-mono text-rose-400 underline hover:text-rose-300"
                    >
                      /sitemap.xml (Pre-rendered for Googlebot indexing)
                    </a>
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-bold text-zinc-400">SEO Rule Constraints:</span>
                    <a 
                      href="/robots.txt" 
                      target="_blank" 
                      className="text-xs font-mono text-rose-400 underline hover:text-rose-300"
                    >
                      /robots.txt (Disallows crawler scrapers to secure API pathways)
                    </a>
                  </div>

                  <div className="mt-4 p-4 bg-zinc-950 border border-zinc-850 rounded-xl flex items-start gap-3">
                    <Globe className="w-5 h-5 text-indigo-400 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-white">AEO Structured Rich Snippets Schema</h4>
                      <p className="text-[10px] text-zinc-400 mt-1">Our server automatically embeds organization, movie database (IMDb structure), and FAQ markup queries on all public paths to capture AI voice snippets.</p>
                    </div>
                  </div>
                </div>

                {/* Redirect rules list */}
                <div className="bg-zinc-900/60 border border-zinc-850 p-6 rounded-2xl">
                  <h3 className="text-sm font-sans font-extrabold text-white mb-3">Active Redirect Pathways ({redirects.length})</h3>
                  <div className="flex flex-col gap-2">
                    {redirects.map((red, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-zinc-950 border border-zinc-850 p-3 rounded-xl text-xs font-mono">
                        <span className="text-zinc-500">{red.fromPath}</span>
                        <span className="text-zinc-400">➔</span>
                        <span className="text-rose-400">{red.toPath}</span>
                        <span className="bg-zinc-900 px-1.5 py-0.5 rounded text-[10px] text-zinc-500">{red.statusCode}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Redirect Form */}
              <form onSubmit={handleAddRedirect} className="bg-zinc-900/60 border border-zinc-850 p-6 rounded-2xl flex flex-col gap-4">
                <h3 className="text-sm font-sans font-extrabold text-white flex items-center gap-2 border-b border-zinc-850 pb-2">
                  <Plus className="w-4 h-4 text-rose-500" />
                  Add Path Redirect (301/302)
                </h3>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono text-zinc-400 uppercase">Incoming Source URL Path</label>
                  <input
                    type="text"
                    placeholder="e.g. /old-naruto-dub"
                    required
                    value={newRedirect.fromPath}
                    onChange={(e) => setNewRedirect({ ...newRedirect, fromPath: e.target.value })}
                    className="bg-zinc-950 border border-zinc-850 focus:border-rose-500 rounded-xl px-3.5 py-2 text-xs text-zinc-100"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono text-zinc-400 uppercase">Destination URL Path</label>
                  <input
                    type="text"
                    placeholder="e.g. /anime/naruto-hindi"
                    required
                    value={newRedirect.toPath}
                    onChange={(e) => setNewRedirect({ ...newRedirect, toPath: e.target.value })}
                    className="bg-zinc-950 border border-zinc-850 focus:border-rose-500 rounded-xl px-3.5 py-2 text-xs text-zinc-100"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono text-zinc-400 uppercase">HTTP Code</label>
                  <select
                    value={newRedirect.statusCode}
                    onChange={(e) => setNewRedirect({ ...newRedirect, statusCode: Number(e.target.value) })}
                    className="bg-zinc-950 border border-zinc-850 focus:border-rose-500 rounded-xl px-3.5 py-2 text-xs text-zinc-100"
                  >
                    <option value={301}>301 (Permanent Redirect)</option>
                    <option value={302}>302 (Temporary Redirect)</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-750 text-white text-xs font-bold rounded-xl border border-zinc-700 cursor-pointer transition-colors"
                >
                  Create Rule
                </button>
              </form>

            </div>
          </div>
        )}

        {/* TAB 4: AEO CONTENT MANAGER */}
        {activeTab === "aeo" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
            
            {/* Form list builder */}
            <form onSubmit={handleAddFaq} className="bg-zinc-900/60 border border-zinc-850 p-6 rounded-2xl flex flex-col gap-4">
              <h2 className="text-base font-sans font-extrabold text-white border-b border-zinc-850 pb-2">Publish FAQ Snippet (AEO)</h2>
              
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-mono text-zinc-400 uppercase">Question Block</label>
                <input
                  type="text"
                  placeholder="e.g. Is Your Name available in Hindi Dub?"
                  required
                  value={newFaq.question}
                  onChange={(e) => setNewFaq({ ...newFaq, question: e.target.value })}
                  className="bg-zinc-950 border border-zinc-850 focus:border-rose-500 rounded-xl px-3.5 py-2 text-xs text-zinc-100"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-mono text-zinc-400 uppercase">Answer Summary (Snippet Answer)</label>
                <textarea
                  rows={4}
                  placeholder="Provide a concise, factual answer for direct voice-search snippets..."
                  required
                  value={newFaq.answer}
                  onChange={(e) => setNewFaq({ ...newFaq, answer: e.target.value })}
                  className="bg-zinc-950 border border-zinc-850 focus:border-rose-500 rounded-xl px-3.5 py-2 text-xs text-zinc-100 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono text-zinc-400 uppercase">Category</label>
                  <select
                    value={newFaq.category}
                    onChange={(e) => setNewFaq({ ...newFaq, category: e.target.value as any })}
                    className="bg-zinc-950 border border-zinc-850 focus:border-rose-500 rounded-xl px-3.5 py-2 text-xs text-zinc-100"
                  >
                    <option value="general">General platform</option>
                    <option value="hindi-dubbed">Hindi Dubbing info</option>
                    <option value="movies">Cinematic Movies</option>
                    <option value="beginners">Beginners guides</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono text-zinc-400 uppercase">Target Entity Highlights (comma-separated)</label>
                  <input
                    type="text"
                    placeholder="e.g. Your Name, Makoto Shinkai"
                    value={faqHighlightInput}
                    onChange={(e) => setFaqHighlightInput(e.target.value)}
                    className="bg-zinc-950 border border-zinc-850 focus:border-rose-500 rounded-xl px-3.5 py-2 text-xs text-zinc-100"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-lg cursor-pointer transition-colors"
              >
                Publish FAQ Snippet
              </button>
            </form>

            {/* Existing FAQs list */}
            <div className="bg-zinc-900/60 border border-zinc-850 p-6 rounded-2xl flex flex-col gap-4">
              <h2 className="text-base font-sans font-extrabold text-white border-b border-zinc-850 pb-2">Active AEO FAQ Snippets ({faqs.length})</h2>
              <div className="flex flex-col gap-4 overflow-y-auto max-h-[420px] pr-2">
                {faqs.map((f) => (
                  <div key={f.id} className="bg-zinc-950 border border-zinc-850 p-4 rounded-xl flex flex-col gap-1.5 text-xs">
                    <span className="text-[10px] font-mono text-rose-500 uppercase font-semibold">{f.category} faq</span>
                    <h4 className="font-bold text-white">{f.question}</h4>
                    <p className="text-zinc-400 leading-relaxed">{f.answer}</p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {f.entityHighlights?.map((e, i) => (
                        <span key={i} className="text-[9px] bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800 text-zinc-500 font-mono">
                          {e}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* TAB 5: GEO TARGET LOCALIZATION */}
        {activeTab === "geo" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
            
            {/* Geo form */}
            <form onSubmit={handleAddGeo} className="bg-zinc-900/60 border border-zinc-850 p-6 rounded-2xl flex flex-col gap-4">
              <h2 className="text-base font-sans font-extrabold text-white border-b border-zinc-850 pb-2">Configure GEO Landing Path</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono text-zinc-400 uppercase">Target region Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Mumbai Metro / UP East"
                    required
                    value={newGeoPage.regionName}
                    onChange={(e) => setNewGeoPage({ ...newGeoPage, regionName: e.target.value })}
                    className="bg-zinc-950 border border-zinc-850 focus:border-rose-500 rounded-xl px-3.5 py-2 text-xs text-zinc-100"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono text-zinc-400 uppercase">Target Slug Path</label>
                  <input
                    type="text"
                    placeholder="e.g. hindi-dubbed-anime-mumbai"
                    required
                    value={newGeoPage.slug}
                    onChange={(e) => setNewGeoPage({ ...newGeoPage, slug: e.target.value })}
                    className="bg-zinc-950 border border-zinc-850 focus:border-rose-500 rounded-xl px-3.5 py-2 text-xs text-zinc-100"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-mono text-zinc-400 uppercase">Localized Banner Hero Title</label>
                <input
                  type="text"
                  placeholder="e.g. Stream Top Hindi Dubbed Movies in Mumbai"
                  required
                  value={newGeoPage.customTitle}
                  onChange={(e) => setNewGeoPage({ ...newGeoPage, customTitle: e.target.value })}
                  className="bg-zinc-950 border border-zinc-850 focus:border-rose-500 rounded-xl px-3.5 py-2 text-xs text-zinc-100"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-mono text-zinc-400 uppercase">Target Regional SEO Description</label>
                <textarea
                  rows={3}
                  placeholder="Describe your localized catalog and community offerings..."
                  required
                  value={newGeoPage.customDescription}
                  onChange={(e) => setNewGeoPage({ ...newGeoPage, customDescription: e.target.value })}
                  className="bg-zinc-950 border border-zinc-850 focus:border-rose-500 rounded-xl px-3.5 py-2 text-xs text-zinc-100 focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-mono text-zinc-400 uppercase">Target Regional Intent Keywords (comma separated)</label>
                <input
                  type="text"
                  placeholder="e.g. hindi anime mumbai, watch anime free india"
                  value={geoKeywordInput}
                  onChange={(e) => setGeoKeywordInput(e.target.value)}
                  className="bg-zinc-950 border border-zinc-850 focus:border-rose-500 rounded-xl px-3.5 py-2 text-xs text-zinc-100"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-lg cursor-pointer transition-colors"
              >
                Launch GEO Page
              </button>
            </form>

            {/* List */}
            <div className="bg-zinc-900/60 border border-zinc-850 p-6 rounded-2xl flex flex-col gap-4">
              <h2 className="text-base font-sans font-extrabold text-white border-b border-zinc-850 pb-2">Active Geo Landing Presets ({geoPages.length})</h2>
              <div className="flex flex-col gap-3 max-h-[420px] overflow-y-auto">
                {geoPages.map((page) => (
                  <div key={page.id} className="bg-zinc-950 border border-zinc-850 p-4 rounded-xl flex flex-col gap-1.5 text-xs">
                    <div className="flex justify-between items-center border-b border-zinc-900 pb-1.5 mb-1">
                      <span className="font-extrabold text-white">{page.regionName}</span>
                      <span className="text-[9px] font-mono text-rose-500 uppercase">/geo/{page.slug}</span>
                    </div>
                    <h4 className="font-semibold text-zinc-300">{page.customTitle}</h4>
                    <p className="text-zinc-500">{page.customDescription}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {page.targetKeywords?.map((k, idx) => (
                        <span key={idx} className="bg-zinc-900 text-zinc-400 text-[9px] font-mono px-1.5 py-0.5 rounded border border-zinc-850">
                          {k}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* TAB 6: USER ACCOUNTS */}
        {activeTab === "users" && (
          <div className="bg-zinc-900/60 border border-zinc-850 p-6 rounded-2xl animate-fade-in">
            <h2 className="text-base font-sans font-extrabold text-white mb-4">Super Admin User Accounts Directory</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-500">
                    <th className="pb-3">Username</th>
                    <th className="pb-3">Email Address</th>
                    <th className="pb-3">Authority Role</th>
                    <th className="pb-3 text-right">Quick Promote Action</th>
                  </tr>
                </thead>
                <tbody>
                  {usersList.map((usr) => (
                    <tr key={usr.id} className="border-b border-zinc-900 hover:bg-zinc-900/20">
                      <td className="py-3.5 font-bold text-zinc-200">{usr.username}</td>
                      <td className="py-3.5 font-mono text-zinc-400">{usr.email}</td>
                      <td className="py-3.5">
                        <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase font-mono ${
                          usr.role === "admin" 
                            ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" 
                            : usr.role === "editor"
                            ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                            : "bg-zinc-950 text-zinc-400 border border-zinc-800"
                        }`}>
                          {usr.role}
                        </span>
                      </td>
                      <td className="py-3.5 text-right">
                        <button
                          onClick={() => handleRoleChange(usr.id, usr.role)}
                          className="px-3 py-1 bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-zinc-300 rounded-lg text-[10px] transition-all cursor-pointer font-bold select-none"
                        >
                          Change Role ⟳
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 7: MODERATION QUEUE */}
        {activeTab === "moderation" && (
          <div className="bg-zinc-900/60 border border-zinc-850 p-6 rounded-2xl animate-fade-in flex flex-col gap-6">
            <div>
              <h2 className="text-base font-sans font-extrabold text-white">Social Comment & Review Moderations</h2>
              <p className="text-xs text-zinc-500">Approve user comments or flag suspected promotional links and spam activities.</p>
            </div>

            {pendingComments.length === 0 ? (
              <div className="py-8 text-center text-zinc-500 text-xs font-mono border-2 border-dashed border-zinc-850 rounded-xl">
                No comments are currently pending review. Moderation queue is pristine!
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {pendingComments.map((com) => (
                  <div key={com.id} className="bg-zinc-950 border border-zinc-850 p-4 rounded-xl flex items-center justify-between gap-4">
                    <div className="flex flex-col gap-1 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-rose-400">{com.username}</span>
                        <span className="text-zinc-600 font-mono text-[10px]">posted on anime: {com.animeId}</span>
                      </div>
                      <p className="text-zinc-300 italic">"{com.content}"</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCommentApproval(com.id, "approve")}
                        className="p-1.5 bg-emerald-600/10 text-emerald-400 rounded-lg hover:bg-emerald-600/20 border border-emerald-500/20 cursor-pointer"
                        title="Approve Comment"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleCommentApproval(com.id, "reject")}
                        className="p-1.5 bg-rose-600/10 text-rose-400 rounded-lg hover:bg-rose-600/20 border border-rose-500/20 cursor-pointer"
                        title="Reject Spam"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 8: SYSTEM AUDIT LOGS */}
        {activeTab === "logs" && (
          <div className="bg-zinc-900/60 border border-zinc-850 p-6 rounded-2xl animate-fade-in">
            <h2 className="text-base font-sans font-extrabold text-white mb-4 flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-rose-500" />
              Immutable Admin System Audit Log Trail
            </h2>
            <div className="flex flex-col gap-2 max-h-[440px] overflow-y-auto">
              {logs.map((log) => (
                <div key={log.id} className="bg-zinc-950 border border-zinc-850 p-3 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-3">
                    <span className="bg-zinc-900 text-zinc-500 px-1.5 py-0.5 rounded font-mono text-[10px] uppercase font-semibold">
                      {log.action}
                    </span>
                    <span className="text-zinc-300 italic">"{log.details}"</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono text-[10px] text-zinc-500">
                    <span>by @{log.username}</span>
                    <span>•</span>
                    <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>

    </div>
  );
}
