import { computed, defineComponent, Ref } from 'vue'
import { useRouter } from 'vue-router'
import * as Attach from 'model/Attach'
import * as Convo from 'model/Convo'
import * as History from 'model/History'
import * as Message from 'model/Message'
import * as Peer from 'model/Peer'
import { useEnv, useNow } from 'hooks'
import { ServiceMessage } from 'ui/messenger/ServiceMessage/ServiceMessage'
import { Avatar } from 'ui/ui/Avatar/Avatar'
import { Counter } from 'ui/ui/Counter/Counter'
import { Icon16Muted } from 'assets/icons'
import './ConvoListItem.css'

type Props = {
  convo: Convo.Convo
  compact?: boolean
}

export const ConvoListItem = defineComponent<Props>((props) => {
  const router = useRouter()
  const peer = computed(() => Peer.safeGet(props.convo.id))
  const lastMessage = computed(() => History.lastMessage(props.convo.history))
  const active = computed(() => router.currentRoute.value.path === `/convo/${props.convo.id}`)
  const authorName = useAuthorName(lastMessage, props.convo)

  function openConvo() {
    router.push('/convo/' + props.convo.id)
  }

  return () => {
    if (props.compact) {
      return (
        <div
          class={['ConvoListItem', 'ConvoListItem--compact', {
            'ConvoListItem--active': active.value
          }]}
          onClick={openConvo}
        >
          <Avatar class="ConvoListItem__avatar" peer={peer.value} size={48} />

          <Counter
            class="ConvoListItem__compactCounter"
            count={props.convo.unreadCount}
            mode={props.convo.enabledNotifications ? 'primary' : 'secondary'}
          />
        </div>
      )
    }

    return (
      <div
        class={['ConvoListItem', { 'ConvoListItem--active': active.value }]}
        onClick={openConvo}
      >
        <Avatar class="ConvoListItem__avatar" peer={peer.value} size={48} />

        <div class="ConvoListItem__name">
          <span class="ConvoListItem__nameText">
            {Peer.name(peer.value)}
          </span>
          <span class="ConvoListItem__nameIcons">
            {!props.convo.enabledNotifications && <Icon16Muted color="var(--vkui--color_icon_tertiary)" />}
          </span>
        </div>

        <div class="ConvoListItem__message">
          <span class="ConvoListItem__text">
            {authorName.value && <span class="ConvoListItem__messageAuthor">{authorName.value}</span>}
            <MessagePreview convo={props.convo} />
          </span>
          <span class="ConvoListItem__date">{lastMessage.value && <MessageDate message={lastMessage.value} />}</span>

          <div class="ConvoListItem__indicators">
            <Counter
              count={props.convo.unreadCount}
              mode={props.convo.enabledNotifications ? 'primary' : 'secondary'}
            />
          </div>
        </div>
      </div>
    )
  }
}, {
  props: ['convo', 'compact']
})

const MessagePreview = defineComponent<{ convo: Convo.Convo }>(({ convo }) => {
  const { lang } = useEnv()

  const getAttachmentPreview = (message: Message.Normal) => {
    if (message.attachments.length > 1) {
      return lang.usePlural('me_message_attaches', message.attachments.length)
    }

    const firstAttach = message.attachments[0]

    if (firstAttach) {
      const translation = Attach.preview(firstAttach, lang)
      if (translation) {
        return translation
      }

      console.warn(firstAttach)
      return lang.use('me_unsupported_message')
    }

    if (message.forwardedMessages.length) {
      return message.forwardedMessages.length === 1
        ? lang.use('me_message')
        : lang.usePlural('me_messages', message.forwardedMessages.length)
    }
  }

  return () => {
    const lastMessage = History.lastMessage(convo.history)

    if (!lastMessage || lastMessage.kind === 'Expired') {
      return (
        <span class="MessagePreview__highlight">
          {Convo.isCasper(convo) || lastMessage
            ? lang.use('me_message_disappeared')
            : lang.use('me_convo_list_empty_convo')}
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
            {lastMessage.text && ' '}
            {attachmentPreview}
          </span>
        )}
      </>
    )
  }
}, {
  props: ['convo']
})

const MessageDate = defineComponent<{ message: Message.Message }>(({ message }) => {
  const { lang } = useEnv()
  const now = useNow(10000)

  const getDate = () => {
    const ONE_MINUTE = 60 * 1000
    const ONE_HOUR = 60 * ONE_MINUTE
    const ONE_DAY = 24 * ONE_HOUR
    const ONE_WEEK = 7 * ONE_DAY
    const ONE_MONTH = 4 * ONE_WEEK
    const diff = now.value - message.sentAt

    switch (true) {
      case diff < ONE_MINUTE:
        return ''

      case diff < ONE_HOUR:
        return lang.use('me_convo_list_date_mins', {
          mins: Math.floor((diff % ONE_HOUR) / ONE_MINUTE)
        })

      case diff < ONE_DAY:
        return lang.use('me_convo_list_date_hours', {
          hours: Math.floor((diff % ONE_DAY) / ONE_HOUR)
        })

      case diff < ONE_WEEK:
        return lang.use('me_convo_list_date_days', {
          days: Math.floor((diff % ONE_WEEK) / ONE_DAY)
        })

      case diff < ONE_MONTH:
        return lang.use('me_convo_list_date_weeks', {
          weeks: Math.floor((diff % ONE_MONTH) / ONE_WEEK)
        })

      default: {
        const isSameYear =
          new Date(now.value).getFullYear() === new Date(message.sentAt).getFullYear()

        const options: Intl.DateTimeFormatOptions = isSameYear
          ? { day: 'numeric', month: 'short' }
          : { day: 'numeric', month: 'numeric', year: '2-digit' }

        return lang.dateTimeFormatter(options).format(message.sentAt)
      }
    }
  }

  return () => {
    const date = getDate()
    return date && ` · ${date}`
  }
}, {
  props: ['message']
})

function useAuthorName(messageRef: Ref<Message.Message | undefined>, convo: Convo.Convo) {
  const { lang } = useEnv()

  return computed(() => {
    const message = messageRef.value

    if (!message || message.kind === 'Service') {
      return ''
    }

    if (message.isOut) {
      return lang.use('me_convo_list_author', {
        author: lang.use('me_convo_list_author_you')
      }) + ' '
    }

    if (convo.kind === 'ChatConvo' && !convo.isChannel) {
      const author = Peer.safeGet(message.authorId)
      return lang.use('me_convo_list_author', {
        author: Peer.firstName(author)
      }) + ' '
    }

    return ''
  })
}
