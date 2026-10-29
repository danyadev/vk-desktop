import { defineComponent, MouseEvent, shallowRef, watch } from 'vue'
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
import { Icon20CheckCircleOn } from 'assets/icons'
import './MessagesStack.css'

type Props = {
  convo?: Convo.Convo
  messages: NonEmptyArray<Message.Message | Message.Foreign>
}

export const MessagesStack = defineComponent<Props>((props) => {
  const { peers } = usePeersStore()
  const { peerInfoModal } = useGlobalModal()
  const session = useConvoSession()

  return () => {
    const [message] = props.messages
    const author = Peer.safeGet(peers, message.authorId)
    const isChat = message.peerId && Peer.isChatPeerId(message.peerId)
    const isChannel = props.convo && Convo.isChannel(props.convo)
    const showAvatar = (message.kind === 'Normal' || message.kind === 'Foreign') &&
      !message.isOut && (!props.convo || isChat) && !isChannel

    return (
      <div
        class={['MessagesStack', {
          'MessagesStack--out': message.isOut,
          'MessagesStack--withAvatar': showAvatar,
          'MessagesStack--selecting': !!props.convo && session.selectedCmids.size > 0
        }]}
      >
        {showAvatar && (
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
  const { selectedCmids } = session

  const toggleSelection = (cmid: Message.Cmid) => {
    if (selectedCmids.has(cmid)) selectedCmids.delete(cmid)
    else selectedCmids.add(cmid)
  }
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

  const onSelect = (event: MouseEvent) => {
    const { message } = props
    if (!selectedCmids.size || message.kind !== 'Normal' || window.getSelection()?.toString()) {
      return
    }
    event.preventDefault()
    event.stopPropagation()
    toggleSelection(message.cmid)
  }

  return () => {
    const { message, isHead } = props
    const isCentered = message.kind === 'Service' || message.kind === 'Expired'
    const isSelecting = !!props.convo && selectedCmids.size > 0
    const selectable = isSelecting && message.kind === 'Normal'
    const selected = message.kind === 'Normal' && selectedCmids.has(message.cmid)
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
          highlightTimeoutId.value && 'MessagesStack__message--highlighted',
          selectable && 'MessagesStack__message--selectable',
          selected && 'MessagesStack__message--selected'
        ]}
        data-cmid={message.kind === 'Foreign' ? undefined : message.cmid}
        onClickCapture={selectable ? onSelect : undefined}
        onContextmenu={isSelecting ? (event) => event.preventDefault() : undefined}
        tabindex={selectable ? 0 : undefined}
        onKeydown={selectable ? (event) => {
          if (event.target !== event.currentTarget) return
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            event.stopPropagation()
            if (message.kind === 'Normal') toggleSelection(message.cmid)
          }
        } : undefined}
      >
        {messageComponent}
        {props.convo && message.kind === 'Normal' && (
          <span class="MessagesStack__selection" aria-hidden="true">
            <Icon20CheckCircleOn />
          </span>
        )}
      </div>
    )

    return props.convo && message.kind !== 'Foreign'
      ? <MessageActionMenu message={message} convo={props.convo}>{content}</MessageActionMenu>
      : content
  }
}, {
  props: ['convo', 'message', 'isHead']
})
