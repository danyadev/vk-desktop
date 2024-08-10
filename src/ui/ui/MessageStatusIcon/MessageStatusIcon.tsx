import { defineComponent } from 'vue'
import * as Convo from 'model/Convo'
import * as Message from 'model/Message'
import { Icon16CheckDoubleOutline, Icon16CheckOutline } from 'assets/icons'
import './MessageStatusIcon.css'

type Props = {
  message: Message.Message
  class?: string
}

export const MessageStatusIcon = defineComponent<Props>((props) => {
  return () => {
    if (!props.message.isOut) {
      return
    }

    const convo = Convo.safeGet(props.message.peerId)
    const hasUnreadMessage = Message.isUnread(props.message, convo)

    return (
      hasUnreadMessage
        ? <Icon16CheckOutline class={['status', props.class]} />
        : <Icon16CheckDoubleOutline class={['status', props.class]} />
    )
  }
}, {
  props: ['message', 'class']
})
