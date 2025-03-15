import { computed, defineComponent } from 'vue'
import * as Attach from 'model/Attach'
import { NonEmptyArray } from 'misc/utils'
import { useConvoHistoryContext } from 'misc/providers'
import { generatePhotosLayout } from './generatePhotosLayout'
import { useMeasureMaxWidth } from './useMeasureMaxWidth'
import './AttachPhotos.css'

type Props = {
  photos: NonEmptyArray<Attach.Photo>
}

export const AttachPhotos = defineComponent<Props>((props) => {
  const { historyViewportWidth, historyViewportHeight } = useConvoHistoryContext()
  const { measureElRef, maxWidth, isMeasured } = useMeasureMaxWidth(historyViewportWidth)
  const maxHeight = computed(() => Math.min(historyViewportHeight.value * 0.9, 500))
  const layout = computed(() => generatePhotosLayout(props.photos, maxWidth.value, maxHeight.value))

  return () => (
    <div class="AttachPhotos">
      {layout.value.map((photos) => (
        <span class="AttachPhotos__row">
          {photos.map((photo) => (
            <img
              class="AttachPhoto"
              src={photo.photo.image.url}
              width={photo.width}
              height={photo.height}
            />
          ))}
        </span>
      ))}

      {!isMeasured.value && (
        <div
          ref={measureElRef}
          style={{ width: '100vw', maxWidth: '100%', marginTop: '-4px' }}
        />
      )}
    </div>
  )
}, {
  props: ['photos']
})
