import { ChangeEvent, computed, defineComponent, KeyboardEvent, shallowRef } from 'vue'
import * as Convo from 'model/Convo'
import { sendMessage } from 'actions'
import { useEnv } from 'hooks'
import { isEventWithModifier } from 'misc/utils'
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
  const text = shallowRef('')
  const $input = shallowRef<HTMLSpanElement | null>(null)

  const isEmpty = computed(() => text.value.trim() === '')

  const onMessageSend = () => {
    sendMessage(props.convo.id, text.value)

    text.value = ''
    $input.value && ($input.value.innerText = '')
  }

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.code === 'Enter' && !isEventWithModifier(event)) {
      // Предотвращаем перенос строки
      event.preventDefault()

      if (isEmpty.value) {
        return
      }

      onMessageSend()
    }
  }

  const onInput = (event: ChangeEvent<HTMLElement>) => {
    text.value = event.currentTarget.innerText ?? ''
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
    if (props.convo.kind === 'ChatConvo' && props.convo.status === 'kicked') {
      return (
        <div class="ConvoComposer__restriction">
          <Icon24Info color="var(--vkui--color_accent_orange)" />
          {lang.use('me_chat_kicked_status')}
        </div>
      )
    }

    if (Convo.isChannel(props.convo)) {
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
          icon={<Icon24Send />}
          addHoverBackground={false}
          onClick={onMessageSend}
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
