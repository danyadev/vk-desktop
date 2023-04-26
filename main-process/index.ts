import fs from 'fs'
import path from 'path'
import os from 'os'
import Electron, { app, BrowserWindow, shell, screen, nativeTheme, ipcMain, session } from 'electron'
import * as electronMain from '@electron/remote/main'
import { buildMacOSMenu } from './buildMacOSMenu'
import { Dictionary } from 'env/Lang'

process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true'

const isMacOS = process.platform === 'darwin'

const appDataPath = path.join(app.getPath('appData'), 'vk-desktop')
const storePath = path.join(appDataPath, 'storage-v1.json')

// Нужно держать синхронизированным с типом из store/mainSettings.ts
type MainSettings = {
  // Определяется на стороне рендерера
  bounds: Electron.Rectangle | null
  useCustomTitlebar: boolean
  appearance: {
    scheme: 'vkcom' | 'vkui'
    theme: 'light' | 'dark' | 'system'
  }
}

let mainSettings: MainSettings = {
  bounds: null,
  // Включаем кастомный тайтлбар только для винды < 10 версии
  useCustomTitlebar: process.platform === 'win32' && parseInt(os.release()) < 10,
  appearance: {
    scheme: 'vkcom',
    theme: 'system'
  }
}

try {
  const localMainSettings = JSON.parse(fs.readFileSync(storePath, 'utf-8')) as MainSettings
  mainSettings = {
    ...mainSettings,
    ...localMainSettings
  }
} catch {
  if (!fs.existsSync(appDataPath)) {
    fs.mkdirSync(appDataPath)
  }
  fs.writeFileSync(storePath, JSON.stringify(mainSettings))
}

electronMain.initialize()

nativeTheme.themeSource = mainSettings.appearance.theme

function createWindow(params: Electron.BrowserWindowConstructorOptions = {}) {
  const isFrameEnabled = 'frame' in params
    ? params.frame
    : !mainSettings.useCustomTitlebar

  const win = new BrowserWindow({
    minWidth: 410,
    minHeight: 550,
    show: false,
    frame: isFrameEnabled,
    titleBarStyle: isFrameEnabled ? 'default' : 'hidden',
    trafficLightPosition: isFrameEnabled ? undefined : { x: 8, y: 4 },
    backgroundColor: nativeTheme.shouldUseDarkColors ? '#222' : '#fff',
    webPreferences: {
      webSecurity: false,
      contextIsolation: false,
      nodeIntegration: true
    },
    ...params
  })

  win.webContents.session.setSpellCheckerLanguages(['ru', 'en-US'])
  electronMain.enable(win.webContents)

  return win
}

function getLoadURL(entry: string) {
  return `file://${__dirname}/dist/${entry}.html`
}

app.once('ready', () => {
  const mainWindow = createWindow()

  mainWindow.webContents.once('dom-ready', () => {
    if (mainSettings.bounds) {
      const { bounds } = mainSettings
      const { width, height } = screen.getPrimaryDisplay().workAreaSize
      const isMaximized = bounds.width >= width && bounds.height >= height

      mainWindow.setBounds({
        x: bounds.x,
        y: bounds.y,
        width: isMaximized ? width : bounds.width,
        height: isMaximized ? height : bounds.height
      })

      if (isMaximized) {
        mainWindow.maximize()
      }
    }

    mainWindow.show()
  })

  mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL || getLoadURL('index'))

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    if (details.responseHeaders) {
      details.responseHeaders['x-original-url-by-electron'] = [details.url]
    }
    callback(details)
  })

  session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
    if (details.requestHeaders['X-User-Agent']) {
      details.requestHeaders['User-Agent'] = details.requestHeaders['X-User-Agent']
      delete details.requestHeaders['X-User-Agent']
    }
    callback(details)
  })

  if (isMacOS) {
    ipcMain.on('menu:build', (event, labels: Dictionary['app_menu_labels']) => {
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
    mainWindow.setMenuBarVisibility(false)
  }
})

if (!isMacOS) {
  app.on('window-all-closed', () => {
    app.quit()
  })
}
