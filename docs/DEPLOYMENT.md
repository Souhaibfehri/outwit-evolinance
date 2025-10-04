# 🚀 Deployment Guide

## Overview

Outwit Budget is optimized for deployment on Vercel but can be deployed to any platform that supports Next.js applications.

## 🌟 Vercel Deployment (Recommended)

### Prerequisites
- GitHub/GitLab/Bitbucket repository
- Vercel account
- Supabase project

### Step-by-Step Deployment

1. **Push your code to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Import Project"
   - Select your GitHub repository
   - Choose "Next.js" framework preset

3. **Configure Environment Variables**
   In Vercel dashboard, add these environment variables:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   DATABASE_URL=postgresql://postgres.your-project:password@aws-0-region.pooler.supabase.com:5432/postgres
   DIRECT_URL=postgresql://postgres.your-project:password@aws-0-region.pooler.supabase.com:5432/postgres
   ```

4. **Deploy**
   - Click "Deploy"
   - Vercel will automatically build and deploy your app
   - Your app will be available at `https://your-app.vercel.app`

### Vercel Configuration

Create `vercel.json` for advanced configuration:
```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "regions": ["iad1"],
  "env": {
    "NODE_ENV": "production"
  }
}
```

## 🐳 Docker Deployment

### Dockerfile
```dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT 3000

CMD ["node", "server.js"]
```

### Docker Compose
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
      - DATABASE_URL=${DATABASE_URL}
      - DIRECT_URL=${DIRECT_URL}
    env_file:
      - .env.local
```

## ☁️ AWS Deployment

### AWS Amplify

1. **Connect Repository**
   - Go to AWS Amplify console
   - Connect your GitHub repository

2. **Build Settings**
   ```yaml
   version: 1
   frontend:
     phases:
       preBuild:
         commands:
           - npm ci
       build:
         commands:
           - npm run build
     artifacts:
       baseDirectory: .next
       files:
         - '**/*'
     cache:
       paths:
         - node_modules/**/*
   ```

3. **Environment Variables**
   Add the same environment variables as Vercel

### AWS App Runner

1. **Create apprunner.yaml**
   ```yaml
   version: 1.0
   runtime: nodejs18
   build:
     commands:
       build:
         - npm ci
         - npm run build
   run:
     runtime-version: 18
     command: npm start
     network:
       port: 3000
       env: PORT
   ```

## 🌐 Other Platforms

### Netlify

1. **Build Settings**
   - Build command: `npm run build`
   - Publish directory: `.next`

2. **Netlify Configuration**
   ```toml
   [build]
     command = "npm run build"
     publish = ".next"

   [[redirects]]
     from = "/*"
     to = "/index.html"
     status = 200
   ```

### Railway

1. **Connect Repository** to Railway
2. **Add Environment Variables**
3. **Deploy** - Railway auto-detects Next.js

### DigitalOcean App Platform

1. **Create App** from GitHub repository
2. **Configure Build Command**: `npm run build`
3. **Configure Run Command**: `npm start`

## 🔧 Production Optimizations

### Next.js Configuration

Update `next.config.js`:
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client']
  },
  images: {
    domains: ['your-domain.com'],
  },
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
}

module.exports = nextConfig
```

### Performance Monitoring

Add analytics and monitoring:
```bash
npm install @vercel/analytics @vercel/speed-insights
```

### Security Headers

Add security headers in `next.config.js`:
```javascript
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin'
  }
]

module.exports = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },
}
```

## 📊 Monitoring & Analytics

### Error Tracking

1. **Sentry Integration**
   ```bash
   npm install @sentry/nextjs
   ```

2. **Vercel Analytics**
   ```bash
   npm install @vercel/analytics
   ```

### Performance Monitoring

1. **Web Vitals Tracking**
2. **Real User Monitoring**
3. **Database Performance Monitoring**

## 🔄 CI/CD Pipeline

### GitHub Actions

The included `.github/workflows/ci.yml` provides:
- **Automated testing** on push/PR
- **Type checking** with TypeScript
- **Linting** with ESLint
- **Security auditing** with npm audit
- **Multi-node testing** (Node 18 & 20)

### Deployment Automation

```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    - name: Deploy to Vercel
      uses: amondnet/vercel-action@v25
      with:
        vercel-token: ${{ secrets.VERCEL_TOKEN }}
        vercel-org-id: ${{ secrets.ORG_ID }}
        vercel-project-id: ${{ secrets.PROJECT_ID }}
```

## 🔐 Environment Security

### Production Environment Variables

**Required:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `DATABASE_URL`
- `DIRECT_URL`

**Optional:**
- `SENTRY_DSN` (for error tracking)
- `VERCEL_ANALYTICS_ID` (for analytics)
- `NODE_ENV=production`

### Security Best Practices

1. **Never commit** `.env` files
2. **Use different** Supabase projects for dev/staging/prod
3. **Rotate keys** regularly
4. **Monitor** for unauthorized access
5. **Use HTTPS** in production
6. **Enable** Supabase RLS (Row Level Security)

## 📈 Scaling Considerations

### Database Optimization
- **Connection pooling** with Supabase pooler
- **Query optimization** with proper indexing
- **Data archiving** for old transactions

### Caching Strategy
- **Static generation** for marketing pages
- **ISR (Incremental Static Regeneration)** for dynamic content
- **Edge caching** with Vercel Edge Network

### Performance Monitoring
- **Core Web Vitals** tracking
- **Database query performance**
- **API response times**
- **User session analytics**

---

**Your app is ready for production! 🎉**
