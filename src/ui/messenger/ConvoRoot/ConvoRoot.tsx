import { computed, defineComponent } from 'vue'
import { useRoute } from 'vue-router'
import { useConvosStore } from 'store/convos'
import { usePeersStore } from 'store/peers'
import * as Convo from 'model/Convo'
import * as Peer from 'model/Peer'
import { Spinner } from 'ui/ui/Spinner/Spinner'
import './ConvoRoot.css'

type ConvoRootProps = {
  convo: Convo.Convo
}

const ConvoRoot = defineComponent<ConvoRootProps>(({ convo }) => {
  const { peers } = usePeersStore()
  const peer = Peer.safeGet(peers, convo.id)

  return () => (
    <div class="ConvoRoot">
      id: {convo.id}<br/>
      name: {Peer.name(peer)}
    </div>
  )
}, {
  props: ['convo']
})

export const ConvoWrapper = defineComponent(() => {
  const route = useRoute()
  const { convos } = useConvosStore()

  const peerId = computed(() => {
    const rawValue = Number(route.params.peerId)
    return rawValue ? Peer.resolveId(rawValue) : null
  })
  const convo = computed(() => (peerId.value ? convos.get(peerId.value) : null))

  return () => (
    convo.value ? (
      <ConvoRoot convo={convo.value} />
    ) : (
      <Spinner class="ConvoWrapper__spinner" size="medium" />
    )
  )
})
