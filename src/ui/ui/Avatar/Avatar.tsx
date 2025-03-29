import { defineComponent } from 'vue'
import * as Peer from 'model/Peer'
import { usePixelDensity } from 'hooks'
import { ClassName } from 'misc/utils'
import './Avatar.css'

type Props = {
  peer: Peer.Peer
  size: 32 | 48 | 56
  class?: ClassName
}

export const Avatar = defineComponent<Props>((props) => {
  const isDense = usePixelDensity()

  return () => {
    const src = isDense.value ? props.peer.photo100 : props.peer.photo50
    const style = {
      width: `${props.size}px`,
      height: `${props.size}px`
    }

    if (src) {
      return <img class="Avatar" src={src} style={style} />
    }

    return (
      <span
        class={[
          'Avatar',
          `Avatar--size-${props.size}`,
          `Avatar--color-${Math.abs(props.peer.id) % 6}`
        ]}
        style={style}
      >
        {Peer.initials(props.peer)}
      </span>
    )
  }
}, {
  props: ['peer', 'size']
})
