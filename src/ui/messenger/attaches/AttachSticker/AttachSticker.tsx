import { computed, defineComponent } from 'vue'
import * as Attach from 'model/Attach'
import { usePixelDensity } from 'hooks'
import './AttachSticker.css'

type Props = {
  sticker: Attach.Sticker
}

export const AttachSticker = defineComponent<Props>((props) => {
  const isDense = usePixelDensity()
  const url = computed(() => {
    const width = isDense.value ? 256 : 128

    if (props.sticker.imagesWithBackground) {
      const image =
        props.sticker.imagesWithBackground.find((image) => image.width >= width) ??
        props.sticker.imagesWithBackground.at(-1)

      if (image) {
        return image.url
      }
    }

    return `https://vk.com/sticker/1-${props.sticker.id}-${width}b`
  })

  return () => (
    <img class="AttachSticker" src={url.value} />
  )
}, {
  props: ['sticker']
})
