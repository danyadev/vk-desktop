import Electron from 'electron'
import { debounce } from './shared'

export function initIpcEvents(browserWindow: Electron.BrowserWindow) {
  const updateWindowBounds = debounce(() => {
    browserWindow.webContents.send('bounds-change', browserWindow.getBounds())
  }, 500)

  browserWindow.on('move', updateWindowBounds)
  browserWindow.on('resize', updateWindowBounds)

  function onMaximizeChange(isMaximized: boolean) {
    browserWindow.webContents.send('maximize-change', isMaximized)
  }

  browserWindow.on('maximize', () => onMaximizeChange(true))
  browserWindow.on('unmaximize', () => onMaximizeChange(false))
}
