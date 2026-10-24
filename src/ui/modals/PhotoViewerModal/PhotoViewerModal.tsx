import { defineComponent } from 'vue'
import { useGlobalModal } from 'hooks'
import { ModalView } from 'ui/modals/parts'
import './PhotoViewerModal.css'

export type PhotoViewerModalProps = {
  url: string
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
      <img class="PhotoViewerModal__photo" src={props.url} />
    </ModalView>
  )
}, {
  props: ['url']
})
