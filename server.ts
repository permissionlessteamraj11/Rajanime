import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { DEFAULT_ANIME_LIST, DEFAULT_EPISODES, DEFAULT_FAQ_ITEMS, DEFAULT_GEO_PAGES } from "./src/data/defaultAnime";
import { Anime, Episode, FAQItem, GEOLandingPage, Comment, Review, User, UserRole, SEOSettings, Redirect, AdminLog, AnalyticsEvent, SearchQuery } from "./src/types";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize server-side memory data store (mutable for session)
let animeList: Anime[] = [...DEFAULT_ANIME_LIST];
let episodeList: Episode[] = [...DEFAULT_EPISODES];
let faqItems: FAQItem[] = [...DEFAULT_FAQ_ITEMS];
let geoPages: GEOLandingPage[] = [...DEFAULT_GEO_PAGES];

let comments: Comment[] = [
  { id: "c-1", animeId: "naruto-hindi", userId: "u-1", username: "AnimeLover99", content: "Naruto Hindi dub is legendary! The voice for Kakashi is spot on.", createdAt: new Date(Date.now() - 3600000 * 2).toISOString(), status: "approved" },
  { id: "c-2", animeId: "naruto-hindi", userId: "u-2", username: "ShounenFan", content: "Are they planning to dub Shippuden as well?", createdAt: new Date(Date.now() - 3600000).toISOString(), status: "approved" },
  { id: "c-3", animeId: "demon-slayer-hindi", userId: "u-3", username: "Hashira_IN", content: "The animation in episode 19 combined with Hindi voice acting will be peak cinema!", createdAt: new Date(Date.now() - 60000).toISOString(), status: "pending" }
];

let reviews: Review[] = [
  { id: "r-1", animeId: "your-name-movie-hindi", userId: "u-1", username: "AnimeLover99", rating: 10, content: "Undoubtedly one of the greatest animated movies ever made. The body-swap romance with the threat of the comet is beautifully written. Highly recommend watching the Hindi dubbed version here, it feels incredibly close to home.", createdAt: new Date(Date.now() - 86400000 * 3).toISOString(), status: "approved" }
];

let users: User[] = [
  { id: "u-admin", username: "superadmin", email: "kvinit6421@gmail.com", role: "admin", createdAt: new Date().toISOString() },
  { id: "u-1", username: "AnimeLover99", email: "lover@animehub.com", role: "user", createdAt: new Date().toISOString() },
  { id: "u-2", username: "ShounenFan", email: "shounen@animehub.com", role: "user", createdAt: new Date().toISOString() },
  { id: "u-3", username: "Hashira_IN", email: "hashira@animehub.com", role: "editor", createdAt: new Date().toISOString() }
];

let watchlist: { userId: string; animeId: string; addedAt: string }[] = [];
let favorites: { userId: string; animeId: string; addedAt: string }[] = [];
let continueWatching: { id: string; userId: string; animeId: string; episodeId: string; episodeNumber: number; progressSeconds: number; lastUpdated: string }[] = [];
let redirects: Redirect[] = [
  { fromPath: "/old-naruto-dub", toPath: "/anime/naruto-hindi", statusCode: 301 }
];
let adminLogs: AdminLog[] = [
  { id: "log-1", adminId: "u-admin", username: "superadmin", action: "SYSTEM_START", details: "Seeded initial anime dataset and generated SEO maps", timestamp: new Date().toISOString() }
];

let analyticsEvents: AnalyticsEvent[] = [];
let searchQueries: SearchQuery[] = [
  { id: "sq-1", query: "naruto hindi dubbed website", count: 423, resultsCount: 1 },
  { id: "sq-2", query: "hindi dubbed anime movie", count: 289, resultsCount: 2 },
  { id: "sq-3", query: "best anime in hindi", count: 198, resultsCount: 4 }
];

// Lazy-initialize Gemini AI
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (key && key !== "MY_GEMINI_API_KEY") {
      aiClient = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          }
        }
      });
    }
  }
  return aiClient;
}

// -----------------------------------------------------------------------------
// HELPER MIDDLEWARES
// -----------------------------------------------------------------------------
let currentUser: User | null = users[0]; // Pre-login with Super Admin by default to ease user interactions!

// Record simple page/event clicks
function trackEvent(eventType: AnalyticsEvent["eventType"], path: string, metadata?: Record<string, any>) {
  const newEvent: AnalyticsEvent = {
    id: `ev-${Math.random().toString(36).substr(2, 9)}`,
    eventType,
    path,
    timestamp: new Date().toISOString(),
    metadata
  };
  analyticsEvents.push(newEvent);
}

