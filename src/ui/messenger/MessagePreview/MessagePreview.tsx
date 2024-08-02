import { defineComponent } from 'vue'
import * as ILang from 'env/ILang'
import * as Attach from 'model/Attach'
import * as Message from 'model/Message'
import { useEnv } from 'hooks'
import { PlainServiceMessage } from 'ui/messenger/ServiceMessage/ServiceMessage'
import './MessagePreview.css'

type Props = {
  message: Message.Message | Message.Foreign | Message.Pinned
  accent?: boolean
}

export const MessagePreview = defineComponent<Props>((props) => {
  const { lang } = useEnv()

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
      return <PlainServiceMessage message={message} />
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

const getAttachmentPreview = (
  message: Message.Normal | Message.Foreign | Message.Pinned,
  lang: ILang.Lang
) => {
  const kindsCount = Attach.kindsCount(message.attaches)
  const count = Attach.count(message.attaches)

  if (kindsCount > 1) {
    return lang.usePlural('me_message_attaches', count)
  }

  const firstAttach = Object.values(message.attaches)[0]
  if (firstAttach) {
    return Attach.preview(firstAttach, lang)
  }

  if (message.replyMessage) {
    return lang.usePlural('me_messages', 1)
  }

  if (message.forwardedMessages) {
    return lang.usePlural('me_messages', message.forwardedMessages.length)
  }
}
