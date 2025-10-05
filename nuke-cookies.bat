@echo off
echo 🚨 NUCLEAR COOKIE NUKE - HTTP 431 DESTROYER 🚨
echo.

echo Step 1: Killing all Node processes...
taskkill /f /im node.exe >nul 2>&1

echo Step 2: Clearing browser data for localhost...
echo This will clear ALL cookies, cache, and data for localhost:3000 and localhost:3001

echo.
echo Step 3: Opening cookie nuke page...
start "" "http://localhost:3001/clear-cookies"

echo.
echo Step 4: Waiting 5 seconds...
timeout /t 5 /nobreak > nul

echo Step 5: Starting DRASTIC server...
start "" "npm run dev"

echo.
echo Step 6: Waiting for server to start...
timeout /t 8 /nobreak > nul

echo Step 7: Opening app with fresh cookies...
start "" "http://localhost:3001"

echo.
echo ✅ NUCLEAR OPTION COMPLETE!
echo.
echo If HTTP 431 persists:
echo 1. Press Ctrl+Shift+Delete in browser
echo 2. Select "All time" and "All data"
echo 3. Clear data
echo 4. Restart browser
echo.
pause
