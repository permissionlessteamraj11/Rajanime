import React, { useState } from "react";
import { Search, Flame, Globe, Sparkles, UserCheck, LogIn, LogOut, Film, ShieldAlert, Heart, Landmark } from "lucide-react";
import { User } from "../types";

interface NavbarProps {
  currentUser: User | null;
  onNavigate: (view: string, param?: string) => void;
  onSearch: (query: string) => void;
  onRoleSwitch: (role: "user" | "editor" | "admin") => void;
  activeView: string;
}

export default function Navbar({
  currentUser,
  onNavigate,
  onSearch,
  onRoleSwitch,
  activeView
}: NavbarProps) {
  const [searchVal, setSearchVal] = useState("");
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchVal);
    onNavigate("catalog");
  };

  return (
    <header id="app-navbar" className="sticky top-0 z-50 bg-[#09090b]/95 border-b border-zinc-800 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Logo and Branding */}
        <div 
          onClick={() => { onNavigate("home"); setSearchVal(""); }}
          className="flex items-center gap-2 cursor-pointer select-none group"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-600 flex items-center justify-center shadow-lg shadow-rose-500/10 group-hover:scale-105 transition-transform">
            <Flame className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-xl font-sans font-bold tracking-tight bg-gradient-to-r from-amber-400 via-rose-500 to-indigo-500 bg-clip-text text-transparent">
              AnimeHub
            </span>
            <span className="hidden sm:inline-block ml-1 text-[10px] font-mono uppercase tracking-widest text-rose-500 border border-rose-500/20 px-1 rounded">
              Hindi Dub
            </span>
          </div>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSubmit} className="flex-1 max-w-md hidden md:block">
          <div className="relative">
            <input
              type="text"
              placeholder="Search Anime, movies, studio or 'Hindi dubbed'..."
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-full py-2 pl-4 pr-10 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-700 focus:ring-1 focus:ring-zinc-700 transition-all"
            />
            <button type="submit" className="absolute right-3 top-2.5 text-zinc-500 hover:text-zinc-300">
              <Search className="w-4 h-4" />
            </button>
          </div>
        </form>

        {/* Right Navigation Controls */}
        <div className="flex items-center gap-4">
          
          <nav className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => onNavigate("home")}
              className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                activeView === "home" ? "bg-zinc-800/80 text-white" : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Home
            </button>
            <button
              onClick={() => onNavigate("catalog")}
              className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                activeView === "catalog" ? "bg-zinc-800/80 text-white" : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Browse
            </button>
            <button
              onClick={() => onNavigate("aeo")}
              className={`px-3 py-2 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors ${
                activeView === "aeo" ? "bg-zinc-800/80 text-white" : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              AI Q&A
            </button>
            {currentUser && (
              <button
                onClick={() => onNavigate("watchlist")}
                className={`px-3 py-2 text-xs font-medium rounded-lg flex items-center gap-1 transition-colors ${
                  activeView === "watchlist" ? "bg-zinc-800/80 text-white" : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <Heart className="w-3.5 h-3.5 text-rose-500" />
                <span className="hidden lg:inline">Watchlist</span>
              </button>
            )}
          </nav>

          {/* Role Switching / Testing Utility - Essential for developer evaluation */}
          <div className="relative">
            <button
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-lg text-xs font-medium text-zinc-300 transition-all select-none"
              title="Simulator Role Control"
            >
              <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden md:inline capitalize">{currentUser?.role || "Guest"}</span>
            </button>
            {showRoleMenu && (
              <div className="absolute right-0 mt-2 w-48 rounded-xl bg-zinc-950 border border-zinc-800 shadow-2xl p-1 z-50">
                <div className="px-2 py-1.5 text-[10px] uppercase font-mono text-zinc-500 border-b border-zinc-900">
                  Switch Active Role:
                </div>
                {(["user", "editor", "admin"] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => {
                      onRoleSwitch(r);
                      setShowRoleMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs rounded-lg capitalize transition-colors flex items-center justify-between ${
                      currentUser?.role === r 
                        ? "bg-gradient-to-r from-rose-500/10 to-amber-500/10 text-rose-400 font-medium" 
                        : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
                    }`}
                  >
                    {r}
                    {currentUser?.role === r && <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Super Admin Access Trigger */}
          {(currentUser?.role === "admin" || currentUser?.role === "editor") && (
            <button
              onClick={() => onNavigate("admin")}
              className={`p-2 rounded-lg border flex items-center justify-center transition-all ${
                activeView === "admin"
                  ? "bg-gradient-to-tr from-amber-500 to-rose-600 border-transparent text-white"
                  : "bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
              }`}
              title="Super Admin Dashboard"
            >
              <ShieldAlert className="w-4 h-4" />
            </button>
          )}

        </div>
      </div>

      {/* Mobile Search Bar overlay */}
      <div className="md:hidden px-4 pb-3">
        <form onSubmit={handleSubmit} className="relative">
          <input
            type="text"
            placeholder="Search anime..."
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-full py-1.5 pl-4 pr-10 text-xs text-zinc-200 focus:outline-none"
          />
          <button type="submit" className="absolute right-3 top-2 text-zinc-500">
            <Search className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </header>
  );
}
