import { defineComponent } from 'vue'
import { useServices } from 'services'
import * as ILang from 'services/contracts/ILang'
import * as Attach from 'model/Attach'
import * as Message from 'model/Message'
import * as Peer from 'model/Peer'
import { usePeersStore } from 'store/peers'
import { useViewer } from 'hooks'
import { getServiceMessageText } from 'ui/messenger/ServiceMessage/ServiceMessage'
import './MessagePreview.css'

type Props = {
  message: Message.Message | Message.Foreign | Message.Pinned
  accent?: boolean
}

export const MessagePreview = defineComponent<Props>((props) => {
  const { lang } = useServices()
  const { peers } = usePeersStore()
  const viewer = useViewer()

  return () => {
    const { message, accent } = props
    const className = accent ? 'MessagePreview--accent' : 'MessagePreview'

    if (message.kind === 'Expired') {
      return (
        <span class={className}>
          {lang.usePlural('me_messages_disappeared', 1)}
        </span>
      )
    }

    if (message.kind === 'Service') {
      return getServiceMessageText(message, lang, peers, viewer.id)
    }

    const attachmentPreview = getAttachmentPreview(message, lang)

    if (!message.text && !attachmentPreview) {
      return (
        <span class={className}>
          {lang.use('me_empty_message')}
        </span>
      )
    }

    return (
      <>
        {message.text}

        {attachmentPreview && (
          <span class={className}>
            {message.text && ' '}
            {attachmentPreview}
          </span>
        )}
      </>
    )
  }
}, {
  props: ['message', 'accent']
})

export function getMessagePreviewText(
  message: Message.Message | Message.Foreign | Message.Pinned,
  lang: ILang.Lang,
  peers: Map<Peer.Id, Peer.Peer>,
  viewerId: Peer.UserId
): string {
  if (message.kind === 'Expired') {
    return lang.usePlural('me_messages_disappeared', 1)
  }

  if (message.kind === 'Service') {
    return getServiceMessageText(message, lang, peers, viewerId)
  }

  const attachmentPreview = getAttachmentPreview(message, lang)
  const text = [message.text.trim(), attachmentPreview].filter(Boolean).join(' ')
  return text || lang.use('me_empty_message')
}

const getAttachmentPreview = (
  message: Message.Normal | Message.Pending | Message.Foreign | Message.Pinned,
  lang: ILang.Lang
) => {
  const kindsCount = Attach.kindsCount(message.attaches)
  const count = Attach.count(message.attaches)

  if (
    kindsCount === 2 &&
    message.attaches.unknown?.length === 1 && message.attaches.unknown[0].type === 'story' &&
    message.attaches.sticker
  ) {
    return lang.use('me_message_attach_story_reaction')
  }

  if (kindsCount > 1) {
    return lang.usePlural('me_message_attaches', count)
  }

  const firstAttach = Object.values(message.attaches)[0]
  if (firstAttach) {
    return Attach.preview(firstAttach, lang)
  }

  if (message.replyMessage) {
    return lang.usePlural('me_messages_preview', 1)
  }

  if (message.forwardedMessages) {
    return lang.usePlural('me_messages_preview', message.forwardedMessages.length)
  }
}
