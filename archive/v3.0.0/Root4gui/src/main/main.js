'use strict';

const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const https = require('https');
const { Engine, readEnvJson, writeEnvJson, envJsonPath, envDir } = require('../engine/engine');

// Handle Squirrel install/uninstall events on Windows (no-op if not present).
try {
  if (require('electron-squirrel-startup')) app.quit();
} catch (_) {}

let mainWindow = null;
const tabs = new Map(); // tabId -> Engine

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 760,
    minWidth: 860,
    minHeight: 600,
    backgroundColor: '#0c0712',
    title: 'Emtypyie — Baking Bread',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));
  mainWindow.on('closed', () => { mainWindow = null; });
}

app.whenReady().then(() => {
  createWindow();

  // ─── IPC bridge: buttons 1:1 to C CLI commands ───

  // One-shot structured command (no live tab process needed).
  ipcMain.handle('engine:exec', async (_e, { cmd, arg, opts }) => {
    const eng = new Engine({ label: 'exec' });
    return eng.exec(cmd, arg, opts || {});
  });

  // Open a persistent project tab -> spawn a dedicated C engine.
  ipcMain.handle('tab:open', async (_e, { tabId, project }) => {
    if (tabs.has(tabId)) return { ok: true, msg: 'already open' };
    const eng = new Engine({
      label: tabId,
      project,
      onData: (txt) => mainWindow && mainWindow.webContents.send('tab:data', { tabId, txt }),
      onJson: (obj) => mainWindow && mainWindow.webContents.send('tab:json', { tabId, obj }),
      onExit: () => mainWindow && mainWindow.webContents.send('tab:exit', { tabId })
    }).start();
    tabs.set(tabId, eng);
    return { ok: true, tabId };
  });

  // Send a command into a live tab's engine.
  ipcMain.on('tab:send', (_e, { tabId, cmd, arg }) => {
    const eng = tabs.get(tabId);
    if (eng) eng.run(cmd, arg);
  });

  // Close a tab's engine.
  ipcMain.on('tab:close', (_e, { tabId }) => {
    const eng = tabs.get(tabId);
    if (eng) { eng.stop(); tabs.delete(tabId); }
  });

  // ─── Environment: ~/.emtypyie/env.json ───
  ipcMain.handle('env:get', async () => readEnvJson());
  ipcMain.handle('env:set', async (_e, obj) => {
    const ok = writeEnvJson(obj || {});
    return { ok };
  });

  // ─── Update flow: Node-side GitHub check + native zip apply ───
  const GUI_VERSION = '3.0.0';
  const REPO = 'myrachane/Emtypyie.cli';

  function httpsJson(url) {
    return new Promise((resolve, reject) => {
      const req = https.get(url, {
        headers: { 'User-Agent': 'Emtypyie-GUI', 'Accept': 'application/vnd.github+json' }
      }, (res) => {
        let data = '';
        res.on('data', (d) => (data += d));
        res.on('end', () => {
          try { resolve(JSON.parse(data)); }
          catch (e) { reject(e); }
        });
      });
      req.on('error', reject);
    });
  }

  function compareVersions(a, b) {
    const pa = a.replace(/^v/, '').split('.').map(Number);
    const pb = b.replace(/^v/, '').split('.').map(Number);
    for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
      const x = pa[i] || 0, y = pb[i] || 0;
      if (x !== y) return x - y;
    }
    return 0;
  }

  ipcMain.handle('update:check', async () => {
    try {
      const rel = await httpsJson(`https://api.github.com/repos/${REPO}/releases/latest`);
      const tag = rel.tag_name || '';
      const isNewer = compareVersions(tag, GUI_VERSION) > 0;
      const asset = (rel.assets || []).find(a => /emtypyie-cli-native-windows-x64/i.test(a.name || ''));
      return {
        updateAvailable: isNewer,
        name: isNewer ? tag : GUI_VERSION,
        notes: rel.body || '',
        url: asset ? asset.browser_download_url : null
      };
    } catch (e) {
      return { updateAvailable: false, name: GUI_VERSION, notes: '', url: null, error: e.message };
    }
  });

  ipcMain.handle('update:apply', async (_e, { url }) => {
    return new Promise((resolve) => {
      if (!url) { resolve({ ok: false, msg: 'no asset url' }); return; }
      const tmp = path.join(envDir(), 'update.zip');
      let received = 0;
      const req = https.get(url, { headers: { 'User-Agent': 'Emtypyie-GUI' } }, (res) => {
        const total = parseInt(res.headers['content-length'] || '0', 10);
        const file = fs.createWriteStream(tmp);
        res.on('data', (chunk) => {
          received += chunk.length;
          if (total) mainWindow && mainWindow.webContents.send('update:progress', (received / total) * 100);
        });
        res.on('end', () => {
          file.end(() => {
            try {
              const AdmZip = require('adm-zip');
              const zip = new AdmZip(tmp);
              const entries = zip.getEntries();
              const target = enginePath();
              let wrote = false;
              for (const e of entries) {
                if (/emtypyie\.exe$/i.test(e.entryName)) {
                  zip.extractEntryTo(e, path.dirname(target), false, true);
                  wrote = true;
                  break;
                }
              }
              fs.unlinkSync(tmp);
              if (mainWindow) mainWindow.webContents.send('update:progress', 100);
              mainWindow && mainWindow.webContents.send('update:done');
              resolve({ ok: wrote });
            } catch (err) {
              resolve({ ok: false, msg: err.message });
            }
          });
        });
      });
      req.on('error', (e) => resolve({ ok: false, msg: e.message }));
    });
  });

  // Auto-check for updates shortly after launch.
  setTimeout(() => {
    mainWindow && mainWindow.webContents.send('update:autocheck');
  }, 2500);

  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on('window-all-closed', () => {
  for (const eng of tabs.values()) eng.stop();
  tabs.clear();
  if (process.platform !== 'darwin') app.quit();
});
