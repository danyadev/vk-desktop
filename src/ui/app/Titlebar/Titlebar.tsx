import './Titlebar.css'
import { defineComponent, ref } from 'vue'
import { isMacOS } from 'misc/constants'
import { currentWindow } from 'misc/utils'
import {
  Icon12TitlebarMinimize,
  Icon10TitlebarMaximize,
  Icon12TitlebarRestore,
  Icon10TitlebarClose
} from 'assets/icons'
import { useMainSettingsStore } from 'store/mainSettings'
import { useEnv } from 'misc/hooks'

const buttons = [
  { action: 'minimize', icon: <Icon12TitlebarMinimize /> },
  { action: 'maximize', icon: <Icon10TitlebarMaximize /> },
  { action: 'restore', icon: <Icon12TitlebarRestore /> },
  { action: 'close', icon: <Icon10TitlebarClose /> }
] as const

export const Titlebar = defineComponent(() => {
  const { lang } = useEnv()
  const mainSettings = useMainSettingsStore()
  const isMaximized = ref(currentWindow.isMaximized())

  const onMaximize = () => (isMaximized.value = true)
  const onUnmaximize = () => (isMaximized.value = false)

  currentWindow.on('maximize', onMaximize)
  currentWindow.on('unmaximize', onUnmaximize)

  window.addEventListener('beforeunload', () => {
    currentWindow.removeListener('maximize', onMaximize)
    currentWindow.removeListener('unmaximize', onUnmaximize)
  })

  return () => {
    if (!mainSettings.useCustomTitlebar) {
      return null
    }

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
      </div>
    )
  }
})
