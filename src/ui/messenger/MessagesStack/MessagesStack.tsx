import { defineComponent, shallowRef, watch } from 'vue'
import * as Convo from 'model/Convo'
import * as Message from 'model/Message'
import * as Peer from 'model/Peer'
import { useConvosStore } from 'store/convos'
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
  messages: NonEmptyArray<Message.Message>
  openMessagePreview: (cmid: Message.Cmid) => void
}

export const MessagesStack = defineComponent<Props>((props) => {
  const { convos } = useConvosStore()
  const { peers } = usePeersStore()
  const { peerInfoModal } = useGlobalModal()

  return () => {
    const [message] = props.messages
    const author = Peer.safeGet(peers, message.authorId)
    const convo = Convo.safeGet(convos, message.peerId)
    const isChat = Peer.isChatPeerId(convo.id)
    const isChannel = Convo.isChannel(convo)

    return (
      <div class={['MessagesStack', message.isOut && 'MessagesStack--out']}>
        {message.kind === 'Normal' && !message.isOut && isChat && !isChannel && (
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
              key={message.kind === 'Pending' ? message.randomId : message.cmid}
              convo={convo}
              message={message}
              isHead={index === 0}
              openMessagePreview={props.openMessagePreview}
            />
          ))}
        </div>
      </div>
    )
  }
}, {
  props: ['messages', 'openMessagePreview']
})

type StackMessageProps = {
  convo: Convo.Convo
  message: Message.Message
  isHead: boolean
  openMessagePreview: (cmid: Message.Cmid) => void
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
    let content: JSXElement

    switch (message.kind) {
      case 'Normal':
      case 'Pending':
        content = (
          <ConvoMessage
            message={message}
            showName={isHead && Peer.isChatPeerId(message.peerId)}
            openMessagePreview={props.openMessagePreview}
          />
        )
        break

      case 'Service':
        content = <ServiceMessage message={message} />
        break

      case 'Expired':
        content = <ExpiredMessage count={1} />
        break
    }

    return (
      <MessageActionMenu message={message} convo={props.convo}>
        <div
          class={[
            'MessagesStack__message',
            isCentered && 'MessagesStack__message--centered',
            highlightTimeoutId.value && 'MessagesStack__message--highlighted'
          ]}
          data-cmid={message.cmid}
        >
          {content}
        </div>
      </MessageActionMenu>
    )
  }
}, {
  props: ['convo', 'message', 'isHead', 'openMessagePreview']
})
