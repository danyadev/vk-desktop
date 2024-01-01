import fs from 'fs'
import path from 'path'
import * as electronMain from '@electron/remote/main'
import Electron, { app, BrowserWindow, ipcMain, nativeTheme, screen, session, shell } from 'electron'
import type { Dictionary } from 'env/Lang'
import type { MainSettings as PostMainSettings } from 'store/mainSettings'
import { buildMacOSMenu } from './buildMacOSMenu'
import { getColorBackgroundContent, shouldUseCustomTitlebar } from './shared'

process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true'

const isMacOS = process.platform === 'darwin'

const appDataPath = path.join(app.getPath('appData'), 'vk-desktop')
const storePath = path.join(appDataPath, 'storage-v1.json')

type MainSettings = Omit<PostMainSettings, 'bounds'> & {
  bounds: PostMainSettings['bounds'] | null
}

let mainSettings: MainSettings = {
  bounds: null,
  useCustomTitlebar: shouldUseCustomTitlebar,
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

  const backgroundColor = getColorBackgroundContent(
    nativeTheme.shouldUseDarkColors ? 'dark' : 'light',
    mainSettings.appearance.scheme
  )

  const win = new BrowserWindow({
    minWidth: 410,
    minHeight: 550,
    show: false,
    frame: isFrameEnabled,
    titleBarStyle: isFrameEnabled ? 'default' : 'hidden',
    trafficLightPosition: isFrameEnabled ? undefined : { x: 8, y: 4 },
    backgroundColor,
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

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else {
    mainWindow.loadFile('dist/index.html')
  }

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
