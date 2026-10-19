import * as electron from '@electron/remote'
import Electron from 'electron'
import { defineStore } from 'pinia'
import { FileSystemStorageBackend, JsonStorage } from 'store/Storage'
import { getStorageFilePath, shouldUseCustomTitlebar } from 'main-process/shared'

export type AppearanceScheme = 'vkcom' | 'vkui'
export type AppearanceTheme = 'light' | 'dark' | 'system'

export type MainSettings = {
  bounds: Electron.Rectangle
  useCustomTitlebar: boolean
  appearance: {
    scheme: AppearanceScheme
    theme: AppearanceTheme
  }
  alwaysOnTop: boolean
  attachDebugger: boolean
}

const mainSettingsStorage = new JsonStorage(
  new FileSystemStorageBackend(getStorageFilePath(electron.app.getPath('appData'))),
  (): MainSettings => ({
    bounds: electron.getCurrentWindow().getBounds(),
    useCustomTitlebar: shouldUseCustomTitlebar,
    appearance: {
      scheme: 'vkcom',
      theme: 'system'
    },
    alwaysOnTop: false,
    attachDebugger: false
  })
)

export const useMainSettingsStore = defineStore('mainSettings', {
  state: () => mainSettingsStorage.getState()
})

export function init() {
  useMainSettingsStore().$subscribe((mutation, state) => {
    mainSettingsStorage.setState(state)
  })
}
