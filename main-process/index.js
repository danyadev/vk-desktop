'use strict';

process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true';

const fs = require('fs');
const path = require('path');
const { app, BrowserWindow, shell, screen, nativeTheme } = require('electron');

const isMacOS = process.platform === 'darwin';

const vkdPath = path.join(app.getPath('appData'), 'vk-desktop');
const storePath = path.join(vkdPath, 'store.json');
let store = {
  useNativeTitlebar: false
};

try {
  store = JSON.parse(fs.readFileSync(storePath));
} catch {
  if (!fs.existsSync(vkdPath)) fs.mkdirSync(vkdPath);
  fs.writeFileSync(storePath, JSON.stringify(store));
}

require('@electron/remote/main').initialize();

nativeTheme.themeSource = 'light';

function createWindow(params = {}) {
  const isFrameEnabled = 'frame' in params
    ? params.frame
    : store.useNativeTitlebar;

  const win = new BrowserWindow({
    minWidth: 410,
    minHeight: 550,
    show: false,
    frame: isFrameEnabled,
    titleBarStyle: isFrameEnabled ? 'default' : 'hidden',
    trafficLightPosition: isFrameEnabled ? null : { x: 8, y: 8 },
    backgroundColor: '#fff',
    webPreferences: {
      webSecurity: false,
      contextIsolation: false,
      nodeIntegration: true,
      worldSafeExecuteJavaScript: false,
      enableRemoteModule: true
    },
    ...params
  });

  win.webContents.session.setSpellCheckerLanguages(['ru', 'en-US']);

  return win;
}

function getLoadURL(entry) {
  return process.argv.includes('dev-mode')
    ? `http://localhost:9973/dist/${entry}.html`
    : `file://${__dirname}/dist/${entry}.html`;
}

app.once('ready', () => {
  const mainWindow = createWindow();

  mainWindow.webContents.once('dom-ready', async () => {
    const data = await mainWindow.webContents.executeJavaScript('localStorage.getItem("settings")');

    if (data) {
      const { window } = JSON.parse(data);
      const { width, height } = screen.getPrimaryDisplay().workAreaSize;
      const isMaximized = window.width >= width && window.height >= height;

      mainWindow.setBounds({
        x: window.x,
        y: window.y,
        width: isMaximized ? width : window.width,
        height: isMaximized ? height : window.height
      });

      if (isMaximized) {
        mainWindow.maximize();
      }
    }

    mainWindow.show();
  });

  mainWindow.loadURL(getLoadURL('main'));

  // const photoViewer = createWindow({
  //   fullscreen: true,
  //   transparent: true,
  //   show: true,
  //   frame: true,
  //   modal: true
  // });
  // photoViewer.loadURL(getLoadURL('photoViewer'));

  mainWindow.webContents.on('new-window', (event, url) => {
    event.preventDefault();
    shell.openExternal(url);
  });

  if (isMacOS) {
    require('./menu')(mainWindow);

    let forceClose = false;

    app.on('before-quit', () => {
      forceClose = true;
    });

    mainWindow.on('close', (event) => {
      if (!forceClose) {
        event.preventDefault();
        mainWindow.hide();
      }
    });

    app.on('activate', (event, hasVisibleWindows) => {
      // Приложение было закрыто через ⌘ + W
      if (!hasVisibleWindows) {
        mainWindow.show();
      }
    });
  } else {
    mainWindow.removeMenu();
  }
});

if (!isMacOS) {
  app.on('window-all-closed', () => {
    app.quit();
  });
}
