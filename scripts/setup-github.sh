#!/bin/bash

# GitHub Repository Setup Script for Outwit Budget
# This script helps set up the GitHub repository and configure deployment

set -e

REPO_URL="https://github.com/Souhaibfehri/OutwitBudget.git"
REPO_NAME="OutwitBudget"

echo "🚀 Setting up GitHub repository for Outwit Budget..."

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }

# Check if git is installed
if ! command -v git &> /dev/null; then
    log_error "Git is not installed. Please install Git first."
    log_info "Download from: https://git-scm.com/downloads"
    exit 1
fi

# Initialize git repository if not already initialized
if [ ! -d ".git" ]; then
    log_info "Initializing Git repository..."
    git init
    log_success "Git repository initialized"
else
    log_info "Git repository already exists"
fi

# Create .gitignore if it doesn't exist
if [ ! -f ".gitignore" ]; then
    log_info "Creating .gitignore file..."
    cat > .gitignore << 'EOF'
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Next.js
.next/
out/
build/

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Database
*.db
*.sqlite

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
*.log

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/

# Dependency directories
jspm_packages/

# Optional npm cache directory
.npm

# Optional eslint cache
.eslintcache

# Microbundle cache
.rpt2_cache/
.rts2_cache_cjs/
.rts2_cache_es/
.rts2_cache_umd/

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# parcel-bundler cache (https://parceljs.org/)
.cache
.parcel-cache

# Stores VSCode versions used for testing VSCode extensions
.vscode-test

# Temporary folders
tmp/
temp/
EOF
    log_success ".gitignore created"
fi

# Add all files to git
log_info "Adding files to git..."
git add .

# Create initial commit
if ! git rev-parse --verify HEAD >/dev/null 2>&1; then
    log_info "Creating initial commit..."
    git commit -m "🎉 Initial commit: Outwit Budget v1.0

✨ Features:
- Zero-based budgeting system
- Debt payoff calculator (Avalanche vs Snowball)
- Investment growth simulator
- Interactive tutorials with badge system
- AI financial coach (Foxy)
- Comprehensive transaction management
- Goal tracking and progress monitoring
- Smart notifications system
- Beautiful responsive UI
- Production-ready with security headers

🚀 Ready for deployment!"
    log_success "Initial commit created"
else
    log_info "Repository already has commits"
    git commit -m "🚀 Deploy: Production-ready Outwit Budget

✅ All critical bugs fixed
✅ Enhanced UI/UX with tutorials
✅ Professional simulators added
✅ Automated deployment configured" || log_info "No changes to commit"
fi

# Add remote origin
if ! git remote get-url origin &> /dev/null; then
    log_info "Adding GitHub remote..."
    git remote add origin $REPO_URL
    log_success "GitHub remote added: $REPO_URL"
else
    log_info "GitHub remote already configured"
fi

# Push to GitHub
log_info "Pushing to GitHub..."
git branch -M main
git push -u origin main --force

log_success "🎉 Successfully pushed to GitHub!"
log_info "Repository URL: $REPO_URL"

# Instructions for next steps
echo ""
log_info "🔧 Next Steps:"
echo "1. 🌐 Set up Vercel deployment:"
echo "   - Go to https://vercel.com"
echo "   - Import your GitHub repository"
echo "   - Configure environment variables"
echo ""
echo "2. 🔐 Configure GitHub Secrets (for automation):"
echo "   - Go to $REPO_URL/settings/secrets/actions"
echo "   - Add these secrets:"
echo "     • VERCEL_TOKEN"
echo "     • VERCEL_ORG_ID" 
echo "     • VERCEL_PROJECT_ID"
echo "     • DATABASE_URL"
echo "     • NEXT_PUBLIC_SUPABASE_URL"
echo "     • NEXT_PUBLIC_SUPABASE_ANON_KEY"
echo "     • SUPABASE_SERVICE_ROLE_KEY"
echo "     • NEXTAUTH_SECRET"
echo "     • OPENAI_API_KEY"
echo ""
echo "3. 🚀 Deploy:"
echo "   - Push to main branch triggers automatic deployment"
echo "   - Or run: ./scripts/deploy.sh vercel"
echo ""
log_success "Setup complete! Your app is ready for deployment."
