import { defineComponent } from 'vue'
import { useServices } from 'services'
import { ComposerAttachCard } from './ComposerAttachCard'
import { ComposerAttachPhoto } from './ComposerAttachPhoto'
import { AttachPreview } from 'ui/messenger/ConvoComposer/useComposerAttaches'
import { ButtonIcon } from 'ui/ui/ButtonIcon/ButtonIcon'
import { CircleProgressBar } from 'ui/ui/CircleProgressBar/CircleProgressBar'
import {
  Icon24Cancel,
  Icon24Info,
  Icon24LinkExternalOutline,
  Icon24VolumeOutline
} from 'assets/icons'
import './ComposerAttach.css'

type Props = {
  preview: AttachPreview
  disabled?: boolean
  onRemove: () => void
  onRetry: () => void
  onCancel: () => void
}

export const ComposerAttach = defineComponent<Props>((props) => {
  const { lang } = useServices()

  const renderContent = () => {
    const { preview } = props
    if (preview.kind === 'UploadingAttach') {
      return <ComposerAttachPhoto uploadingPhoto={preview.attach} />
    }

    const { attach } = preview
    switch (attach.kind) {
      case 'Photo':
        return <ComposerAttachPhoto photo={attach} />

      case 'Link':
        return (
          <ComposerAttachCard
            image={attach.imageSizes?.get('o')?.url}
            icon={<Icon24LinkExternalOutline />}
            title={lang.usePlural('me_message_attach_link', 1)}
            subtitle={attach.title || attach.url}
          />
        )

      case 'Wall':
        return (
          <ComposerAttachCard
            icon={<Icon24LinkExternalOutline />}
            title={lang.use('me_message_attach_wall')}
            subtitle={attach.text}
          />
        )

      case 'Voice':
        return (
          <ComposerAttachCard
            icon={<Icon24VolumeOutline />}
            title={lang.use('me_message_attach_voice')}
            subtitle={attach.transcript}
          />
        )

      case 'Sticker':
        return (
          <ComposerAttachCard
            image={attach.imagesWithBackground?.[0]?.url ?? attach.images?.[0]?.url}
            icon={<Icon24Info />}
            title={lang.use('me_message_attach_sticker')}
          />
        )

      case 'Unknown':
        return (
          <ComposerAttachCard
            icon={<Icon24Info />}
            title={lang.use('me_unknown_attach')}
            subtitle={attach.type}
          />
        )
    }
  }

  return () => (
    <div class="ComposerAttach">
      {renderContent()}

      <ButtonIcon
        class="ComposerAttach__remove"
        icon={<Icon24Cancel width={16} height={16} />}
        disabled={props.disabled}
        onClick={props.onRemove}
      />

      {props.preview.kind === 'UploadingAttach' && (
        <CircleProgressBar
          class="ComposerAttach__progress"
          progress={props.preview.attach.progress}
          showRetry={props.preview.attach.failed}
          onRetry={props.onRetry}
          onCancel={props.onCancel}
        />
      )}
    </div>
  )
}, {
  props: ['preview', 'disabled', 'onRemove', 'onRetry', 'onCancel']
})
