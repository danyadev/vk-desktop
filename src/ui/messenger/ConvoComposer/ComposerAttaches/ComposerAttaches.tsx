import { defineComponent } from 'vue'
import * as Attach from 'model/Attach'
import * as ConvoDraft from 'model/ConvoDraft'
import { ComposerAttach } from './ComposerAttach'
import { AttachPreview } from 'ui/messenger/ConvoComposer/useComposerAttaches'
import './ComposerAttaches.css'

type Props = {
  previews: AttachPreview[]
  disabled?: boolean
  onRemove: (preview: AttachPreview) => void
  onRetry: (attach: ConvoDraft.UploadingAttach) => void
  onCancel: (attach: ConvoDraft.UploadingAttach) => void
}

export const ComposerAttaches = defineComponent<Props>((props) => {
  return () => (
    <div class={['ComposerAttaches', props.disabled && 'ComposerAttaches--disabled']}>
      {props.previews.map((preview, index) => (
        <ComposerAttach
          key={preview.kind === 'UploadingAttach'
            ? `upload_${preview.attach.id}`
            : `attach_${Attach.id(preview.attach)}_${index}`}
          preview={preview}
          disabled={props.disabled}
          onRemove={() => props.onRemove(preview)}
          onRetry={() => {
            if (preview.kind === 'UploadingAttach') props.onRetry(preview.attach)
          }}
          onCancel={() => {
            if (preview.kind === 'UploadingAttach') props.onCancel(preview.attach)
          }}
        />
      ))}
    </div>
  )
}, {
  props: ['previews', 'disabled', 'onRemove', 'onRetry', 'onCancel']
})
