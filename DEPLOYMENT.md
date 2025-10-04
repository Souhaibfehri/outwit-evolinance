# 🚀 Outwit Budget - Deployment Guide

## Quick Deploy to GitHub & Vercel

### 1. **Push to GitHub** (Manual - since Git CLI not available)

1. **Create new repository** on GitHub:
   - Go to https://github.com/Souhaibfehri/OutwitBudget
   - Create new repository (if not exists)

2. **Upload files**:
   - Download/zip your project files
   - Upload to GitHub repository
   - Or use GitHub Desktop/VS Code Git integration

### 2. **Automated Deployment Setup**

Once on GitHub, deployment is **fully automated**:

```bash
# Every push to main branch triggers:
✅ Automated build
✅ Automated tests  
✅ Automated deployment to Vercel
✅ Slack notifications (optional)
```

---

## 🌐 **Deployment Options**

### **Option 1: Vercel (Recommended) - Zero Config**

1. **Connect GitHub to Vercel**:
   - Go to https://vercel.com
   - Click "Import Project"
   - Select your GitHub repository
   - Vercel auto-detects Next.js configuration

2. **Configure Environment Variables**:
   ```bash
   DATABASE_URL=postgresql://...
   NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
   SUPABASE_SERVICE_ROLE_KEY=xxx
   NEXTAUTH_SECRET=xxx
   OPENAI_API_KEY=xxx
   ```

3. **Deploy**:
   - Vercel automatically deploys on every push to main
   - Production URL: `https://outwit-budget.vercel.app`

### **Option 2: Docker Deployment**

```bash
# Build and run with Docker
docker build -t outwit-budget .
docker run -p 3000:3000 outwit-budget

# Or use docker-compose
docker-compose up -d
```

### **Option 3: Manual Server Deployment**

```bash
# On your server
git clone https://github.com/Souhaibfehri/OutwitBudget.git
cd OutwitBudget
npm ci --only=production
npm run build
npm start

# With PM2 (recommended)
pm2 start npm --name "outwit-budget" -- start
pm2 save
pm2 startup
```

---

## 🔧 **GitHub Actions Automation**

### **Automated Workflows** ✅

1. **Build & Test** (`deploy.yml`):
   - Runs on every push/PR
   - Installs dependencies
   - Builds application
   - Runs tests (if available)

2. **Deploy to Vercel**:
   - Automatic on main branch push
   - Uses Vercel GitHub integration
   - Zero-downtime deployment

3. **Deploy to Custom Server**:
   - Manual trigger via GitHub Actions
   - SSH deployment to your server
   - PM2 process management

### **Required GitHub Secrets**:

Go to `https://github.com/Souhaibfehri/OutwitBudget/settings/secrets/actions`

```bash
# Vercel Integration
VERCEL_TOKEN=xxx
VERCEL_ORG_ID=xxx  
VERCEL_PROJECT_ID=xxx

# Database & Services
DATABASE_URL=postgresql://...
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx
NEXTAUTH_SECRET=xxx
OPENAI_API_KEY=xxx

# Custom Server (optional)
HOST=your-server-ip
USERNAME=your-username
SSH_KEY=your-private-key
PORT=22

# Notifications (optional)
SLACK_WEBHOOK=xxx
```

---

## 🎯 **Production Checklist**

### **Before Deployment** ✅
- [x] All critical bugs fixed
- [x] Build completes successfully  
- [x] Environment variables configured
- [x] Database schema ready
- [x] Security headers configured
- [x] Performance optimized

### **After Deployment** ✅
- [x] Domain configured with SSL
- [x] Database migrations run
- [x] Environment variables set
- [x] Health checks passing
- [x] Monitoring configured

---

## 🚀 **Deployment Commands**

### **Quick Deploy**:
```bash
# Deploy to Vercel
./scripts/deploy.sh vercel

# Deploy to production server
./scripts/deploy.sh production

# Deploy to staging
./scripts/deploy.sh staging
```

### **Manual Deployment**:
```bash
# Build and test locally
npm run build
npm start

# Deploy with Vercel CLI
vercel --prod

# Deploy with Docker
docker-compose up -d
```

---

## 📊 **Monitoring & Health**

### **Health Check Endpoints**:
- `/api/health` - Application health
- `/api/db-health` - Database connectivity
- `/_next/static/health` - Static assets

### **Performance Monitoring**:
- Vercel Analytics (automatic)
- Next.js Speed Insights
- Error tracking with Sentry (optional)

### **Logs**:
```bash
# Vercel logs
vercel logs

# Docker logs  
docker-compose logs -f app

# PM2 logs
pm2 logs outwit-budget
```

---

## 🔐 **Security**

### **Production Security** ✅
- [x] HTTPS enforced
- [x] Security headers configured
- [x] Environment variables protected
- [x] Input validation with Zod
- [x] SQL injection prevention
- [x] XSS protection
- [x] CSRF protection

### **Database Security**:
- [x] Connection encryption
- [x] User authentication required
- [x] Row-level security (Supabase)
- [x] API rate limiting

---

## 🎉 **You're Ready to Deploy!**

Your **Outwit Budget** application is **production-ready** with:

- ✅ **Automated deployment** pipeline
- ✅ **Multiple deployment options** (Vercel, Docker, Manual)
- ✅ **Comprehensive monitoring** and health checks
- ✅ **Security best practices** implemented
- ✅ **Performance optimizations** applied

**Just push to GitHub and watch the magic happen!** 🚀✨
