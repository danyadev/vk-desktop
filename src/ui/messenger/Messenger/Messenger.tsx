import { defineComponent, onMounted } from 'vue'
import { loadInitialData } from 'actions'
import { ConvoList } from 'ui/messenger/ConvoList/ConvoList'
import './Messenger.css'

export const Messenger = defineComponent(() => {
  onMounted(() => {
    loadInitialData()
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
