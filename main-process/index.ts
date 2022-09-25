import fs from 'fs'
import path from 'path'
import os from 'os'
import type Electron from 'electron'
import { app, BrowserWindow, shell, screen, nativeTheme, ipcMain } from 'electron'
import * as electronMain from '@electron/remote/main'
import buildMacOSMenu from './buildMacOSMenu'

process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true'

const isMacOS = process.platform === 'darwin'

const appDataPath = path.join(app.getPath('appData'), 'vk-desktop')
const storePath = path.join(appDataPath, 'store.json')

let store = {
  // Включаем кастомный тайтлбар только для винды < 10 версии
  useCustomTitlebar: process.platform === 'win32' && parseInt(os.release()) < 10
}

try {
  store = JSON.parse(fs.readFileSync(storePath, 'utf-8')) as typeof store
} catch {
  if (!fs.existsSync(appDataPath)) {
    fs.mkdirSync(appDataPath)
  }
  fs.writeFileSync(storePath, JSON.stringify(store))
}

electronMain.initialize()

// TODO: Поддержать тему при инициализации
nativeTheme.themeSource = 'light'

function createWindow(params: Electron.BrowserWindowConstructorOptions = {}) {
  const isFrameEnabled = 'frame' in params
    ? params.frame
    : !store.useCustomTitlebar

  const win = new BrowserWindow({
    minWidth: 410,
    minHeight: 550,
    show: false,
    frame: isFrameEnabled,
    titleBarStyle: isFrameEnabled ? 'default' : 'hidden',
    trafficLightPosition: isFrameEnabled ? undefined : { x: 8, y: 8 },
    backgroundColor: '#fff',
    webPreferences: {
      webSecurity: false,
      contextIsolation: false,
      nodeIntegration: true,
      worldSafeExecuteJavaScript: false,
      enableRemoteModule: true
    },
    ...params
  })

  win.webContents.session.setSpellCheckerLanguages(['ru', 'en-US'])

  return win
}

function getLoadURL(entry: string) {
  const devServerUrl = process.env.VITE_DEV_SERVER_URL
  return devServerUrl || `file://${__dirname}/dist/${entry}.html`
}

type PartialSettings = {
  window: Electron.Rectangle
}

app.once('ready', () => {
  const mainWindow = createWindow()

  mainWindow.webContents.once('dom-ready', async () => {
    const storedSettings = await mainWindow.webContents.executeJavaScript(
      'localStorage.getItem("settings")'
    ) as string | null

    if (storedSettings) {
      const settings = JSON.parse(storedSettings) as PartialSettings
      const { window } = settings
      const { width, height } = screen.getPrimaryDisplay().workAreaSize
      const isMaximized = window.width >= width && window.height >= height

      mainWindow.setBounds({
        x: window.x,
        y: window.y,
        width: isMaximized ? width : window.width,
        height: isMaximized ? height : window.height
      })

      if (isMaximized) {
        mainWindow.maximize()
      }
    }

    mainWindow.show()
  })

  mainWindow.loadURL(getLoadURL('index'))

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  if (isMacOS) {
    ipcMain.on('menu:create', (event, labels: Record<string, string>) => {
      buildMacOSMenu(mainWindow, labels)
    })

    let forceClose = false

    app.on('before-quit', () => {
      forceClose = true
    })

    mainWindow.on('close', (event) => {
      // Позволяем полностью закрыть приложение
      if (forceClose) {
        return
      }

      event.preventDefault()

      if (mainWindow.isFullScreen()) {
        mainWindow.setFullScreen(false)
        mainWindow.once('leave-full-screen', () => mainWindow.hide())
      } else {
        mainWindow.hide()
      }
    })

    app.on('activate', (event, hasVisibleWindows) => {
      // Приложение было закрыто через ⌘ + W
      if (!hasVisibleWindows) {
        mainWindow.show()
      }
    })
  } else {
    mainWindow.removeMenu()
  }
})

if (!isMacOS) {
  app.on('window-all-closed', () => {
    app.quit()
  })
}
