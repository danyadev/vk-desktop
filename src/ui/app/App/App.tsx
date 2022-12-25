import './App.css'
import electron from 'electron'
import { defineComponent } from 'vue'
import { RouterView } from 'vue-router'
import { useEnv, useThemeScheme } from 'misc/hooks'
import { isMacOS } from 'misc/constants'
import { Titlebar } from 'ui/app/Titlebar/Titlebar'
import { currentWindow, debounce, subscribeToElectronEvent } from 'misc/utils'
import { useMainSettingsStore } from 'store/mainSettings'

export const App = defineComponent(() => {
  const { lang } = useEnv()
  const scheme = useThemeScheme()
  const mainSettings = useMainSettingsStore()

  if (isMacOS) {
    electron.ipcRenderer.send('menu:build', lang.use('app_menu_labels'))
  }

  const updateWindowBounds = debounce(() => {
    mainSettings.setWindowBounds()
  }, 500)

  subscribeToElectronEvent(() => {
    currentWindow.on('move', updateWindowBounds)
    currentWindow.on('resize', updateWindowBounds)

    return () => {
      currentWindow.off('move', updateWindowBounds)
      currentWindow.off('resize', updateWindowBounds)
    }
  })

  return () => (
    <div class="App" data-scheme={scheme.value}>
      <Titlebar />
      <RouterView />
    </div>
  )
})
