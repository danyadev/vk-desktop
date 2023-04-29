import * as electron from '@electron/remote'
import { computed, shallowRef, watch } from 'vue'
import { AppearanceScheme, AppearanceTheme, useMainSettingsStore } from 'store/mainSettings'
import { createSingletonHook, currentWindow, subscribeToElectronEvent } from 'misc/utils'

export const useThemeScheme = createSingletonHook(() => {
  const { appearance } = useMainSettingsStore()

  const actualAppTheme = shallowRef(getAppTheme())
  const scheme = computed(
    () => getFullScheme(appearance.theme, appearance.scheme, actualAppTheme.value)
  )

  watch(() => appearance.theme, () => {
    electron.nativeTheme.themeSource = appearance.theme
  })

  function onThemeUpdate() {
    actualAppTheme.value = getAppTheme()
    // см. main-process/index.ts
    currentWindow.setBackgroundColor(actualAppTheme.value === 'dark' ? '#222' : '#fff')
  }

  subscribeToElectronEvent(() => {
    electron.nativeTheme.on('updated', onThemeUpdate)
    return () => electron.nativeTheme.off('updated', onThemeUpdate)
  })

  return scheme
})

type ActualTheme = 'light' | 'dark'
function getAppTheme(): ActualTheme {
  return electron.nativeTheme.shouldUseDarkColors ? 'dark' : 'light'
}

function getFullScheme(
  theme: AppearanceTheme,
  scheme: AppearanceScheme,
  actualAppTheme: ActualTheme
): 'vkcom_light' | 'vkcom_dark' | 'bright_light' | 'space_gray' {
  switch (theme) {
    case 'light':
      return scheme === 'vkcom'
        ? 'vkcom_light'
        : 'bright_light'

    case 'dark':
      return scheme === 'vkcom'
        ? 'vkcom_dark'
        : 'space_gray'

    case 'system':
      return getFullScheme(
        actualAppTheme,
        scheme,
        actualAppTheme
      )
  }
}
