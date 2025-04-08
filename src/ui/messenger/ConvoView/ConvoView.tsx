import { computed, defineComponent, watchEffect } from 'vue'
import { useRoute } from 'vue-router'
import * as Convo from 'model/Convo'
import * as Peer from 'model/Peer'
import { useConvosStore } from 'store/convos'
import { ConvoComposer } from 'ui/messenger/ConvoComposer/ConvoComposer'
import { ConvoHeader } from 'ui/messenger/ConvoHeader/ConvoHeader'
import { ConvoHistory } from 'ui/messenger/ConvoHistory/ConvoHistory'
import { PinnedMessage } from 'ui/messenger/PinnedMessage/PinnedMessage'
import { Spinner } from 'ui/ui/Spinner/Spinner'
import './ConvoView.css'

type ConvoViewProps = {
  convo: Convo.Convo
}

const ConvoView = defineComponent<ConvoViewProps>((props) => {
  return () => (
    <div class="ConvoView">
      <ConvoHeader convo={props.convo} />
      {props.convo.kind === 'ChatConvo' && props.convo.pinnedMessage && (
        <PinnedMessage pinnedMessage={props.convo.pinnedMessage} />
      )}
      <div class="ConvoView__history">
        <ConvoHistory convo={props.convo} />
      </div>
      <ConvoComposer convo={props.convo} />
    </div>
  )
}, {
  props: ['convo']
})

export const ConvoWrapper = defineComponent(() => {
  const route = useRoute('Convo')
  const { connection } = useConvosStore()

  const convo = computed(() => {
    const rawPeerId = Number(route.params.peerId)
    const peerId = rawPeerId && Peer.resolveId(rawPeerId)
    return peerId && Convo.get(peerId)
  })

  watchEffect(() => {
    if (!convo.value && connection.status === 'connected') {
      alert('необходима загрузка конвы')
    }
  })

  return () => (
    convo.value
      ? <ConvoView convo={convo.value} />
      : <Spinner class="ConvoWrapper__spinner" size="regular" />
  )
})
