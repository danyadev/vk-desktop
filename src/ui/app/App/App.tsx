import './App.css'
import * as electron from '@electron/remote'
import { computed, ref, defineComponent } from 'vue'
import { useMainSettingsStore, AppearanceScheme, AppearanceTheme } from 'store/mainSettings'
import { Titlebar } from 'ui/app/Titlebar/Titlebar'
import { exhaustivenessCheck } from 'misc/utils'

export const App = defineComponent(() => {
  const { appearance } = useMainSettingsStore()

  const systemTheme = ref<SystemTheme>(getSystemTheme())
  const scheme = computed(
    () => getFullScheme(appearance.theme, appearance.scheme, systemTheme.value)
  )

  electron.nativeTheme.on('updated', () => {
    systemTheme.value = getSystemTheme()
  })

  return () => (
    <div class="App" data-scheme={scheme.value}>
      <Titlebar />
    </div>
  )
})

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
