import { defineComponent, shallowRef, watch } from 'vue'
import { useServices } from 'services'
import * as Attach from 'model/Attach'
import { useInView, useViewer } from 'hooks'
import { Image } from 'ui/ui/Image/Image'
import { Spinner } from 'ui/ui/Spinner/Spinner'
import { Icon24AddCircleOutline, Icon24CheckOutline, Icon24Play } from 'assets/icons'

type Props = {
  gif: Attach.Gif
  width: number
  height: number
  isOnly: boolean
}

export const AttachGif = defineComponent<Props>((props) => {
  const { api } = useServices()
  const viewer = useViewer()
  const { ref, inView } = useInView({ threshold: 0.25 })
  const isPlaying = shallowRef(false)
  const isSaving = shallowRef(false)
  const savedId = shallowRef<number>()

  watch(inView, (visible) => {
    isPlaying.value = visible && props.isOnly
  })

  const toggleSave = async () => {
    if (isSaving.value) return

    isSaving.value = true
    const currentSavedId = savedId.value

    try {
      if (currentSavedId !== undefined) {
        await api.fetch('docs.delete', {
          owner_id: viewer.id,
          doc_id: currentSavedId
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

  const fileSize = () => {
    const { size } = props.gif
    if (size < 1024) return `${size} B`
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
    return `${(size / 1024 / 1024).toFixed(1)} MB`
  }

  return () => {
    const { gif } = props
    const hasVideo = !!gif.videoUrl
    const gifImageSrc = isPlaying.value ? gif.url ?? gif.thumbnail?.url : gif.thumbnail?.url
    const saved = savedId.value !== undefined

    return (
      <div
        ref={ref}
        class="AttachMedia__item AttachMedia__gif"
        style={{ aspectRatio: props.width / props.height }}
      >
        {hasVideo ? (
          <video
            class="AttachMedia__gifVideo"
            src={isPlaying.value ? gif.videoUrl : undefined}
            poster={gif.thumbnail?.url}
            muted
            autoplay
            loop
            playsinline
            preload="none"
            onError={() => (isPlaying.value = false)}
          />
        ) : gifImageSrc && (
          <Image
            class="AttachMedia__image"
            src={gifImageSrc}
            width={props.width}
            height={props.height}
          />
        )}

        <button
          class="AttachMedia__gifToggle"
          type="button"
          onClick={() => (isPlaying.value = !isPlaying.value)}
        />
        {!isPlaying.value && (
          <span class="AttachMedia__play"><Icon24Play /></span>
        )}
        <span class="AttachMedia__gifBadge">GIF{props.isOnly && ` · ${fileSize()}`}</span>

        {props.isOnly && gif.ownerId !== viewer.id && (
          <button
            class="AttachMedia__gifSave"
            type="button"
            disabled={isSaving.value}
            onClick={toggleSave}
          >
            {isSaving.value ? <Spinner size="small" /> : saved
              ? <Icon24CheckOutline width={20} height={20} />
              : <Icon24AddCircleOutline width={20} height={20} />}
          </button>
        )}
      </div>
    )
  }
}, {
  props: ['gif', 'width', 'height', 'isOnly']
})
