const { MakerSquirrel } = require('@electron-forge/maker-squirrel');
const { MakerZIP } = require('@electron-forge/maker-zip');

module.exports = {
  packagerConfig: {
    name: 'Emtypyie',
    executableName: 'emtypyie-gui',
    asar: true,
    extraResource: ['./resources/emtypyie.exe']
  },
  rebuildConfig: {},
  makers: [
    new MakerSquirrel({ name: 'emtypyie-gui' }),
    new MakerZIP({}, ['win32'])
  ],
  plugins: [],
  hooks: {}
};
