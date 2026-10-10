import { defineConfig, ViteDevServer } from 'vite'
import react from '@vitejs/plugin-react'
import { qrcode } from 'vite-plugin-qrcode'
import fs from 'fs'
import path from 'path'
import os from 'os'
import { IncomingForm } from 'formidable'

let sseClients: any[] = [];
let currentLiveState: any = null;


const pingInterval = setInterval(() => {
  sseClients.forEach(client => {
    client.write('event: ping\ndata: {}\n\n');
    if (client.flush) {
      client.flush();
    }
  });
}, 5000);
pingInterval.unref();

function localMediaServer() {
  return {
    name: 'local-media-server',
    configureServer(server: ViteDevServer) {
      server.ws.on('web-projector:update', (data) => {
        currentLiveState = data;
        server.ws.send('web-projector:state', currentLiveState);
        
        sseClients.forEach(client => {
          client.write(`data: ${JSON.stringify(currentLiveState)}\n\n`);
          if (client.flush) client.flush();
        });
      });

      server.ws.on('web-projector:request-state', () => {
        if (currentLiveState) {
          server.ws.send('web-projector:state', currentLiveState);
        }
      });

      server.middlewares.use('/api/state', (req, res, next) => {
        if (req.method === 'GET') {
          res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, no-transform',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no',
            'Access-Control-Allow-Origin': '*'
          });
          if (res.flushHeaders) {
            res.flushHeaders();
          }
          
          sseClients.push(res);
          
          if (currentLiveState) {
            res.write(`data: ${JSON.stringify(currentLiveState)}\n\n`);
          }
          
          req.on('close', () => {
            sseClients = sseClients.filter(c => c !== res);
          });
          return;
        }
        
        if (req.method === 'POST') {
          let body = '';
          req.on('data', chunk => {
            body += chunk.toString();
          });
          req.on('end', () => {
            try {
              currentLiveState = JSON.parse(body);
              sseClients.forEach(client => {
                client.write(`data: ${JSON.stringify(currentLiveState)}\n\n`);
                if ((client as any).flush) {
                  (client as any).flush();
                }
              });
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true }));
            } catch (e) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'Invalid JSON' }));
            }
          });
          return;
        }
        next();
      });

      server.middlewares.use('/api/upload', (req, res, next) => {
        if (req.method === 'POST') {
          const uploadDir = path.resolve(process.cwd(), 'public/uploads');
          const form = new IncomingForm({
            uploadDir,
            keepExtensions: true,
            maxFileSize: 500 * 1024 * 1024,
          });

          if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
          }

          form.parse(req, (err, fields, files) => {
            if (err) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: err.message }));
              return;
            }
            
            const fileArray = Array.isArray(files.file) ? files.file : [files.file];
            const file = fileArray[0];
            
            if (file) {
              const fileName = path.basename(file.filepath);
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ url: `/uploads/${fileName}` }));
            } else {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'No file uploaded' }));
            }
          });
        }
      });

      server.middlewares.use('/api/local-ip', (req, res) => {
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
        
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ ip: localIp }));
      });

      server.middlewares.use('/api/bibles/list', (req, res) => {
        if (req.method === 'GET') {
          const bibleDir = path.resolve(process.cwd(), 'BIBLE');
          if (fs.existsSync(bibleDir)) {
            const files = fs.readdirSync(bibleDir).filter(f => f.toLowerCase().endsWith('.xml'));
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(files));
          } else {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify([]));
          }
        }
      });

      server.middlewares.use('/api/bibles/file', (req, res) => {
        if (req.method === 'GET') {
          const urlParts = req.url?.split('?');
          if (!urlParts || urlParts.length < 2) {
            res.statusCode = 400;
            res.end('Missing query parameter ?name=');
            return;
          }
          const queryParams = new URLSearchParams(urlParts[1]);
          const fileName = queryParams.get('name');
          
          if (!fileName || !fileName.toLowerCase().endsWith('.xml')) {
            res.statusCode = 400;
            res.end('Invalid file name');
            return;
          }
          
          const filePath = path.resolve(process.cwd(), 'BIBLE', fileName);
          if (fs.existsSync(filePath)) {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/xml; charset=utf-8');
            const stream = fs.createReadStream(filePath);
            stream.pipe(res);
          } else {
            res.statusCode = 404;
            res.end('File not found');
          }
        }
      });

      // Save Bible XML to BIBLE/ directory
      server.middlewares.use('/api/bibles/save', (req, res, next) => {
        if (req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk.toString(); });
          req.on('end', () => {
            try {
              const { filename, content } = JSON.parse(body);
              if (!filename || !content) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: 'Filename and content are required' }));
                return;
              }
              const bibleDir = path.resolve(process.cwd(), 'BIBLE');
              if (!fs.existsSync(bibleDir)) {
                fs.mkdirSync(bibleDir, { recursive: true });
              }
              let safeName = path.basename(filename);
              if (!safeName.toLowerCase().endsWith('.xml')) {
                safeName += '.xml';
              }
              safeName = safeName.replace(/[<>:"/\\|?*]/g, '_');
              const targetPath = path.join(bibleDir, safeName);
              fs.writeFileSync(targetPath, content, 'utf8');

              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, filename: safeName }));
            } catch (e: any) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: e.message }));
            }
          });
          return;
        }
        next();
      });

      // Delete Bible XML from BIBLE/ directory
      server.middlewares.use('/api/bibles/delete', (req, res, next) => {
        if (req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk.toString(); });
          req.on('end', () => {
            try {
              const { filename } = JSON.parse(body);
              if (filename) {
                const bibleDir = path.resolve(process.cwd(), 'BIBLE');
                const safeName = path.basename(filename);
                const targetPath = path.join(bibleDir, safeName);
                if (fs.existsSync(targetPath)) {
                  fs.unlinkSync(targetPath);
                }
              }
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true }));
            } catch (e: any) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: e.message }));
            }
          });
          return;
        }
        next();
      });

      // Local Songs Directory Endpoints & Cache
      const songsDir = path.resolve(process.cwd(), 'songs');
      if (!fs.existsSync(songsDir)) {
        fs.mkdirSync(songsDir, { recursive: true });
      }

      const songCache = new Map<string, { mtimeMs: number; data: any }>();

      const parseSongTxt = (content: string, filename: string) => {
        const lines = content.split(/\r?\n/);
        let title = path.basename(filename, path.extname(filename));
        let artist = '';
        let lyricsStart = 0;
        let hasHeader = false;

        for (let i = 0; i < Math.min(lines.length, 12); i++) {
          const line = lines[i].trim();
          if (line.toLowerCase().startsWith('title:')) {
            title = line.substring(6).trim();
            hasHeader = true;
          } else if (line.toLowerCase().startsWith('artist:')) {
            artist = line.substring(7).trim();
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
          lyrics: lyrics,
          filename: filename
        };
      };

      const serializeSongTxt = (title: string, artist: string, lyrics: string) => {
        return `Title: ${title.trim()}\nArtist: ${(artist || '').trim()}\n---\n${(lyrics || '').trim()}\n`;
      };

      const getCachedSongsList = () => {
        if (!fs.existsSync(songsDir)) {
          fs.mkdirSync(songsDir, { recursive: true });
        }
        const files = fs.readdirSync(songsDir).filter(f => f.toLowerCase().endsWith('.txt'));
        const currentFiles = new Set(files);
        songCache.forEach((_, cachedFile) => {
          if (!currentFiles.has(cachedFile)) {
            songCache.delete(cachedFile);
          }
        });
        return files.map(file => {
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
              createdAt: stat.birthtimeMs || stat.mtimeMs
            };
            songCache.set(file, { mtimeMs: stat.mtimeMs, data: item });
            return item;
          } catch (e) {
            return null;
          }
        }).filter(Boolean);
      };

      server.middlewares.use('/api/songs/list', (req, res) => {
        if (req.method === 'GET') {
          try {
            const songs = getCachedSongsList();
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(songs));
          } catch (e: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: e.message }));
          }
        }
      });

      server.middlewares.use('/api/songs/save', (req, res, next) => {
        if (req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk.toString(); });
          req.on('end', () => {
            try {
              const { title, artist, lyrics, originalFilename } = JSON.parse(body);
              if (!title || !title.trim()) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: 'Title is required' }));
                return;
              }
              const safeTitle = title.trim().replace(/[<>:"/\\|?*]/g, '_');
              const filename = `${safeTitle}.txt`;
              const filePath = path.join(songsDir, filename);

              // If filename changed and originalFilename was provided, remove old file
              if (originalFilename && originalFilename !== filename) {
                const oldPath = path.join(songsDir, originalFilename);
                if (fs.existsSync(oldPath)) {
                  fs.unlinkSync(oldPath);
                }
                songCache.delete(originalFilename);
              }

              const content = serializeSongTxt(title, artist, lyrics);
              fs.writeFileSync(filePath, content, 'utf8');
              songCache.delete(filename);

              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({
                success: true,
                filename,
                id: 'song_' + Buffer.from(filename).toString('hex')
              }));
            } catch (e: any) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: e.message }));
            }
          });
          return;
        }
        next();
      });

      server.middlewares.use('/api/songs/delete-all', (req, res, next) => {
        if (req.method === 'POST') {
          try {
            if (fs.existsSync(songsDir)) {
              const files = fs.readdirSync(songsDir).filter(f => f.toLowerCase().endsWith('.txt'));
              files.forEach(f => {
                fs.unlinkSync(path.join(songsDir, f));
              });
            }
            songCache.clear();
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true }));
          } catch (e: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: e.message }));
          }
          return;
        }
        next();
      });

      server.middlewares.use('/api/songs/delete', (req, res, next) => {
        if (req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk.toString(); });
          req.on('end', () => {
            try {
              const { filename, title } = JSON.parse(body);
              const targetName = filename || (title ? `${title.trim().replace(/[<>:"/\\|?*]/g, '_')}.txt` : null);
              if (targetName) {
                const filePath = path.join(songsDir, targetName);
                if (fs.existsSync(filePath)) {
                  fs.unlinkSync(filePath);
                }
                songCache.delete(targetName);
              }
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true }));
            } catch (e: any) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: e.message }));
            }
          });
          return;
        }
        next();
      });
    },
  }
}

// https://vite.dev/config/
const interfaces = os.networkInterfaces();
let localIp = 'localhost';
for (const devName in interfaces) {
  const iface = interfaces[devName];
  if (!iface) continue;
  for (let i = 0; i < iface.length; i++) {
    const alias = iface[i];
    if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
      // Prioritize Wi-Fi or Ethernet over VirtualBox/VMware adapters if possible, but this is simple enough
      if (!devName.toLowerCase().includes('vEthernet') && !devName.toLowerCase().includes('vmware') && !devName.toLowerCase().includes('virtual')) {
        localIp = alias.address;
      }
    }
  }
}

export default defineConfig({
  plugins: [react(), localMediaServer(), qrcode()],
  server: {
    host: true, 
    open: `http://${localIp}:3000`,
    port: 3000,
    strictPort: true
  }
})
