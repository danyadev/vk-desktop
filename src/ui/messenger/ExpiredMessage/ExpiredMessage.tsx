import { defineComponent } from 'vue'
import { useEnv } from 'hooks'
import { Icon20BombOutline } from 'assets/icons'
import './ExpiredMessage.css'

type Props = {
  count: number
}

export const ExpiredMessage = defineComponent<Props>((props) => {
  const { lang } = useEnv()

  return () => (
    <div class="ExpiredMessage">
      <Icon20BombOutline class="ExpiredMessage__icon" color="var(--vkui--color_icon_contrast)" />
      {lang.usePlural('me_messages_disappeared', props.count)}
    </div>
  )
}, {
  props: ['count']
})
