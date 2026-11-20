import { computed, defineComponent, shallowRef, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useServices } from 'services'
import * as Message from 'model/Message'
import * as Peer from 'model/Peer'
import { useConvosStore } from 'store/convos'
import { usePeersStore } from 'store/peers'
import { useMessageSearch, useNow, useViewer } from 'hooks'
import { isSameDay, ONE_MINUTE } from 'misc/dateTime'
import { useMessageAuthorName } from 'ui/messenger/ConvoListView/useMessageAuthorName'
import { MessagePreview } from 'ui/messenger/MessagePreview/MessagePreview'
import { Avatar } from 'ui/ui/Avatar/Avatar'
import { IntersectionWrapper } from 'ui/ui/IntersectionWrapper/IntersectionWrapper'
import { LoadError } from 'ui/ui/LoadError/LoadError'
import { Spinner } from 'ui/ui/Spinner/Spinner'
import { Icon56SearchOutline } from 'assets/icons'
import './MessageSearch.css'

type Props = {
  query: string
}

export const MessageSearch = defineComponent<Props>((props) => {
  const { lang } = useServices()
  const router = useRouter()
  const viewer = useViewer()
  const now = useNow(ONE_MINUTE)
  const convosStore = useConvosStore()
  const { peers } = usePeersStore()
  const search = useMessageSearch(computed(() => props.query))
  const getAuthorName = useMessageAuthorName()
  const $results = shallowRef<HTMLElement | null>(null)

  watch(() => props.query, () => $results.value?.scrollTo({ top: 0 }))

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    const current = new Date(now.value)

    if (isSameDay(current, date)) {
      return lang.dateTimeFormatter({
        hour: '2-digit',
        minute: '2-digit'
      }).format(timestamp)
    }
    if (date.getFullYear() === current.getFullYear()) {
      return lang.dateTimeFormatter({
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      }).format(timestamp)
    }
    return lang.dateTimeFormatter({
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(timestamp)
  }

  const openMessage = (message: Message.Confirmed) => {
    convosStore.requestNavigation(message.peerId, {
      kind: 'Message',
      cmid: message.cmid
    })
    router.push({
      name: 'Convo',
      params: { peerId: message.peerId },
      query: { canGoBack: 1 }
    })
  }

  const renderMessage = (message: Message.Confirmed) => {
    const peer = Peer.safeGet(peers, message.peerId)
    const authorName = getAuthorName(message, convosStore.convos.get(message.peerId))

    return (
      <button
        type="button"
        class="MessageSearch__item"
        key={`${message.peerId}-${message.cmid}`}
        onClick={() => openMessage(message)}
      >
        <Avatar peer={peer} size={48} />

        <span class="MessageSearch__details">
          <span class="MessageSearch__header">
            <span class="MessageSearch__name">
              {message.peerId === viewer.id ? lang.use('me_peer_favorites') : Peer.name(peer)}
            </span>
            <span class="MessageSearch__date">
              {formatDate(message.sentAt)}
            </span>
          </span>

          <span class="MessageSearch__text">
            {authorName && <span class="MessageSearch__author">{authorName}</span>}
            <MessagePreview message={message} />
          </span>
        </span>
      </button>
    )
  }

  const renderResults = () => {
    if (!props.query.trim()) {
      return (
        <div class="SearchView__placeholder">
          <Icon56SearchOutline color="var(--vkui--color_icon_tertiary)" />
          <span>{lang.use('me_convo_list_search_message_placeholder')}</span>
        </div>
      )
    }

    if (search.status === 'complete' && search.results.length === 0) {
      return (
        <div class="SearchView__empty">
          {lang.use('me_convo_list_search_message_empty')}
        </div>
      )
    }

    return (
      <>
        {search.results.map(renderMessage)}

        {search.status === 'error' && <LoadError onRetry={search.loadMore} />}
        {search.status === 'loading' && (
          <Spinner class="SearchView__spinner" size="regular" />
        )}

        {search.status === 'hasMore' && (
          <IntersectionWrapper key={search.results.length} onIntersect={search.loadMore}>
            <Spinner class="SearchView__spinner" size="regular" />
          </IntersectionWrapper>
        )}
      </>
    )
  }

  return () => <div class="SearchView__results" ref={$results}>{renderResults()}</div>
}, {
  props: ['query']
})
