import { computed, defineComponent, shallowRef, watch } from 'vue'
import * as Peer from 'model/Peer'
import { usePixelDensity } from 'hooks'
import { ClassName } from 'misc/utils'
import './Avatar.css'

export type AvatarSize = 24 | 32 | 48 | 56 | 80

type Props = {
  peer: Peer.Peer
  size: AvatarSize
  class?: ClassName
}

export const Avatar = defineComponent<Props>((props) => {
  const isDense = usePixelDensity()
  const isImageFailed = shallowRef(false)

  const src = computed(() => {
    const screenSize = isDense.value ? props.size * 2 : props.size
    if (screenSize > 100 && props.peer.kind !== 'Chat' && props.peer.photo200) {
      return props.peer.photo200
    }
    return screenSize > 50 ? props.peer.photo100 : props.peer.photo50
  })

  watch(src, () => {
    isImageFailed.value = false
  })

  return () => {
    const style = {
      width: `${props.size}px`,
      height: `${props.size}px`
    }

    if (src.value && !isImageFailed.value) {
      return (
        <img
          class="Avatar"
          src={src.value}
          style={style}
          onError={() => (isImageFailed.value = true)}
        />
      )
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
