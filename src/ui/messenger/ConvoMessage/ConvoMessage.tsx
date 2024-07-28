import { defineComponent } from 'vue'
import * as Attach from 'model/Attach'
import * as Message from 'model/Message'
import * as Peer from 'model/Peer'
import { useEnv } from 'hooks'
import { Attaches } from 'ui/messenger/ConvoMessage/Attaches'
import './ConvoMessage.css'

type Props = {
  message: Message.Normal
  showName: boolean
}

export const ConvoMessage = defineComponent<Props>((props) => {
  const { lang } = useEnv()

  return () => {
    const { message, showName } = props
    const author = Peer.safeGet(message.authorId)
    const hasAttaches = Attach.kindsCount(message.attaches) > 0
    const isEmpty =
      !message.text &&
      !hasAttaches &&
      !message.replyMessage &&
      !message.forwardedMessages.length

    return (
      <div
        class={['ConvoMessage', {
          'ConvoMessage--out': message.isOut
        }]}
      >
        <div class="ConvoMessage__content">
          {showName && !message.isOut && (
            <div class="ConvoMessage__author">{Peer.name(author)}</div>
          )}

          {message.replyMessage && (
            <div class="ConvoMessage__unknownAttach">
              тут ответ
            </div>
          )}

          {message.text && <span class="ConvoMessage__text">{message.text}</span>}
          {hasAttaches && <Attaches attaches={message.attaches} />}

          {isEmpty && (
            <span class="ConvoMessage__unknownAttach">
              {lang.use('me_empty_message')}
            </span>
          )}

          {message.forwardedMessages.length > 0 && (
            <div class="ConvoMessage__unknownAttach">
              тут пересланные
            </div>
          )}

          <span class="ConvoMessage__time">
            {lang
              .dateTimeFormatter({ hour: '2-digit', minute: '2-digit' })
              .format(message.sentAt)}
          </span>
        </div>
      </div>
    )
  }
}, {
  props: ['message', 'showName']
})
