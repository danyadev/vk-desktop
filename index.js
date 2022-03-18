'use strict';

process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true';

const fs = require('fs');
const path = require('path');
const { app, BrowserWindow, shell, screen, nativeTheme } = require('electron');

require('@electron/remote/main').initialize();

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

app.once('ready', () => {
  const mainWindow = new BrowserWindow({
    minWidth: 400,
    minHeight: 550,
    show: false,
    frame: store.useNativeTitlebar,
    backgroundColor: '#fff',
    titleBarStyle: store.useNativeTitlebar ? 'default' : 'hidden',
    trafficLightPosition: store.useNativeTitlebar ? null : { x: 8, y: 8 },
    webPreferences: {
      webSecurity: false,
      contextIsolation: false,
      nodeIntegration: true,
      worldSafeExecuteJavaScript: false,
      enableRemoteModule: true
    }
  });

  mainWindow.webContents.session.setSpellCheckerLanguages(['ru', 'en-US']);
  nativeTheme.themeSource = 'light';

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

  mainWindow.loadURL(
    process.argv.includes('dev-mode')
      ? 'http://localhost:9973/dist/index.html'
      : `file://${__dirname}/dist/index.html`
  );

  mainWindow.webContents.on('new-window', (event, url) => {
    event.preventDefault();
    shell.openExternal(url);
  });

  if (process.platform !== 'darwin') {
    mainWindow.removeMenu();
  } else {
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
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
