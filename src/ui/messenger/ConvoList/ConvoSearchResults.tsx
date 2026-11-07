import { defineComponent } from 'vue'
import { useRouter } from 'vue-router'
import { useServices } from 'services'
import * as Convo from 'model/Convo'
import * as Peer from 'model/Peer'
import { useConvosStore } from 'store/convos'
import { usePeersStore } from 'store/peers'
import { useConvoSubtitle, useViewer } from 'hooks'
import { Avatar } from 'ui/ui/Avatar/Avatar'
import { ButtonIcon } from 'ui/ui/ButtonIcon/ButtonIcon'
import { LoadError } from 'ui/ui/LoadError/LoadError'
import { Spinner } from 'ui/ui/Spinner/Spinner'
import { Icon24Cancel, Icon56SearchOutline } from 'assets/icons'

export type ConvoSearchProps = {
  query: string
  status: 'loading' | 'complete' | 'error'
  results: Convo.Convo[]
  onRetry: () => void
}

const RECENT_LIMIT = 20

export const ConvoSearchResults = defineComponent<ConvoSearchProps>((props) => {
  const { lang } = useServices()
  const router = useRouter()
  const viewer = useViewer()
  const convosStore = useConvosStore()
  const { convos } = convosStore
  const { peers } = usePeersStore()
  const getSubtitle = useConvoSubtitle()

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

  return () => {
    if (!props.query.trim()) {
      const recentSearches = convosStore.recentSearches.filter((peerId) => peers.has(peerId))
      if (recentSearches.length === 0) {
        return (
          <div class="SearchView__placeholder">
            <Icon56SearchOutline color="var(--vkui--color_icon_tertiary)" />
            <span>{lang.use('me_convo_list_search_placeholder')}</span>
          </div>
        )
      }

      return (
        <>
          <div class="SearchView__sectionTitle">
            {lang.use('me_convo_list_search_recent')}
          </div>
          {recentSearches.map((peerId) => renderConvo(peerId, convos.get(peerId), true))}
        </>
      )
    }

    if (props.status === 'complete' && props.results.length === 0) {
      return (
        <div class="SearchView__empty">
          {lang.use('me_convo_list_search_empty_results')}
        </div>
      )
    }

    return (
      <>
        {props.results.map((convo) => renderConvo(convo.id, convo, false))}

        {props.status === 'error' && <LoadError onRetry={props.onRetry} />}
        {props.status === 'loading' && <Spinner class="SearchView__spinner" size="regular" />}
      </>
    )
  }
}, {
  props: ['query', 'status', 'results', 'onRetry']
})
