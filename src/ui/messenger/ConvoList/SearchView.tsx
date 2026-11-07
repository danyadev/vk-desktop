import { computed, defineComponent, shallowRef, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useServices } from 'services'
import * as Convo from 'model/Convo'
import * as Message from 'model/Message'
import * as Peer from 'model/Peer'
import { useConvosStore } from 'store/convos'
import { usePeersStore } from 'store/peers'
import { useConvoSubtitle, useMessageSearch, useViewer } from 'hooks'
import { MessagePreview } from 'ui/messenger/MessagePreview/MessagePreview'
import { Avatar } from 'ui/ui/Avatar/Avatar'
import { ButtonIcon } from 'ui/ui/ButtonIcon/ButtonIcon'
import { IntersectionWrapper } from 'ui/ui/IntersectionWrapper/IntersectionWrapper'
import { LoadError } from 'ui/ui/LoadError/LoadError'
import { Spinner } from 'ui/ui/Spinner/Spinner'
import { Tabs } from 'ui/ui/Tabs/Tabs'
import { TabsItem } from 'ui/ui/TabsItem/TabsItem'
import { Icon24Cancel, Icon56SearchOutline } from 'assets/icons'
import './SearchView.css'

type Props = {
  query: string
  status: 'loading' | 'complete' | 'error'
  results: Convo.Convo[]
  onRetry: () => void
}

type SearchTab = 'convos' | 'messages'
const RECENT_LIMIT = 20

export const SearchView = defineComponent<Props>((props) => {
  const { lang } = useServices()
  const router = useRouter()
  const viewer = useViewer()
  const convosStore = useConvosStore()
  const { convos } = convosStore
  const { peers } = usePeersStore()
  const getSubtitle = useConvoSubtitle()
  const activeTab = shallowRef<SearchTab>('convos')
  const messageSearch = useMessageSearch(
    computed(() => props.query),
    computed(() => activeTab.value === 'messages')
  )
  const $list = shallowRef<HTMLElement | null>(null)
  const dateFormatter = lang.dateTimeFormatter({ day: 'numeric', month: 'short', year: 'numeric' })

  const removeRecent = (peerId: Peer.Id) => {
    convosStore.recentSearches = convosStore.recentSearches.filter((id) => id !== peerId)
  }

  const openConvo = (peerId: Peer.Id) => {
    convosStore.recentSearches = [
      peerId,
      ...convosStore.recentSearches.filter((id) => id !== peerId)
    ].slice(0, RECENT_LIMIT)

    router.push({ name: 'Convo', params: { peerId } })
  }

  const openMessage = (message: Message.Confirmed) => {
    convosStore.requestNavigation(message.peerId, {
      kind: 'Message',
      cmid: message.cmid
    })
    router.push({ name: 'Convo', params: { peerId: message.peerId } })
  }

  watch([() => props.query, activeTab], () => $list.value?.scrollTo({ top: 0 }))

  const renderConvo = (peerId: Peer.Id, convo: Convo.Convo | undefined, recent: boolean) => {
    const peer = Peer.safeGet(peers, peerId)

    return (
      <div key={peerId} class="SearchView__item">
        <button type="button" class="SearchView__itemMain" onClick={() => openConvo(peerId)}>
          <Avatar peer={peer} size={40} />
          <span class="SearchView__details">
            <span class="SearchView__itemName">
              {peerId === viewer.id ? lang.use('me_peer_favorites') : Peer.name(peer)}
            </span>
            <span class="SearchView__subtitle">{getSubtitle(convo, peer)}</span>
          </span>
        </button>
        {recent && (
          <ButtonIcon
            class="SearchView__remove"
            icon={<Icon24Cancel width={20} height={20} />}
            withHoverBackground
            title={lang.use('me_convo_list_search_remove_recent')}
            onClick={() => removeRecent(peerId)}
          />
        )}
      </div>
    )
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

  return () => (
    <div class="SearchView">
      <Tabs wide class="SearchView__tabs">
        <TabsItem
          active={activeTab.value === 'convos'}
          onClick={() => (activeTab.value = 'convos')}
        >
          {lang.use('me_convo_list_search_convos')}
        </TabsItem>
        <TabsItem
          active={activeTab.value === 'messages'}
          onClick={() => (activeTab.value = 'messages')}
        >
          {lang.use('me_convo_list_search_messages')}
        </TabsItem>
      </Tabs>

      <div class="SearchView__results" ref={$list}>
        {activeTab.value === 'convos' ? (
          props.query.trim() ? (
            <>
              {props.status === 'complete' && props.results.length === 0 && (
                <div class="SearchView__empty">
                  {lang.use('me_convo_list_search_empty_results')}
                </div>
              )}

              {props.results.map((convo) => renderConvo(convo.id, convo, false))}

              {props.status === 'error' && <LoadError onRetry={props.onRetry} />}
              {props.status === 'loading' && <Spinner class="SearchView__spinner" size="regular" />}
            </>
          ) : (
            <>
              {convosStore.recentSearches.length === 0 && (
                <div class="SearchView__placeholder">
                  <Icon56SearchOutline color="var(--vkui--color_icon_tertiary)" />
                  <span>{lang.use('me_convo_list_search_placeholder')}</span>
                </div>
              )}

              {convosStore.recentSearches.length > 0 && (
                <div class="SearchView__sectionTitle">
                  {lang.use('me_convo_list_search_recent')}
                </div>
              )}
              {convosStore.recentSearches.filter((id) => peers.has(id)).map((peerId) => (
                renderConvo(peerId, convos.get(peerId), true)
              ))}
            </>
          )
        ) : !props.query.trim() ? (
          <div class="SearchView__placeholder">
            <Icon56SearchOutline color="var(--vkui--color_icon_tertiary)" />
            <span>{lang.use('me_convo_list_search_message_placeholder')}</span>
          </div>
        ) : (
          <>
            {messageSearch.results.value.map(renderMessage)}

            {messageSearch.status.value === 'complete' &&
              messageSearch.results.value.length === 0 && (
              <div class="SearchView__empty">
                {lang.use('me_convo_list_search_message_empty')}
              </div>
            )}

            {messageSearch.status.value === 'error' && (
              <LoadError onRetry={messageSearch.retry} />
            )}
            {messageSearch.status.value === 'loading' && (
              <Spinner class="SearchView__spinner" size="regular" />
            )}
            {messageSearch.status.value === 'complete' && messageSearch.hasMore.value && (
              <IntersectionWrapper
                key={messageSearch.results.value.length}
                onIntersect={messageSearch.loadMore}
              >
                <Spinner class="SearchView__spinner" size="regular" />
              </IntersectionWrapper>
            )}
          </>
        )}
      </div>
    </div>
  )
}, {
  props: ['query', 'status', 'results', 'onRetry']
})
