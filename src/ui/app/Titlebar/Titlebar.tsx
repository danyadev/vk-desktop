import { ipcRenderer, IpcRendererEvent } from 'electron'
import { defineComponent, shallowRef } from 'vue'
import { useEnv } from 'hooks'
import { currentWindow, subscribeToElectronEvent } from 'misc/utils'
import { isMacOS } from 'misc/constants'
import {
  Icon10TitlebarClose,
  Icon10TitlebarMaximize,
  Icon10TitlebarMinimize,
  Icon10TitlebarRestore
} from 'assets/icons'
import './Titlebar.css'

const buttons = [
  { action: 'minimize', icon: <Icon10TitlebarMinimize /> },
  { action: 'maximize', icon: <Icon10TitlebarMaximize /> },
  { action: 'restore', icon: <Icon10TitlebarRestore /> },
  { action: 'close', icon: <Icon10TitlebarClose /> }
] as const

export const Titlebar = defineComponent(() => {
  const { lang } = useEnv()
  const isMaximized = shallowRef(currentWindow.isMaximized())

  subscribeToElectronEvent(() => {
    function onMaximizeChange(event: IpcRendererEvent, value: boolean) {
      isMaximized.value = value
    }

    ipcRenderer.on('maximize-change', onMaximizeChange)
    return () => ipcRenderer.off('maximize-change', onMaximizeChange)
  })

  return () => {
    return (
      <div
        class={['Titlebar', {
          'Titlebar--maximized': isMaximized.value,
          'Titlebar--macOS': isMacOS
        }]}
        onDblclick={() => {
          if (isMacOS && !currentWindow.isFullScreen()) {
            if (isMaximized.value) {
              currentWindow.unmaximize()
            } else {
              currentWindow.maximize()
            }
          }
        }}
      >
        <div class="Titlebar__dragZone">{lang.use('vk_desktop_label')}</div>

        {!isMacOS && (
          <div class="Titlebar__buttons">
            {buttons.map(({ action, icon }) => (
              <div
                class={['Titlebar__button', `Titlebar__button--${action}`]}
                onClick={() => currentWindow[action]()}
              >
                {icon}
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }
})
