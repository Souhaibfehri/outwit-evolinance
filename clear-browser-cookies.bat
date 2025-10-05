@echo off
echo Clearing browser cookies for localhost:3000...
echo.

echo Opening clear-cookies page...
start "" "http://localhost:3000/clear-cookies"

echo.
echo Waiting 3 seconds...
timeout /t 3 /nobreak > nul

echo.
echo Opening main app...
start "" "http://localhost:3000"

echo.
echo ✅ Cookies cleared and app opened!
echo If you still get HTTP 431 error:
echo 1. Press F12 in browser
echo 2. Right-click refresh button
echo 3. Select "Empty Cache and Hard Reload"
echo.
pause
