import './App.css'
import electron from 'electron'
import { defineComponent } from 'vue'
import { RouterView } from 'vue-router'
import { useEnv, useThemeScheme } from 'misc/hooks'
import { isMacOS } from 'misc/constants'
import { Titlebar } from 'ui/app/Titlebar/Titlebar'
import { debounce } from 'misc/utils'
import { useSettingsStore } from 'store/settings'

export const App = defineComponent(() => {
  const { lang } = useEnv()
  const scheme = useThemeScheme()
  const settings = useSettingsStore()

  if (isMacOS) {
    electron.ipcRenderer.send('menu:build', lang.use('app_menu_labels'))
  }

  window.addEventListener('resize', debounce(() => {
    settings.setWindowBounds()
  }, 1000))

  return () => (
    <div class="App" data-scheme={scheme.value}>
      <Titlebar />
      <RouterView />
    </div>
  )
})
