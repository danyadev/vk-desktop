import { defineComponent } from 'vue'
import { useServices } from 'hooks'
import './NoConvo.css'

export const NoConvo = defineComponent(() => {
  const { lang } = useServices()

  return () => (
    <div class="NoConvo">
      {lang.use('me_choose_chat_to_write')}
    </div>
  )
})
