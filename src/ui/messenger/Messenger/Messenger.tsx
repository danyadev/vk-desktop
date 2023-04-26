import './Messenger.css'
import { defineComponent, onMounted } from 'vue'
import { useEnv } from 'misc/hooks'
import { ENGINE_VERSION } from 'env/Engine'

export const Messenger = defineComponent(() => {
  const { api, engine } = useEnv()

  onMounted(async () => {
    const longpollParams = await api.fetch('messages.getLongPollServer', {
      lp_version: ENGINE_VERSION,
      need_pts: 1
    })

    engine.start(longpollParams)
    // TODO () => engine.stop()
  })

  return () => (
    <div class="Messenger">
      <div class="Messenger__leftPanel">
        <div class="Messenger__leftPanelHeader">
          шапка
        </div>
        <div class="Messenger__leftPanelContent">
          список диалогов
        </div>
      </div>
      <div class="Messenger__content">
        контент
      </div>
    </div>
  )
})
