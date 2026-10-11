import { defineComponent, shallowRef } from 'vue'
import { useServices } from 'services'
import * as Convo from 'model/Convo'
import { toggleConvoNotifications } from 'actions'
import { Button } from 'ui/ui/Button/Button'
import { Icon24MuteOutline, Icon24VolumeOutline } from 'assets/icons'
import './ComposerMuteChannelButton.css'

type Props = {
  convo: Convo.Convo
}

export const ComposerMuteChannelButton = defineComponent<Props>((props) => {
  const { lang } = useServices()
  const isLoading = shallowRef(false)

  const toggleNotifications = async () => {
    try {
      isLoading.value = true
      await toggleConvoNotifications(props.convo)
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
        ? lang.use('me_convo_menu_mute')
        : lang.use('me_convo_menu_unmute')}
    </Button>
  )
}, {
  props: ['convo']
})
