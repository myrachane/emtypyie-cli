'use strict';

const path = require('path');
const { spawn } = require('child_process');
const { app } = require('electron');

/**
 * Engine process wrapper.
 *
 * Each GUI project tab owns one C engine process (child_process.spawn).
 * The C engine is the single runtime engine — the GUI shells it. Tabs run
 * their engines in parallel; heavy compute (downloads, builds) is offloaded
 * to these child processes so the UI thread never blocks.
 */

function enginePath() {
  // In dev, the exe lives in resources/. In a packaged build it's an extraResource.
  if (app && app.isPackaged) {
    return path.join(process.resourcesPath, 'emtypyie.exe');
  }
  return path.join(__dirname, '..', '..', 'resources', 'emtypyie.exe');
}

function envDir() {
  const os = require('os');
  return path.join(os.homedir(), '.emtypyie');
}

function envJsonPath() {
  return path.join(envDir(), 'env.json');
}

class Engine {
  constructor(opts = {}) {
    this.label = opts.label || 'engine';
    this.project = opts.project || null;
    this.proc = null;
    this.onData = opts.onData || (() => {});
    this.onJson = opts.onJson || (() => {});
    this.onExit = opts.onExit || (() => {});
    this.buffer = '';
  }

  start() {
    const args = ['/shell'];
    if (this.project) args.push('--project', this.project);
    this.proc = spawn(enginePath(), args, {
      windowsHide: true,
      env: { ...process.env, EMTYPYIE_NO_ANIM: '1' }
    });

    this.proc.stdout.on('data', (chunk) => this._ingest(chunk.toString()));
    this.proc.stderr.on('data', (chunk) => this.onData(chunk.toString()));
    this.proc.on('exit', (code) => this.onExit(code));
    this.proc.on('error', (err) => this.onData('engine error: ' + err.message));
    return this;
  }

  _ingest(text) {
    this.buffer += text;
    let idx;
    // Split on newlines so we can detect complete JSON bridge lines.
    while ((idx = this.buffer.indexOf('\n')) !== -1) {
      const line = this.buffer.slice(0, idx);
      this.buffer = this.buffer.slice(idx + 1);
      this._handleLine(line);
    }
  }

  _handleLine(line) {
    const trimmed = line.trim();
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        this.onJson(JSON.parse(trimmed));
        return;
      } catch (_) { /* fall through to raw */ }
    }
    this.onData(line);
  }

  /**
   * Run a single CLI command against this engine's interactive shell.
   * The engine is launched in /shell mode; we write "<cmd> <arg>\n".
   */
  run(cmd, arg) {
    if (!this.proc) this.start();
    const line = arg ? `${cmd} ${arg}\n` : `${cmd}\n`;
    this.proc.stdin.write(line);
  }

  /** Run a one-shot command (non-interactive), returns a promise of JSON/raw. */
  exec(cmd, arg, opts = {}) {
    return new Promise((resolve) => {
      const args = [cmd];
      if (arg) args.push(arg);
      // Default to --json for a structured result; raw mode returns the C
      // engine's human output (banner art, project lists, system info).
      if (!opts.raw) args.push('--json');
      const p = spawn(enginePath(), args, {
        windowsHide: true,
        env: { ...process.env, EMTYPYIE_NO_ANIM: '1' }
      });
      let out = '';
      p.stdout.on('data', (d) => (out += d.toString()));
      p.on('close', () => {
        const trimmed = out.trim();
        if (opts.raw) return resolve(trimmed);
        try { resolve(JSON.parse(trimmed)); }
        catch (_) { resolve({ cmd, ok: true, msg: trimmed }); }
      });
      p.on('error', (e) => resolve({ cmd, ok: false, msg: e.message }));
    });
  }

  stop() {
    if (this.proc) {
      try { this.proc.stdin.end(); this.proc.kill(); } catch (_) {}
      this.proc = null;
    }
  }
}

module.exports = { Engine, enginePath, envDir, envJsonPath, readEnvJson, writeEnvJson };

const fs = require('fs');

function readEnvJson() {
  try {
    return JSON.parse(fs.readFileSync(envJsonPath(), 'utf8'));
  } catch (_) {
    return {};
  }
}

function writeEnvJson(obj) {
  try {
    if (!fs.existsSync(envDir())) fs.mkdirSync(envDir(), { recursive: true });
    fs.writeFileSync(envJsonPath(), JSON.stringify(obj, null, 2));
    return true;
  } catch (_) {
    return false;
  }
}
