import './App.css'
import electron from 'electron'
import { defineComponent } from 'vue'
import { useEnv, useThemeScheme } from 'misc/hooks'
import { isMacOS } from 'misc/constants'
import { Titlebar } from 'ui/app/Titlebar/Titlebar'

export const App = defineComponent(() => {
  const { lang } = useEnv()
  const scheme = useThemeScheme()

  if (isMacOS) {
    electron.ipcRenderer.send('menu:build', lang.use('app_menu_labels'))
  }

  return () => (
    <div class="App" data-scheme={scheme.value}>
      <Titlebar />
    </div>
  )
})
