import './Messenger.css'

import { defineComponent, onMounted, onUnmounted } from 'vue'
import { ENGINE_VERSION } from 'env/Engine'
import { useEnv } from 'misc/hooks'
import { ConvoList } from 'ui/messenger/ConvoList/ConvoList'

export const Messenger = defineComponent(() => {
  const { api, engine } = useEnv()

  onMounted(async () => {
    const longpollParams = await api.fetch('messages.getLongPollServer', {
      lp_version: ENGINE_VERSION,
      need_pts: 1
    })

    engine.start(longpollParams)
  })

  onUnmounted(() => {
    engine.stop()
  })

  return () => (
    <div class="Messenger">
      <ConvoList class="Messenger__convoList" />
      <div class="Messenger__content">
        контент
      </div>
    </div>
  )
})
