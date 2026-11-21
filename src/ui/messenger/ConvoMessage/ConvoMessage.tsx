import { defineComponent } from 'vue'
import { useRouter } from 'vue-router'
import { useServices } from 'services'
import * as Attach from 'model/Attach'
import * as Message from 'model/Message'
import * as Peer from 'model/Peer'
import { useConvosStore } from 'store/convos'
import { usePeersStore } from 'store/peers'
import { useConvoSession, useGlobalModal } from 'hooks'
import { Attaches } from 'ui/messenger/attaches/Attaches'
import { ForwardedMessages } from 'ui/messenger/ForwardedMessages/ForwardedMessages'
import { MessageOutStatusIcon } from 'ui/messenger/MessageOutStatusIcon/MessageOutStatusIcon'
import { ReplyMessage } from 'ui/messenger/ReplyMessage/ReplyMessage'
import { ButtonIcon } from 'ui/ui/ButtonIcon/ButtonIcon'
import { ButtonText } from 'ui/ui/ButtonText/ButtonText'
import { Icon20MessageArrowRightOutline } from 'assets/icons'
import './ConvoMessage.css'

type Props = {
  message: Message.Normal | Message.Pending | Message.Foreign
  showName: boolean
}

export const ConvoMessage = defineComponent<Props>((props) => {
  const router = useRouter()
  const { lang } = useServices()
  const { peers } = usePeersStore()
  const convosStore = useConvosStore()
  const { peerInfoModal, messageViewerModal } = useGlobalModal()
  const session = useConvoSession()

  const navigateToReply = (reply: Message.Foreign) => {
    if (props.message.kind === 'Foreign') {
      messageViewerModal.open({ messages: [reply] })
    } else if (reply.isUnavailable && reply.cmid) {
      messageViewerModal.open({ peerId: props.message.peerId, cmid: reply.cmid })
    } else if (reply.cmid) {
      session.navigationRequest = { kind: 'Message', cmid: reply.cmid }
    }
  }

  const goToMessage = () => {
    if (!props.message.peerId || !props.message.cmid) {
      return
    }

    messageViewerModal.close()
    convosStore.requestNavigation(props.message.peerId, {
      kind: 'Message',
      cmid: props.message.cmid
    })
    router.push({
      name: 'Convo',
      params: { peerId: props.message.peerId },
      query: { canGoBack: 1 }
    })
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
          {isEmpty && <span class="ConvoMessage__empty">{lang.use('me_empty_message')}</span>}

          {hasAttaches && (
            <Attaches
              class="ConvoMessage__attaches"
              attaches={message.attaches}
              message={message}
            />
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

        {props.message.kind === 'Foreign' &&
          !props.message.isUnavailable &&
          props.message.peerId &&
          props.message.cmid && (
          <ButtonIcon
            class="ConvoMessage__goToMessage"
            icon={<Icon20MessageArrowRightOutline />}
            shiftOnClick
            onClick={goToMessage}
          />
        )}
      </div>
    )
  }
}, {
  props: ['message', 'showName']
})
