import { computed, defineComponent, Ref } from 'vue'
import * as Attach from 'model/Attach'
import { NonEmptyArray } from 'misc/utils'
import { generatePhotosLayout } from './generatePhotosLayout'
import './AttachPhotos.css'

type Props = {
  photos: NonEmptyArray<Attach.Photo>
  historyContainerWidth: Ref<number>
}

export const AttachPhotos = defineComponent<Props>((props) => {
  // TODO: аттач может рисоваться из записи на стене или пересланного,
  // поэтому стоит считать максимальную ширину сообщения в ConvoMessage
  // и уточнять значение по мере продвижения значения
  const maxWidth = computed(() => (
    props.historyContainerWidth.value
  ))
  const layout = computed(() => generatePhotosLayout(props.photos, maxWidth.value, 500))

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
  props: ['photos', 'historyContainerWidth']
})
