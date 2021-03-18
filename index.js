'use strict';

process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true';

const { app, BrowserWindow, shell, screen, nativeTheme } = require('electron');

app.once('ready', () => {
  const win = new BrowserWindow({
    minWidth: 400,
    minHeight: 550,
    show: false,
    frame: false,
    backgroundColor: '#fff',
    titleBarStyle: 'hidden',
    trafficLightPosition: { x: 8, y: 8 },
    webPreferences: {
      webSecurity: false,
      nodeIntegration: true,
      spellcheck: true,
      enableRemoteModule: true
    }
  });

  win.webContents.session.setSpellCheckerLanguages(['ru', 'en-US']);
  nativeTheme.themeSource = 'light';

  win.webContents.once('dom-ready', async () => {
    const data = await win.webContents.executeJavaScript('localStorage.getItem("settings")');

    if (data) {
      const { window } = JSON.parse(data);
      const { width, height } = screen.getPrimaryDisplay().workAreaSize;
      const isMaximized = window.width >= width && window.height >= height;

      win.setBounds({
        x: window.x,
        y: window.y,
        width: isMaximized ? width : window.width,
        height: isMaximized ? height : window.height
      });

      if (isMaximized) {
        win.maximize();
      }
    }

    win.show();
  });

  win.webContents.on('new-window', (event, url) => {
    event.preventDefault();
    shell.openExternal(url);
  });

  if (process.platform === 'darwin') {
    require('./menu')(win);
  } else {
    win.removeMenu();
  }

  win.loadURL(
    process.argv.includes('dev-mode')
      ? 'http://localhost:9973/dist/index.html'
      : `file://${__dirname}/dist/index.html`
  );
});

app.on('window-all-closed', app.exit);
