'use strict';

const { app, BrowserWindow, Menu } = require('electron');
const fs = require('fs');
let win;

app.on('ready', () => {
  if(fs.readdirSync('.').find((file) => file == 'vue-devtools')) {
    BrowserWindow.addDevToolsExtension('./vue-devtools');
  }

  const { screen } = require('electron');

  win = new BrowserWindow({
    minWidth: 360,
    minHeight: 480,
    show: false,
    frame: false,
    titleBarStyle: 'hidden'
  });

  win.webContents.once('dom-ready', async () => {
    let data = await win.webContents.executeJavaScript('localStorage.getItem("settings")'),
        { width, height } = screen.getPrimaryDisplay().workAreaSize;

    if(data) {
      let { window } = JSON.parse(data),
          maximized = window.width >= width && window.height >= height;

      win.setBounds({
        x: window.x,
        y: window.y,
        width: maximized ? width : window.width,
        height: maximized ? height : window.height
      });

      if(maximized) win.maximize();
    }

    // Вместо того, чтобы открывать окно при событии ready-to-show,
    // можно открывать его после вызова JavaScript из renderer процесса,
    // ведь в этот момент renderer процесс уже загружен и мы уже установили
    // окно на нужное положение, и оно не будет "улетать" после открытия.
    win.show();
  });

  // Fix: Не работала вставка текста в инпуты на macOS
  if(process.platform == 'darwin') {
    let menuTemplate = [{
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'pasteandmatchstyle' },
        { role: 'delete' },
        { role: 'selectall' }
      ]
    }];

    Menu.setApplicationMenu(Menu.buildFromTemplate(menuTemplate));
  } else win.setMenu(null);

  win.loadURL(
    process.argv.indexOf('dev-mode') != -1
        ? 'http://localhost:8080/'
        : `file://${__dirname}/index.html`
  );

  win.on('closed', () => win = null);
});

app.on('window-all-closed', app.exit);
