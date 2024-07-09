import * as Convo from 'model/Convo'
import { useConvosStore } from 'store/convos'
import { usePeersStore } from 'store/peers'
import { fromApiConvo } from 'converters/ConvoConverter'
import { fromApiGroup, fromApiUser } from 'converters/PeerConverter'
import { useEnv } from 'hooks'
import { CONVOS_PER_PAGE, PEER_FIELDS } from 'misc/constants'

export async function loadMoreConvos() {
  const { api } = useEnv()
  const { convoList, convos } = useConvosStore()
  const { peers } = usePeersStore()

  if (convoList.loading) {
    return
  }

  const lastConvoId = convoList.peerIds.at(-1)
  const convo = lastConvoId && Convo.safeGet(lastConvoId)

  if (!convo?.minorSortId) {
    console.error('чет не то')
    return
  }

  convoList.loading = true

  const response = await api.fetch('messages.getConversations', {
    start_from_minor_sort_id: convo.minorSortId,
    count: CONVOS_PER_PAGE,
    fields: PEER_FIELDS,
    extended: 1
  })

  for (const apiConvo of response.items) {
    const { convo, peer } = fromApiConvo(apiConvo.conversation, apiConvo.last_message)

    if (convo) {
      convoList.peerIds.push(convo.id)
      // Мы держим конву в актуальном состоянии через лонгполл.
      // Перезапись конвы в кеше сбросила бы список сообщений
      if (!convos.get(convo.id)) {
        convos.set(convo.id, convo)
      }
    }

    if (peer) {
      peers.set(peer.id, peer)
    }
  }

  for (const apiUser of response.profiles ?? []) {
    const user = fromApiUser(apiUser)
    peers.set(user.id, user)
  }
  for (const apiGroup of response.groups ?? []) {
    const group = fromApiGroup(apiGroup)
    peers.set(group.id, group)
  }

  convoList.peerIds = [...new Set(convoList.peerIds)]
    .map(Convo.safeGet)
    .sort(Convo.sorter)
    .map((convo) => convo.id)

  convoList.loading = false
  convoList.hasMore = response.items.length === CONVOS_PER_PAGE
}
