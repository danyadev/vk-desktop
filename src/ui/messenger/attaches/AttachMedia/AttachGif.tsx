import { defineComponent } from 'vue'
import * as Attach from 'model/Attach'
import { useGlobalModal, useInView } from 'hooks'
import { Image } from 'ui/ui/Image/Image'

type Props = {
  gif: Attach.Gif
  width: number
  height: number
}

export const AttachGif = defineComponent<Props>((props) => {
  const { ref, inView } = useInView()
  const { photoViewerModal } = useGlobalModal()

  return () => (
    <div
      ref={ref}
      class="AttachMedia__item AttachMedia__gif"
      style={{ aspectRatio: props.width / props.height }}
      onClick={() => {
        if (props.gif.url) photoViewerModal.open({ url: props.gif.url })
      }}
    >
      {props.gif.videoUrl ? (
        <video
          class="AttachMedia__gifVideo"
          src={inView.value ? props.gif.videoUrl : undefined}
          poster={props.gif.thumbnail?.url}
          muted
          autoplay
          loop
          playsInline
          preload="none"
        />
      ) : props.gif.url && (
        <Image
          class="AttachMedia__image"
          src={props.gif.url}
          previewSrc={props.gif.thumbnail?.url}
          width={props.width}
          height={props.height}
        />
      )}
      <span class="AttachMedia__gifBadge">GIF</span>
    </div>
  )
}, {
  props: ['gif', 'width', 'height']
})