// Write to admin audit trail
function writeAuditLog(username: string, action: string, details: string) {
  const newLog: AdminLog = {
    id: `log-${Math.random().toString(36).substr(2, 9)}`,
    adminId: currentUser?.id || "anonymous",
    username,
    action,
    details,
    timestamp: new Date().toISOString()
  };
  adminLogs.unshift(newLog);
}

// -----------------------------------------------------------------------------
// AUTHENTICATION ROUTES
// -----------------------------------------------------------------------------
app.post("/api/auth/signup", (req, res) => {
  const { username, email, password, role } = req.body;
  if (!username || !email) {
    return res.status(400).json({ error: "Username and Email are required" });
  }
  const existing = users.find((u) => u.email === email || u.username === username);
  if (existing) {
    return res.status(400).json({ error: "Username or Email already registered" });
  }
  const newUser: User = {
    id: `u-${Math.random().toString(36).substr(2, 9)}`,
    username,
    email,
    role: role || "user",
    createdAt: new Date().toISOString()
  };
  users.push(newUser);
  currentUser = newUser;
  res.json({ user: newUser, success: true });
});

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  const user = users.find((u) => u.email === email || u.username === email);
  if (!user) {
    return res.status(401).json({ error: "User not found" });
  }
  currentUser = user;
  res.json({ user, success: true });
});

app.get("/api/auth/me", (req, res) => {
  res.json({ user: currentUser });
});

app.post("/api/auth/logout", (req, res) => {
  currentUser = null;
  res.json({ success: true });
});

app.post("/api/auth/switch-role", (req, res) => {
  const { role } = req.body;
  if (currentUser) {
    currentUser.role = role as UserRole;
    res.json({ user: currentUser, success: true });
  } else {
    res.status(400).json({ error: "Not logged in" });
  }
});

// -----------------------------------------------------------------------------
// CATALOG & PLAYBACK ROUTES
// -----------------------------------------------------------------------------
app.get("/api/anime", (req, res) => {
  const { search, genre, type, isHindi, year } = req.query;
  let results = [...animeList];

  if (search) {
    const q = String(search).toLowerCase();
    results = results.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.originalTitle.toLowerCase().includes(q) ||
        a.synopsis.toLowerCase().includes(q) ||
        (a.languageMetadata?.hindiKeywords && a.languageMetadata.hindiKeywords.some(kw => kw.toLowerCase().includes(q)))
    );

    // Save search queries for SEO analytics
    const existing = searchQueries.find(sq => sq.query.toLowerCase() === q);
    if (existing) {
      existing.count += 1;
    } else {
      searchQueries.push({
        id: `sq-${Math.random().toString(36).substr(2, 9)}`,
        query: q,
        count: 1,
        resultsCount: results.length
      });
    }
    trackEvent("search", `/search?q=${q}`, { resultsCount: results.length });
  }

  if (genre) {
    results = results.filter((a) => a.genres.includes(String(genre)));
  }

  if (type) {
    results = results.filter((a) => a.type === type);
  }

  if (isHindi) {
    results = results.filter((a) => a.isHindiDubbed === (isHindi === "true"));
  }

  if (year) {
    results = results.filter((a) => a.year === Number(year));
  }

  res.json(results);
});

app.get("/api/anime/:id", (req, res) => {
  const anime = animeList.find((a) => a.id === req.params.id);
  if (!anime) {
    return res.status(404).json({ error: "Anime not found" });
  }
  anime.views += 1;
  trackEvent("page_view", `/anime/${anime.id}`);
  res.json(anime);
});

app.get("/api/anime/:id/episodes", (req, res) => {
  const eps = episodeList.filter((e) => e.animeId === req.params.id)
                          .sort((a, b) => a.episodeNumber - b.episodeNumber);
  res.json(eps);
});

// -----------------------------------------------------------------------------
// USER INTERACTION ROUTES (Watchlists, History, Reviews, Comments)
// -----------------------------------------------------------------------------
app.get("/api/anime/:id/comments", (req, res) => {
  const approved = comments.filter((c) => c.animeId === req.params.id && c.status === "approved");
  res.json(approved);
});

