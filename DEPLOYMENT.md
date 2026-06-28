# AnimeHub Production Deployment Guide

This guide details how to scale **AnimeHub** from a rapid in-memory container sandbox to a highly redundant, auto-scaling enterprise deployment with **PostgreSQL**, **Prisma ORM**, **Redis caching**, and **Docker**.

---

## 1. Production Architecture Overview

The production architecture separates the state, cache, and execution layers to achieve sub-100ms response times:

```
[ CDN / Cloudflare ]
       │ (Geo-Routing & Edge Cache)
       ▼
[ Application Load Balancer / Nginx ]
       │
   ┌───┴───┐ (Scale out stateless app containers)
[ App ] [ App ] [ App ] (Cloud Run / AWS Fargate / K8s)
   │       │       │
   ├─── Prisma ORM ───► [ Managed PostgreSQL Database ]
   │
   └──────────────────► [ Managed Redis Cache ] (Session & AEO answers)
```

---

## 2. Docker Setup

Create the following file in your project root for building containerized production artifacts:

### `Dockerfile`
```dockerfile
# Multi-stage build for speed and minimal image size
FROM node:22-alpine AS builder

WORKDIR /app

# Install build dependencies
COPY package*.json ./
RUN npm ci

# Copy source and compile application
COPY . .
RUN npm run build

# Production-runner environment
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist

# Install production-only modules
RUN npm ci --only=production

EXPOSE 3000
CMD ["npm", "start"]
```

---

## 3. Database Schema Mapping (Prisma)

To migrate from the seeded mutable memory layer to PostgreSQL, initialize Prisma:

```bash
npx prisma init
```

Define the relational mapping models in `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum Role {
  USER
  EDITOR
  ADMIN
}

model User {
  id        String    @id @default(uuid())
  username  String    @unique
  email     String    @unique
  role      Role      @default(USER)
  createdAt DateTime  @default(now())
}

model Anime {
  id             String    @id
  title          String
  originalTitle  String
  type           String    // "series" | "movie"
  synopsis       String    @db.Text
  poster         String
  banner         String
  trailer        String
  genres         String[]
  studio         String
  year           Int
  status         String    // "ongoing" | "completed"
  rating         Float
  isHindiDubbed  Boolean   @default(true)
  views          Int       @default(0)
  createdAt      DateTime  @default(now())
}

model Episode {
  id             String    @id @default(uuid())
  animeId        String
  title          String
  episodeNumber  Int
  duration       Int
  videoUrl       String
  skipIntroStart Int?
  skipIntroEnd   Int?
}

model FAQItem {
  id                String   @id @default(uuid())
  question          String   @db.Text
  answer            String   @db.Text
  category          String   @default("general")
  isFeaturedSnippet Boolean  @default(true)
  entityHighlights  String[]
}
```

Deploy your migrations using:
```bash
npx prisma migrate deploy
```

---

## 4. Redis Caching Integration

In production, wrap high-frequency read endpoints with a Redis caching layer to offload the PostgreSQL instance. 

Install the official client:
```bash
npm install redis
```

Implement the lazy caching pattern in `server.ts` routes:

```typescript
import { createClient } from 'redis';

const redis = createClient({ url: process.env.REDIS_URL });
redis.connect().catch(console.error);

app.get("/api/anime", async (req, res) => {
  const cacheKey = `anime:catalog:${JSON.stringify(req.query)}`;
  
  try {
    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
      return res.json(JSON.parse(cachedData));
    }
    
    // Fetch from Database if cache misses
    const data = await prisma.anime.findMany(); 
    
    // Cache result with 10-minute expiry
    await redis.setEx(cacheKey, 600, JSON.stringify(data));
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Database or Redis Cache error" });
  }
});
```

---

## 5. SEO / AEO Indexing Instructions

1. **Submit Sitemap to Google Search Console**: Submit `${APP_URL}/sitemap.xml` directly to register localized Hindi dubbed pathways.
2. **Setup Schema Validation**: Verify your embedded FAQ schema using the Google Rich Results Test tool.
3. **Verify Robots Directive**: Verify that search engines are indexing dynamic landings and bypassing administrator pathways under `${APP_URL}/robots.txt`.
