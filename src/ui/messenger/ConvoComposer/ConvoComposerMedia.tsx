import { defineComponent, onUnmounted } from 'vue'
import * as Attach from 'model/Attach'
import * as ConvoDraft from 'model/ConvoDraft'
import { useGlobalModal } from 'hooks'
import { ButtonIcon } from 'ui/ui/ButtonIcon/ButtonIcon'
import { CircleProgressBar } from 'ui/ui/CircleProgressBar/CircleProgressBar'
import { Icon24Cancel } from 'assets/icons'
import './ConvoComposerMedia.css'

type Props = (
  | { attach: Attach.SingleAttach, uploadingAttach?: undefined }
  | { attach?: undefined, uploadingAttach: ConvoDraft.UploadingAttach }
) & {
  onRemove: () => void
}

// TODO: обработать media.failed
export const ConvoComposerMedia = defineComponent<Props>((props) => {
  const { photoViewerModal } = useGlobalModal()
  const objectUrl = props.uploadingAttach && URL.createObjectURL(props.uploadingAttach.file)

  onUnmounted(() => {
    if (objectUrl) {
      URL.revokeObjectURL(objectUrl)
    }
  })

  return () => {
    const photo = props.attach?.kind === 'Photo' && props.attach
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
        {props.uploadingAttach && (
          <CircleProgressBar
            class="ConvoComposerMedia__progress"
            progress={props.uploadingAttach.progress}
          />
        )}
      </div>
    )
  }
}, {
  props: ['attach', 'uploadingAttach', 'onRemove']
})
