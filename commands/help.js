const chalk = require('chalk');

const retro = chalk.hex('#33ff33');
const retroDim = chalk.hex('#1a7a1a');
const retroAccent = chalk.hex('#66ff66');

function show(projects) {
  console.log();
  console.log(retroDim('  ─── Commands ───'));
  console.log();
  console.log(retro('  /get <project>') + retroDim('     install a project'));
  console.log(retro('  /flash <project>') + retroDim('   re-download latest version'));
  console.log(retro('  /info <project>') + retroDim('    show project details'));
  console.log(retro('  /rm <project>') + retroDim('      delete project files'));
  console.log(retro('  /issue <project>') + retroDim('   open issue tracker'));
  console.log(retro('  /issue <project> -m') + retroDim('  file a bug report'));
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

module.exports = { show };
