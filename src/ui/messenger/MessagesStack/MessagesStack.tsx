import { defineComponent } from 'vue'
import * as Message from 'model/Message'
import * as Peer from 'model/Peer'
import { NonEmptyArray } from 'misc/utils'
import { ConvoMessage } from 'ui/messenger/ConvoMessage/ConvoMessage'
import { ExpiredMessage } from 'ui/messenger/ExpiredMessage/ExpiredMessage'
import { ServiceMessage } from 'ui/messenger/ServiceMessage/ServiceMessage'
import { Avatar } from 'ui/ui/Avatar/Avatar'
import './MessagesStack.css'

type MessagesStackProps = {
  messages: NonEmptyArray<Message.Message>
}

export const MessagesStack = defineComponent<MessagesStackProps>((props) => {
  const renderMessage = (message: Message.Message, index: number) => {
    switch (message.kind) {
      case 'Normal':
        return (
          <div class="MessagesStack__message" data-cmid={message.cmid}>
            <ConvoMessage message={message} showName={index === 0} />
          </div>
        )
      case 'Service':
        return (
          <div
            class="MessagesStack__message MessagesStack__message--centered"
            data-cmid={message.cmid}
          >
            <ServiceMessage message={message} />
          </div>
        )
      case 'Expired':
        return (
          <div
            class="MessagesStack__message MessagesStack__message--centered"
            data-cmid={message.cmid}
          >
            <ExpiredMessage count={1} />
          </div>
        )
    }
  }

  return () => {
    const [message] = props.messages
    const author = Peer.safeGet(message.authorId)

    return (
      <div class={['MessagesStack', message.isOut && 'MessagesStack--out']}>
        {message.kind === 'Normal' && !message.isOut && (
          <Avatar class="MessagesStack__avatar" peer={author} size={32} />
        )}
        <div class="MessagesStack__messages">
          {props.messages.map(renderMessage)}
        </div>
      </div>
    )
  }
}, {
  props: ['messages']
})