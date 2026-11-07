import { computed, onActivated, onDeactivated, Ref, shallowRef, watch } from 'vue'
import { useServices } from 'services'
import * as Convo from 'model/Convo'
import * as Peer from 'model/Peer'
import { useConvosStore } from 'store/convos'
import { usePeersStore } from 'store/peers'
import { insertPeerModel, insertPeers } from 'actions'
import { fromApiConvo } from 'converters/ConvoConverter'
import { PEER_FIELDS } from 'misc/constants'
import { RULES_EN_RU, RULES_RU_EN, translitPrefixes } from 'misc/transliteration'

export const useConvoSearch = (query: Ref<string>) => {
  const { api } = useServices()
  const { convos, convoDrafts } = useConvosStore()
  const { peers } = usePeersStore()
  const active = shallowRef(true)
  let searchedQuery = ''
  const status = shallowRef<'loading' | 'complete' | 'error'>('loading')
  const apiResults = shallowRef<Convo.Convo[]>([])
  const cachedResults = shallowRef<Convo.Convo[]>([])
  let currentController: AbortController | undefined

  const search = async () => {
    if (!query.value.trim()) return

    currentController?.abort()
    const controller = new AbortController()
    currentController = controller
    status.value = 'loading'
    apiResults.value = []

    try {
      const { items, profiles, groups } = await api.fetch('messages.searchConversations', {
        q: query.value,
        count: 100,
        extended: 1,
        fields: PEER_FIELDS
      }, { signal: controller.signal })

      if (controller.signal.aborted) return
      status.value = 'complete'

      insertPeers({ profiles, groups })
      apiResults.value = items.map((apiConvo) => {
        const { convo, peer } = fromApiConvo(apiConvo)
        if (convo && peer) insertPeerModel(peer)
        return convo
      }).filter((convo) => convo !== undefined)

      const seen = new Set<Peer.Id>()
      cachedResults.value = [...apiResults.value, ...cachedResults.value]
        .filter((convo) => {
          if (seen.has(convo.id)) return false
          seen.add(convo.id)
          return true
        })
        .slice(0, 200)
    } catch (error) {
      if (controller.signal.aborted) return
      console.warn('[useConvoSearch] Search failed', error)
      status.value = 'error'
    }
  }

  onActivated(() => (active.value = true))
  onDeactivated(() => (active.value = false))

  watch([query, active], ([value, isActive], _, onCleanup) => {
    if (!isActive) return

    const q = value.trim()
    const changed = q !== searchedQuery
    if (changed) {
      searchedQuery = q
      status.value = 'loading'
      apiResults.value = []
    }
    if (!q || (!changed && (status.value === 'complete' || status.value === 'error'))) return

    const timeout = window.setTimeout(search, 300)
    onCleanup(() => {
      window.clearTimeout(timeout)
      currentController?.abort()
    })
  }, { immediate: true })

  const localConvos = computed(() => (
    [...convos.values()].sort((a, b) => Convo.sorter(a, b, convoDrafts))
  ))

  const results = computed(() => {
    const queryText = query.value.toLocaleLowerCase().trim()
    if (!queryText) return []

    if (status.value !== 'loading') {
      return apiResults.value
    }

    const queryVariants = extractSearchWords(queryText).map(expandQueryWord)
    if (queryVariants.length === 0) return []

    const cachedIds = new Set(cachedResults.value.map((convo) => convo.id))
    const candidates = [
      ...cachedResults.value.map((convo) => convos.get(convo.id) ?? convo),
      ...localConvos.value.filter((convo) => !cachedIds.has(convo.id))
    ]

    return candidates.filter((convo) => (
      matchesNameByWordPrefixes(
        Peer.name(Peer.safeGet(peers, convo.id)),
        queryVariants
      )
    ))
  })

  return { status, results, search }
}

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
function matchesNameByWordPrefixes(name: string, queryVariants: string[][]): boolean {
  const nameWords = extractSearchWords(name).flatMap((word) => [
    word,
    // NFD decomposes accented letters into base letters and combining marks
    // (e.g. "ё" → "е" + "◌̈"), which are then removed.
    word.normalize('NFD').replace(/\p{M}/gu, '')
  ])

  return queryVariants.every((variants) => (
    variants.some((prefix) => (
      nameWords.some((word) => word.startsWith(prefix))
    ))
  ))
}

function expandQueryWord(word: string): string[] {
  return [...new Set([
    ...translitPrefixes(word, RULES_EN_RU),
    ...translitPrefixes(word, RULES_RU_EN)
  ])]
}
