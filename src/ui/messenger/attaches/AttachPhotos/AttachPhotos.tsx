import { computed, defineComponent } from 'vue'
import * as Attach from 'model/Attach'
import { useGlobalModal } from 'hooks'
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
  const layout = computed(() => {
    const maxHeight = Math.min(historyViewportHeight.value * 0.9, 500)
    return generatePhotosLayout(props.photos, maxWidth.value, maxHeight)
  })
  const { photoViewerModal } = useGlobalModal()

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
              onClick={() => photoViewerModal.open({ photo: photo.photo })}
            />
          ))}
        </span>
      ))}

      {!isMeasured.value && (
        <div
          ref={measureElRef}
          style={{ width: '100vw', maxWidth: '100%' }}
        />
      )}
    </div>
  )
}, {
  props: ['photos']
})
