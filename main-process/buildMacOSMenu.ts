import Electron, { Menu, shell } from 'electron'

export function buildMacOSMenu(mainWindow: Electron.BrowserWindow, labels: Record<string, string>) {
  const menu: Electron.MenuItemConstructorOptions[] = [
    {
      label: labels.appMenuTitle,
      submenu: [
        { role: 'about', label: labels.about },
        {
          label: labels.settings,
          accelerator: 'Command+,',
          click: () => mainWindow.webContents.send('menu:open-preferences')
        },
        { type: 'separator' },
        { role: 'services', label: labels.services },
        { type: 'separator' },
        { role: 'hide', label: labels.hideApp },
        { role: 'hideOthers', label: labels.hideOthers },
        { role: 'unhide', label: labels.showAllApps },
        { type: 'separator' },
        { role: 'quit', label: labels.quit }
      ]
    },

    {
      label: labels.editMenuTitle,
      submenu: [
        { role: 'undo', label: labels.undo },
        { role: 'redo', label: labels.redo },
        { type: 'separator' },
        { role: 'cut', label: labels.cut },
        { role: 'copy', label: labels.copy },
        { role: 'paste', label: labels.paste },
        { role: 'selectAll', label: labels.selectAll }
      ]
    },

    {
      label: labels.viewMenuTitle,
      submenu: [
        { role: 'reload', label: labels.reload },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom', label: labels.resetZoom },
        { role: 'zoomIn', label: labels.zoomIn },
        { role: 'zoomOut', label: labels.zoomOut },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },

    {
      role: 'window',
      label: labels.windowMenuTitle,
      submenu: [
        { role: 'minimize', label: labels.minimize },
        { role: 'close', label: labels.close }
      ]
    },

    {
      role: 'help',
      label: labels.helpMenuTitle,
      submenu: [
        {
          label: labels.vkPage,
          click: () => shell.openExternal('https://vk.com/vk_desktop_app')
        },
        {
          label: labels.githubPage,
          click: () => shell.openExternal('https://github.com/danyadev/vk-desktop')
        }
      ]
    }
  ]

  Menu.setApplicationMenu(Menu.buildFromTemplate(menu))
}
