import * as electron from '@electron/remote'
import { computed, ref } from 'vue'
import { useMainSettingsStore, AppearanceScheme, AppearanceTheme } from 'store/mainSettings'
import { exhaustivenessCheck } from 'misc/utils'

export function useThemeScheme() {
  const { appearance } = useMainSettingsStore()

  const systemTheme = ref(getSystemTheme())
  const scheme = computed(
    () => getFullScheme(appearance.theme, appearance.scheme, systemTheme.value)
  )

  electron.nativeTheme.on('updated', () => {
    systemTheme.value = getSystemTheme()
  })

  return scheme
}

type SystemTheme = 'light' | 'dark'
function getSystemTheme(): SystemTheme {
  return electron.nativeTheme.shouldUseDarkColors ? 'dark' : 'light'
}

function getFullScheme(
  theme: AppearanceTheme,
  scheme: AppearanceScheme,
  systemTheme: SystemTheme
): string {
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
        systemTheme,
        scheme,
        systemTheme
      )

    default:
      exhaustivenessCheck(theme)
  }
}
