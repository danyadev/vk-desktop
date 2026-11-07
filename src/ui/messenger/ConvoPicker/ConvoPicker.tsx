import { computed, defineComponent, shallowRef, watch } from 'vue'
import { useServices } from 'services'
import * as Convo from 'model/Convo'
import * as Peer from 'model/Peer'
import { useConvosStore } from 'store/convos'
import { usePeersStore } from 'store/peers'
import { loadMoreConvos } from 'actions'
import { useConvoSearch, useConvoSubtitle, useViewer } from 'hooks'
import { useConvoList } from 'ui/messenger/ConvoList/useConvoList'
import { Avatar } from 'ui/ui/Avatar/Avatar'
import { Input } from 'ui/ui/Input/Input'
import { IntersectionWrapper } from 'ui/ui/IntersectionWrapper/IntersectionWrapper'
import { LoadError } from 'ui/ui/LoadError/LoadError'
import { Spinner } from 'ui/ui/Spinner/Spinner'
import { Icon20ChevronRight } from 'assets/icons'
import './ConvoPicker.css'

type Props = {
  onSelect: (convo: Convo.Convo) => void
  getDisabledReason?: (convo: Convo.Convo) => string | undefined
}

export const ConvoPicker = defineComponent<Props>((props) => {
  const { lang } = useServices()
  const { lists } = useConvosStore()
  const { peers } = usePeersStore()
  const viewer = useViewer()
  const getSubtitle = useConvoSubtitle()
  const convoList = useConvoList(lists.main)

  const $list = shallowRef<HTMLElement | null>(null)
  const query = shallowRef('')
  const { status: searchStatus, results: searchResults, search } = useConvoSearch(query)
  watch(query, () => $list.value?.scrollTo({ top: 0 }))

  const items = computed(() => (
    query.value.trim() ? searchResults.value : convoList.value
  ))

  return () => {
    const hasQuery = !!query.value.trim()

    return (
      <div class="ConvoPicker">
        <Input
          class="ConvoPicker__search"
          mode="search"
          autofocus
          placeholder={lang.use('input_search')}
          value={query.value}
          onInput={(event) => (query.value = event.target.value)}
          onKeydown={(event) => {
            if (event.key === 'Escape' && query.value) {
              event.stopPropagation()
              query.value = ''
            }
          }}
        />

        <div class="ConvoPicker__list" ref={$list}>
          {items.value.map((convo) => {
            const peer = Peer.safeGet(peers, convo.id)
            const disabledReason = props.getDisabledReason?.(convo)

            return (
              <button
                key={convo.id}
                class="ConvoPicker__item"
                type="button"
                disabled={!!disabledReason}
                onClick={() => props.onSelect(convo)}
              >
                <Avatar peer={peer} size={40} />
                <span class="ConvoPicker__details">
                  <span class="ConvoPicker__name">
                    {convo.id === viewer.id
                      ? lang.use('me_peer_favorites')
                      : Peer.name(peer)}
                  </span>
                  <span class="ConvoPicker__subtitle">
                    {disabledReason ?? getSubtitle(convo, peer)}
                  </span>
                </span>
                {!disabledReason && <Icon20ChevronRight class="ConvoPicker__chevron" />}
              </button>
            )
          })}

          {items.value.length === 0 &&
            ((hasQuery ? searchStatus.value : lists.main.status) === 'complete') && (
            <div class="ConvoPicker__empty">
              {lang.use('me_convo_list_search_empty_results')}
            </div>
          )}

          {hasQuery && searchStatus.value === 'error' ? (
            <LoadError onRetry={search} />
          ) : hasQuery && searchStatus.value !== 'complete' ? (
            <Spinner class="ConvoPicker__spinner" size="regular" />
          ) : !hasQuery && lists.main.status === 'error' ? (
            <LoadError onRetry={() => loadMoreConvos(lists.main)} />
          ) : !hasQuery && lists.main.status !== 'complete' && (
            <IntersectionWrapper
              key={lists.main.peerIds.size}
              onIntersect={() => loadMoreConvos(lists.main)}
            >
              <Spinner class="ConvoPicker__spinner" size="regular" />
            </IntersectionWrapper>
          )}
        </div>
      </div>
    )
  }
}, {
  props: ['onSelect', 'getDisabledReason']
})

