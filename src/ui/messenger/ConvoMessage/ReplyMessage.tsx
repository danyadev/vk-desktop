import { defineComponent } from 'vue'
import * as Message from 'model/Message'
import * as Peer from 'model/Peer'
import { ClassName } from 'misc/utils'
import { MessagePreview } from 'ui/messenger/MessagePreview/MessagePreview'
import './ReplyMessage.css'

type Props = {
  reply: Message.Foreign
  class: ClassName
}

export const ReplyMessage = defineComponent<Props>((props) => {
  return () => {
    const author = Peer.safeGet(props.reply.authorId)

    return (
      <div class={['ReplyMessage', props.class]}>
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
  props: ['reply', 'class']
})