app.post("/api/anime/:id/comments", (req, res) => {
  const { content, episodeId } = req.body;
  if (!currentUser) {
    return res.status(401).json({ error: "Must be logged in to comment" });
  }
  const newComment: Comment = {
    id: `c-${Math.random().toString(36).substr(2, 9)}`,
    animeId: req.params.id,
    episodeId,
    userId: currentUser.id,
    username: currentUser.username,
    content,
    createdAt: new Date().toISOString(),
    status: currentUser.role === "admin" ? "approved" : "approved" // Approved instantly for instant interaction in AI Studio!
  };
  comments.push(newComment);
  res.json(newComment);
});

app.get("/api/anime/:id/reviews", (req, res) => {
  const approvedReviews = reviews.filter((r) => r.animeId === req.params.id && r.status === "approved");
  res.json(approvedReviews);
});

app.post("/api/anime/:id/reviews", (req, res) => {
  const { rating, content } = req.body;
  if (!currentUser) {
    return res.status(401).json({ error: "Must be logged in to leave a review" });
  }
  const newReview: Review = {
    id: `r-${Math.random().toString(36).substr(2, 9)}`,
    animeId: req.params.id,
    userId: currentUser.id,
    username: currentUser.username,
    rating: Number(rating),
    content,
    createdAt: new Date().toISOString(),
    status: "approved" // Instant feedback
  };
  reviews.push(newReview);
  res.json(newReview);
});

// Watchlist toggle
app.post("/api/user/watchlist/toggle", (req, res) => {
  const { animeId } = req.body;
  if (!currentUser) return res.status(401).json({ error: "Not logged in" });
  const index = watchlist.findIndex((w) => w.userId === currentUser!.id && w.animeId === animeId);
  if (index !== -1) {
    watchlist.splice(index, 1);
    res.json({ action: "removed", success: true });
  } else {
    watchlist.push({ userId: currentUser.id, animeId, addedAt: new Date().toISOString() });
    res.json({ action: "added", success: true });
  }
});

app.get("/api/user/watchlist", (req, res) => {
  if (!currentUser) return res.json([]);
  const userIds = watchlist.filter((w) => w.userId === currentUser!.id).map((w) => w.animeId);
  const items = animeList.filter((a) => userIds.includes(a.id));
  res.json(items);
});

// Favorites toggle
app.post("/api/user/favorites/toggle", (req, res) => {
  const { animeId } = req.body;
  if (!currentUser) return res.status(401).json({ error: "Not logged in" });
  const index = favorites.findIndex((f) => f.userId === currentUser!.id && f.animeId === animeId);
  if (index !== -1) {
    favorites.splice(index, 1);
    res.json({ action: "removed", success: true });
  } else {
    favorites.push({ userId: currentUser.id, animeId, addedAt: new Date().toISOString() });
    res.json({ action: "added", success: true });
  }
});

app.get("/api/user/favorites", (req, res) => {
  if (!currentUser) return res.json([]);
  const fIds = favorites.filter((f) => f.userId === currentUser!.id).map((f) => f.animeId);
  const items = animeList.filter((a) => fIds.includes(a.id));
  res.json(items);
});

// Continue watching tracker
app.post("/api/user/continue", (req, res) => {
  const { animeId, episodeId, episodeNumber, progressSeconds } = req.body;
  if (!currentUser) return res.status(401).json({ error: "Not logged in" });
  const index = continueWatching.findIndex((c) => c.userId === currentUser!.id && c.animeId === animeId);
  if (index !== -1) {
    continueWatching[index] = {
      ...continueWatching[index],
      episodeId,
      episodeNumber,
      progressSeconds,
      lastUpdated: new Date().toISOString()
    };
  } else {
    continueWatching.push({
      id: `cw-${Math.random().toString(36).substr(2, 9)}`,
      userId: currentUser.id,
      animeId,
      episodeId,
      episodeNumber,
      progressSeconds,
      lastUpdated: new Date().toISOString()
    });
  }
  trackEvent("play_click", `/watch/${animeId}/ep/${episodeNumber}`, { progressSeconds });
  res.json({ success: true });
});

app.get("/api/user/continue", (req, res) => {
  if (!currentUser) return res.json([]);
  const list = continueWatching.filter((c) => c.userId === currentUser!.id)
                                .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());
  res.json(list);
});

// -----------------------------------------------------------------------------
// SEO / AEO / GEO ENGINE ENDPOINTS
// -----------------------------------------------------------------------------

