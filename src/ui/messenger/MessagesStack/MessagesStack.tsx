import { defineComponent, MouseEvent, shallowRef, watch } from 'vue'
import * as Convo from 'model/Convo'
import * as History from 'model/History'
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
          'MessagesStack--selecting': session.selectedCmids.size > 0
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
    if (!props.convo || props.message.kind === 'Pending' || props.message.kind === 'Foreign') return

    const { cmid } = props.message
    const { selectedCmids, selectionAnchorCmid } = session

    if (event.shiftKey && selectionAnchorCmid && selectedCmids.has(selectionAnchorCmid)) {
      const { history } = props.convo
      const from = History.findNode(history, selectionAnchorCmid, true)
      const to = History.findNode(history, cmid, true)

      if (from !== null && to !== null) {
        const nodes = history.slice(Math.min(from, to), Math.max(from, to) + 1)
        if (nodes.every((node) => node.kind === 'Item')) {
          for (const { item } of nodes) selectedCmids.add(item.cmid)
          return
        }
      }
    }

    if (selectedCmids.has(cmid)) {
      selectedCmids.delete(cmid)
    } else {
      selectedCmids.add(cmid)
      session.selectionAnchorCmid = cmid
    }
  }

  return () => {
    const { message, isHead } = props
    const isCentered = message.kind === 'Service' || message.kind === 'Expired'
    const isConfirmed = message.kind !== 'Pending' && message.kind !== 'Foreign'
    const isSelecting = !!props.convo && session.selectedCmids.size > 0
    const selectable = isSelecting && isConfirmed
    const selected = isConfirmed && session.selectedCmids.has(message.cmid)
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
          message.kind === 'Service' && 'MessagesStack__message--service',
          highlightTimeoutId.value && 'MessagesStack__message--highlighted',
          selectable && 'MessagesStack__message--selectable',
          selected && 'MessagesStack__message--selected'
        ]}
        data-cmid={message.kind === 'Foreign' ? undefined : message.cmid}
        onClick={selectable ? onSelect : undefined}
      >
        {props.convo && isConfirmed && (
          <span class="MessagesStack__selection">
            <Icon20CheckCircleOn />
          </span>
        )}
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
