import { defineComponent } from 'vue'
import * as Attach from 'model/Attach'
import * as Message from 'model/Message'
import * as Peer from 'model/Peer'
import { useEnv } from 'hooks'
import { NonEmptyArray } from 'misc/utils'
import { Attaches } from 'ui/messenger/attaches/Attaches'
import { Avatar } from 'ui/ui/Avatar/Avatar'
import './ForwardedMessages.css'

type Props = {
  messages: NonEmptyArray<Message.Foreign>
}

export const ForwardedMessages = defineComponent<Props>((props) => {
  const { lang } = useEnv()

  return () => (
    props.messages.map((message) => {
      const author = Peer.safeGet(message.authorId)
      const hasAttaches = Attach.kindsCount(message.attaches) > 0
      const isEmpty =
        !message.text &&
        !hasAttaches &&
        !message.replyMessage &&
        !message.forwardedMessages
      const date = lang.dateTimeFormatter({
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(message.sentAt)

      return (
        <div class="ForwardedMessage">
          <div class="ForwardedMessage__header">
            <Avatar class="ForwardedMessage__avatar" peer={author} size={32} />
            <div class="ForwardedMessage__name">{Peer.name(author)}</div>
            <div class="ForwardedMessage__date">
              {date}
              {message.updatedAt && (' · ' + lang.use('me_edited_label'))}
            </div>
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
