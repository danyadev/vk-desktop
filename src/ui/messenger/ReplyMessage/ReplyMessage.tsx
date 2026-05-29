import { defineComponent } from 'vue'
import * as Message from 'model/Message'
import * as Peer from 'model/Peer'
import { usePeersStore } from 'store/peers'
import { ClassName } from 'misc/utils'
import { MessagePreview } from 'ui/messenger/MessagePreview/MessagePreview'
import './ReplyMessage.css'

type Props = {
  reply: Message.Foreign
  onClick: () => void
  class?: ClassName
}

export const ReplyMessage = defineComponent<Props>((props) => {
  const { peers } = usePeersStore()

  return () => {
    const author = Peer.safeGet(peers, props.reply.authorId)

    return (
      <div class="ReplyMessage">
        <div class="ReplyMessage__name">
          {Peer.name(author)}
        </div>
        <div class="ReplyMessage__text">
          <MessagePreview message={props.reply} accent />
        </div>
      </div>
    )
  }
}, {
  props: ['reply']
})
