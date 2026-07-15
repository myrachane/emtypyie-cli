# emtypyie-cli

> Run emtypyie projects from your terminal with ease — the future runtime engine.

## Install

```bash
npm install -g emtypyie-cli
```

Requires **Node.js 18+**.

After installation, run:

```bash
emtypyie
```

## Commands

| Command | Description |
|---|---|
| `/get <project>` | Install a project |
| `/flash <project>` | Re-download latest version |
| `/info <project>` | Show project details |
| `/rm <project>` | Delete project files |
| `/issue <project>` | Open issue tracker |
| `/issue <project> -m` | File a bug report |
| `/bakafetch` | System info with ASCII art |
| `/bf` | Shortcut for `/bakafetch` |
| `/wrap all <theme>` | Change CLI color scheme |
| `/wrap bakafetch <color>` | Change bakafetch accent color |
| `/about` | About emtypyie |
| `/wiki` | Open wiki.emtypyie.in |
| `/help` | Show all commands |
| `/exit` | Quit |

## Themes

Built-in color schemes: `slate`, `green`, `amber`, `violet`, `cyan`.

```bash
/wrap all slate
/wrap bakafetch #ff0000
```

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

## Links

- GitHub: [myrachane/emtypyie-cli](https://github.com/myrachane/emtypyie-cli)
- Website: [emtypyie.in/cli](https://emtypyie.in/cli)

## License

MIT
