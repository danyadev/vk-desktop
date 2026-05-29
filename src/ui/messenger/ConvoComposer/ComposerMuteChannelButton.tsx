import { defineComponent, shallowRef } from 'vue'
import { useServices } from 'services'
import * as Convo from 'model/Convo'
import { Button } from 'ui/ui/Button/Button'
import { Icon24MuteOutline, Icon24VolumeOutline } from 'assets/icons'
import './ComposerMuteChannelButton.css'

type Props = {
  convo: Convo.Convo
}

export const ComposerMuteChannelButton = defineComponent<Props>((props) => {
  const { lang, api } = useServices()
  const isLoading = shallowRef(false)

  const toggleNotifications = async () => {
    try {
      isLoading.value = true

      await api.fetch('account.setSilenceMode', {
        peer_id: props.convo.id,
        sound: props.convo.notifications.enabled ? 0 : 1,
        time: props.convo.notifications.enabled ? -1 : 0
      })

      props.convo.notifications.enabled = !props.convo.notifications.enabled
    } finally {
      isLoading.value = false
    }
  }

  return () => (
    <Button
      class="ComposerMuteChannelButton"
      mode="tertiary"
      loading={isLoading.value}
      onClick={toggleNotifications}
      before={
        props.convo.notifications.enabled
          ? <Icon24MuteOutline />
          : <Icon24VolumeOutline />
      }
    >
      {props.convo.notifications.enabled
        ? lang.use('me_convo_disable_notifications')
        : lang.use('me_convo_enable_notifications')}
    </Button>
  )
}, {
  props: ['convo']
})
