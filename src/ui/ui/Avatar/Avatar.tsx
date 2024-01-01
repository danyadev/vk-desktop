import { computed, defineComponent } from 'vue'
import * as Peer from 'model/Peer'
import { ClassName } from 'misc/utils'
import { usePixelDensity } from 'misc/hooks'
import './Avatar.css'

type Props = {
  peer: Peer.Peer
  size: 32 | 48 | 56
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
