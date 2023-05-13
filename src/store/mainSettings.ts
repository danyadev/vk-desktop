import os from 'os'
import type Electron from 'electron'
import { toRaw } from 'vue'
import { defineStore } from 'pinia'
import { MainStorage } from 'model/Storage'
import { currentWindow } from 'misc/utils'

export type AppearanceScheme = 'vkcom' | 'vkui'
export type AppearanceTheme = 'light' | 'dark' | 'system'

// Нужно держать синхронизированным с типом из main-process/index.ts
type MainSettings = {
  bounds: Electron.Rectangle
  useCustomTitlebar: boolean
  appearance: {
    scheme: AppearanceScheme
    theme: AppearanceTheme
  }
}

const mainSettingsStorage = new MainStorage<MainSettings>({
  bounds: currentWindow.getBounds(),
  // Включаем кастомный тайтлбар только для винды < 10 версии
  useCustomTitlebar: process.platform === 'win32' && parseInt(os.release()) < 10,
  appearance: {
    scheme: 'vkcom',
    theme: 'system'
  }
})

export const useMainSettingsStore = defineStore('mainSettings', {
  state: () => mainSettingsStorage.data,
  actions: {
    setWindowBounds() {
      this.bounds = currentWindow.getBounds()
    }
  }
})

export function init() {
  useMainSettingsStore().$subscribe((mutation, state) => {
    mainSettingsStorage.update(toRaw(state))
  })
}
