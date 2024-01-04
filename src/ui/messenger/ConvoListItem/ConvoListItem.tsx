import { defineComponent } from 'vue'
import { usePeersStore } from 'store/peers'
import * as Convo from 'model/Convo'
import * as Peer from 'model/Peer'
import { Avatar } from 'ui/ui/Avatar/Avatar'
import './ConvoListItem.css'

type Props = {
  convo: Convo.Convo
}

export const ConvoListItem = defineComponent<Props>(({ convo }) => {
  const { peers } = usePeersStore()
  const peer = Peer.safeGet(peers, convo.id)
  const lastMessage = Convo.lastMessage(convo)

  const renderMessage = () => {
    let authorName = ''
    let text = ''

    const author = lastMessage && Peer.safeGet(peers, lastMessage.authorId)

    if (author) {
      if (lastMessage.isOut) {
        authorName = 'Вы: '
      } else if (convo.kind === 'ChatConvo') {
        authorName = Peer.firstName(author) + ': '
      }
    }

    switch (lastMessage?.kind) {
      case 'Normal':
        text = lastMessage.text

        if (lastMessage.attachments.length) {
          text += ' [Вложение]'
        }
        break
      case 'Service':
        text = '[Сервисное сообщение]'
        break
      case 'Expired':
        text = '[Сообщение исчезло]'
        break
      case undefined:
        text = '[Пустой диалог]'
        break
    }

    return (
      <>
        {authorName && <span class="ConvoListItem__messageAuthor">{authorName}</span>}
        <span class="ConvoListItem__messageText">{text}</span>
      </>
    )
  }

  return () => (
    <div class="ConvoListItem">
      <Avatar class="ConvoListItem__avatar" peer={peer} size={48} />

      <div class="ConvoListItem__name">{Peer.name(peer)}</div>

      <div class="ConvoListItem__message">
        {renderMessage()}
      </div>

      <div class="ConvoListItem__indicators">
        {convo.unreadCount > 0 && (
          <div class="ConvoListItem__unreadCount">
            {convo.unreadCount}
          </div>
        )}
      </div>
    </div>
  )
}, {
  props: ['convo']
})
