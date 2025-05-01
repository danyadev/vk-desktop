import { defineComponent, ref } from 'vue'
import * as Convo from 'model/Convo'
import * as Message from 'model/Message'
import * as Peer from 'model/Peer'
import { useConvosStore } from 'store/convos'
import { NonEmptyArray, RawRefElement } from 'misc/utils'
import { ConvoMessage } from 'ui/messenger/ConvoMessage/ConvoMessage'
import { ExpiredMessage } from 'ui/messenger/ExpiredMessage/ExpiredMessage'
import { ServiceMessage } from 'ui/messenger/ServiceMessage/ServiceMessage'
import { Avatar } from 'ui/ui/Avatar/Avatar'
import './MessagesStack.css'

type MessagesStackProps = {
  messages: NonEmptyArray<Message.Message>
  messageElements: Map<Message.Cmid, HTMLElement>
}

export const MessagesStack = defineComponent<MessagesStackProps>((props) => {
  const { cmidToScrollToByConvo } = useConvosStore()
  const highlightedMessages = ref(new Set<Message.Cmid>()).value

  const setMessageRef = (cmid: Message.Cmid, element: RawRefElement) => {
    if (element instanceof HTMLElement) {
      props.messageElements.set(cmid, element)
    } else {
      props.messageElements.delete(cmid)
    }
  }

  const renderMessage = (message: Message.Message, index: number) => {
    const highlighted = message.cmid && highlightedMessages.has(message.cmid)

    if (
      message.cmid &&
      cmidToScrollToByConvo.get(message.peerId) === message.cmid &&
      !highlighted
    ) {
      highlightedMessages.add(message.cmid)
      setTimeout(() => message.cmid && highlightedMessages.delete(message.cmid), 1000)
    }

    switch (message.kind) {
      case 'Normal':
        return (
          <div
            key={message.cmid}
            class={['MessagesStack__message', highlighted && 'MessagesStack__message--highlighted']}
            ref={(el) => setMessageRef(message.cmid, el)}
          >
            <ConvoMessage
              message={message}
              showName={index === 0 && Peer.isChatPeerId(message.peerId)}
            />
          </div>
        )

      case 'Pending':
        return (
          <div key={message.randomId} class="MessagesStack__message">
            <ConvoMessage
              message={message}
              showName={index === 0 && Peer.isChatPeerId(message.peerId)}
            />
          </div>
        )

      case 'Service':
        return (
          <div
            key={message.cmid}
            class={[
              'MessagesStack__message MessagesStack__message--centered',
              highlighted && 'MessagesStack__message--highlighted'
            ]}
            ref={(el) => setMessageRef(message.cmid, el)}
          >
            <ServiceMessage message={message} />
          </div>
        )

      case 'Expired':
        return (
          <div
            key={message.cmid}
            class={[
              'MessagesStack__message MessagesStack__message--centered',
              highlighted && 'MessagesStack__message--highlighted'
            ]}
            ref={(el) => setMessageRef(message.cmid, el)}
          >
            <ExpiredMessage count={1} />
          </div>
        )
    }
  }

  return () => {
    const [message] = props.messages
    const author = Peer.safeGet(message.authorId)
    const convo = Convo.safeGet(message.peerId)
    const isChat = Peer.isChatPeerId(convo.id)
    const isChannel = Convo.isChannel(convo)

    return (
      <div class={['MessagesStack', message.isOut && 'MessagesStack--out']}>
        {message.kind === 'Normal' && !message.isOut && isChat && !isChannel && (
          <Avatar class="MessagesStack__avatar" peer={author} size={32} />
        )}
        <div class="MessagesStack__messages">
          {props.messages.map(renderMessage)}
        </div>
      </div>
    )
  }
}, {
  props: ['messages', 'messageElements']
})
