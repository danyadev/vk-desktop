import { defineComponent } from 'vue'
import { useRouter } from 'vue-router'
import { useServices } from 'services'
import * as Attach from 'model/Attach'
import * as Message from 'model/Message'
import * as Peer from 'model/Peer'
import { useConvosStore } from 'store/convos'
import { usePeersStore } from 'store/peers'
import { useConvoSession, useFormatDate, useGlobalModal } from 'hooks'
import { NonEmptyArray } from 'misc/utils'
import { Attaches } from 'ui/messenger/attaches/Attaches'
import { Avatar } from 'ui/ui/Avatar/Avatar'
import { ButtonBase } from 'ui/ui/ButtonBase/ButtonBase'
import { ButtonIcon } from 'ui/ui/ButtonIcon/ButtonIcon'
import { ButtonText } from 'ui/ui/ButtonText/ButtonText'
import { Icon20MessageArrowRightOutline } from 'assets/icons'
import './ForwardedMessages.css'

type Props = {
  messages: NonEmptyArray<Message.Foreign>
}

export const ForwardedMessages = defineComponent<Props>((props) => {
  const router = useRouter()
  const { lang } = useServices()
  const session = useConvoSession()
  const convosStore = useConvosStore()
  const { peers } = usePeersStore()
  const { peerInfoModal } = useGlobalModal()
  const formatDate = useFormatDate({ relativeTime: false })

  const goToMessage = (message: Message.Foreign) => {
    if (!message.peerId || !message.cmid) {
      return
    }

    const request = {
      kind: 'Message' as const,
      cmid: message.cmid
    }

    if (message.peerId === message.rootPeerId) {
      session.navigationRequest = request
    } else {
      router.push({
        name: 'Convo',
        params: {
          peerId: message.peerId
        },
        query: {
          canGoBack: 1
        }
      })

      convosStore.requestNavigation(message.peerId, request)
    }
  }

  return () => (
    props.messages.map((message) => {
      const author = Peer.safeGet(peers, message.authorId)
      const hasAttaches = Attach.kindsCount(message.attaches) > 0
      const isEmpty =
        !message.text &&
        !hasAttaches &&
        !message.replyMessage &&
        !message.forwardedMessages

      return (
        <div class="ForwardedMessage">
          <div class="ForwardedMessage__header">
            <ButtonBase
              class="ForwardedMessage__avatar"
              onClick={() => peerInfoModal.open({ peerId: author.id })}
              tabindex={-1}
            >
              <Avatar peer={author} size={32} />
            </ButtonBase>

            <ButtonText
              class="ForwardedMessage__name"
              onClick={() => peerInfoModal.open({ peerId: author.id })}
            >
              {Peer.name(author)}
            </ButtonText>
            <div class="ForwardedMessage__date">
              {formatDate(message.sentAt)}
              {message.updatedAt && (' · ' + lang.use('me_edited_label'))}
            </div>

            {!message.isUnavailable && (
              <ButtonIcon
                class="ForwardedMessage__goToMessage"
                shiftOnClick
                icon={<Icon20MessageArrowRightOutline />}
                onClick={() => goToMessage(message)}
              />
            )}
          </div>

          {message.text && <span class="ForwardedMessage__text">{message.text}</span>}
          {hasAttaches && (
            <Attaches class="ForwardedMessage__attaches" attaches={message.attaches} message={message} />
          )}

          {message.replyMessage && (
            <div class="ForwardedMessage__nested">
              {lang.use('me_in_reply_to_message')}
            </div>
          )}
          {message.forwardedMessages && (
            <div class="ForwardedMessage__nested">
              {lang.usePlural('me_messages', message.forwardedMessages.length)}
            </div>
          )}

          {isEmpty && (
            <div class="ForwardedMessage__empty">
              {lang.use('me_empty_message')}
            </div>
          )}
        </div>
      )
    })
  )
}, {
  props: ['messages']
})
