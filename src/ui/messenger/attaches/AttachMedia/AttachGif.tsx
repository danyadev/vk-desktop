import { defineComponent, shallowRef, watch } from 'vue'
import { useServices } from 'services'
import * as Attach from 'model/Attach'
import { useInView, useViewer } from 'hooks'
import { ButtonIcon } from 'ui/ui/ButtonIcon/ButtonIcon'
import { Image } from 'ui/ui/Image/Image'
import { Icon24AddCircleOutline, Icon24CheckOutline, Icon24Play } from 'assets/icons'

type Props = {
  gif: Attach.Gif
  width: number
  height: number
  isOnlyMedia: boolean
}

export const AttachGif = defineComponent<Props>((props) => {
  const { api, lang } = useServices()
  const viewer = useViewer()
  const { ref, inView } = useInView(0.25)
  const isPlaying = shallowRef(false)
  const isSaving = shallowRef(false)
  const savedId = shallowRef<number>()

  watch([inView, () => props.isOnlyMedia], ([visible, isOnlyAttach]) => {
    isPlaying.value = visible && isOnlyAttach
  })

  const toggleSave = async (event: MouseEvent) => {
    event.stopPropagation()
    if (isSaving.value) return

    isSaving.value = true

    try {
      if (savedId.value !== undefined) {
        await api.fetch('docs.delete', {
          owner_id: viewer.id,
          doc_id: savedId.value
        })
        savedId.value = undefined
      } else {
        savedId.value = await api.fetch('docs.add', {
          owner_id: props.gif.ownerId,
          doc_id: props.gif.id,
          access_key: props.gif.accessKey
        })
      }
    } catch (error) {
      console.error('[AttachGif] Failed to update saved GIF', error)
    } finally {
      isSaving.value = false
    }
  }

  return () => {
    const { gif } = props
    const imageSrc = isPlaying.value ? gif.url ?? gif.thumbnail?.url : gif.thumbnail?.url

    return (
      <div
        ref={ref}
        class="AttachMedia__item AttachMedia__gif"
        style={{ aspectRatio: props.width / props.height }}
        onClick={() => (isPlaying.value = !isPlaying.value)}
      >
        {isPlaying.value && gif.videoUrl ? (
          <video
            class="AttachMedia__gifVideo"
            src={gif.videoUrl}
            poster={gif.thumbnail?.url}
            muted
            autoplay
            loop
            playsinline
            preload="none"
            onError={() => (isPlaying.value = false)}
          />
        ) : imageSrc && (
          <Image
            key={imageSrc}
            class="AttachMedia__image"
            src={imageSrc}
            width={props.width}
            height={props.height}
          />
        )}

        {!isPlaying.value && (
          <span class="AttachMedia__play"><Icon24Play /></span>
        )}
        <span class="AttachMedia__meta">
          GIF{props.isOnlyMedia && ` · ${formatFileSize(gif.size, lang.getLocale())}`}
        </span>

        {props.isOnlyMedia && gif.ownerId !== viewer.id && (
          <ButtonIcon
            class="AttachMedia__gifSave"
            loading={isSaving.value}
            icon={savedId.value !== undefined
              ? <Icon24CheckOutline width={20} height={20} />
              : <Icon24AddCircleOutline width={20} height={20} />}
            onClick={toggleSave}
          />
        )}
      </div>
    )
  }
}, {
  props: ['gif', 'width', 'height', 'isOnlyMedia']
})

function formatFileSize(size: number, locale: string) {
  const [value, unit] = size < 1024
    ? [size, 'byte']
    : size < 1024 ** 2
      ? [size / 1024, 'kilobyte']
      : [size / 1024 ** 2, 'megabyte']

  return new Intl.NumberFormat(locale, {
    style: 'unit',
    unit,
    maximumFractionDigits: 1
  }).format(value)
}
