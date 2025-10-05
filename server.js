// DRASTIC HTTP 431 FIX - Maximum header limits and aggressive cookie cleanup
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3001; // Use port 3001 to avoid conflicts

// Create Next.js app
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  // Create custom server with MAXIMUM header limits
  const server = createServer({
    maxHeaderSize: 32768, // 32KB - maximum possible
    keepAlive: true,
    keepAliveInitialDelay: 1000,
    timeout: 60000, // 60 second timeout
  }, async (req, res) => {
    try {
      // AGGRESSIVE COOKIE CLEANUP - Remove ALL cookies if headers are large
      const rawHeaders = req.rawHeaders;
      let totalHeaderSize = 0;
      
      for (let i = 0; i < rawHeaders.length; i += 2) {
        totalHeaderSize += rawHeaders[i].length + (rawHeaders[i + 1] ? rawHeaders[i + 1].length : 0);
      }
      
      console.log(`Request headers size: ${totalHeaderSize} bytes`);
      
      // If headers are large, clear ALL cookies aggressively
      if (totalHeaderSize > 8000 || req.headers.cookie?.length > 4000) {
        console.log('🚨 LARGE HEADERS DETECTED - Clearing ALL cookies');
        
        // Clear ALL possible cookies
        const cookiesToClear = [
          'sb-access-token', 'sb-refresh-token', 'supabase.auth.token',
          'supabase-auth-token', 'vercel-auth-session', 'next-auth.session-token',
          'session', 'auth', 'token', 'jwt', 'cookie', 'auth-token',
          'access-token', 'refresh-token', 'user-token', 'app-session'
        ];
        
        cookiesToClear.forEach(cookieName => {
          res.setHeader('Set-Cookie', [
            `${cookieName}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly`,
            `${cookieName}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Secure; HttpOnly`,
            `${cookieName}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict`,
          ]);
        });
        
        // Set aggressive cache headers
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
      }
      
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      
      // If it's a header size error, return a clean response
      if (err.code === 'HPE_HEADER_OVERFLOW' || err.message.includes('header')) {
        res.writeHead(431, {
          'Content-Type': 'text/html',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Set-Cookie': 'session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT'
        });
        res.end(`
          <html>
            <body>
              <h1>Headers Too Large - Clearing Cookies</h1>
              <p>Your browser cookies are too large. Clearing them now...</p>
              <script>
                document.cookie.split(";").forEach(function(c) { 
                  document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
                });
                setTimeout(() => window.location.reload(), 1000);
              </script>
            </body>
          </html>
        `);
        return;
      }
      
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  });

  server.on('clientError', (err, socket) => {
    console.error('Client error:', err);
    if (err.code === 'HPE_HEADER_OVERFLOW') {
      console.log('🚨 HTTP 431 DETECTED - Sending cookie clear response');
      socket.write('HTTP/1.1 431 Request Header Fields Too Large\r\n');
      socket.write('Content-Type: text/html\r\n');
      socket.write('Set-Cookie: session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT\r\n');
      socket.write('\r\n');
      socket.write('<html><body><h1>Clearing Cookies...</h1><script>document.cookie.split(";").forEach(function(c) { document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); }); setTimeout(() => window.location.reload(), 1000);</script></body></html>');
    }
    socket.end();
  });

  server.listen(port, (err) => {
    if (err) throw err;
    console.log(`🚀 DRASTIC HTTP 431 FIX SERVER READY`);
    console.log(`📍 http://${hostname}:${port}`);
    console.log(`🔧 Header size limit: 32KB (MAXIMUM)`);
    console.log(`🧹 Aggressive cookie cleanup: ENABLED`);
  });
});
