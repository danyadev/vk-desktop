import { computed, defineComponent } from 'vue'
import { usePeersStore } from 'store/peers'
import * as Convo from 'model/Convo'
import * as Message from 'model/Message'
import * as Peer from 'model/Peer'
import { useEnv } from 'misc/hooks'
import { ServiceMessage } from 'ui/messenger/ServiceMessage/ServiceMessage'
import { Avatar } from 'ui/ui/Avatar/Avatar'
import { Counter } from 'ui/ui/Counter/Counter'
import './ConvoListItem.css'

type Props = {
  convo: Convo.Convo
}

export const ConvoListItem = defineComponent<Props>(({ convo }) => {
  const { peers } = usePeersStore()
  const peer = Peer.safeGet(peers, convo.id)
  const authorName = useAuthorName(convo)

  return () => (
    <div class="ConvoListItem">
      <Avatar class="ConvoListItem__avatar" peer={peer} size={48} />

      <div class="ConvoListItem__name">{Peer.name(peer)}</div>

      <div class="ConvoListItem__message">
        {authorName.value && <span class="ConvoListItem__messageAuthor">{authorName.value}</span>}
        <span class="ConvoListItem__messageText">
          <MessagePreview convo={convo} />
        </span>
      </div>

      <div class="ConvoListItem__indicators">
        <Counter
          count={convo.unreadCount}
          mode={convo.enabledNotifications ? 'primary' : 'secondary'}
        />
      </div>
    </div>
  )
}, {
  props: ['convo']
})

const MessagePreview = defineComponent<{ convo: Convo.Convo }>(({ convo }) => {
  const { lang } = useEnv()

  const getAttachmentPreview = (message: Message.Normal) => {
    const attachTranslations = lang.useRaw('me_message_attaches_preview')
    const firstAttach = message.attachments[0]

    if (firstAttach && firstAttach.type in attachTranslations) {
      const translation = attachTranslations[firstAttach.type as keyof typeof attachTranslations]

      if (typeof translation === 'string') {
        return translation
      } else {
        return lang.applyVariables(translation[lang.pluralIndex(1)], ['1'])
      }
    }

    if (message.forwardedMessages.length) {
      return lang.usePlural('me_message_messages', message.forwardedMessages.length)
    }
  }

  return () => {
    const lastMessage = Convo.lastMessage(convo)

    if (!lastMessage || lastMessage.kind === 'Expired') {
      return (
        <span class="MessagePreview__highlight">
          {Convo.isCasper(convo) || lastMessage
            ? lang.use('me_message_disappeared')
            : lang.use('me_convo_empty')}
        </span>
      )
    }

    if (lastMessage.kind === 'Service') {
      return <ServiceMessage message={lastMessage} />
    }

    const attachmentPreview = getAttachmentPreview(lastMessage)

    return (
      <>
        {lastMessage.text}

        {attachmentPreview && (
          <span class="MessagePreview__highlight">
            {' '}
            {attachmentPreview}
          </span>
        )}
      </>
    )
  }
}, {
  props: ['convo']
})

function useAuthorName(convo: Convo.Convo) {
  const { peers } = usePeersStore()
  const { lang } = useEnv()

  return computed(() => {
    const lastMessage = Convo.lastMessage(convo)

    if (!lastMessage || lastMessage.kind === 'Service') {
      return ''
    }

    if (lastMessage.isOut) {
      return lang.use(
        'me_convo_list_author',
        [lang.use('me_convo_list_author_you')]
      ) + ' '
    }

    if (convo.kind === 'ChatConvo' && !convo.isChannel) {
      const author = Peer.safeGet(peers, lastMessage.authorId)
      return lang.use(
        'me_convo_list_author',
        [Peer.firstName(author)]
      ) + ' '
    }

    return ''
  })
}
