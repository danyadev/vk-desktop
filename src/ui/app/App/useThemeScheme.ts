import * as electron from '@electron/remote'
import { computed, shallowRef, watch } from 'vue'
import { AppearanceScheme, useMainSettingsStore } from 'store/mainSettings'
import { createSingletonHook, currentWindow, subscribeToElectronEvent } from 'misc/utils'
import { getColorBackgroundContent } from 'main-process/shared'

/**
 * 0) В main процессе выставляем themeSource в зависимости от mainSettings (light | dark | system)
 * 1) В этом хуке достаем высчитанную из themeSource тему через getAppTheme (light | dark)
 * 2) При смене appearance из mainSettings обновляем themeSource
 * 2.1) Сразу же ловим эвент и обновляем actualAppTheme -> меняем схему
 * 3) При смене системной темы ловим эвент и обновляем actualAppTheme -> меняем схему
 */
export const useThemeScheme = createSingletonHook(() => {
  const { appearance } = useMainSettingsStore()
  const actualAppTheme = shallowRef(getAppTheme())

  watch(() => appearance.theme, () => {
    electron.nativeTheme.themeSource = appearance.theme
  })

  function onThemeUpdate() {
    actualAppTheme.value = getAppTheme()
    currentWindow.setBackgroundColor(
      getColorBackgroundContent(actualAppTheme.value, appearance.scheme)
    )
  }

  subscribeToElectronEvent(() => {
    electron.nativeTheme.on('updated', onThemeUpdate)
    return () => electron.nativeTheme.off('updated', onThemeUpdate)
  })

  return computed<`${AppearanceScheme}-${ActualTheme}`>(
    () => `${appearance.scheme}-${actualAppTheme.value}`
  )
})

export type ActualTheme = 'light' | 'dark'
function getAppTheme(): ActualTheme {
  return electron.nativeTheme.shouldUseDarkColors ? 'dark' : 'light'
}
