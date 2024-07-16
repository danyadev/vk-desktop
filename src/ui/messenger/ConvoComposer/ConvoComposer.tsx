import { defineComponent } from 'vue'
import { useEnv } from 'hooks'
import './ConvoComposer.css'

export const ConvoComposer = defineComponent(() => {
  const { lang } = useEnv()

  return () => (
    <div class="ConvoComposer">
      <div class="ConvoComposer__panel">
        <div
          class="ConvoComposer__input"
          contenteditable
          placeholder={lang.use('me_convo_composer_placeholder')}
        />
      </div>
    </div>
  )
})
