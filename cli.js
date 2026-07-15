#!/usr/bin/env node

const readline = require('readline');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const chalk = require('chalk');
const getCommand = require('./commands/get');
const bakafetch = require('./commands/bakafetch');

const retro = chalk.hex('#33ff33');
const retroDim = chalk.hex('#1a7a1a');
const retroAccent = chalk.hex('#66ff66');
const retroWarn = chalk.hex('#ffaa00');
const retroErr = chalk.hex('#ff3333');

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
      console.log(retro('  Opening wiki.emtypyie.in...'));
      if (openBrowser('https://wiki.emtypyie.in')) {
        console.log(retroDim('  Browser opened.'));
      } else {
        console.log(retroErr('  Could not open browser. Visit https://wiki.emtypyie.in'));
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

    case 'exit':
    case 'quit':
      console.log(retroDim('\n  System halted.'));
      if (rl) rl.close();
      process.exit(0);
      break;

    default:
      console.log(retroErr(`  Unknown command "/${normalized}". Type /help for available commands.`));
  }
}

function showHelp() {
  console.log();
  console.log(retroDim('  ─── Commands ───'));
  console.log();
  console.log(retro('  /get <project>') + retroDim('     install a project'));
  console.log(retro('  /flash <project>') + retroDim('   re-download latest version'));
  console.log(retro('  /info <project>') + retroDim('    show project details'));
  console.log(retro('  /rm <project>') + retroDim('      delete project files'));
  console.log(retro('  /issue <project>') + retroDim('   open issue tracker'));
  console.log(retro('  /issue <project> -m') + retroDim('  file a bug report'));
  console.log(retro('  /bakafetch') + retroDim('         system info with style'));
  console.log(retro('  /bf') + retroDim('               shortcut for /bakafetch'));
  console.log(retro('  /wrap bakafetch <c>') + retroDim('  change bakafetch color'));
  console.log(retro('  /about') + retroDim('             about emtypyie'));
  console.log(retro('  /wiki') + retroDim('              open wiki.emtypyie.in'));
  console.log(retro('  /help') + retroDim('             this screen'));
  console.log(retro('  /exit') + retroDim('             quit'));
  console.log();
  console.log(retroDim('  ─── Projects ───'));
  console.log();
  for (const [name, proj] of Object.entries(projects)) {
    const pad = ' '.repeat(Math.max(0, 12 - name.length));
    console.log(`  ${retroAccent(name)}${pad}${retroDim(proj.description || '')}`);
  }
  console.log();
}

function showAbout() {
  console.log();
  console.log(retroDim('  ─────────────────────────────'));
  console.log(retro('  EMTYPYIE — Project Manager'));
  console.log(retroDim('  ─────────────────────────────'));
  console.log();
  const pkg = require('./package.json');
  console.log(retroDim('  Version: ') + retro(pkg.version));
  console.log(retroDim('  Website: ') + retroAccent('https://emtypyie.in'));
  console.log(retroDim('  GitHub:  ') + retroAccent('https://github.com/myrachane'));
  console.log(retroDim('  Wiki:    ') + retroAccent('https://wiki.emtypyie.in'));
  console.log(retroDim('  Author:  ') + retro('myrachane'));
  console.log();
  console.log(retro('  "code. create. conquer."'));
  console.log();
}

function showProjectInfo(name) {
  if (!name) {
    console.log(retroErr('  Specify a project: /info <project>'));
    return;
  }
  const proj = projects[name.toLowerCase()];
  if (!proj) {
    console.log(retroErr(`  Unknown project "${name}".`));
    return;
  }
  console.log();
  console.log(retroDim('  ─── ') + retroAccent(proj.name || name) + retroDim(' ───'));
  console.log(retroDim('  Description: ') + retro(proj.description || 'N/A'));
  console.log(retroDim('  Version:     ') + retro(proj.version || 'latest'));
  console.log(retroDim('  Repo:        ') + retroAccent(proj.repo || 'N/A'));
  console.log(retroDim('  Download:    ') + retroDim(proj.download || 'N/A'));
  if (proj.info) {
    console.log();
    console.log(proj.info.trim().split('\n').map(l => `  ${l}`).join('\n'));
  }
  console.log();
}

