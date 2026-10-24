import { defineComponent, onUnmounted } from 'vue'
import * as Attach from 'model/Attach'
import * as ConvoDraft from 'model/ConvoDraft'
import { useGlobalModal } from 'hooks'
import './ComposerAttachPhoto.css'

type Props =
  | { photo: Attach.Photo, uploadingPhoto?: undefined }
  | { photo?: undefined, uploadingPhoto: ConvoDraft.UploadingPhoto }

export const ComposerAttachPhoto = defineComponent<Props>((props) => {
  const { photoViewerModal } = useGlobalModal()
  const objectUrl = props.uploadingPhoto
    ? URL.createObjectURL(props.uploadingPhoto.file)
    : undefined

  onUnmounted(() => {
    if (objectUrl) URL.revokeObjectURL(objectUrl)
  })

  return () => {
    const { photo } = props
    const src = photo ? photo.sizes.get('x')?.url ?? photo.image.url : objectUrl

    return (
      <img
        class={['ComposerAttachPhoto', photo && 'ComposerAttachPhoto--clickable']}
        src={src}
        onClick={() => photo && photoViewerModal.open({ url: photo.image.url })}
      />
    )
  }
}, {
  props: ['photo', 'uploadingPhoto']
})
