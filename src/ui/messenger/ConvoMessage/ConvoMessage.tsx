import { defineComponent } from 'vue'
import { useServices } from 'services'
import * as Attach from 'model/Attach'
import * as Message from 'model/Message'
import * as Peer from 'model/Peer'
import { usePeersStore } from 'store/peers'
import { useConvoSession, useGlobalModal } from 'hooks'
import { Attaches } from 'ui/messenger/attaches/Attaches'
import { ForwardedMessages } from 'ui/messenger/ForwardedMessages/ForwardedMessages'
import { MessageOutStatusIcon } from 'ui/messenger/MessageOutStatusIcon/MessageOutStatusIcon'
import { ReplyMessage } from 'ui/messenger/ReplyMessage/ReplyMessage'
import { ButtonText } from 'ui/ui/ButtonText/ButtonText'
import './ConvoMessage.css'

type Props = {
  message: Message.Normal | Message.Pending | Message.Foreign
  showName: boolean
}

export const ConvoMessage = defineComponent<Props>((props) => {
  const { lang } = useServices()
  const { peers } = usePeersStore()
  const { peerInfoModal, messagePreviewModal, messagesModal } = useGlobalModal()
  const session = useConvoSession()

  const navigateToReply = (reply: Message.Foreign) => {
    if (props.message.kind === 'Foreign') {
      messagesModal.open({ messages: [reply] })
    } else if (reply.isUnavailable && reply.cmid) {
      messagePreviewModal.open({ peerId: props.message.peerId, cmid: reply.cmid })
    } else if (reply.cmid) {
      session.navigationRequest = { kind: 'Message', cmid: reply.cmid }
    }
  }

  return () => {
    const { message, showName } = props
    const author = Peer.safeGet(peers, message.authorId)
    const hasAttaches = Attach.kindsCount(message.attaches) > 0
    const isEmpty =
      !message.text &&
      !hasAttaches &&
      !message.replyMessage &&
      !message.forwardedMessages

    return (
      <div
        class={['ConvoMessage', {
          'ConvoMessage--out': message.isOut
        }]}
      >
        <div class="ConvoMessage__content">
          {showName && !message.isOut && (
            <ButtonText
              class="ConvoMessage__author"
              onClick={() => peerInfoModal.open({ peerId: author.id })}
            >
              {Peer.name(author)}
            </ButtonText>
          )}

          {message.replyMessage && (
            <ReplyMessage
              class="ConvoMessage__reply"
              reply={message.replyMessage}
              onClick={() => navigateToReply(message.replyMessage!)}
            />
          )}

          {message.text && <span class="ConvoMessage__text">{message.text}</span>}
          {hasAttaches && <Attaches class="ConvoMessage__attaches" attaches={message.attaches} message={message} />}

          {isEmpty && (
            <span class="ConvoMessage__empty">
              {lang.use('me_empty_message')}
            </span>
          )}

          {message.forwardedMessages && <ForwardedMessages messages={message.forwardedMessages} />}

          <span class="ConvoMessage__time">
            {message.updatedAt && (lang.use('me_edited_label') + ' · ')}
            {lang
              .dateTimeFormatter({ hour: '2-digit', minute: '2-digit' })
              .format(message.sentAt)}
            {props.message.isOut && props.message.kind !== 'Foreign' && (
              <span class="ConvoMessage__status">
                <MessageOutStatusIcon message={props.message} />
              </span>
            )}
          </span>
        </div>
      </div>
    )
  }
}, {
  props: ['message', 'showName']
})
