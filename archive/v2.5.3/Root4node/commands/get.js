const os = require('os');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const { execSync, spawn } = require('child_process');

const t = require('./theme');

/* ─── Project installer module (Node.js) ───
 * Downloads project ZIPs from cdn.emtypyie.in, extracts them,
 * and installs binaries to PATH via batch launcher.
 *
 * Future work:
 *  - Add progress bar during download.
 *  - Add checksum verification after download.
 *  - Support selective file extraction.
 *  - Rollback on failed installation.
 */

function downloadHttps(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const protocol = url.startsWith('https') ? https : http;

    protocol.get(url, (response) => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        file.close();
        fs.unlinkSync(dest);
        return downloadHttps(response.headers.location, dest).then(resolve).catch(reject);
      }

      if (response.statusCode !== 200) {
        file.close();
        fs.unlinkSync(dest);
        reject(new Error(`HTTP ${response.statusCode}`));
        return;
      }

      const total = parseInt(response.headers['content-length'], 10);
      let downloaded = 0;

      response.on('data', (chunk) => {
        downloaded += chunk.length;
        if (total) {
          const pct = ((downloaded / total) * 100).toFixed(1);
          process.stdout.write(`\r  ${t.retroDim('▼')} ${t.retro(pct + '%')}`);
        }
      });

      response.pipe(file);

      file.on('finish', () => {
        process.stdout.write('\r' + ' '.repeat(50) + '\r');
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

function downloadCurl(url, dest) {
  return new Promise((resolve, reject) => {
    const proc = spawn('curl', ['-L', '--progress-bar', '-o', dest, url], { stdio: 'inherit', timeout: 300000 });
    proc.on('close', (code) => {
      if (code === 0) {
        resolve(dest);
      } else {
        if (fs.existsSync(dest)) fs.unlinkSync(dest);
        reject(new Error(`curl exited with code ${code}`));
      }
    });
    proc.on('error', (err) => {
      if (fs.existsSync(dest)) fs.unlinkSync(dest);
      reject(err);
    });
  });
}

function isCurlAvailable() {
  try {
    execSync('curl --version', { stdio: 'ignore', timeout: 3000 });
    return true;
  } catch {
    return false;
  }
}

async function download(url, dest) {
  console.log(`  ${t.retroDim('▼')} ${t.retro('Downloading...')}`);
  if (isCurlAvailable()) {
    return downloadCurl(url, dest);
  }
  return downloadHttps(url, dest);
}

async function install(name, project) {
  console.log();
  console.log(t.retroDim('  ─────────────────────────────'));
  console.log(t.retro(`  Installing ${t.retroAccent(project.name || name)}`));
  console.log(t.retroDim('  ─────────────────────────────'));
  console.log();

  const version = project.version || 'latest';
  console.log(t.retroDim(`  Version: ${t.retro(version)}`));
  console.log(t.retroDim(`  Repo: ${t.retro(project.repo || 'N/A')}`));
  console.log();

  if (project.install) {
    await project.install(name, download);
    return;
  }

  if (project.download) {
    const dest = path.join(t.getDevDir(name), project.filename || `${name}-setup.exe`);

    try {
      await download(project.download, dest);
      const rel = dest.replace(os.homedir(), '~');
      console.log(`  ${t.retro('✓')} ${t.retroDim('Saved to')} ${t.retroAccent(rel)}`);

      if (project.postInstall) {
        project.postInstall(dest);
      }
    } catch (err) {
      console.log(`  ${chalk.red('✗')} Download failed: ${err.message}`);
      process.exit(1);
    }
  }

  if (project.info) {
    console.log();
    console.log(t.retroDim('  ─── Info ───'));
    console.log(project.info.trim().split('\n').map(l => `  ${l}`).join('\n'));
  }

  console.log();
  console.log(t.retro('  ✔ Done.'));
  console.log();
}

module.exports = { install, download };
