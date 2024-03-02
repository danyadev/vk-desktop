import { defineComponent } from 'vue'
import './ConvoComposer.css'

export const ConvoComposer = defineComponent(() => {
  return () => (
    <div class="ConvoComposer">
      <div class="ConvoComposer__panel">
        <div
          class="ConvoComposer__input"
          contenteditable
          placeholder="Напишите сообщение..."
        />
      </div>
    </div>
  )
})
