import { computed, defineComponent } from 'vue'
import * as Attach from 'model/Attach'
import { useGlobalModal } from 'hooks'
import { NonEmptyArray } from 'misc/utils'
import { generatePhotosLayout } from './generatePhotosLayout'
import { Image } from 'ui/ui/Image/Image'
import './AttachPhotos.css'

type Props = {
  photos: NonEmptyArray<Attach.Photo>
}

export const AttachPhotos = defineComponent<Props>((props) => {
  const layout = computed(() => generatePhotosLayout(props.photos))
  const { photoViewerModal } = useGlobalModal()

  return () => (
    <div class="AttachPhotos">
      {layout.value.map((photos) => (
        <span class="AttachPhotos__row">
          {photos.map((photo) => (
            <Image
              key={photo.photo.image.url}
              class="AttachPhotos__photo"
              src={photo.photo.image.url}
              previewSrc={photo.photo.sizes.get('s')?.url}
              width={photo.width}
              height={photo.height}
              onClick={() => photoViewerModal.open({ photo: photo.photo })}
            />
          ))}
        </span>
      ))}
    </div>
  )
}, {
  props: ['photos']
})
