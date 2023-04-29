import './App.css'
import electron from 'electron'
import { defineComponent } from 'vue'
import { RouterView } from 'vue-router'
import { useEnv, useGlobalModal } from 'misc/hooks'
import { isMacOS } from 'misc/constants'
import { currentWindow, debounce, subscribeToElectronEvent } from 'misc/utils'
import { useThemeScheme } from './useThemeScheme'
import { useMainSettingsStore } from 'store/mainSettings'
import { Titlebar } from 'ui/app/Titlebar/Titlebar'
import { ModalsContainer } from 'ui/modals/parts'
import { CaptchaModal } from 'ui/modals/CaptchaModal/CaptchaModal'
import { exposeFeatures } from 'misc/exposeFeatures'

export const App = defineComponent(() => {
  const { lang } = useEnv()
  const scheme = useThemeScheme()
  const mainSettings = useMainSettingsStore()

  exposeFeatures()

  if (isMacOS) {
    electron.ipcRenderer.send('menu:build', lang.useRaw('app_menu_labels'))
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
    <div class="root" data-scheme={scheme.value}>
      <Titlebar />
      <div class={['App', { 'App--isMacOS': isMacOS }]}>
        <RouterView />

        <ModalsContainer />
        <GlobalModals />
      </div>
    </div>
  )
})

const GlobalModals = defineComponent(() => {
  const { captchaModal } = useGlobalModal()
  const modals = [
    [captchaModal, CaptchaModal]
  ] as const

  return () => (
    modals.map(([modal, Modal]) => (
      // Параметры появляются при открытии модалки,
      // а удаляются только после окончания анимации закрытия модалки
      modal.params && <Modal {...modal.params} />
    ))
  )
})
