import { defineComponent } from 'vue'
import * as Attach from 'model/Attach'
import { NonEmptyArray } from 'misc/utils'
import './AttachPhotos.css'

type Props = {
  photos: NonEmptyArray<Attach.Photo>
}

export const AttachPhotos = defineComponent<Props>((props) => {
  return () => (
    <div class="AttachPhotos">
      {props.photos.map((photo) => (
        <img class="AttachPhoto" src={photo.image.url} />
      ))}
    </div>
  )
}, {
  props: ['photos']
})
