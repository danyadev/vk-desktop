import { ChangeEvent, computed, defineComponent, KeyboardEvent, shallowRef } from 'vue'
import * as Convo from 'model/Convo'
import { useEnv } from 'hooks'
import { isEventWithModifier, random } from 'misc/utils'
import { INTEGER_BOUNDARY } from 'misc/constants'
import { Button } from 'ui/ui/Button/Button'
import { ButtonIcon } from 'ui/ui/ButtonIcon/ButtonIcon'
import { Icon24Info, Icon24MuteOutline, Icon24Send, Icon24VolumeOutline } from 'assets/icons'
import './ConvoComposer.css'

type Props = {
  convo: Convo.Convo
}

export const ConvoComposer = defineComponent<Props>((props) => {
  const { lang, api } = useEnv()
  const isNotificationsUpdating = shallowRef(false)
  const isMessageSending = shallowRef(false)
  const text = shallowRef('')
  const $input = shallowRef<HTMLSpanElement | null>(null)

  const isEmpty = computed(() => text.value.trim() === '')

  const sendMessage = async () => {
    try {
      isMessageSending.value = true

      await api.fetch('messages.send', {
        peer_id: props.convo.id,
        random_id: random(-INTEGER_BOUNDARY, INTEGER_BOUNDARY),
        message: text.value
      })

      if ($input.value) {
        text.value = ''
        $input.value.textContent = ''
      }
    } catch (error) {
      console.warn(error)
    } finally {
      isMessageSending.value = false
    }
  }

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.code === 'Enter' && !isEventWithModifier(event)) {
      // Предотвращаем перенос строки
      event.preventDefault()

      if (isEmpty.value) {
        return
      }

      sendMessage()
    }
  }

  const onInput = (event: ChangeEvent<HTMLElement>) => {
    text.value = event.currentTarget.textContent ?? ''
  }

  const toggleNotifications = async () => {
    try {
      isNotificationsUpdating.value = true

      await api.fetch('account.setSilenceMode', {
        peer_id: props.convo.id,
        sound: props.convo.notifications.enabled ? 0 : 1,
        time: props.convo.notifications.enabled ? -1 : 0
      })

      props.convo.notifications.enabled = !props.convo.notifications.enabled
    } finally {
      isNotificationsUpdating.value = false
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
          loading={isNotificationsUpdating.value}
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
      <>
        <span
          class="ConvoComposer__input"
          contenteditable="plaintext-only"
          role="textbox"
          placeholder={lang.use('me_convo_composer_placeholder')}
          ref={$input}
          onKeydown={onKeyDown}
          onInput={onInput}
        />
        <ButtonIcon
          class="ConvoComposer__send"
          disabled={isEmpty.value}
          loading={isMessageSending.value}
          icon={<Icon24Send />}
          addHoverBackground={false}
          onClick={sendMessage}
          // Предотвращаем сброс фокуса с поля ввода
          onMousedown={(event) => event.preventDefault()}
        />
      </>
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
