'use strict';

const win = require('./win');
const IPCMainBridge = require('./ipc_main_bridge');
const useVKUpdater = ['win32', 'linux'].includes(process.platform);

const autoUpdater = useVKUpdater
  ? require('./windows-linux-updater')
  : require('electron').autoUpdater;

function getPlatform() {
  const x64 = process.arch == 'x64';

  if(process.platform == 'darwin') {
    return 'mac';
  }

  if(process.platform == 'win32') {
    return x64 ? 'win32-x64' : 'win32-ia32';
  }

  if(process.platform == 'linux') {
    return x64 ? 'linux64' : 'linux32';
  }

  return process.platform;
}

function getCheckURL() {
  const platform = getPlatform();
  const { version } = require('../package.json');

  return `https://update.electronjs.org/danyadev/vk-desktop/${platform}/${version}/`;
}

module.exports = {
  init() {
    const bridge = new IPCMainBridge();

    autoUpdater.setFeedURL(getCheckURL());
    bridge.setWindow(win.getWindow());

    if(useVKUpdater) {
      autoUpdater.setBridge(bridge);
    }
  },

  check() {
    autoUpdater.checkForUpdates();
  },

  quitAndInstall() {
    win.getWindow().forceClose = true;
    autoUpdater.quitAndInstall();
  },

  getPlatform
}
