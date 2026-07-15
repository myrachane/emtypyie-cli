#!/usr/bin/env node

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const chalk = require('chalk');
const retro = chalk.hex('#e2e8f0');
const retroDim = chalk.hex('#64748b');

const PORT = 3000;
const HOST = '127.0.0.1';

const MIME = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml'
};

function serveFile(res, filePath) {
  const ext = path.extname(filePath);
  const contentType = MIME[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
}

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const protocol = url.startsWith('https') ? https : http;

    protocol.get(url, (response) => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        file.close();
        fs.unlinkSync(dest);
        return downloadFile(response.headers.location, dest).then(resolve).catch(reject);
      }
      if (response.statusCode !== 200) {
        file.close();
        fs.unlinkSync(dest);
        reject(new Error(`HTTP ${response.statusCode}`));
        return;
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve(dest);
      });
    }).on('error', (err) => {
      file.close();
      if (fs.existsSync(dest)) fs.unlinkSync(dest);
      reject(err);
    });
  });
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'POST' && req.url === '/api/download') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const { project, url } = JSON.parse(body);
        const dest = path.join(process.cwd(), `${project}-setup.exe`);

        await downloadFile(url, dest);

        res.writeHead(200);
        res.end('OK');
      } catch (e) {
        res.writeHead(500);
        res.end(e.message);
      }
    });
    return;
  }

  let filePath = req.url === '/' ? '/index.html' : req.url;
  serveFile(res, path.join(__dirname, filePath));
});

server.listen(PORT, HOST, () => {
  const url = `http://${HOST}:${PORT}`;
  console.log(retro('  ─────────────────────────────'));
  console.log(retro('  EMTYPYIE GUI'));
  console.log(retroDim(`  ${url}`));
  console.log(retro('  ─────────────────────────────'));

  try {
    execSync(`start ${url}`, { stdio: 'ignore' });
  } catch (_) {}

  console.log(retroDim('  Press Ctrl+C to stop'));
});
