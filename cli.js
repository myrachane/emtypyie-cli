#!/usr/bin/env node

const readline = require('readline');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const chalk = require('chalk');
const getCommand = require('./commands/get');
const bakafetch = require('./commands/bakafetch');

const t = require('./commands/theme');

const BANNER = `
  ______ __  __ _________     _________     _______ ______ 
 |  ____|  \\/  |__   __\\ \\   / /  __ \\ \\   / /_   _|  ____|
 | |__  | \\  / |  | |   \\ \\_/ /| |__) \\ \\_/ /  | | | |__   
 |  __| | |\\/| |  | |    \\   / |  ___/ \\   /   | | |  __|  
 | |____| |  | |  | |     | |  | |      | |   _| |_| |____ 
 |______|_|  |_|  |_|     |_|  |_|      |_|  |_____|______|
`;

const projects = {
  qrkraft: require('./projects/qrkraft')
};

function openBrowser(url) {
  try {
    execSync(`start ${url}`, { stdio: 'ignore' });
    return true;
  } catch {
    try {
      execSync(`explorer ${url}`, { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  }
}

async function handleCommand(cmd, arg, rl) {
  const normalized = cmd.replace(/^\//, '').toLowerCase();

  switch (normalized) {
    case 'help':
      showHelp();
      break;

    case 'about':
      showAbout();
      break;

    case 'wiki':
      console.log(t.retro('  Opening wiki.emtypyie.in...'));
      if (openBrowser('https://wiki.emtypyie.in')) {
        console.log(t.retroDim('  Browser opened.'));
      } else {
        console.log(t.retroErr('  Could not open browser. Visit https://wiki.emtypyie.in'));
      }
      break;

    case 'info':
      showProjectInfo(arg);
      break;

    case 'get':
      await doGet(arg);
      break;

    case 'flash':
      await doFlash(arg);
      break;

    case 'rm':
      doRemove(arg);
      break;

    case 'issue':
      await doIssue(arg);
      break;

    case 'bakafetch':
    case 'bf':
      bakafetch.show();
      break;

    case 'wrap':
      doWrap(arg);
      break;

    case 'clear':
      console.clear();
      break;

    case 'update':
      doUpdate();
      break;

    case 'list':
      doList();
      break;

    case 'docs':
      doDocs(arg);
      break;

    case 'changelog':
      doChangelog();
      break;

    case 'exit':
    case 'quit':
      console.log(t.retroDim('\n  System halted.'));
      if (rl) rl.close();
      process.exit(0);
      break;

    default:
      const proj = projects[normalized];
      if (proj) {
        runProject(normalized, proj);
      } else {
        console.log(t.retroErr(`  Unknown command "/${normalized}". Type /help for available commands.`));
      }
  }
}

function showHelp() {
  console.log();
  console.log(t.retroDim('  ─── Commands ───'));
  console.log();
  console.log(t.retro('  /get <project>') + t.retroDim('     install a project'));
  console.log(t.retro('  /flash <project>') + t.retroDim('   re-download latest version'));
  console.log(t.retro('  /info <project>') + t.retroDim('    show project details'));
  console.log(t.retro('  /rm <project>') + t.retroDim('      delete project files'));
  console.log(t.retro('  /issue <project>') + t.retroDim('   open issue tracker'));
  console.log(t.retro('  /issue <project> -m') + t.retroDim('  file a bug report'));
  console.log(t.retro('  /bakafetch') + t.retroDim('         system info with style'));
  console.log(t.retro('  /bf') + t.retroDim('               shortcut for /bakafetch'));
  console.log(t.retro('  /wrap bakafetch <c>') + t.retroDim('  change bakafetch color'));
  console.log(t.retro('  /wrap all <theme>') + t.retroDim('    change CLI theme'));
  console.log(t.retro('  /clear') + t.retroDim('              clear screen'));
  console.log(t.retro('  /update') + t.retroDim('            update emtypyie'));
  console.log(t.retro('  /list') + t.retroDim('              list projects'));
  console.log(t.retro('  /docs <project>') + t.retroDim('    open project docs'));
  console.log(t.retro('  /changelog') + t.retroDim('         what\'s new'));
  console.log(t.retro('  /about') + t.retroDim('             about emtypyie'));
  console.log(t.retro('  /wiki') + t.retroDim('              open wiki.emtypyie.in'));
  console.log(t.retro('  /help') + t.retroDim('             this screen'));
  console.log(t.retro('  /exit') + t.retroDim('             quit'));
  console.log();
  console.log(t.retroDim('  ─── Projects ───'));
  console.log();
  for (const [name, proj] of Object.entries(projects)) {
    const pad = ' '.repeat(Math.max(0, 12 - name.length));
    console.log(`  ${t.retroAccent(name)}${pad}${t.retroDim(proj.description || '')}`);
  }
  console.log();
}

function showAbout() {
  console.log();
  console.log(t.retroDim('  ─────────────────────────────'));
  console.log(t.retro('  emtypyie CLI'));
  console.log(t.retroDim('  ─────────────────────────────'));
  console.log();
  const pkg = require('./package.json');
  console.log(t.retroDim('  Version: ') + t.retro(pkg.version));
  console.log(t.retroDim('  Website: ') + t.retroAccent('https://emtypyie.in'));
  console.log(t.retroDim('  GitHub:  ') + t.retroAccent('https://github.com/myrachane'));
  console.log(t.retroDim('  Wiki:    ') + t.retroAccent('https://wiki.emtypyie.in'));
  console.log(t.retroDim('  Author:  ') + t.retro('myrachane'));
  console.log();
  console.log(t.retro('  "code. create. conquer."'));
  console.log();
}

function showProjectInfo(name) {
  if (!name) {
    console.log(t.retroErr('  Specify a project: /info <project>'));
    return;
  }
  const proj = projects[name.toLowerCase()];
  if (!proj) {
    console.log(t.retroErr(`  Unknown project "${name}".`));
    return;
  }
  console.log();
  console.log(t.retroDim('  ─── ') + t.retroAccent(proj.name || name) + t.retroDim(' ───'));
  console.log(t.retroDim('  Description: ') + t.retro(proj.description || 'N/A'));
  console.log(t.retroDim('  Version:     ') + t.retro(proj.version || 'latest'));
  console.log(t.retroDim('  Repo:        ') + t.retroAccent(proj.repo || 'N/A'));
  console.log(t.retroDim('  Download:    ') + t.retroDim(proj.download || 'N/A'));
  if (proj.info) {
    console.log();
    console.log(proj.info.trim().split('\n').map(l => `  ${l}`).join('\n'));
  }
  console.log();
}

async function doGet(name) {
  if (!name) {
    console.log(t.retroErr('  Specify a project: /get <project>'));
    return;
  }
  const proj = projects[name.toLowerCase()];
  if (!proj) {
    console.log(t.retroErr(`  Unknown project "${name}".`));
    return;
  }
  await getCommand.install(name.toLowerCase(), proj);
}

async function doFlash(name) {
  if (!name) {
    console.log(t.retroErr('  Specify a project: /flash <project>'));
    return;
  }
  const proj = projects[name.toLowerCase()];
  if (!proj) {
    console.log(t.retroErr(`  Unknown project "${name}".`));
    return;
  }
  console.log();
  console.log(t.retroWarn('  Re-downloading ') + t.retroAccent(proj.name || name) + t.retroWarn('...'));
  console.log();
  const dir = t.getDevDir(name.toLowerCase());
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
    console.log(t.retroDim('  Removed old files.'));
  }
  await getCommand.install(name.toLowerCase(), proj);
}

function doRemove(name) {
  if (!name) {
    console.log(t.retroErr('  Specify a project: /rm <project>'));
    return;
  }
  const proj = projects[name.toLowerCase()];
  if (!proj) {
    console.log(t.retroErr(`  Unknown project "${name}".`));
    return;
  }
  const dir = t.getDevDir(name.toLowerCase());
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
    console.log(t.retro('  Removed ') + t.retroDim(dir));
  } else {
    console.log(t.retroDim('  No local files found for ') + t.retroAccent(name));
  }
}

async function doIssue(arg) {
  let name, message;
  const msgMatch = arg.match(/^(\S+)\s+-m\s+"(.+?)"/);
  if (msgMatch) {
    name = msgMatch[1].toLowerCase();
    message = msgMatch[2];
  } else {
    name = arg.trim().toLowerCase();
    message = '';
  }

  if (!name) {
    console.log(t.retroErr('  Usage: /issue <project> -m "your message"'));
    return;
  }

  const proj = projects[name];
  if (!proj) {
    console.log(t.retroErr(`  Unknown project "${name}".`));
    return;
  }

  const repoPath = proj.repo || `myrachane/${name}`;
  let url;
  if (message) {
    url = `https://github.com/${repoPath}/issues/new?title=${encodeURIComponent(message)}`;
  } else {
    url = `https://github.com/${repoPath}/issues`;
  }

  console.log(t.retro(`  Opening issue tracker for ${t.retroAccent(proj.name || name)}...`));
  if (openBrowser(url)) {
    console.log(t.retroDim('  Browser opened.'));
  } else {
    console.log(t.retroDim(`  Visit: ${url}`));
  }
}

function runProject(name, proj) {
  if (proj.run) {
    const runPath = path.resolve(t.getDevDir(name), proj.run);
    console.log(t.retro(`  Launching ${t.retroAccent(proj.name || name)}...`));
    execSync(`start "" "${runPath}"`, { stdio: 'ignore' });
    return;
  }
  const dest = path.join(t.getDevDir(name), proj.filename || `${name}-setup.exe`);
  if (!fs.existsSync(dest)) {
    console.log(t.retroErr(`  Project "${proj.name || name}" not downloaded yet. Use /get ${name} first.`));
    return;
  }
  console.log(t.retro(`  Running ${t.retroAccent(proj.name || name)} installer...`));
  execSync(`start "" "${dest}"`, { stdio: 'ignore' });
}

function doUpdate() {
  console.log(t.retro('  Updating emtypyie...'));
  try {
    execSync('npm update -g emtypyie-cli', { stdio: 'inherit' });
    console.log(t.retro('  Update complete!'));
  } catch {
    console.log(t.retroErr('  Update failed. Try: npm update -g emtypyie-cli'));
  }
}

function doList() {
  console.log();
  console.log(t.retroDim('  ─── Projects ───'));
  console.log();
  for (const [name, proj] of Object.entries(projects)) {
    const pad = ' '.repeat(Math.max(0, 12 - name.length));
    console.log(`  ${t.retroAccent(name)}${pad}${t.retroDim(proj.version || '?')}  ${t.retro(proj.description || '')}`);
  }
  console.log();
}

function doDocs(arg) {
  if (!arg) {
    console.log(t.retroErr('  Specify a project: /docs <project>'));
    return;
  }
  const proj = projects[arg.toLowerCase()];
  if (!proj) {
    console.log(t.retroErr(`  Unknown project "${arg}".`));
    return;
  }
  const repo = proj.repo || `myrachane/${arg}`;
  const url = `https://github.com/${repo}#readme`;
  console.log(t.retro(`  Opening docs for ${t.retroAccent(proj.name || arg)}...`));
  if (openBrowser(url)) {
    console.log(t.retroDim('  Browser opened.'));
  } else {
    console.log(t.retroDim(`  Visit: ${url}`));
  }
}

function doChangelog() {
  const url = 'https://github.com/myrachane/emtypyie-cli/releases';
  console.log(t.retro('  Opening changelog...'));
  if (openBrowser(url)) {
    console.log(t.retroDim('  Browser opened.'));
  } else {
    console.log(t.retroDim(`  Visit: ${url}`));
  }
}

function doWrap(arg) {
  const parts = arg.trim().split(/\s+/);
  if (parts.length < 2) {
    console.log(t.retroDim('  Usage: ') + t.retro('/wrap bakafetch <color>'));
    console.log(t.retroDim('  Usage: ') + t.retro('/wrap all <theme>'));
    console.log(t.retroDim('  Themes: ') + t.retro(Object.keys(t.THEMES).join(', ')));
    console.log(t.retroDim('  Bakafetch colors: ') + t.retro(Object.keys(bakafetch.COLORS).join(', ')) + t.retroDim(' or hex'));
    return;
  }
  if (parts[0].toLowerCase() === 'all') {
    const theme = parts.slice(1).join(' ');
    if (t.THEMES[theme]) {
      t.apply(theme);
      bakafetch.setColor(theme);
      console.log(t.retro('  Theme set to ') + t.retroAccent(theme));
    } else {
      console.log(t.retroErr('  Invalid theme. Use: ') + t.retro(Object.keys(t.THEMES).join(', ')));
    }
    return;
  }
  if (parts[0].toLowerCase() !== 'bakafetch') {
    console.log(t.retroDim('  Usage: ') + t.retro('/wrap bakafetch <color>'));
    console.log(t.retroDim('  Usage: ') + t.retro('/wrap all <theme>'));
    return;
  }
  const color = parts.slice(1).join(' ');
  if (bakafetch.setColor(color)) {
    console.log(t.retro('  Bakafetch color set to ') + chalk.hex(bakafetch.getColor())(color));
  } else {
    console.log(t.retroErr('  Invalid color. Use: ') + t.retro(Object.keys(bakafetch.COLORS).join(', ')) + t.retroErr(' or hex like #ff8800'));
  }
}

const COMMANDS = ['help', 'about', 'wiki', 'info', 'get', 'flash', 'rm', 'issue', 'bakafetch', 'bf', 'wrap', 'clear', 'update', 'list', 'docs', 'changelog', 'exit', 'quit'];

function completer(line) {
  const input = line.replace(/^\//, '');
  const parts = input.split(/\s+/);
  const hits = COMMANDS.filter(c => c.startsWith(parts[0])).map(c => '/' + c + ' ');
  return [hits.length ? hits : [], line];
}

function interactive() {
  process.title = 'emtypyie cli';
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: t.retro('>> '),
    completer
  });

  console.clear();
  console.log(BANNER);
  console.log(t.retroDim(`
  ─────────────────────────────────────────────
  `) + t.retro('"code. create. conquer."') + t.retroDim(`
  ─────────────────────────────────────────────

  Type `) + t.retroAccent('/help') + t.retroDim(` for available commands.
  ─────────────────────────────────────────────`));
  console.log();

  rl.prompt();

  rl.on('line', async (line) => {
    const input = line.trim();
    const parts = input.split(/\s+/);
    const cmd = parts[0]?.toLowerCase() || '';
    const arg = parts.slice(1).join(' ');

    if (!cmd) {
      rl.prompt();
      return;
    }

    await handleCommand(cmd, arg, rl);
    rl.prompt();
  });

  rl.on('close', () => {
    console.log(t.retroDim('\n  System halted.'));
    process.exit(0);
  });
}

async function direct(args) {
  process.title = 'emtypyie cli';
  const cmd = args[0]?.toLowerCase();
  const arg = args.slice(1).join(' ');

  if (!cmd || cmd === 'help' || cmd === '/help') {
    showHelp();
    return;
  }

  await handleCommand(cmd, arg, null);
}

const args = process.argv.slice(2);

if (args.length === 0) {
  interactive();
} else {
  direct(args);
}