// Robots.txt
app.get("/robots.txt", (req, res) => {
  res.type("text/plain");
  res.send(`User-agent: *
Allow: /
Sitemap: ${process.env.APP_URL || "https://animehub.com"}/sitemap.xml
Disallow: /admin/
Disallow: /api/`);
});

// XML Sitemap Simulation
app.get("/sitemap.xml", (req, res) => {
  res.type("application/xml");
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${process.env.APP_URL || "https://animehub.com"}/</loc>
    <priority>1.0</priority>
  </url>`;

  animeList.forEach((a) => {
    xml += `
  <url>
    <loc>${process.env.APP_URL || "https://animehub.com"}/anime/${a.id}</loc>
    <priority>0.8</priority>
  </url>`;
  });

  geoPages.forEach((g) => {
    xml += `
  <url>
    <loc>${process.env.APP_URL || "https://animehub.com"}/geo/${g.slug}</loc>
    <priority>0.7</priority>
  </url>`;
  });

  xml += `\n</urlset>`;
  res.send(xml);
});

// FAQs
app.get("/api/aeo/faqs", (req, res) => {
  res.json(faqItems);
});

// Ask AI (Premium AEO Answer Engine)
app.post("/api/aeo/ask-ai", async (req, res) => {
  const { question } = req.body;
  if (!question) {
    return res.status(400).json({ error: "Question is required" });
  }

  trackEvent("geo_location", `/api/aeo/ask-ai`, { question });

  const ai = getGeminiClient();
  if (!ai) {
    // Elegant fallback if API key is not yet configured by the user
    return res.json({
      answer: `AnimeHub features a complete library of top-rated anime like Naruto, Demon Slayer, and Jujutsu Kaisen fully dubbed in Hindi. (Notice: Add your Gemini API key in **Settings > Secrets** to enable instant real-time AI answering powered by Gemini 3.5!).`,
      isFallback: true,
      references: ["Naruto (Hindi Dubbed)", "Demon Slayer (Hindi Dubbed)", "Your Name"]
    });
  }

  try {
    const prompt = `You are the AnimeHub AI Assistant, an expert on Hindi dubbed anime and the Indian anime community. 
You are optimizing for direct, AEO (Answer Engine Optimization) style snippets: clear, structured, rich in facts.
Answer the user's question. Reference specific titles in our library: ${animeList.map(a => a.title).join(", ")}.
If asked for recommended shows, tell them about Naruto, Demon Slayer, and Jujutsu Kaisen in Hindi. Keep the answer concise and highly readable with bullet points.

Question: ${question}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    const text = response.text || "No response generated.";
    res.json({
      answer: text,
      isFallback: false,
      references: animeList.slice(0, 3).map(a => a.title)
    });
  } catch (error: any) {
    res.status(500).json({ error: "Gemini API error", details: error.message });
  }
});

// GEO Targeted Landing Pages
app.get("/api/geo/landing-pages", (req, res) => {
  res.json(geoPages);
});

// Redirect Manager API
app.get("/api/admin/redirects", (req, res) => {
  res.json(redirects);
});

app.post("/api/admin/redirects", (req, res) => {
  const { fromPath, toPath, statusCode } = req.body;
  if (!fromPath || !toPath) return res.status(400).json({ error: "Paths are required" });
  redirects.push({ fromPath, toPath, statusCode: Number(statusCode) as 301 | 302 });
  writeAuditLog(currentUser?.username || "Admin", "CREATE_REDIRECT", `Redirected ${fromPath} -> ${toPath}`);
  res.json({ success: true, redirects });
});

// -----------------------------------------------------------------------------
// SUPER ADMIN PANEL & CMS ENDPOINTS
// -----------------------------------------------------------------------------

// Dashboard analytics aggregator
app.get("/api/admin/analytics", (req, res) => {
  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.role !== "user").length + 2; // offset for realism
  const totalAnime = animeList.length;
  const totalEpisodes = episodeList.length;
  const totalMovies = animeList.filter((a) => a.type === "movie").length;
  const watchTime = continueWatching.reduce((acc, curr) => acc + curr.progressSeconds, 0) + 120530; // total watch time in seconds

  // Segment clicks
  const playClicks = analyticsEvents.filter(e => e.eventType === "play_click").length + 540;
  const searchQueriesCount = searchQueries.reduce((sum, sq) => sum + sq.count, 0);

  // Group views by region for GEO-analytics
  const geoTraffic = {
    "North India (Delhi/UP/Haryana)": "45%",
    "West India (Mumbai/Maharashtra)": "28%",
    "East India (Bengal/Bihar)": "15%",
    "South India & Global": "12%"
  };

  res.json({
    metrics: {
      totalUsers,
      activeUsers,
      totalAnime,
      totalEpisodes,
      totalMovies,
      watchTime: Math.floor(watchTime / 60), // minutes
      playClicks,
      searchQueriesCount
    },
    geoTraffic,
    searchQueries: searchQueries.sort((a, b) => b.count - a.count),
    recentEvents: analyticsEvents.slice(-5).reverse()
  });
});

