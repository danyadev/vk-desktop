import { defineComponent, shallowRef, watch } from 'vue'
import * as Convo from 'model/Convo'
import * as Message from 'model/Message'
import * as Peer from 'model/Peer'
import { usePeersStore } from 'store/peers'
import { useConvoSession, useGlobalModal } from 'hooks'
import { JSXElement, NonEmptyArray } from 'misc/utils'
import { ConvoMessage } from 'ui/messenger/ConvoMessage/ConvoMessage'
import { ExpiredMessage } from 'ui/messenger/ExpiredMessage/ExpiredMessage'
import { MessageActionMenu } from 'ui/messenger/MessageActionMenu/MessageActionMenu'
import { ServiceMessage } from 'ui/messenger/ServiceMessage/ServiceMessage'
import { Avatar } from 'ui/ui/Avatar/Avatar'
import { ButtonBase } from 'ui/ui/ButtonBase/ButtonBase'
import './MessagesStack.css'

type Props = {
  convo?: Convo.Convo
  messages: NonEmptyArray<Message.Message | Message.Foreign>
}

export const MessagesStack = defineComponent<Props>((props) => {
  const { peers } = usePeersStore()
  const { peerInfoModal } = useGlobalModal()

  return () => {
    const [message] = props.messages
    const author = Peer.safeGet(peers, message.authorId)
    const isChat = message.peerId && Peer.isChatPeerId(message.peerId)
    const isChannel = props.convo && Convo.isChannel(props.convo)

    return (
      <div class={['MessagesStack', message.isOut && 'MessagesStack--out']}>
        {(message.kind === 'Normal' || message.kind === 'Foreign') &&
          !message.isOut &&
          (!props.convo || isChat) &&
          !isChannel && (
          <ButtonBase
            class="MessagesStack__avatar"
            onClick={() => peerInfoModal.open({ peerId: author.id })}
            tabindex={-1}
          >
            <Avatar peer={author} size={32} />
          </ButtonBase>
        )}
        <div class="MessagesStack__messages">
          {props.messages.map((message, index) => (
            <StackMessage
              key={message.kind === 'Foreign'
                ? index
                : message.kind === 'Pending'
                  ? message.randomId
                  : message.cmid}
              convo={props.convo}
              message={message}
              isHead={index === 0}
            />
          ))}
        </div>
      </div>
    )
  }
}, {
  props: ['convo', 'messages']
})

type StackMessageProps = {
  convo?: Convo.Convo
  message: Message.Message | Message.Foreign
  isHead: boolean
}

const StackMessage = defineComponent<StackMessageProps>((props) => {
  const session = useConvoSession()
  const highlightTimeoutId = shallowRef<number>()

  watch(() => session.navigationRequest, (request) => {
    if (
      request?.kind === 'Message' &&
      request.cmid === props.message.cmid &&
      request.highlight !== false
    ) {
      window.clearTimeout(highlightTimeoutId.value)
      highlightTimeoutId.value = window.setTimeout(() => {
        highlightTimeoutId.value = undefined
      }, 1000)
    }
  }, { immediate: true })

  return () => {
    const { message, isHead } = props
    const isCentered = message.kind === 'Service' || message.kind === 'Expired'
    let messageComponent: JSXElement

    switch (message.kind) {
      case 'Normal':
      case 'Pending':
      case 'Foreign':
        messageComponent = (
          <ConvoMessage
            message={message}
            showName={isHead && (
              !props.convo || (!!message.peerId && Peer.isChatPeerId(message.peerId))
            )}
          />
        )
        break

      case 'Service':
        messageComponent = <ServiceMessage message={message} />
        break

      case 'Expired':
        messageComponent = <ExpiredMessage count={1} />
        break
    }

    const content = (
      <div
        class={[
          'MessagesStack__message',
          isCentered && 'MessagesStack__message--centered',
          highlightTimeoutId.value && 'MessagesStack__message--highlighted'
        ]}
        data-cmid={message.kind === 'Foreign' ? undefined : message.cmid}
      >
        {messageComponent}
      </div>
    )

    return props.convo && message.kind !== 'Foreign'
      ? <MessageActionMenu message={message} convo={props.convo}>{content}</MessageActionMenu>
      : content
  }
}, {
  props: ['convo', 'message', 'isHead']
})
