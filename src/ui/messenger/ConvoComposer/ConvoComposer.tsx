import { defineComponent, KeyboardEvent, ref } from 'vue'
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
  const newMessage = ref('')
  const randomIds = ref<number[]>([])
  const repetId = ref(0)

  const printMessage = (event: KeyboardEvent<HTMLElement>) => {
    newMessage.value = event.currentTarget.textContent ?? ''

    if (event.code === 'Enter' && !event.shiftKey) {
      sendMessage()

      event.currentTarget.textContent = ''
      event.currentTarget.contentEditable = 'inherit'
      event.currentTarget.contentEditable = 'plaintext-only'
    }
  }

  const sendMessage = async () => {
    try {
      do {
        const randomNumber = Math.random()
        const id = Math.random() * randomNumber
        repetId.value = id

        randomIds.value.push(id)
      } while (repetId.value !== randomIds.value[randomIds.value.length - 1])

      await api.fetch('messages.send', {
        peer_id: props.convo.id,
        random_id: randomIds.value[randomIds.value.length - 1] ?? Math.random(),
        message: newMessage.value
      })
    } catch (error) {
      console.warn(error)
    }
  }

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
        onKeydown={printMessage}
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
