const fs = require('fs');

// Read the JS source
const src = fs.readFileSync('root4node/commands/bakafetch.js', 'utf8');
const lines = src.split('\n');

// Extract lines between ASCII_ARTS definition and the closing ];
let inArt = false;
let inTsun = false;
const arts = [];
let currentArt = [];
const tsunLines = [];

for (const line of lines) {
  if (line.includes('const ASCII_ARTS = [')) { inArt = true; continue; }
  if (inArt && line.trimStart().startsWith('];')) { inArt = false; continue; }
  if (line.includes('const TSUNDERE_LINES = [')) { inTsun = true; continue; }
  if (inTsun && line.trimStart().startsWith('];')) { inTsun = false; continue; }

    if (inArt) {
    const trimmed = line.trim();
    if (trimmed === '[') { currentArt = []; }
    else if (trimmed === '],') { arts.push([...currentArt]); }
    else if (trimmed.startsWith("'") || trimmed.startsWith('"') || trimmed.startsWith('`')) {
      const match = trimmed.match(/^['"`](.*)['"`],?$/);
      if (match) currentArt.push(match[1]);
    }
    if (trimmed === '[' && currentArt.length > 0) { arts.push([...currentArt]); currentArt = []; }
  }

    if (inTsun) {
    const match = line.trim().match(/^['"`](.*)['"`],?$/);
    if (match) tsunLines.push(match[1].replace(/\\'/g, "'").replace(/\\"/g, '"'));
  }
}

// Generate C file
let c = '#ifndef BAKAFETCH_DATA_H\n#define BAKAFETCH_DATA_H\n\n';

c += `#define ART_COUNT ${arts.length}\n`;
c += `#define TSUN_COUNT ${tsunLines.length}\n\n`;

const maxArtLines = Math.max(...arts.map(a => a.length));
c += `static const char* ARTS[ART_COUNT][${maxArtLines + 1}] = {\n`;
for (const art of arts) {
  c += '  {\n';
  for (const line of art) {
    const escaped = line.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    c += `    u8"${escaped}",\n`;
  }
  c += '    NULL,\n';
  c += '  },\n';
}
c += '};\n\n';

c += 'static const char* TSUNDERE[] = {\n';
for (const line of tsunLines) {
  const escaped = line.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  c += `  u8"${escaped}",\n`;
}
c += '};\n\n#endif\n';

fs.writeFileSync('root4c/src/bakafetch_data.h', c, 'utf8');
console.log('Generated root4c/src/bakafetch_data.h');
console.log(`Arts: ${arts.length}, Tsun lines: ${tsunLines.length}`);
