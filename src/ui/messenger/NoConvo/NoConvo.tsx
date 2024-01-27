import { defineComponent } from 'vue'
import { useEnv } from 'misc/hooks'
import './NoConvo.css'

export const NoConvo = defineComponent(() => {
  const { lang } = useEnv()

  return () => (
    <div class="NoConvo">
      {lang.use('me_choose_chat_to_write')}
    </div>
  )
})
