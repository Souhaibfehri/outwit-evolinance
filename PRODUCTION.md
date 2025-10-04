# 🚀 Production Deployment Guide

## Prerequisites

- Node.js 18+ 
- PostgreSQL database
- Supabase account
- Domain name with SSL

## Environment Setup

Create `.env.production` with these variables:

```bash
# Database
DATABASE_URL="postgresql://user:password@host:5432/database?schema=public"
DIRECT_URL="postgresql://user:password@host:5432/database?schema=public"

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# App
NEXT_PUBLIC_APP_URL="https://your-domain.com"
NEXTAUTH_SECRET="your-secure-secret-key"
OPENAI_API_KEY="your-openai-api-key"
```

## Build & Deploy

```bash
# Install dependencies
npm ci --only=production

# Generate Prisma client
npm run prisma:generate

# Build application
npm run build

# Start production server
npm start
```

## Performance Optimizations ✅

- [x] Bundle optimization with tree shaking
- [x] Image optimization with Next.js Image
- [x] CSS optimization and minification
- [x] JavaScript minification and compression
- [x] Static page generation where possible
- [x] Lazy loading of components
- [x] Efficient chunk splitting

## Security Features ✅

- [x] Security headers (HSTS, CSP, etc.)
- [x] XSS protection
- [x] CSRF protection
- [x] Input validation with Zod
- [x] SQL injection prevention with Prisma
- [x] Environment variable protection
- [x] Authentication with Supabase

## Monitoring & Analytics

- Error tracking with built-in error boundaries
- Performance monitoring via Next.js analytics
- User analytics ready for integration
- Database query optimization

## Deployment Platforms

### Vercel (Recommended)
```bash
vercel --prod
```

### Docker
```bash
docker build -t outwit-budget .
docker run -p 3000:3000 outwit-budget
```

### Manual Server
```bash
# PM2 process manager
pm2 start npm --name "outwit-budget" -- start
```

## Database Migration

```bash
# Run migrations
npm run prisma:push

# Seed initial data
npm run db:seed
```

## Health Checks

- `/api/health` - Application health
- Database connectivity check
- External service availability

## Production Checklist ✅

- [x] Build completes successfully
- [x] No security vulnerabilities
- [x] Environment variables configured
- [x] Database schema updated
- [x] SSL certificate installed
- [x] Security headers configured
- [x] Error handling implemented
- [x] Performance optimized
- [x] Monitoring setup ready

## Support

For production issues, check:
1. Application logs
2. Database connectivity
3. Environment variables
4. SSL certificate validity
5. External service status