async function doGet(name) {
  if (!name) {
    console.log(retroErr('  Specify a project: /get <project>'));
    return;
  }
  const proj = projects[name.toLowerCase()];
  if (!proj) {
    console.log(retroErr(`  Unknown project "${name}".`));
    return;
  }
  await getCommand.install(name.toLowerCase(), proj);
}

async function doFlash(name) {
  if (!name) {
    console.log(retroErr('  Specify a project: /flash <project>'));
    return;
  }
  const proj = projects[name.toLowerCase()];
  if (!proj) {
    console.log(retroErr(`  Unknown project "${name}".`));
    return;
  }
  console.log();
  console.log(retroWarn('  Re-downloading ') + retroAccent(proj.name || name) + retroWarn('...'));
  console.log();
  const dest = path.join(process.cwd(), proj.filename || `${name}-setup.exe`);
  if (fs.existsSync(dest)) {
    fs.unlinkSync(dest);
    console.log(retroDim('  Removed old file.'));
  }
  await getCommand.install(name.toLowerCase(), proj);
}

function doRemove(name) {
  if (!name) {
    console.log(retroErr('  Specify a project: /rm <project>'));
    return;
  }
  const proj = projects[name.toLowerCase()];
  if (!proj) {
    console.log(retroErr(`  Unknown project "${name}".`));
    return;
  }
  const dest = path.join(process.cwd(), proj.filename || `${name}-setup.exe`);
  if (fs.existsSync(dest)) {
    fs.unlinkSync(dest);
    console.log(retro('  Removed ') + retroDim(dest));
  } else {
    console.log(retroDim('  No local files found for ') + retroAccent(name));
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
    console.log(retroErr('  Usage: /issue <project> -m "your message"'));
    return;
  }

  const proj = projects[name];
  if (!proj) {
    console.log(retroErr(`  Unknown project "${name}".`));
    return;
  }

  const repoPath = proj.repo || `myrachane/${name}`;
  let url;
  if (message) {
    url = `https://github.com/${repoPath}/issues/new?title=${encodeURIComponent(message)}`;
  } else {
    url = `https://github.com/${repoPath}/issues`;
  }

  console.log(retro(`  Opening issue tracker for ${retroAccent(proj.name || name)}...`));
  if (openBrowser(url)) {
    console.log(retroDim('  Browser opened.'));
  } else {
    console.log(retroDim(`  Visit: ${url}`));
  }
}

function doWrap(arg) {
  const parts = arg.trim().split(/\s+/);
  if (parts.length < 2 || parts[0].toLowerCase() !== 'bakafetch') {
    console.log(retroDim('  Usage: ') + retro('/wrap bakafetch <color>'));
    console.log(retroDim('  Colors: ') + retro(Object.keys(bakafetch.COLORS).join(', ')) + retroDim(' or hex (e.g. #ff8800)'));
    return;
  }
  const color = parts.slice(1).join(' ');
  if (bakafetch.setColor(color)) {
    console.log(retro('  Bakafetch color set to ') + chalk.hex(bakafetch.getColor())(color));
  } else {
    console.log(retroErr('  Invalid color. Use: ') + retro(Object.keys(bakafetch.COLORS).join(', ')) + retroErr(' or hex like #ff8800'));
  }
}

function interactive() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: retro('>> ')
  });

  console.clear();
  console.log(BANNER);
  console.log(retroDim(`
  ─────────────────────────────────────────────
  `) + retro('"code. create. conquer."') + retroDim(`
  ─────────────────────────────────────────────

  Type `) + retroAccent('/help') + retroDim(` for available commands.
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
    console.log(retroDim('\n  System halted.'));
    process.exit(0);
  });
}

async function direct(args) {
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
