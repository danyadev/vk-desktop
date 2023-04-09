import './Messenger.css'
import { defineComponent } from 'vue'

export const Messenger = defineComponent(() => {
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
