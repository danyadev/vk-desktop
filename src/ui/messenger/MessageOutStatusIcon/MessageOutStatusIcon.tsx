import { defineComponent } from 'vue'
import * as Convo from 'model/Convo'
import * as Message from 'model/Message'
import { Icon12ClockOutline, Icon12ErrorCircleFill, Icon16CheckDoubleOutline, Icon16CheckOutline } from 'assets/icons'
import './MessageOutStatusIcon.css'

type Props = {
  message: Message.Message
}

export const MessageOutStatusIcon = defineComponent<Props>((props) => {
  return () => {
    if (!props.message.isOut) {
      return
    }

    if (props.message.kind === 'Pending' && !props.message.cmid) {
      return props.message.isFailed
        ? <Icon12ErrorCircleFill class="MessageOutStatusIcon MessageOutStatusIcon--failed" />
        : <Icon12ClockOutline class="MessageOutStatusIcon MessageOutStatusIcon--pending" />
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
