@echo off
echo 🔧 Setting up local environment variables...

echo # 🔑 LOCAL DEVELOPMENT ENVIRONMENT VARIABLES > .env.local
echo # These are placeholder values for local development only >> .env.local
echo. >> .env.local
echo # ===== SUPABASE (PLACEHOLDERS) ===== >> .env.local
echo NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co >> .env.local
echo NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder-key >> .env.local
echo SUPABASE_SERVICE_ROLE_KEY=placeholder-service-role-key >> .env.local
echo. >> .env.local
echo # ===== DATABASE (PLACEHOLDERS) ===== >> .env.local
echo DATABASE_URL=postgresql://placeholder:placeholder@placeholder:5432/placeholder >> .env.local
echo DIRECT_URL=postgresql://placeholder:placeholder@placeholder:5432/placeholder >> .env.local
echo. >> .env.local
echo # ===== AUTHENTICATION (PLACEHOLDERS) ===== >> .env.local
echo NEXTAUTH_SECRET=placeholder-secret-for-local-development-only >> .env.local
echo NEXTAUTH_URL=http://localhost:3001 >> .env.local
echo. >> .env.local
echo # ===== OPTIONAL (PLACEHOLDERS) ===== >> .env.local
echo OPENAI_API_KEY=sk-placeholder-key-for-local-development >> .env.local
echo NEXT_PUBLIC_APP_URL=http://localhost:3001 >> .env.local
echo NODE_ENV=development >> .env.local

echo ✅ Environment variables created!
echo.
echo 📝 Note: These are placeholder values for local development
echo Replace with real values if you want to connect to Supabase locally
echo.
pause
