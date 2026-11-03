import { computed, defineComponent, shallowRef, watch } from 'vue'
import { useServices } from 'services'
import * as Convo from 'model/Convo'
import * as Peer from 'model/Peer'
import { useConvosStore } from 'store/convos'
import { usePeersStore } from 'store/peers'
import { insertPeerModel, insertPeers, loadMoreConvos } from 'actions'
import { fromApiConvo } from 'converters/ConvoConverter'
import { useFormatOnlineStatus, useViewer } from 'hooks'
import { debounce } from 'misc/utils'
import { PEER_FIELDS } from 'misc/constants'
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
  const { api, lang } = useServices()
  const { convos, lists, convoDrafts } = useConvosStore()
  const { peers } = usePeersStore()
  const viewer = useViewer()
  const formatOnlineStatus = useFormatOnlineStatus()
  const convoList = useConvoList()

  const $list = shallowRef<HTMLElement | null>(null)
  const query = shallowRef('')
  const searchStatus = shallowRef<'loading' | 'complete' | 'error'>('loading')
  const searchResults = shallowRef<Convo.Convo[]>([])
  let currentSearchController: AbortController | undefined

  const search = async () => {
    searchStatus.value = 'loading'
    if (!query.value.trim()) return

    const controller = new AbortController()
    currentSearchController = controller

    try {
      const {
        items: apiConvos,
        profiles,
        groups
      } = await api.fetch('messages.searchConversations', {
        q: query.value,
        count: 100,
        extended: 1,
        fields: PEER_FIELDS
      }, { signal: controller.signal })

      if (controller.signal.aborted) return

      searchStatus.value = 'complete'
      insertPeers({ profiles, groups })
      searchResults.value = apiConvos.map((apiConvo) => {
        const { convo, peer } = fromApiConvo(apiConvo)
        if (convo && peer) insertPeerModel(peer)
        return convo
      }).filter((convo) => convo !== undefined)
    } catch (error) {
      if (controller.signal.aborted) return
      console.warn('[ConvoPicker] Search failed', error)
      searchStatus.value = 'error'
    }
  }

  watch(query, debounce(search, 300))
  watch(query, () => {
    currentSearchController?.abort()
    searchStatus.value = 'loading'
    searchResults.value = []
    $list.value?.scrollTo({ top: 0 })
  })

  const localConvos = computed(() => (
    [...convos.values()].sort((a, b) => Convo.sorter(a, b, convoDrafts))
  ))

  const items = computed(() => {
    const queryText = query.value.toLocaleLowerCase().trim()
    if (queryText) {
      if (searchStatus.value === 'loading') {
        const queryWords = extractSearchWords(queryText)
        if (queryWords.length === 0) return []

        return localConvos.value.filter((convo) => (
          matchesNameByWordPrefixes(
            Peer.name(Peer.safeGet(peers, convo.id)),
            queryWords
          )
        ))
      }

      return searchResults.value
    }

    return convoList.value.convoList
  })

  const getSubtitle = (convo: Convo.Convo, peer: Peer.Peer): string => {
    if (convo.id === viewer.id) {
      return lang.use('convoPicker_favorites_description')
    }

    switch (peer.kind) {
      case 'User':
        return formatOnlineStatus(peer)
      case 'Group':
        return lang.usePlural('me_group_members_count', peer.membersCount, {
          count: peer.membersCount
        })
      case 'Chat':
        if (convo.kind === 'ChatConvo') {
          if (convo.status === 'left') return lang.use('me_chat_leaved_status')
          if (convo.status === 'kicked') return lang.use('me_chat_kicked_status')
        }
        return lang.usePlural('me_chat_members_count', peer.membersCount, {
          count: peer.membersCount
        })
    }
  }

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
                      ? lang.use('convoPicker_favorites')
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
            <div class="ConvoPicker__empty">{lang.use('convoPicker_empty')}</div>
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

/**
 * Splits text into searchable words.
 * Punctuation separates words, while combining marks and certain
 * special characters are removed without creating word boundaries
 */
function extractSearchWords(text: string): string[] {
  return text.toLowerCase()
    // \p{M}: combining marks (e.g. ◌́)
    // \p{Cf}: format characters (e.g. zero-width space)
    // Unicode chars: · (middle dot), ʼ and ʾ (modifier letters), ー (Japanese long vowel mark)
    .replace(/[\p{M}\p{Cf}\u00b7\u02bc\u02be\u30fc]/gu, '')
    // \p{L}: Unicode letters, \p{N}: Unicode numbers
    .match(/[\p{L}\p{N}]+/gu) ?? []
}

/**
 * Matches every query word against the beginning of any name word,
 * regardless of order. Multiple query words can match the same word
 *
 * Names are also matched without diacritics, but query words aren't.
 * For example, name "Семён" matches query "семе", but name "Семен"
 * doesn't match query "семё"
 */
function matchesNameByWordPrefixes(name: string, queryWords: string[]): boolean {
  const nameWords = extractSearchWords(name).flatMap((word) => [
    word,
    // NFD decomposes accented letters into base letters and combining marks
    // (e.g. "ё" → "е" + "◌̈"), which are then removed.
    word.normalize('NFD').replace(/\p{M}/gu, '')
  ])

  return queryWords.every((queryWord) => nameWords.some((word) => word.startsWith(queryWord)))
}
