import { computed, defineComponent, watchEffect } from 'vue'
import { useRoute } from 'vue-router'
import { useConvosStore } from 'store/convos'
import * as Convo from 'model/Convo'
import * as Peer from 'model/Peer'
import { ConvoComposer } from 'ui/messenger/ConvoComposer/ConvoComposer'
import { ConvoHeader } from 'ui/messenger/ConvoHeader/ConvoHeader'
import { ConvoHistory } from 'ui/messenger/ConvoHistory/ConvoHistory'
import { Spinner } from 'ui/ui/Spinner/Spinner'
import './ConvoView.css'

type ConvoViewProps = {
  convo: Convo.Convo
}

const ConvoView = defineComponent<ConvoViewProps>(({ convo }) => {
  return () => (
    <div class="ConvoView">
      <ConvoHeader convo={convo} />
      <div class="ConvoView__history">
        <ConvoHistory convo={convo} />
      </div>
      <ConvoComposer />
    </div>
  )
}, {
  props: ['convo']
})

export const ConvoWrapper = defineComponent(() => {
  const route = useRoute()
  const { convos, connection } = useConvosStore()

  const peerId = computed(() => {
    const rawValue = Number(route.params.peerId)
    return rawValue ? Peer.resolveId(rawValue) : null
  })
  const convo = computed(() => (peerId.value && convos.get(peerId.value)))

  watchEffect(() => {
    if (!convo.value && connection.status !== 'init') {
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
