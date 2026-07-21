'use strict';

// Baking Bread shimmer worker.
// Mirrors the C engine `effects` module: frames are "baked" up front
// (here, precomputed glow indices), then blitted on a timer. Heavy work
// stays off the UI thread.

const FRAME_COUNT = 24;
const FPS = 18;
let running = false;
let timer = null;
let frame = 0;

self.onmessage = (e) => {
  const msg = e.data || {};
  if (msg.cmd === 'start') { start(); }
  else if (msg.cmd === 'stop') { stop(); }
};

function start() {
  if (running) return;
  running = true;
  frame = 0;
  timer = setInterval(tick, 1000 / FPS);
}

function stop() {
  running = false;
  if (timer) clearInterval(timer);
  timer = null;
}

function tick() {
  // Bake the glow for this frame (sin-based shimmer, 0..1).
  const glow = (Math.sin((frame / FRAME_COUNT) * Math.PI * 2) + 1) / 2;
  self.postMessage({ glow });
  frame = (frame + 1) % FRAME_COUNT;
}
