import { defineComponent } from 'vue'
import * as Attach from 'model/Attach'
import * as Message from 'model/Message'
import * as Peer from 'model/Peer'
import { useConvosStore } from 'store/convos'
import { useEnv } from 'hooks'
import { Attaches } from 'ui/messenger/attaches/Attaches'
import { ForwardedMessages } from 'ui/messenger/ForwardedMessages/ForwardedMessages'
import { MessageOutStatusIcon } from 'ui/messenger/MessageOutStatusIcon/MessageOutStatusIcon'
import { ReplyMessage } from 'ui/messenger/ReplyMessage/ReplyMessage'
import './ConvoMessage.css'

type Props = {
  message: Message.Normal | Message.Pending
  showName: boolean
}

export const ConvoMessage = defineComponent<Props>((props) => {
  const { lang } = useEnv()
  const { scrollAnchors } = useConvosStore()

  return () => {
    const { message, showName } = props
    const author = Peer.safeGet(message.authorId)
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
            <div class="ConvoMessage__author">{Peer.name(author)}</div>
          )}

          {message.replyMessage && (
            <ReplyMessage
              class="ConvoMessage__reply"
              reply={message.replyMessage}
              onClick={() => {
                if (message.replyMessage?.cmid) {
                  scrollAnchors.set(message.peerId, {
                    kind: 'Message',
                    cmid: message.replyMessage.cmid
                  })
                }
              }}
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
            {props.message.isOut && (
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
