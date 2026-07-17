const fs = require('fs');
const path = require('path');

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function getTerminalWidth() {
  if (process.stdout.columns && process.stdout.columns > 0) {
    return process.stdout.columns;
  }
  return 80;
}

function padLine(line, targetWidth) {
  const len = line.length;
  if (len >= targetWidth) {
    return line.slice(0, targetWidth);
  }
  return line + ' '.repeat(targetWidth - len);
}

function shouldSkipAnimation() {
  if (process.env.EMTYPYIE_NO_ANIM) return true;
  return false;
}

async function playStartupAnimation(options = {}) {
  const {
    totalMs = 2000,
    lineCount = 300,
    skip = false
  } = options;

  if (skip || shouldSkipAnimation()) return;

  const dataPath = path.join(__dirname, '..', '..', 'archive', 'v2.5.3', 'startup_animation.json');
  if (!fs.existsSync(dataPath)) {
    return;
  }

  let data;
  try {
    data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  } catch {
    return;
  }

  const lines = data.lines || [];
  if (lines.length === 0) return;

  const timing = data.timing || {};
  const actualTotalMs = timing.total_ms || totalMs;
  const actualLineCount = timing.line_count || lineCount;
  const intervalMs = timing.interval_ms ? Math.round(timing.interval_ms) : Math.round(actualTotalMs / actualLineCount);

  const termWidth = getTerminalWidth();
  const targetWidth = Math.floor(termWidth * 0.65);
  const clampedWidth = Math.max(40, Math.min(targetWidth, termWidth));

  for (let i = 0; i < actualLineCount; i++) {
    const line = lines[i % lines.length];
    const padded = padLine(line, clampedWidth);
    process.stdout.write(padded + '\n');
    await sleep(intervalMs);
  }
}

module.exports = { playStartupAnimation, shouldSkipAnimation };