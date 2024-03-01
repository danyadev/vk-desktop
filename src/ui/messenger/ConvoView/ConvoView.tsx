import { computed, defineComponent, watchEffect } from 'vue'
import { useRoute } from 'vue-router'
import { useConvosStore } from 'store/convos'
import * as Convo from 'model/Convo'
import * as Peer from 'model/Peer'
import { Spinner } from 'ui/ui/Spinner/Spinner'
import './ConvoView.css'

type ConvoViewProps = {
  convo: Convo.Convo
}

const ConvoView = defineComponent<ConvoViewProps>(({ convo }) => {
  const peer = Peer.safeGet(convo.id)

  return () => (
    <div class="ConvoView">
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

  watchEffect(() => {
    if (!convo.value) {
      alert('необходима загрузка конвы')
    }
  })

  return () => (
    convo.value ? (
      <ConvoView convo={convo.value} />
    ) : (
      <Spinner class="ConvoWrapper__spinner" size="medium" />
    )
  )
})
