import './Titlebar.css'
import { defineComponent, ref } from 'vue'
import { isMacOS } from 'misc/constants'
import { currentWindow } from 'misc/utils'
import Icon12TitlebarMinimize from 'assets/Icon12TitlebarMinimize.svg'
import Icon10TitlebarMaximize from 'assets/Icon10TitlebarMaximize.svg'
import Icon12TitlebarRestore from 'assets/Icon12TitlebarRestore.svg'
import Icon10TitlebarClose from 'assets/Icon10TitlebarClose.svg'
import { useMainSettingsStore } from 'store/mainSettings'
import { useEnv } from 'misc/hooks'

const buttons = [
  { action: 'minimize' as const, icon: <Icon12TitlebarMinimize /> },
  { action: 'maximize' as const, icon: <Icon10TitlebarMaximize /> },
  { action: 'restore' as const, icon: <Icon12TitlebarRestore /> },
  { action: 'close' as const, icon: <Icon10TitlebarClose /> }
]

export const Titlebar = defineComponent(() => {
  const { lang } = useEnv()
  const mainSettingsStore = useMainSettingsStore()
  const isMaximized = ref(currentWindow.isMaximized())

  const onMaximize = () => (isMaximized.value = true)
  const onUnmaximize = () => (isMaximized.value = false)

  currentWindow.on('maximize', onMaximize)
  currentWindow.on('unmaximize', onUnmaximize)

  window.addEventListener('beforeunload', () => {
    currentWindow.removeListener('maximize', onMaximize)
    currentWindow.removeListener('unmaximize', onUnmaximize)
  })

  return () => (
    <div
      class={['Titlebar', {
        'Titlebar--disabled': !mainSettingsStore.useCustomTitlebar,
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
})