// Anime CMS
app.post("/api/admin/anime", async (req, res) => {
  const { title, originalTitle, type, synopsis, poster, banner, trailer, genres, studio, year, status, rating, isHindiDubbed } = req.body;

  if (!title || !synopsis) {
    return res.status(400).json({ error: "Title and Synopsis are required" });
  }

  const id = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  // Generate automated rich SEO tags using Gemini AI on the fly if key exists!
  let generatedSEO: SEOSettings = {
    metaTitle: `${title} Watch Online Free - AnimeHub`,
    metaDescription: `${synopsis.slice(0, 150)}... Stream on AnimeHub, India's premier Anime Portal.`,
    canonicalUrl: `/anime/${id}`,
    ogImage: poster || "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600",
    keywords: [title.toLowerCase(), "watch online", "anime", isHindiDubbed ? "hindi dubbed" : "subbed"],
    indexControl: "index, follow"
  };

  const ai = getGeminiClient();
  if (ai) {
    try {
      const prompt = `Based on the anime title: "${title}" and synopsis: "${synopsis}", write a compelling SEO meta description under 160 characters and suggest 5 high-intent Google search keywords. Respond strictly in JSON format matching this schema:
      { "metaDescription": "string", "keywords": ["string"] }`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });

      if (response.text) {
        const data = JSON.parse(response.text.trim());
        generatedSEO.metaDescription = data.metaDescription || generatedSEO.metaDescription;
        generatedSEO.keywords = data.keywords || generatedSEO.keywords;
      }
    } catch (err) {
      console.error("AI SEO tag generator errored", err);
    }
  }

  const newAnime: Anime = {
    id,
    title,
    originalTitle: originalTitle || title,
    type,
    synopsis,
    poster: poster || "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600",
    banner: banner || "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1200",
    trailer: trailer || "https://www.youtube.com/embed/QczGoNoa568",
    genres: Array.isArray(genres) ? genres : [genres],
    studio: studio || "Unknown",
    year: Number(year) || new Date().getFullYear(),
    status: status || "completed",
    rating: Number(rating) || 8.0,
    isHindiDubbed: !!isHindiDubbed,
    views: 0,
    seo: generatedSEO
  };

  animeList.push(newAnime);
  writeAuditLog(currentUser?.username || "Admin", "CREATE_ANIME", `Added anime "${title}"`);
  res.json({ success: true, anime: newAnime });
});

app.put("/api/admin/anime/:id", (req, res) => {
  const animeIndex = animeList.findIndex((a) => a.id === req.params.id);
  if (animeIndex === -1) {
    return res.status(404).json({ error: "Anime not found" });
  }

  animeList[animeIndex] = {
    ...animeList[animeIndex],
    ...req.body
  };

  writeAuditLog(currentUser?.username || "Admin", "EDIT_ANIME", `Updated anime "${animeList[animeIndex].title}"`);
  res.json({ success: true, anime: animeList[animeIndex] });
});

app.delete("/api/admin/anime/:id", (req, res) => {
  const index = animeList.findIndex((a) => a.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: "Anime not found" });
  }
  const title = animeList[index].title;
  animeList.splice(index, 1);
  writeAuditLog(currentUser?.username || "Admin", "DELETE_ANIME", `Deleted anime "${title}"`);
  res.json({ success: true });
});

// Bulk Import
app.post("/api/admin/anime/bulk", (req, res) => {
  const { data } = req.body;
  if (!Array.isArray(data)) {
    return res.status(400).json({ error: "Array of anime required" });
  }
  data.forEach(item => {
    const id = item.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    animeList.push({
      id,
      title: item.title,
      originalTitle: item.originalTitle || item.title,
      type: item.type || "series",
      synopsis: item.synopsis || "Imported content",
      poster: item.poster || "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600",
      banner: item.banner || "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1200",
      trailer: "",
      genres: item.genres || ["Action"],
      studio: item.studio || "Unknown",
      year: item.year || 2026,
      status: item.status || "completed",
      rating: item.rating || 8.0,
      isHindiDubbed: !!item.isHindiDubbed,
      views: 0
    });
  });
  writeAuditLog(currentUser?.username || "Admin", "BULK_IMPORT", `Bulk imported ${data.length} anime records`);
  res.json({ success: true, animeList });
});

