import { defineComponent } from 'vue'
import * as Convo from 'model/Convo'
import * as Message from 'model/Message'
import { Icon16CheckDoubleOutline, Icon16CheckOutline } from 'assets/icons'
import './MessageOutStatusIcon.css'

type Props = {
  message: Message.Message
}

export const MessageOutStatusIcon = defineComponent<Props>((props) => {
  return () => {
    if (!props.message.isOut) {
      return
    }

    const convo = Convo.safeGet(props.message.peerId)
    const isMessageUnread = Message.isUnread(props.message, convo)

    return isMessageUnread
      ? <Icon16CheckOutline class="MessageOutStatusIcon" />
      : <Icon16CheckDoubleOutline class="MessageOutStatusIcon" />
  }
}, {
  props: ['message']
})
