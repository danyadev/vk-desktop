import { computed, defineComponent, shallowRef, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useServices } from 'services'
import * as Message from 'model/Message'
import * as Peer from 'model/Peer'
import { useConvosStore } from 'store/convos'
import { usePeersStore } from 'store/peers'
import { useMessageSearch, useViewer } from 'hooks'
import { MessagePreview } from 'ui/messenger/MessagePreview/MessagePreview'
import { Avatar } from 'ui/ui/Avatar/Avatar'
import { IntersectionWrapper } from 'ui/ui/IntersectionWrapper/IntersectionWrapper'
import { LoadError } from 'ui/ui/LoadError/LoadError'
import { Spinner } from 'ui/ui/Spinner/Spinner'
import { Icon56SearchOutline } from 'assets/icons'

type Props = {
  query: string
}

export const MessageSearchResults = defineComponent<Props>((props) => {
  const { lang } = useServices()
  const router = useRouter()
  const viewer = useViewer()
  const convosStore = useConvosStore()
  const { peers } = usePeersStore()
  const search = useMessageSearch(computed(() => props.query))
  const $results = shallowRef<HTMLElement | null>(null)

  watch(() => props.query, () => $results.value?.scrollTo({ top: 0 }))
  const dateFormatter = lang.dateTimeFormatter({ day: 'numeric', month: 'short', year: 'numeric' })

  const openMessage = (message: Message.Confirmed) => {
    convosStore.requestNavigation(message.peerId, {
      kind: 'Message',
      cmid: message.cmid
    })
    router.push({ name: 'Convo', params: { peerId: message.peerId } })
  }

  const renderMessage = (message: Message.Confirmed) => {
    const peer = Peer.safeGet(peers, message.peerId)
    return (
      <div class="SearchView__item" key={`${message.peerId}:${message.cmid}`}>
        <button
          type="button"
          class="SearchView__itemMain"
          onClick={() => openMessage(message)}
        >
          <Avatar peer={peer} size={40} />
          <span class="SearchView__details">
            <span class="SearchView__messageHeader">
              <span class="SearchView__itemName">
                {message.peerId === viewer.id ? lang.use('me_peer_favorites') : Peer.name(peer)}
              </span>
              <span class="SearchView__messageDate">
                {dateFormatter.format(message.sentAt)}
              </span>
            </span>
            {message.authorId !== message.peerId && (
              <span class="SearchView__subtitle">
                {Peer.name(Peer.safeGet(peers, message.authorId))}
              </span>
            )}
            <span class="SearchView__messageText">
              <MessagePreview message={message} />
            </span>
          </span>
        </button>
      </div>
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

    if (search.status.value === 'complete' && search.results.value.length === 0) {
      return (
        <div class="SearchView__empty">
          {lang.use('me_convo_list_search_message_empty')}
        </div>
      )
    }

    return (
      <>
        {search.results.value.map(renderMessage)}

        {search.status.value === 'error' && <LoadError onRetry={search.retry} />}
        {search.status.value === 'loading' && (
          <Spinner class="SearchView__spinner" size="regular" />
        )}

        {search.status.value === 'complete' && search.hasMore.value && (
          <IntersectionWrapper key={search.results.value.length} onIntersect={search.loadMore}>
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
