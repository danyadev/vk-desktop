import { defineComponent, onUnmounted } from 'vue'
import { useGlobalModal } from 'hooks'
import { AttachPreview } from 'ui/messenger/ConvoComposer/useComposerAttaches'
import { ButtonIcon } from 'ui/ui/ButtonIcon/ButtonIcon'
import { CircleProgressBar } from 'ui/ui/CircleProgressBar/CircleProgressBar'
import { Icon24Cancel } from 'assets/icons'
import './ComposerAttachPreview.css'

type Props = {
  attachPreview: AttachPreview
  onRemove: () => void
  onRetry: () => void
  onCancel: () => void
}

export const ComposerAttachPreview = defineComponent<Props>((props) => {
  const { photoViewerModal } = useGlobalModal()
  const objectUrl = props.attachPreview.kind === 'UploadingAttach'
    ? URL.createObjectURL(props.attachPreview.attach.file)
    : undefined

  onUnmounted(() => {
    if (objectUrl) {
      URL.revokeObjectURL(objectUrl)
    }
  })

  return () => {
    const { kind, attach } = props.attachPreview
    const photo = kind === 'Attach' && attach.kind === 'Photo' && attach
    const src = photo ? photo.sizes.get('x')?.url : objectUrl

    return (
      <div class={['ComposerAttachPreview', photo && 'ComposerAttachPreview--clickable']}>
        <ButtonIcon
          class="ComposerAttachPreview__remove"
          icon={<Icon24Cancel width={16} height={16} />}
          onClick={props.onRemove}
        />
        <img
          src={src}
          class="ComposerAttachPreview__img"
          onClick={() => photo && photoViewerModal.open({ photo })}
        />
        {kind === 'UploadingAttach' && (
          <CircleProgressBar
            class="ComposerAttachPreview__progress"
            progress={attach.progress}
            showRetry={attach.failed}
            onRetry={props.onRetry}
            onCancel={props.onCancel}
          />
        )}
      </div>
    )
  }
}, {
  props: ['attachPreview', 'onRemove', 'onRetry', 'onCancel']
})
