import { defineComponent, shallowRef, watch } from 'vue'
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

type Props = {
  messages: NonEmptyArray<Message.Message>
  setMessageRef: (cmid: Message.Cmid, el: RawRefElement) => void
}

export const MessagesStack = defineComponent<Props>((props) => {
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
          {props.messages.map((message, index) => (
            <StackMessage
              key={message.kind === 'Pending' ? message.randomId : message.cmid}
              message={message}
              isHead={index === 0}
              setMessageRef={props.setMessageRef}
            />
          ))}
        </div>
      </div>
    )
  }
}, {
  props: ['messages', 'setMessageRef']
})

type StackMessageProps = {
  message: Message.Message
  isHead: boolean
  setMessageRef: (cmid: Message.Cmid, el: RawRefElement) => void
}

const StackMessage = defineComponent<StackMessageProps>((props) => {
  const { scrollAnchors } = useConvosStore()
  const highlighted = shallowRef(false)

  watch(() => scrollAnchors.get(props.message.peerId), (anchor) => {
    if (anchor?.kind === 'Message' && anchor.cmid === props.message.cmid) {
      highlighted.value = true
      setTimeout(() => (highlighted.value = false), 1000)
    }
  }, { immediate: true })

  return () => {
    const { message, isHead, setMessageRef } = props

    switch (message.kind) {
      case 'Normal':
        return (
          <div
            class={[
              'MessagesStack__message',
              highlighted.value && 'MessagesStack__message--highlighted'
            ]}
            ref={(el) => setMessageRef(message.cmid, el)}
          >
            <ConvoMessage
              message={message}
              showName={isHead && Peer.isChatPeerId(message.peerId)}
            />
          </div>
        )

      case 'Pending':
        return (
          <div class="MessagesStack__message">
            <ConvoMessage
              message={message}
              showName={isHead && Peer.isChatPeerId(message.peerId)}
            />
          </div>
        )

      case 'Service':
        return (
          <div
            class={[
              'MessagesStack__message MessagesStack__message--centered',
              highlighted.value && 'MessagesStack__message--highlighted'
            ]}
            ref={(el) => setMessageRef(message.cmid, el)}
          >
            <ServiceMessage message={message} />
          </div>
        )

      case 'Expired':
        return (
          <div
            class={[
              'MessagesStack__message MessagesStack__message--centered',
              highlighted.value && 'MessagesStack__message--highlighted'
            ]}
            ref={(el) => setMessageRef(message.cmid, el)}
          >
            <ExpiredMessage count={1} />
          </div>
        )
    }
  }
}, {
  props: ['message', 'isHead', 'setMessageRef']
})
