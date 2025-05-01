import { defineComponent } from 'vue'
import { useRouter } from 'vue-router'
import * as Attach from 'model/Attach'
import * as Message from 'model/Message'
import * as Peer from 'model/Peer'
import { useConvosStore } from 'store/convos'
import { useEnv, useFormatDate } from 'hooks'
import { NonEmptyArray } from 'misc/utils'
import { Attaches } from 'ui/messenger/attaches/Attaches'
import { Avatar } from 'ui/ui/Avatar/Avatar'
import { ButtonIcon } from 'ui/ui/ButtonIcon/ButtonIcon'
import { Icon20MessageArrowRightOutline } from 'assets/icons'
import './ForwardedMessages.css'

type Props = {
  messages: NonEmptyArray<Message.Foreign>
}

export const ForwardedMessages = defineComponent<Props>((props) => {
  const router = useRouter()
  const { lang } = useEnv()
  const { cmidToScrollToByConvo } = useConvosStore()
  const formatDate = useFormatDate({ relativeTime: false })

  const goToMessage = (message: Message.Foreign) => {
    console.log(message)
    if (!message.peerId || !message.cmid) {
      return
    }

    router.push({
      name: 'Convo',
      params: {
        peerId: message.peerId
      },
      query: {
        canGoBack: 1
      }
    })
    cmidToScrollToByConvo.set(message.peerId, message.cmid)
  }

  return () => (
    props.messages.map((message) => {
      const author = Peer.safeGet(message.authorId)
      const hasAttaches = Attach.kindsCount(message.attaches) > 0
      const isEmpty =
        !message.text &&
        !hasAttaches &&
        !message.replyMessage &&
        !message.forwardedMessages

      return (
        <div class="ForwardedMessage">
          <div class="ForwardedMessage__header">
            <Avatar class="ForwardedMessage__avatar" peer={author} size={32} />

            <div class="ForwardedMessage__name">{Peer.name(author)}</div>
            <div class="ForwardedMessage__date">
              {formatDate(message.sentAt)}
              {message.updatedAt && (' · ' + lang.use('me_edited_label'))}
            </div>

            {!message.isUnavailable && (
              <ButtonIcon
                class="ForwardedMessage__goToMessage"
                shiftOnClick
                addHoverBackground={false}
                icon={<Icon20MessageArrowRightOutline />}
                onClick={() => goToMessage(message)}
              />
            )}
          </div>

          {message.text && <span class="ForwardedMessage__text">{message.text}</span>}
          {hasAttaches && (
            <Attaches class="ForwardedMessage__attaches" attaches={message.attaches} />
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
