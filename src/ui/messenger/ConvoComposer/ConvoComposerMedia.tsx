import { defineComponent, onUnmounted } from 'vue'
import * as ConvoDraft from 'model/ConvoDraft'
import { useGlobalModal } from 'hooks'
import { ButtonIcon } from 'ui/ui/ButtonIcon/ButtonIcon'
import { CircleProgressBar } from 'ui/ui/CircleProgressBar/CircleProgressBar'
import { Icon24Cancel } from 'assets/icons'
import './ConvoComposerMedia.css'

type Props = {
  attachPreview: ConvoDraft.AttachPreview
  onRemove: () => void
}

// TODO: обработать media.failed
export const ConvoComposerMedia = defineComponent<Props>((props) => {
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
      <div class={['ConvoComposerMedia', photo && 'ConvoComposerMedia--clickable']}>
        <ButtonIcon
          class="ConvoComposerMedia__remove"
          icon={<Icon24Cancel width={16} height={16} />}
          onClick={props.onRemove}
        />
        <img
          src={src}
          class="ConvoComposerMedia__img"
          onClick={() => photo && photoViewerModal.open({ photo })}
        />
        {kind === 'UploadingAttach' && (
          <CircleProgressBar
            class="ConvoComposerMedia__progress"
            progress={attach.progress}
          />
        )}
      </div>
    )
  }
}, {
  props: ['attachPreview', 'onRemove']
})
