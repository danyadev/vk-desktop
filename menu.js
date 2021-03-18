'use strict';

const { app, Menu, shell, BrowserWindow } = require('electron');

module.exports = function(mainWindow) {
  const menu = [
    {
      label: 'VK Desktop',
      submenu: [
        {
          label: 'О программе VK Desktop',
          click() {
            shell.openExternal('https://vk.com/vk_desktop_app');
          }
        },
        { type: 'separator' },
        {
          label: 'Настройки',
          enabled: false,
          accelerator: 'Command+,',
          click() {
            // TODO Настройки
            // win.send('preferences');
          }
        },
        {
          label: 'Проверить обновления',
          enabled: false,
          click() {
            // TODO Проверка обновлений
            // win.send('updateCheck');
          }
        },
        { type: 'separator' },
        {
          label: 'Сервисы',
          role: 'services',
          submenu: []
        },
        { type: 'separator' },
        {
          label: 'Скрыть VK Desktop',
          accelerator: 'Command+H',
          role: 'hide'
        },
        {
          label: 'Скрыть остальные',
          accelerator: 'Command+Shift+H',
          role: 'hideothers'
        },
        {
          label: 'Показать все',
          role: 'unhide'
        },
        { type: 'separator' },
        {
          label: 'Выйти',
          accelerator: 'Command+Q',
          click() {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Правка',
      submenu: [
        {
          label: 'Отменить',
          accelerator: 'CmdOrCtrl+Z',
          role: 'undo'
        },
        {
          label: 'Повторить',
          accelerator: 'Shift+CmdOrCtrl+Z',
          role: 'redo'
        },
        { type: 'separator' },
        {
          label: 'Вырезать',
          accelerator: 'CmdOrCtrl+X',
          role: 'cut'
        },
        {
          label: 'Скопировать',
          accelerator: 'CmdOrCtrl+C',
          role: 'copy'
        },
        {
          label: 'Вставить',
          accelerator: 'CmdOrCtrl+V',
          role: 'paste'
        },
        {
          label: 'Выбрать все',
          accelerator: 'CmdOrCtrl+A',
          role: 'selectall'
        }
      ]
    },
    {
      label: 'Вид',
      submenu: [
        {
          label: 'Перейти в полноэкранный режим',
          accelerator: 'Ctrl+Command+F',
          click(item, focusedWindow) {
            if (focusedWindow) {
              focusedWindow.setFullScreen(!focusedWindow.isFullScreen());
            }
          }
        },
        {
          label: 'Toggle Developer Tools',
          accelerator: 'Alt+Command+I',
          click(item, focusedWindow) {
            if (focusedWindow) {
              focusedWindow.toggleDevTools();
            }
          }
        }
      ]
    },
    {
      label: 'Окно',
      role: 'window',
      submenu: [
        {
          label: 'Свернуть',
          accelerator: 'CmdOrCtrl+M',
          role: 'minimize'
        },
        {
          label: 'Закрыть',
          role: 'close',
          click() {
            const focusedWin = BrowserWindow.getFocusedWindow();

            if (!focusedWin) {
              return;
            }

            if (focusedWin !== mainWindow) {
              return focusedWin.close();
            }

            function closeFunc() {
              mainWindow.close();
              mainWindow.removeListener('leave-full-screen', closeFunc);
            }

            if (mainWindow.isFullScreen()) {
              mainWindow.setFullScreen(false);
              mainWindow.on('leave-full-screen', closeFunc);
            } else {
              closeFunc();
            }
          }
        },
        { type: 'separator' },
        {
          label: 'Все окна — на передний план',
          click() {
            if (mainWindow) {
              mainWindow.show();
              mainWindow.focus();
            }
          }
        }
      ]
    },
    {
      label: 'Справка',
      role: 'help',
      submenu: [
        {
          label: 'Узнать больше',
          click() {
            shell.openExternal('https://vk.com/vk_desktop_app');
          }
        }
      ]
    }
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(menu));
};
