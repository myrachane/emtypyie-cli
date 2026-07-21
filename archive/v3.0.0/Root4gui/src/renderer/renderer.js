'use strict';

const $ = (id) => document.getElementById(id);
const consoleEl = $('console');
const artEl = $('art');
const tabsEl = $('tabs');
const projectListEl = $('projectList');

let activeTab = null;
const liveTabs = new Set();

function log(text, cls) {
  const div = document.createElement('div');
  if (cls) div.className = cls;
  div.textContent = text;
  consoleEl.appendChild(div);
  consoleEl.scrollTop = consoleEl.scrollHeight;
}

function jsonLine(obj) {
  const cls = obj.ok ? 'ok' : 'err';
  const m = obj.msg ? ' — ' + obj.msg : '';
  log('[' + obj.cmd + '] ' + (obj.ok ? 'OK' : 'FAIL') + m, cls);
}

// ─── Toolbar buttons (1:1 to C CLI commands) ───
$('btnAbout').onclick = async () => {
  const r = await window.emt.exec('/about');
  jsonLine(r);
  renderBakingBread();
};
$('btnList').onclick = async () => {
  const r = await window.emt.exec('/list');
  jsonLine(r);
  await refreshProjects();
};
$('btnBf').onclick = async () => { jsonLine(await window.emt.exec('/bf')); };
$('btnTheme').onclick = async () => { jsonLine(await window.emt.exec('/theme', 'violet')); };
$('btnGet').onclick = async () => {
  const p = $('projInput').value.trim();
  if (!p) return log('Enter a project name first.', 'err');
  jsonLine(await window.emt.exec('/get', p));
  await refreshProjects();
};
$('btnInfo').onclick = async () => {
  const p = $('projInput').value.trim();
  if (!p) return log('Enter a project name first.', 'err');
  jsonLine(await window.emt.exec('/info', p));
};
$('btnFlash').onclick = async () => {
  const p = $('projInput').value.trim();
  if (!p) return log('Enter a project name first.', 'err');
  jsonLine(await window.emt.exec('/flash', p));
};
$('btnRm').onclick = async () => {
  const p = $('projInput').value.trim();
  if (!p) return log('Enter a project name first.', 'err');
  jsonLine(await window.emt.exec('/rm', p));
  await refreshProjects();
};
$('btnUpdate').onclick = async () => { jsonLine(await window.emt.exec('/update')); };
$('btnNewTab').onclick = () => openTab('tab-' + Date.now());

// ─── Project sidebar ───
async function refreshProjects() {
  const r = await window.emt.exec('/list', null, { raw: true });
  projectListEl.innerHTML = '';
  const known = ['qrkraft', 'wcrawler'];
  for (const name of known) {
    const li = document.createElement('li');
    li.textContent = name;
    li.onclick = () => { $('projInput').value = name; };
    projectListEl.appendChild(li);
  }
}

// ─── Live tabs (parallel C engines) ───
function openTab(tabId) {
  if (liveTabs.has(tabId)) return;
  liveTabs.add(tabId);
  activeTab = tabId;

  const tab = document.createElement('div');
  tab.className = 'tab active';
  tab.dataset.tab = tabId;
  tab.innerHTML = 'Engine ' + liveTabs.size + '<span class="x">x</span>';
  tab.querySelector('.x').onclick = (e) => { e.stopPropagation(); closeTab(tabId); };
  tab.onclick = () => activateTab(tabId);
  tabsEl.appendChild(tab);

  window.emt.openTab(tabId);
  log('Spawned C engine for ' + tabId, 'sys');
}

function activateTab(tabId) {
  activeTab = tabId;
  Array.from(tabsEl.children).forEach((c) => c.classList.toggle('active', c.dataset.tab === tabId));
}

function closeTab(tabId) {
  window.emt.closeTab(tabId);
  liveTabs.delete(tabId);
  const el = Array.from(tabsEl.children).find((c) => c.dataset.tab === tabId);
  if (el) el.remove();
  log('Closed engine ' + tabId, 'sys');
}

window.emt.onTabData(({ tabId, txt }) => { if (tabId === activeTab) log(txt, 'sys'); });
window.emt.onTabJson(({ tabId, obj }) => { if (tabId === activeTab) jsonLine(obj); });

