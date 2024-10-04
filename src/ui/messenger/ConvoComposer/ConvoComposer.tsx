import { defineComponent, ref } from 'vue'
import * as Convo from 'model/Convo'
import { useEnv } from 'hooks'
import { Button } from 'ui/ui/Button/Button'
import { Icon24Info, Icon24MuteOutline, Icon24VolumeOutline } from 'assets/icons'
import './ConvoComposer.css'

type Props = {
  convo: Convo.Convo
}

export const ConvoComposer = defineComponent<Props>((props) => {
  const { lang, api } = useEnv()
  const loading = ref(false)

  const toggleNotifications = async () => {
    try {
      loading.value = true

      await api.fetch('account.setSilenceMode', {
        peer_id: props.convo.id,
        sound: props.convo.notifications.enabled ? 0 : 1,
        time: props.convo.notifications.enabled ? -1 : 0
      })

      props.convo.notifications.enabled = !props.convo.notifications.enabled
    } finally {
      loading.value = false
    }
  }

  const renderPanel = () => {
    const isChannel = Convo.isChannel(props.convo)

    if (props.convo.kind === 'ChatConvo' && props.convo.status === 'kicked') {
      return (
        <div class="ConvoComposer__restriction">
          <Icon24Info color="var(--vkui--color_accent_orange)" />
          {lang.use('me_chat_kicked_status')}
        </div>
      )
    }

    if (isChannel) {
      return (
        <Button
          class="ConvoComposer__muteChannelButton"
          mode="tertiary"
          loading={loading.value}
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
    }

    return (
      <span
        class="ConvoComposer__input"
        contenteditable="plaintext-only"
        placeholder={lang.use('me_convo_composer_placeholder')}
      />
    )
  }

  return () => (
    <div class="ConvoComposer">
      <div class="ConvoComposer__panel">
        {renderPanel()}
      </div>
    </div>
  )
}, {
  props: ['convo']
})
