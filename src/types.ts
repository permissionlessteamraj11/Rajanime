export type UserRole = "user" | "editor" | "admin";

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  password?: string; // Kept secure on backend
  createdAt: string;
}

export interface Anime {
  id: string;
  title: string;
  originalTitle: string;
  type: "series" | "movie";
  synopsis: string;
  poster: string;
  banner: string;
  trailer: string;
  genres: string[];
  studio: string;
  year: number;
  status: "ongoing" | "completed";
  rating: number; // e.g. 8.7
  isHindiDubbed: boolean;
  views: number;
  studioUrl?: string;
  languageMetadata?: {
    hindiKeywords?: string[];
    localTitle?: string; // e.g. "हिंदी में एनिमे"
  };
  seo?: SEOSettings;
}

export interface SEOSettings {
  metaTitle: string;
  metaDescription: string;
  canonicalUrl: string;
  ogImage: string;
  faqSchema?: { question: string; answer: string }[];
  keywords: string[];
  schemaMarkup?: string; // Rich snippet JSON string
  indexControl: "index, follow" | "noindex, nofollow";
}

export interface Episode {
  id: string;
  animeId: string;
  title: string;
  episodeNumber: number;
  duration: number; // in seconds
  videoUrl: string;
  skipIntroStart?: number; // in seconds
  skipIntroEnd?: number; // in seconds
}

export interface Season {
  id: string;
  animeId: string;
  seasonNumber: number;
  name: string;
}

export interface Review {
  id: string;
  animeId: string;
  userId: string;
  username: string;
  rating: number; // 1 to 10
  content: string;
  createdAt: string;
  status: "approved" | "pending" | "rejected";
}

export interface Comment {
  id: string;
  animeId: string;
  episodeId?: string; // Optional for episode chat
  userId: string;
  username: string;
  content: string;
  createdAt: string;
  status: "approved" | "pending" | "spam";
}

export interface WatchlistItem {
  userId: string;
  animeId: string;
  addedAt: string;
}

export interface FavoriteItem {
  userId: string;
  animeId: string;
  addedAt: string;
}

export interface ContinueWatching {
  id: string;
  userId: string;
  animeId: string;
  episodeId: string;
  episodeNumber: number;
  progressSeconds: number;
  lastUpdated: string;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: "general" | "hindi-dubbed" | "movies" | "beginners";
  isFeaturedSnippet: boolean;
  entityHighlights: string[]; // e.g. ["Naruto", "Hindi Dubbed", "Crunchyroll India"]
}

export interface GEOLandingPage {
  id: string;
  slug: string; // e.g. /hindi-dubbed-anime-india
  regionName: string; // e.g. India (North) / Delhi / Mumbai
  customTitle: string;
  customDescription: string;
  targetKeywords: string[];
  bannerUrl: string;
  priorityAnimeIds: string[]; // Pin certain items to top
}

export interface Redirect {
  fromPath: string;
  toPath: string;
  statusCode: 301 | 302;
}

export interface AdminLog {
  id: string;
  adminId: string;
  username: string;
  action: string;
  details: string;
  timestamp: string;
}

export interface AnalyticsEvent {
  id: string;
  eventType: "page_view" | "play_click" | "search" | "geo_location";
  path: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface SearchQuery {
  id: string;
  query: string;
  count: number;
  resultsCount: number;
}
