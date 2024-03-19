import { ENGINE_VERSION } from 'env/Engine'
import { useConvosStore } from 'store/convos'
import { usePeersStore } from 'store/peers'
import { fromApiConvo } from 'converters/ConvoConverter'
import { fromApiGroup, fromApiUser } from 'converters/PeerConverter'
import { useEnv } from 'misc/hooks'
import { PEER_FIELDS } from 'misc/constants'

export async function loadInitialData() {
  const { api, engine } = useEnv()
  const { peers } = usePeersStore()
  const { convos, convoList, connection } = useConvosStore()

  if (connection.status !== 'init') {
    return
  }

  try {
    const [longpollParams, conversations] = await api.fetchParallel([
      api.buildMethod('messages.getLongPollServer', {
        lp_version: ENGINE_VERSION,
        need_pts: 1
      }),
      api.buildMethod('messages.getConversations', {
        count: 20,
        extended: 1,
        fields: PEER_FIELDS
      })
    ])

    connection.status = 'connected'
    engine.start(longpollParams)
    engine.stop()

    for (const apiConvo of conversations.items) {
      const {
        convo,
        peer
      } = fromApiConvo(apiConvo.conversation, apiConvo.last_message)
      if (convo) {
        convoList.push(convo.id)
        convos.set(convo.id, convo)
      }
      if (peer) {
        peers.set(peer.id, peer)
      }
    }

    for (const apiUser of conversations.profiles ?? []) {
      const user = fromApiUser(apiUser)
      peers.set(user.id, user)
    }
    for (const apiGroup of conversations.groups ?? []) {
      const group = fromApiGroup(apiGroup)
      peers.set(group.id, group)
    }
  } catch (err) {
    console.error(err)
    connection.status = 'initFailed'
  }
}
