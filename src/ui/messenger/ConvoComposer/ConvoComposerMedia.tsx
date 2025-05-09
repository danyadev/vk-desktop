import { defineComponent, onUnmounted } from 'vue'
import { fromApiAttachPhoto } from 'converters/AttachConverter'
import { useGlobalModal } from 'hooks'
import { UploadedMediaItem } from 'ui/messenger/ConvoComposer/ConvoComposer'
import { ButtonIcon } from 'ui/ui/ButtonIcon/ButtonIcon'
import { CircleProgressBar } from 'ui/ui/CircleProgressBar/CircleProgressBar'
import { Icon24Cancel } from 'assets/icons'
import './ConvoComposerMedia.css'

type Props = {
  media: UploadedMediaItem
  onRemove: () => void
}

export const ConvoComposerMedia = defineComponent<Props>((props) => {
  const { photoViewerModal } = useGlobalModal()
  const objectUrl = URL.createObjectURL(props.media.file)

  onUnmounted(() => {
    URL.revokeObjectURL(objectUrl)
  })

  return () => {
    const photo = props.media.photo && fromApiAttachPhoto(props.media.photo)
    const src = photo?.sizes.get('x')?.url ?? objectUrl

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
        {!props.media.photo && (
          <CircleProgressBar
            class="ConvoComposerMedia__progress"
            progress={props.media.progress}
          />
        )}
      </div>
    )
  }
}, {
  props: ['media', 'onRemove']
})
