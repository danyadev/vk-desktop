import { useMainSettingsStore } from 'store/mainSettings'
import { useSettingsStore } from 'store/settings'

/**
 * Вытаскиваем полезные функции/переменные/etc в глобальную область видимости,
 * чтобы пользоваться этим в DevTools для дебага
 *
 * Создаем отдельную переменную для window, чтобы не менять тип глобального объекта
 * и не пользоваться глобальными переменными в коде
 */

type ExposedFeatures = {
  mainSettingsStore: ReturnType<typeof useMainSettingsStore>
  settingsStore: ReturnType<typeof useSettingsStore>
}
const exposedWindow = window as typeof window & ExposedFeatures

export function exposeFeatures() {
  exposedWindow.mainSettingsStore = useMainSettingsStore()
  exposedWindow.settingsStore = useSettingsStore()
}
