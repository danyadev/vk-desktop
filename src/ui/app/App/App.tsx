import { ipcRenderer, IpcRendererEvent, Rectangle } from 'electron'
import { defineComponent } from 'vue'
import { RouterView } from 'vue-router'
import { useMainSettingsStore } from 'store/mainSettings'
import { useEnv, useGlobalModal } from 'hooks'
import { subscribeToElectronEvent } from 'misc/utils'
import { isMacOS } from 'misc/constants'
import { exposeFeatures } from './exposeFeatures'
import { useThemeScheme } from './useThemeScheme'
import { Titlebar } from 'ui/app/Titlebar/Titlebar'
import { CaptchaModal } from 'ui/modals/CaptchaModal/CaptchaModal'
import { ModalsContainer } from 'ui/modals/parts'
import { PhotoViewerModal } from 'ui/modals/PhotoViewerModal/PhotoViewerModal'
import { SettingsModal } from 'ui/modals/SettingsModal/SettingsModal'
import './App.css'

export const App = defineComponent(() => {
  const { lang } = useEnv()
  const scheme = useThemeScheme()
  const mainSettings = useMainSettingsStore()

  exposeFeatures()

  if (isMacOS) {
    ipcRenderer.send('menu:build', lang.useRaw('app_menu_labels'))
  }

  subscribeToElectronEvent(() => {
    const onBoundsChange = (event: IpcRendererEvent, bounds: Rectangle) => {
      mainSettings.bounds = bounds
    }

    ipcRenderer.on('bounds-change', onBoundsChange)
    return () => ipcRenderer.off('bounds-change', onBoundsChange)
  })

  return () => (
    <div class="root" data-scheme={scheme.value}>
      {mainSettings.useCustomTitlebar && <Titlebar />}

      <div class={['App', { 'App--isMacOS': isMacOS }]}>
        <RouterView />

        <ModalsContainer />
        <GlobalModals />
      </div>
    </div>
  )
})

const GlobalModals = defineComponent(() => {
  const { captchaModal, photoViewerModal, settingsModal } = useGlobalModal()

  return () => [
    // Параметры появляются при открытии модалки,
    // а удаляются только после окончания анимации закрытия модалки
    captchaModal.params && <CaptchaModal {...captchaModal.params} />,
    photoViewerModal.params && <PhotoViewerModal {...photoViewerModal.params} />,
    settingsModal.params && <SettingsModal {...settingsModal.params} />
  ]
})
