import './Avatar.css'

import { computed, defineComponent } from 'vue'
import * as Peer from 'model/Peer'
import { ClassName } from 'misc/utils'
import { usePixelDensity } from 'misc/hooks'

type Props = {
  peer: Pick<Peer.Peer, 'photo50' | 'photo100'>
  size: 32 | 56
  class?: ClassName
}

export const Avatar = defineComponent<Props>((props) => {
  const isDense = usePixelDensity()
  const src = computed(() => (isDense.value ? props.peer.photo100 : props.peer.photo50))

  return () => (
    <img
      class="Avatar"
      src={src.value}
      style={{ width: `${props.size}px`, height: `${props.size}px` }}
    />
  )
}, {
  props: ['peer', 'size']
})