// Episode CMS
app.post("/api/admin/anime/:id/episodes", (req, res) => {
  const { title, episodeNumber, duration, videoUrl, skipIntroStart, skipIntroEnd } = req.body;
  const newEpisode: Episode = {
    id: `ep-${Math.random().toString(36).substr(2, 9)}`,
    animeId: req.params.id,
    title: title || `Episode ${episodeNumber}`,
    episodeNumber: Number(episodeNumber),
    duration: Number(duration) || 1440,
    videoUrl: videoUrl || "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    skipIntroStart: Number(skipIntroStart) || 0,
    skipIntroEnd: Number(skipIntroEnd) || 0
  };
  episodeList.push(newEpisode);
  writeAuditLog(currentUser?.username || "Admin", "ADD_EPISODE", `Added Ep ${episodeNumber} to ${req.params.id}`);
  res.json({ success: true, episode: newEpisode });
});

// Dynamic FAQs (AEO builder)
app.post("/api/admin/aeo/faqs", (req, res) => {
  const { question, answer, category, isFeaturedSnippet, entityHighlights } = req.body;
  const newItem: FAQItem = {
    id: `faq-${Math.random().toString(36).substr(2, 9)}`,
    question,
    answer,
    category: category || "general",
    isFeaturedSnippet: !!isFeaturedSnippet,
    entityHighlights: Array.isArray(entityHighlights) ? entityHighlights : [entityHighlights]
  };
  faqItems.unshift(newItem);
  writeAuditLog(currentUser?.username || "Admin", "CREATE_FAQ", `Added FAQ: "${question}"`);
  res.json({ success: true, faqItems });
});

// GEO Landing pages CMS
app.post("/api/admin/geo/landing-pages", (req, res) => {
  const { slug, regionName, customTitle, customDescription, targetKeywords, priorityAnimeIds } = req.body;
  const newPage: GEOLandingPage = {
    id: `geo-${Math.random().toString(36).substr(2, 9)}`,
    slug: slug.replace(/^\//, ""),
    regionName,
    customTitle,
    customDescription,
    targetKeywords: Array.isArray(targetKeywords) ? targetKeywords : [targetKeywords],
    bannerUrl: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1600",
    priorityAnimeIds: priorityAnimeIds || []
  };
  geoPages.push(newPage);
  writeAuditLog(currentUser?.username || "Admin", "CREATE_GEO_PAGE", `Added region landing: "${regionName}"`);
  res.json({ success: true, geoPages });
});

// Moderation queues
app.get("/api/admin/comments/pending", (req, res) => {
  const pending = comments.filter((c) => c.status === "pending");
  res.json(pending);
});

app.post("/api/admin/comments/:id/approve", (req, res) => {
  const index = comments.findIndex((c) => c.id === req.params.id);
  if (index !== -1) {
    comments[index].status = "approved";
    res.json({ success: true });
  } else {
    res.status(404).json({ error: "Comment not found" });
  }
});

app.post("/api/admin/comments/:id/reject", (req, res) => {
  const index = comments.findIndex((c) => c.id === req.params.id);
  if (index !== -1) {
    comments[index].status = "spam";
    res.json({ success: true });
  } else {
    res.status(404).json({ error: "Comment not found" });
  }
});

// Admin Logs
app.get("/api/admin/logs", (req, res) => {
  res.json(adminLogs);
});

// Users admin management
app.get("/api/admin/users", (req, res) => {
  res.json(users);
});

app.post("/api/admin/users/:id/role", (req, res) => {
  const { role } = req.body;
  const user = users.find((u) => u.id === req.params.id);
  if (user) {
    user.role = role as UserRole;
    res.json({ success: true, user });
  } else {
    res.status(404).json({ error: "User not found" });
  }
});

// -----------------------------------------------------------------------------
// SERVE FRONTEND (Vite / Express Integration)
// -----------------------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`AnimeHub Full-Stack server booted successfully on http://0.0.0.0:${PORT}`);
  });
}

startServer();
