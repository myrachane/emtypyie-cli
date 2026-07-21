# TODO

## High Priority
- [ ] Push v2.5.0 to Chocolatey — troubleshoot 403 Forbidden on `push.chocolatey.org`
- [ ] Update `choco_api_key.txt` with working API key once resolved
- [ ] Commit remaining changes after Chocolatey push succeeds

## Medium Priority
- [ ] Update Winget PR if Chocolatey changes affect it
- [ ] Verify website download links point to correct GitHub Release assets
- [ ] Test `choco install emtypyie-cli` end-to-end after package is approved

## `/update` auto-restart (stacking with next release)
- [x] v2.5.8 (initial): C `/update` self-updates from latest GitHub native asset + re-execs; Node re-spawns fresh npm binary. No downgrade.
- [x] Persistence fix (rides next release, predates published v2.5.8): C `/update` now overwrites its OWN running exe path with the new binary, validates the download is a real `MZ` PE before trusting it, cleans the temp `_emtypyie_update` dir on success/failure, and re-execs its own (now-updated) path — so the update survives across launches (fixes the stale `.local\bin` PATH copy bug we hit). Local `.local\bin` + `dist/` refreshed; GitHub release v2.5.8 NOT republished.
- [ ] Checksum verify: fetch the release `.sha256` and compare (needs SHA-256 in C, or shell out to `certutil -hashfile`).

## v3.0.0 "Baking Bread" (major update — do NOT publish until fully done)
Decisions: Electron wraps the C engine (C is the single runtime engine); GUI tabs run
projects in parallel; do not publish to GitHub/npm until the final public 3.0.0 is complete.
- [x] **Phase 1 — C engine v3.0.0 DONE:** `archive/v3.0.0/Root4c` from v2.5.8, version bumped to v3.0.0 ("Baking Bread") everywhere. New `effects.c/.h` module: parallel frame-baking player (thread pool, ring buffer) + theme-colored "rice" art. `/about` renders the Baking Bread ASCII as a shimmer loop (or static frame under `EMTYPYIE_NO_ANIM`). Clean MSYS2 build (-lpthread). `/update` no-downgrade check works (v3.0.0 >= v2.5.8). README updated.
- [ ] **Phase 2 — Node CLI v3.0.0:** port effects + Baking Bread art to `Root4node/cli.js`; bump package.json to 3.0.0; keep `/update` auto-restart parity with C.
- [x] **Phase 3 — Electron GUI (`Root4gui`):** dark-only HTML + inline CSS (B/W pixel palette); tabs = parallel C engine processes (child_process.spawn per project); effects/animation in a Web Worker; IPC bridge maps buttons 1:1 to C CLI commands; build/pack with electron-forge. JSON-over-stdio protocol: added `--json` mode to the C engine (main.c) emitting `{"cmd","ok","msg"}` lines; GUI `src/engine/engine.js` spawns the exe and parses them. Baking Bread ASCII animates in `renderer.js` + `workers/bakingbread.js`. NOT yet packaged/published.
  - [x] **Console commands call the real C engine** via `window.emt.exec` (one-shot `--json` bridge, plus a `raw` mode that returns the C engine's human output). C `main.c` accepts commands with/without a leading `/`, emits valid quoted JSON, and suppresses human output in `--json` mode. Rebuilt + copied to `resources/emtypyie.exe`.
  - [x] **Display commands use raw mode + ANSI stripping:** `/about` (Baking Bread banner on GUI open), `/list` (real project list from CDN), `/bf`+`/bakafetch` (system info), `/get` `/info` `/flash` `/rm` `/theme` `/docs` all show the engine's real human output. Renderer strips ANSI escape codes so text renders cleanly in the DOM.
  - [x] **`/bf` fixed:** was wrongly wired to a JS brainfuck mock; now maps to the C engine `bakafetch` (system info). Added `/bakafetch` alias and `/docs`.
  - [x] **Startup banner + scroll fixes:** GUI opening banner and `/about` now show an `EMTYPYIE.CLI` block ASCII + the new Baking Bread loaf art (user-provided). C engine `main.c` `about` + `shell.c` `BANNER`/`about` updated to the same art and rebuilt (copied to `resources/emtypyie.exe`). Console scroll bug fixed: replaced `justify-content: flex-end` (which made overflow unscrollable) with a `::before` flex spacer + `min-height: 0` so the console scrolls normally.
  - [x] **Parallel tabs + fork + split view:** per-tab fork button spawns a parallel C engine (`Engine` `project` arg); `#splitBtn` toggles a two-pane split showing two live stage engines.
  - [x] **Settings sections:** Appearance (accent swatches + font S/M+/M/L = 16/19/18/21), Environment (`~/.emtypyie/env.json` CRUD via new `env:get`/`env:set` IPC), About (Baking Bread), Updates (auto-check on open + manual check), Developer ("Stay tuned").
  - [x] **Node-side update flow:** `update:check` hits GitHub releases/latest (compare to 3.2.0), `update:apply` downloads the native x64 zip, validates `MZ`, extracts to replace `resources/emtypyie.exe`, reports progress + restart. Auto-check on launch.
- [ ] Final public v3.0.0 release only after all phases land (GitHub release + npm publish + choco/winget bump).
- [ ] Signed/trusted-source check before exec.
- [ ] Progress output during download.

## Low Priority / Future
- [ ] Automate Chocolatey push in `release.yml` (currently manual due to 403)
- [ ] Add Chocolatey badge to README once package is live
- [ ] Consider signing up at https://community.chocolatey.org as `myrachane` if `emtypyie` account push issue persists
- [ ] **Robust error handling pass:**
  - Add input validation (bounds checking on all string buffers in C)
  - Replace manual JSON parsing with cJSON library (already in lib/)
  - Surface WinHTTP error details (DNS/timeout/TLS) instead of silent 0
  - Add retry logic (3 attempts with backoff) for network operations
  - Verify downloaded files against checksums
  - Wrap all Node.js `execSync` calls in try-catch
  - Clean up partial files on install failure (rollback)
  - Add unit tests for error paths and failure modes