// ─── Baking Bread animation (offloaded to a Web Worker) ───
// ASCII signature (theme-colored, shimmer loop — mirrors the C engine).
const BAKING_BREAD_ART = [
  '██████████████████████████████                        ',
  '                                      ████░░░░▒▒░░▒▒░░░░░░░░▒▒▒▒░░░░░░████                      ',
  '                                    ██░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░██                    ',
  '                                  ████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░▒▒██                  ',
  '                                ██        ████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░██                ',
  '                              ██              ▓▓░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░▒▒▓▓              ',
  '                            ▓▓░░              ░░▓▓░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░▒▒██            ',
  '                            ██                    ██░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░██            ',
  '                          ██                      ██░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░██          ',
  '                          ██                      ░░██░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░██          ',
  '                          ██                        ██░░░░░░░░░░░░░░▒▒░░░░░░░░░░░░░░▒▒▓▓        ',
  '                        ██                            ▓▓░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░██        ',
  '                        ██                            ▓▓░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░██      ',
  '                        ██                              ▓▓░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░██      ',
  '              ████████  ██░░                            ██░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░██    ',
  '            ██        ████░░░░░░                        ██▒▒░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░██    ',
  '          ██              ████░░░░                        ██░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░██    ',
  '        ▓▓░░              ░░░░▓▓░░░░░░                    ██░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░▒▒██  ',
  '      ██                        ████░░░░░░░░              ██░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░██  ',
  '    ██                              ██░░░░░░░░░░░░          ██░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░██  ',
  '    ██                                ████░░░░░░░░░░░░      ██░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░██  ',
  '  ▓▓░░                                ░░▒▒▓▓▓▓░░░░░░░░  ░░░░██░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░▒▒▓▓',
  '  ██                                        ░░████░░░░░░░░░░░░██░░░░░░░░░░░░░░░░░░░░░░░░░▒▒██',
  '██░░██                                        ░░░░██░░░░░░░░░░██▒▒░░░░░░░░░░░░░░░░░░▒▒▒▒██',
  '██░░░░██                                        ░░░░██░░░░░░░░██▒▒▒▒▒▒░░░░░░░░░░▒▒▒▒▒▒▒▒██',
  '██░░░░▒▒▓▓▓▓                                      ░░░░▓▓▓▓░░░░██▒▒▒▒▒▒▒▒▒▒▒▒░░░░░░░▒▒▒▒▒▒▒▒██',
  '  ██░░░░░░░░████                                  ████░░░░██░░██▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒██',
  '    ██░░░░░░░░░░██████                      ██████░░░░░░░░░░████▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒██',
  '  ██  ████░░░░░░░░░░▒▒██████            ████░░░░░░░░░░░░░░▒▒▒▒██▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒██',
  '  ████  ░░████░░░░░░░░░░░░░░████████████░░░░░░░░░░░░████▒▒▒▒▒▒▒▒██▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒██',
  '  ██▒▒██    ░░██████░░░░░░░░▒▒▒▒░░░░▒▒░░░░░░░░██████▒▒▒▒████▒▒▒▒██▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒██',
  '  ██░░░░████    ░░░░██████░░░░░░░░░░░░████████░░░░▒▒▒▒▒▒▒▒▒▒██▒▒▒▒██▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒██',
  '    ██░░░░▒▒▓▓▓▓██    ░░░░██████████▓▓░░████▒▒░░░░░░████▒▒▒▒██▒▒▒▒██▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒██  ',
  '      ██░░░░░░░░░░████████    ░░░░░░░░██░░░░░░░░████    ██▒▒▒▒██▒▒██▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒██  ',
  '      ░░▓▓▓▓░░░░░░▒▒▒▒▒▒▒▒▓▓██▒▒▓▓▓▓▓▓▒▒░░░░▓▓██        ▓▓▒▒▒▒██▒▒▒▒██▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▓▓██    ',
  '        ░░░░▓▓▓▓▓▓░░░░░░░░▒▒▒▒▒▒░░▒▒░░░░░░▓▓░░          ░░▓▓▓▓██▒▒▒▒██▒▒▒▒▒▒▒▒▒▒▒▒▓▓▓▓▓▓░░▓▓    ',
  '                  ██████▓▓░░░░░░░░░░▓▓████                      ████████▓▓████▓▓██              ',
  '                          ██████████                                                              ',
  '                          ░░░░  ░░                                                              '
];

const worker = new Worker('./workers/bakingbread.js');
worker.onmessage = (e) => {
  const { glow } = e.data;
  const r = Math.round(124 + glow * 68);
  const g = Math.round(58 + glow * 74);
  const b = 237;
  artEl.textContent = BAKING_BREAD_ART.join('\n');
  artEl.style.color = 'rgb(' + r + ',' + g + ',' + b + ')';
  artEl.style.textShadow = '0 0 ' + (6 + glow * 10) + 'px rgba(167,132,250,' + (0.2 + glow * 0.4) + ')';
};

function renderBakingBread() { worker.postMessage({ cmd: 'start' }); }

renderBakingBread();
refreshProjects();
