import { defineComponent, ref } from 'vue'
import * as Convo from 'model/Convo'
import { useEnv } from 'hooks'
import { Button } from 'ui/ui/Button/Button'
import { Icon24MuteOutline, Icon24VolumeOutline } from 'assets/icons'
import './ConvoComposer.css'

type Props = {
  convo: Convo.Convo
}

export const ConvoComposer = defineComponent<Props>((props) => {
  const { lang, api } = useEnv()
  const loading = ref(false)

  return () => {
    const isChannel = Convo.isChannel(props.convo)
    const peer = Convo.safeGet(props.convo.id)

    const toggleNotifications = async () => {
      try {
        loading.value = true

        await api.fetch('account.setSilenceMode', {
          peer_id: peer.id,
          sound: props.convo.notifications.enabled ? 0 : 1,
          time: props.convo.notifications.enabled ? -1 : 0
        })

        props.convo.notifications.enabled = !props.convo.notifications.enabled
      } catch (error) {
        console.warn(error)
      } finally {
        loading.value = false
      }
    }

    return (
      <div class="ConvoComposer">
        <div class={['ConvoComposer__panel', {
          'ConvoComposer__panel--blocked': isChannel
        }]}
        >
          {!isChannel ? (
            <div
              class="ConvoComposer__input"
              contenteditable
              placeholder={lang.use('me_convo_composer_placeholder')}
            />
          ) : (
            <Button
              class="ConvoComposer__actionButton"
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
          )}
        </div>
      </div>
    )
  }
}, {
  props: ['convo']
})
