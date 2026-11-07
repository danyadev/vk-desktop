import { useServices } from 'services'
import { useConvosStore } from 'store/convos'
import { insertConvos, insertPeers } from 'actions'
import { PEER_FIELDS } from 'misc/constants'

export async function loadRecentlySearchedConvos() {
  const { api } = useServices()
  const convosStore = useConvosStore()
  const { convos } = convosStore

  const missingIds = convosStore.recentSearches.filter((id) => !convos.has(id))
  if (missingIds.length === 0) return

  try {
    const {
      items: apiConvos,
      last_messages: apiLastMessages,
      profiles,
      groups
    } = await api.fetch('messages.getConversationsById', {
      peer_ids: missingIds.join(','),
      with_last_messages: 1,
      extended: 1,
      fields: PEER_FIELDS
    })

    insertPeers({ profiles, groups })
    insertConvos(apiConvos.map((apiConvo) => ({
      conversation: apiConvo,
      last_message: apiLastMessages?.find((apiMessage) => apiMessage.peer_id === apiConvo.peer.id)
    })))
  } catch (error) {
    console.warn('[loadRecentlySearchedConvos] Failed to load', error)
  }
}
