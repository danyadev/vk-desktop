import { defineComponent } from 'vue'
import * as Peer from 'model/Peer'
import { TypingUser } from 'store/convos'
import './ConvoTyping.css'

type Props = {
  typingUsers: TypingUser[]
}

export const ConvoTyping = defineComponent<Props>((props) => {
  return () => (
    <span class="ConvoTyping">
      {props.typingUsers.map(({ peerId, type }) => (
        <div>{type} - {Peer.name(Peer.safeGet(peerId))}</div>
      ))}
    </span>
  )
}, {
  props: ['typingUsers']
})
