# emtypyie-cli

> Run emtypyie projects from your terminal with ease — the future runtime engine.

![GitHub release](https://img.shields.io/github/v/release/myrachane/emtypyie-cli)
![npm](https://img.shields.io/npm/v/emtypyie-cli)

## Install

**npm** (requires Node.js 18+):

```bash
npm install -g emtypyie-cli
```

**winget** (standalone binary, no Node.js required):

```bash
winget install myrachane.emtypyie-cli
```

After installation, run:

```bash
emtypyie
```

## Commands

| Command | Description |
|---|---|
| `/setenv` | Set environment variables (tokens, git config) interactively |
| `/theme <name>` | Change CLI color scheme (`slate`, `green`, `amber`, `violet`, `cyan`) |
| `/theme bakafetch <color>` | Change bakafetch accent color (name or hex) |
| `/get <project>` | Install a project |
| `/flash <project>` | Re-download latest version |
| `/info <project>` | Show project details |
| `/rm <project>` | Delete project files |
| `/issue <project>` | Open issue tracker |
| `/issue <project> -m` | File a bug report |
| `/bakafetch` | System info with ASCII art |
| `/bf` | Shortcut for `/bakafetch` |
| `/wrap <dir>` | Stage all files in a directory (git add) |
| `/wrap <dir> --commit -m "msg"` | Stage, commit, and push |
| `/wrap all` | Stage all subdirectories in current directory |
| `/wrap all --commit -m "msg"` | Stage, commit, and push for all subdirs |
| `/wrap npm publish` | Auto-increment patch version and publish to npm |
| `/wrap repo "name"` | Create GitHub repo or create PR + merge |
| `/about` | About emtypyie |
| `/wiki` | Open wiki.emtypyie.in |
| `/list` | List projects |
| `/docs <project>` | Open project docs |
| `/changelog` | What's new |
| `/clear` | Clear screen |
| `/update` | Update emtypyie-cli |
| `/help` | Show all commands |
| `/exit` | Quit |

## /setenv

Stores tokens and git credentials locally in `~/.emtypyie/.env`. Prompts for:

- `GITHUB_TOKEN` — for GitHub API (repo create, PR, merge)
- `GIT_USERNAME` — for commit authorship
- `GIT_EMAIL` — for commit authorship
- `NPM_TOKEN` — for npm publish auth

```bash
/setenv
```

> Tokens are stored **only on your machine**, never sent anywhere.

## /theme

Built-in color schemes: `slate`, `green`, `amber`, `violet`, `cyan`.

```bash
/theme amber
/theme bakafetch #ff0000
```

## /wrap

### Stage & commit

Stage all changes in a directory (or all subdirectories):

```bash
/wrap my-project
/wrap all
```

Add, commit, and push in one go:

```bash
/wrap my-project --commit -m "fix: typo"
/wrap all --commit -m "bulk update"
```

### npm publish

Auto-increments the patch version in `package.json`, then publishes to npm (requires `NPM_TOKEN` set via `/setenv`):

```bash
/wrap npm publish
```

### GitHub repo management

If the repo doesn't exist, creates it and pushes `main`:

```bash
/wrap repo "my-new-project"
```

If the repo exists, creates a feature branch, asks for a commit message, opens a PR to `main`, and asks whether to merge:

```bash
/wrap repo "existing-repo"
```

Requires `GITHUB_TOKEN`, `GIT_USERNAME`, and `GIT_EMAIL` set via `/setenv`.

## Environment Variables

Saved to `~/.emtypyie/.env` via `/setenv`:

| Variable | Purpose |
|---|---|
| `GITHUB_TOKEN` | GitHub API auth (repo, PR, merge) |
| `GIT_USERNAME` | Git commit author name |
| `GIT_EMAIL` | Git commit author email |
| `NPM_TOKEN` | npm registry auth token |

## Projects

Projects are downloaded to `~/.emtypyie/dev/<name>/`.

- **QR KRAFT** — `/get qrkraft`

## GUI

Start the web interface:

```bash
emtypyie gui
# or
node gui/server.js
```

## Build standalone binary

```bash
npm run build
```

Produces `dist/emtypyie.exe` — a portable Windows executable with embedded Node.js (no runtime required).

## Links

- GitHub: [myrachane/emtypyie-cli](https://github.com/myrachane/emtypyie-cli)
- Website: [emtypyie.in/cli](https://emtypyie.in/cli)
- Winget: `winget install myrachane.emtypyie-cli`

## License

MIT
