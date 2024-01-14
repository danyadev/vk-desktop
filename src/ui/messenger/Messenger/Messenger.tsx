import { defineComponent, onMounted, onUnmounted } from 'vue'
import { ENGINE_VERSION } from 'env/Engine'
import { useConvosStore } from 'store/convos'
import { usePeersStore } from 'store/peers'
import { fromApiConvo } from 'converters/ConvoConverter'
import { fromApiGroup, fromApiUser } from 'converters/PeerConverter'
import { useEnv } from 'misc/hooks'
import { PEER_FIELDS } from 'misc/constants'
import { ConvoList } from 'ui/messenger/ConvoList/ConvoList'
import './Messenger.css'

export const Messenger = defineComponent(() => {
  const { api, engine } = useEnv()
  const { convos, convoList } = useConvosStore()
  const { peers } = usePeersStore()

  onMounted(async () => {
    console.time('load data')
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
    console.timeEnd('load data')

    engine.start(longpollParams)
    engine.stop()

    for (const apiConvo of conversations.items) {
      const { convo, peer } = fromApiConvo(apiConvo.conversation, apiConvo.last_message)
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
  })

  onUnmounted(() => {
    engine.stop()
  })

  return () => (
    <div class="Messenger">
      <ConvoList class="Messenger__convoList" />
      <div class="Messenger__content">
        контент
      </div>
    </div>
  )
})
