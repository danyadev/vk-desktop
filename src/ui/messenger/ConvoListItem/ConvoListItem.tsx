import { computed, defineComponent, Ref } from 'vue'
import { useRouter } from 'vue-router'
import * as Convo from 'model/Convo'
import * as History from 'model/History'
import * as Message from 'model/Message'
import * as Peer from 'model/Peer'
import { useEnv, useNow } from 'hooks'
import { ONE_DAY, ONE_HOUR, ONE_MINUTE, ONE_MONTH, ONE_WEEK } from 'misc/dateTime'
import { MessageOutStatusIcon } from 'ui/messenger/MessageOutStatusIcon/MessageOutStatusIcon'
import { MessagePreview } from 'ui/messenger/MessagePreview/MessagePreview'
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
  const { lang } = useEnv()
  const peer = computed(() => Peer.safeGet(props.convo.id))
  const lastMessage = computed(() => History.lastItem(props.convo.history))
  const active = computed(() => router.currentRoute.value.path === `/convo/${props.convo.id}`)
  const authorName = useAuthorName(lastMessage, computed(() => props.convo))

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
            mode={props.convo.notifications.enabled ? 'primary' : 'secondary'}
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
            {!props.convo.notifications.enabled && (
              <Icon16Muted color="var(--vkui--color_icon_tertiary)" />
            )}
          </span>
        </div>

        <div class="ConvoListItem__message">
          <span class="ConvoListItem__text">
            {authorName.value && <span class="ConvoListItem__messageAuthor">{authorName.value}</span>}
            {lastMessage.value ? (
              <MessagePreview message={lastMessage.value} />
            ) : (
              <span class="MessagePreview">
                {Convo.isCasper(props.convo)
                  ? lang.usePlural('me_messages_disappeared', 1)
                  : lang.use('me_convo_list_empty_convo')}
              </span>
            )}
          </span>
          <span class="ConvoListItem__date">
            {lastMessage.value && <MessageDate sentAt={lastMessage.value.sentAt} />}
          </span>
        </div>
        <div class="ConvoListItem__indicators">
          <Counter
            count={props.convo.unreadCount}
            mode={props.convo.notifications.enabled ? 'primary' : 'secondary'}
          />
        </div>
        {lastMessage.value && (
          <MessageOutStatusIcon
            class="ConvoListItem__status"
            message={lastMessage.value}
          />
        )}
      </div>
    )
  }
}, {
  props: ['convo', 'compact']
})

const MessageDate = defineComponent<{ sentAt: number }>((props) => {
  const { lang } = useEnv()
  const now = useNow(10000)

  const getDate = () => {
    const diff = now.value - props.sentAt

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
          new Date(now.value).getFullYear() === new Date(props.sentAt).getFullYear()

        const options: Intl.DateTimeFormatOptions = isSameYear
          ? { day: 'numeric', month: 'short' }
          : { day: 'numeric', month: 'numeric', year: '2-digit' }

        return lang.dateTimeFormatter(options).format(props.sentAt)
      }
    }
  }

  return () => {
    const date = getDate()
    return date && ` · ${date}`
  }
}, {
  props: ['sentAt']
})

function useAuthorName(messageRef: Ref<Message.Message | undefined>, convo: Ref<Convo.Convo>) {
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

    if (convo.value.kind === 'ChatConvo' && !convo.value.isChannel) {
      const author = Peer.safeGet(message.authorId)
      return lang.use('me_convo_list_author', {
        author: Peer.firstName(author)
      }) + ' '
    }

    return ''
  })
}
