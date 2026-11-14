const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { IncomingForm } = require('formidable');

function startServer({
  port = 5173,
  baseDir = process.cwd(),
  appDir = null,
  resourcesDir = null,
  userDataDir = null,
} = {}) {
  let sseClients = [];
  let currentLiveState = null;

  // Periodic SSE ping to keep connections alive
  const pingTimer = setInterval(() => {
    sseClients.forEach((client) => {
      try {
        client.write('event: ping\ndata: {}\n\n');
        if (client.flush) client.flush();
      } catch (e) {}
    });
  }, 5000);
  if (pingTimer.unref) pingTimer.unref();

  // Setup directories with robust fallbacks
  const storageRoot = userDataDir || resourcesDir || baseDir;
  const uploadsDir = path.join(storageRoot, 'public', 'uploads');
  const songsDir = path.join(storageRoot, 'songs');
  const biblesDir = path.join(storageRoot, 'BIBLE');

  [uploadsDir, songsDir, biblesDir].forEach((dir) => {
    if (!fs.existsSync(dir)) {
      try {
        fs.mkdirSync(dir, { recursive: true });
      } catch (e) {}
    }
  });

  const findFallbackBiblesDir = () => {
    const list = [
      resourcesDir ? path.join(resourcesDir, 'BIBLE') : null,
      appDir ? path.join(appDir, 'BIBLE') : null,
      path.join(baseDir, 'BIBLE'),
      path.join(__dirname, '..', 'BIBLE'),
    ].filter(Boolean);
    for (const d of list) {
      if (fs.existsSync(d)) return d;
    }
    return list[0];
  };
  const fallbackBiblesDir = findFallbackBiblesDir();

  const findBackgroundsDir = () => {
    const list = [
      resourcesDir ? path.join(resourcesDir, 'public', 'backgrounds') : null,
      appDir ? path.join(appDir, 'public', 'backgrounds') : null,
      path.join(baseDir, 'public', 'backgrounds'),
      path.join(__dirname, '..', 'public', 'backgrounds'),
    ].filter(Boolean);
    for (const d of list) {
      if (fs.existsSync(d)) return d;
    }
    return list[0];
  };
  const backgroundsDir = findBackgroundsDir();

  const settingsFilePath = path.join(storageRoot, 'super_settings.json');
  const findFallbackSettingsPath = () => {
    const list = [
      resourcesDir ? path.join(resourcesDir, 'super_settings.json') : null,
      appDir ? path.join(appDir, 'super_settings.json') : null,
      path.join(baseDir, 'super_settings.json'),
      path.join(__dirname, '..', 'super_settings.json'),
    ].filter(Boolean);
    for (const p of list) {
      if (fs.existsSync(p)) return p;
    }
    return list[0];
  };
  const fallbackSettingsPath = findFallbackSettingsPath();

  const findDistDir = () => {
    const list = [
      resourcesDir ? path.join(resourcesDir, 'dist') : null,
      appDir ? path.join(appDir, 'dist') : null,
      path.join(baseDir, 'dist'),
      path.join(__dirname, '..', 'dist'),
      path.join(process.cwd(), 'dist'),
    ].filter(Boolean);
    for (const d of list) {
      try {
        if (fs.existsSync(d) && fs.existsSync(path.join(d, 'index.html'))) {
          console.log('[Server] Verified dist directory:', d);
          return d;
        }
      } catch (e) {}
    }
    console.error('[Server] WARNING: Could not find dist directory with index.html! Checked:', list);
    return list[0] || path.join(process.cwd(), 'dist');
  };
  const distDir = findDistDir();

  const readSuperSettings = () => {
    try {
      if (fs.existsSync(settingsFilePath)) {
        return JSON.parse(fs.readFileSync(settingsFilePath, 'utf8'));
      }
      if (fs.existsSync(fallbackSettingsPath)) {
        return JSON.parse(fs.readFileSync(fallbackSettingsPath, 'utf8'));
      }
    } catch (e) {
      console.error('Error reading super_settings.json:', e);
    }
    return null;
  };

  const writeSuperSettings = (data) => {
    let existing = readSuperSettings() || {};
    const payload = {
      version: '1.0',
      ...existing,
      ...data,
      updatedAt: new Date().toISOString(),
    };
    fs.writeFileSync(settingsFilePath, JSON.stringify(payload, null, 2), 'utf8');
    return payload;
  };

  // Song parsing & serialization helpers
  const parseSongTxt = (content, filename) => {
    const lines = content.split(/\r?\n/);
    let title = path.basename(filename, path.extname(filename));
    let artist = '';
    let settings = null;
    let lyricsStart = 0;
    let hasHeader = false;

    for (let i = 0; i < Math.min(lines.length, 14); i++) {
      const line = lines[i].trim();
      if (line.toLowerCase().startsWith('title:')) {
        title = line.substring(6).trim();
        hasHeader = true;
      } else if (line.toLowerCase().startsWith('artist:')) {
        artist = line.substring(7).trim();
        hasHeader = true;
      } else if (line.toLowerCase().startsWith('settings:')) {
        try {
          settings = JSON.parse(line.substring(9).trim());
        } catch (e) {}
        hasHeader = true;
      } else if (line === '---' || line === '===') {
        lyricsStart = i + 1;
        hasHeader = true;
        break;
      }
    }

    const lyrics = hasHeader
      ? lines.slice(lyricsStart).join('\n').trim()
      : content.trim();

    return {
      id: 'song_' + Buffer.from(filename).toString('hex'),
      title: title || path.basename(filename, path.extname(filename)),
      artist: artist || '',
      settings: settings || undefined,
      lyrics: lyrics,
      filename: filename,
    };
  };

  const serializeSongTxt = (title, artist, lyrics, settings) => {
    let header = `Title: ${title.trim()}\nArtist: ${(artist || '').trim()}\n`;
    if (settings && typeof settings === 'object' && Object.keys(settings).length > 0) {
      header += `Settings: ${JSON.stringify(settings)}\n`;
    }
    return `${header}---\n${(lyrics || '').trim()}\n`;
  };

  // High-performance server-side in-memory cache for songs
  const songCache = new Map(); // filename -> { mtimeMs, data }

  const getCachedSongsList = () => {
    if (!fs.existsSync(songsDir)) {
      try {
        fs.mkdirSync(songsDir, { recursive: true });
      } catch (e) {}
    }
    const files = fs.readdirSync(songsDir).filter((f) => f.toLowerCase().endsWith('.txt'));
    const currentFiles = new Set(files);
    songCache.forEach((_, cachedFile) => {
      if (!currentFiles.has(cachedFile)) {
        songCache.delete(cachedFile);
      }
    });
    return files
      .map((file) => {
        const fullPath = path.join(songsDir, file);
        try {
          const stat = fs.statSync(fullPath);
          const cached = songCache.get(file);
          if (cached && cached.mtimeMs === stat.mtimeMs) {
            return cached.data;
          }
          const content = fs.readFileSync(fullPath, 'utf8');
          const parsed = parseSongTxt(content, file);
          const item = {
            ...parsed,
            updatedAt: stat.mtimeMs,
            createdAt: stat.birthtimeMs || stat.mtimeMs,
          };
          songCache.set(file, { mtimeMs: stat.mtimeMs, data: item });
          return item;
        } catch (err) {
          return null;
        }
      })
      .filter(Boolean);
  };

  // MIME types
  const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.mjs': 'application/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.xml': 'application/xml; charset=utf-8',
    '.txt': 'text/plain; charset=utf-8',
    '.woff2': 'font/woff2',
    '.woff': 'font/woff',
    '.ttf': 'font/ttf',
  };

  const server = http.createServer((req, res) => {
    // CORS headers for local LAN / OBS access
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const pathname = parsedUrl.pathname;

    // 1. /api/state
    if (pathname === '/api/state') {
      if (req.method === 'OPTIONS') {
        res.writeHead(204, {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': '*',
        });
        res.end();
        return;
      }

      if (req.method === 'GET') {
        if (req.socket) {
          try {
            req.socket.setNoDelay(true);
            req.socket.setKeepAlive(true, 1000);
          } catch (e) {}
        }
        res.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache, no-transform',
          Connection: 'keep-alive',
          'X-Accel-Buffering': 'no',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': '*',
        });
        if (typeof res.flushHeaders === 'function') {
          res.flushHeaders();
        }
        sseClients.push(res);
        if (currentLiveState) {
          res.write(`data: ${JSON.stringify(currentLiveState)}\n\n`);
        }
        req.on('close', () => {
          sseClients = sseClients.filter((c) => c !== res);
        });
        return;
      }

      if (req.method === 'POST') {
        let body = '';
        req.on('data', (chunk) => {
          body += chunk.toString();
        });
        req.on('end', () => {
          try {
            currentLiveState = JSON.parse(body);
            const packet = `data: ${JSON.stringify(currentLiveState)}\n\n`;
            for (let i = 0; i < sseClients.length; i++) {
              const client = sseClients[i];
              try {
                if (client.socket && !client.socket.destroyed && client.socket.setNoDelay) {
                  client.socket.setNoDelay(true);
                }
                client.write(packet);
                if (typeof client.flush === 'function') client.flush();
              } catch (e) {}
            }
            res.writeHead(200, {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            });
            res.end(JSON.stringify({ success: true }));
          } catch (e) {
            res.writeHead(400, {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            });
            res.end(JSON.stringify({ error: 'Invalid JSON' }));
          }
        });
        return;
      }
    }

    // 2. /api/upload
    if (pathname === '/api/upload' && req.method === 'POST') {
      const form = new IncomingForm({
        uploadDir: uploadsDir,
        keepExtensions: true,
        maxFileSize: 500 * 1024 * 1024,
      });

      form.parse(req, (err, fields, files) => {
        if (err) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err.message }));
          return;
        }

        const fileArray = Array.isArray(files.file) ? files.file : [files.file];
        const file = fileArray[0];

        if (file) {
          const fileName = path.basename(file.filepath);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ url: `/uploads/${fileName}` }));
        } else {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'No file uploaded' }));
        }
      });
      return;
    }

    // 2.5 /api/settings
    if (pathname === '/api/settings') {
      if (req.method === 'GET') {
        const current = readSuperSettings();
        res.writeHead(200, {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        });
        res.end(JSON.stringify({ success: true, settings: current }));
        return;
      }
      if (req.method === 'POST') {
        let body = '';
        req.on('data', (chunk) => { body += chunk.toString(); });
        req.on('end', () => {
          try {
            const parsed = JSON.parse(body);
            const saved = writeSuperSettings(parsed);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, settings: saved }));
          } catch (e) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: e.message }));
          }
        });
        return;
      }
    }

    // 3. /api/local-ip
    if (pathname === '/api/local-ip' && req.method === 'GET') {
      const interfaces = os.networkInterfaces();
      let localIp = '127.0.0.1';

      for (const devName in interfaces) {
        const iface = interfaces[devName];
        if (!iface) continue;
        for (let i = 0; i < iface.length; i++) {
          const alias = iface[i];
          if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
            localIp = alias.address;
            break;
          }
        }
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ip: localIp }));
      return;
    }

    // 4. /api/bibles/list
    if (pathname === '/api/bibles/list' && req.method === 'GET') {
      const fileSet = new Set();
      if (fs.existsSync(biblesDir)) {
        fs.readdirSync(biblesDir)
          .filter((f) => f.toLowerCase().endsWith('.xml'))
          .forEach((f) => fileSet.add(f));
      }
      if (fs.existsSync(fallbackBiblesDir) && fallbackBiblesDir !== biblesDir) {
        fs.readdirSync(fallbackBiblesDir)
          .filter((f) => f.toLowerCase().endsWith('.xml'))
          .forEach((f) => fileSet.add(f));
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(Array.from(fileSet)));
      return;
    }

    // 5. /api/bibles/file
    if (pathname === '/api/bibles/file' && req.method === 'GET') {
      const fileName = parsedUrl.searchParams.get('name');
      if (!fileName || !fileName.toLowerCase().endsWith('.xml')) {
        res.writeHead(400, { 'Content-Type': 'text/plain' });
        res.end('Invalid file name');
        return;
      }

      const filePath = path.resolve(biblesDir, fileName);
      const fallbackPath = path.resolve(fallbackBiblesDir, fileName);

      if (fs.existsSync(filePath)) {
        res.writeHead(200, { 'Content-Type': 'application/xml; charset=utf-8' });
        fs.createReadStream(filePath).pipe(res);
      } else if (fs.existsSync(fallbackPath)) {
        res.writeHead(200, { 'Content-Type': 'application/xml; charset=utf-8' });
        fs.createReadStream(fallbackPath).pipe(res);
      } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('File not found');
      }
      return;
    }

    // 5a. /api/bibles/save - Saves uploaded Bible XML to BIBLE/ directory
    if (pathname === '/api/bibles/save' && req.method === 'POST') {
      let body = '';
      req.on('data', (chunk) => {
        body += chunk.toString();
      });
      req.on('end', () => {
        try {
          const { filename, content } = JSON.parse(body);
          if (!filename || !content) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Filename and content are required' }));
            return;
          }
          let safeName = path.basename(filename);
          if (!safeName.toLowerCase().endsWith('.xml')) {
            safeName += '.xml';
          }
          safeName = safeName.replace(/[<>:"/\\|?*]/g, '_');
          if (!fs.existsSync(biblesDir)) {
            fs.mkdirSync(biblesDir, { recursive: true });
          }
          const targetPath = path.join(biblesDir, safeName);
          fs.writeFileSync(targetPath, content, 'utf8');
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, filename: safeName }));
        } catch (e) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: e.message }));
        }
      });
      return;
    }

    // 5b. /api/bibles/delete - Deletes a Bible XML from BIBLE/ directory
    if (pathname === '/api/bibles/delete' && req.method === 'POST') {
      let body = '';
      req.on('data', (chunk) => {
        body += chunk.toString();
      });
      req.on('end', () => {
        try {
          const { filename } = JSON.parse(body);
          if (filename) {
            const safeName = path.basename(filename);
            const targetPath = path.join(biblesDir, safeName);
            if (fs.existsSync(targetPath)) {
              fs.unlinkSync(targetPath);
            }
          }
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true }));
        } catch (e) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: e.message }));
        }
      });
      return;
    }

    // 6. /api/songs/list - High performance cached songs list
    if (pathname === '/api/songs/list' && req.method === 'GET') {
      try {
        const songs = getCachedSongsList();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(songs));
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
      return;
    }

    // 7. /api/songs/save
    if (pathname === '/api/songs/save' && req.method === 'POST') {
      let body = '';
      req.on('data', (chunk) => {
        body += chunk.toString();
      });
      req.on('end', () => {
        try {
          const { title, artist, lyrics, settings, originalFilename } = JSON.parse(body);
          if (!title || !title.trim()) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Title is required' }));
            return;
          }
          const safeTitle = title.trim().replace(/[<>:"/\\|?*]/g, '_');
          const filename = `${safeTitle}.txt`;
          const filePath = path.join(songsDir, filename);

          if (originalFilename && originalFilename !== filename) {
            const oldPath = path.join(songsDir, originalFilename);
            if (fs.existsSync(oldPath)) {
              fs.unlinkSync(oldPath);
            }
            songCache.delete(originalFilename);
          }

          const content = serializeSongTxt(title, artist, lyrics, settings);
          fs.writeFileSync(filePath, content, 'utf8');
          songCache.delete(filename);

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(
            JSON.stringify({
              success: true,
              filename,
              id: 'song_' + Buffer.from(filename).toString('hex'),
            }),
          );
        } catch (e) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: e.message }));
        }
      });
      return;
    }

    // 8. /api/songs/delete-all
    if (pathname === '/api/songs/delete-all' && req.method === 'POST') {
      try {
        if (fs.existsSync(songsDir)) {
          const files = fs.readdirSync(songsDir).filter((f) => f.toLowerCase().endsWith('.txt'));
          files.forEach((f) => fs.unlinkSync(path.join(songsDir, f)));
        }
        songCache.clear();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
      return;
    }

    // 9. /api/songs/delete
    if (pathname === '/api/songs/delete' && req.method === 'POST') {
      let body = '';
      req.on('data', (chunk) => {
        body += chunk.toString();
      });
      req.on('end', () => {
        try {
          const { filename, title } = JSON.parse(body);
          const targetName =
            filename || (title ? `${title.trim().replace(/[<>:"/\\|?*]/g, '_')}.txt` : null);
          if (targetName) {
            const filePath = path.join(songsDir, targetName);
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
            }
            songCache.delete(targetName);
          }
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true }));
        } catch (e) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: e.message }));
        }
      });
      return;
    }

    // 10. Static files: /uploads/...
    if (pathname.startsWith('/uploads/')) {
      const fileName = path.basename(pathname);
      const candidates = [
        path.join(uploadsDir, fileName),
        path.join(baseDir, 'public', 'uploads', fileName),
        path.join(distDir, 'uploads', fileName),
      ];
      for (const filePath of candidates) {
        if (fs.existsSync(filePath)) {
          const ext = path.extname(filePath).toLowerCase();
          res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
          fs.createReadStream(filePath).pipe(res);
          return;
        }
      }
    }

    // 11. Static files: /backgrounds/...
    if (pathname.startsWith('/backgrounds/')) {
      const fileName = path.basename(pathname);
      const candidates = [
        path.join(backgroundsDir, fileName),
        path.join(storageRoot, 'public', 'backgrounds', fileName),
        path.join(distDir, 'backgrounds', fileName),
        resourcesDir ? path.join(resourcesDir, 'public', 'backgrounds', fileName) : null,
      ].filter(Boolean);
      for (const filePath of candidates) {
        if (fs.existsSync(filePath)) {
          const ext = path.extname(filePath).toLowerCase();
          res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
          fs.createReadStream(filePath).pipe(res);
          return;
        }
      }
    }

    // 12. Static files from dist/ (built app)
    if (distDir && fs.existsSync(distDir)) {
      let cleanPath = pathname;
      if (cleanPath === '/' || cleanPath === '') {
        cleanPath = '/index.html';
      }
      let relativePath = cleanPath.replace(/^\//, '');
      if (relativePath.includes('?')) {
        relativePath = relativePath.split('?')[0];
      }
      const safeRelativePath = path.normalize(relativePath).replace(/^(\.\.[\/\\])+/, '');
      const filePath = path.join(distDir, safeRelativePath);

      if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        const ext = path.extname(filePath).toLowerCase();
        try {
          const content = fs.readFileSync(filePath);
          res.writeHead(200, {
            'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
            'Content-Length': content.length,
            'Cache-Control': ext === '.html' ? 'no-cache, no-store, must-revalidate' : 'public, max-age=31536000',
          });
          res.end(content);
          return;
        } catch (readErr) {
          console.error(`[Server] Error reading ${filePath}:`, readErr);
        }
      }

      // SPA fallback to index.html for client-side routing (e.g. /output, /dashboard, /)
      const indexPath = path.join(distDir, 'index.html');
      if (fs.existsSync(indexPath)) {
        try {
          const htmlContent = fs.readFileSync(indexPath);
          res.writeHead(200, {
            'Content-Type': 'text/html; charset=utf-8',
            'Content-Length': htmlContent.length,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
          });
          res.end(htmlContent);
          return;
        } catch (readErr) {
          console.error(`[Server] Error reading index.html:`, readErr);
        }
      }
    }

    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found: ' + pathname);
  });

  return new Promise((resolve, reject) => {
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        // Try next port if busy
        server.listen(0, '0.0.0.0');
      } else {
        reject(err);
      }
    });

    server.listen(port, '0.0.0.0', () => {
      const actualPort = server.address().port;
      resolve({ server, port: actualPort });
    });
  });
}

module.exports = { startServer };
