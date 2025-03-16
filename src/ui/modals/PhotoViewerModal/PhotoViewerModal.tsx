import { defineComponent } from 'vue'
import * as Attach from 'model/Attach'
import { useGlobalModal } from 'hooks'
import { ModalView } from 'ui/modals/parts'
import './PhotoViewerModal.css'

export type PhotoViewerModalProps = {
  photo: Attach.Photo
}

export const PhotoViewerModal = defineComponent<PhotoViewerModalProps>((props) => {
  const { photoViewerModal } = useGlobalModal()

  return () => (
    <ModalView
      class="PhotoViewerModal"
      opened={photoViewerModal.opened}
      onClose={photoViewerModal.close}
      onVisibilityChange={photoViewerModal.onVisibilityChange}
    >
      <img class="PhotoViewerModal__photo" src={props.photo.image.url} />
    </ModalView>
  )
}, {
  props: ['photo']
})
