import { computed, defineComponent } from 'vue'
import * as Attach from 'model/Attach'
import { NonEmptyArray } from 'misc/utils'
import { generatePhotosLayout } from './generatePhotosLayout'
import './AttachPhotos.css'

type Props = {
  photos: NonEmptyArray<Attach.Photo>
}

export const AttachPhotos = defineComponent<Props>((props) => {
  const layout = computed(() => generatePhotosLayout(props.photos))

  return () => (
    <div class="AttachPhotos">
      {layout.value.map((photos) => (
        <span class="AttachPhotos__row">
          {photos.map((photo) => (
            <img class="AttachPhoto" src={photo.photo.image.url} />
          ))}
        </span>
      ))}
    </div>
  )
}, {
  props: ['photos']
})
