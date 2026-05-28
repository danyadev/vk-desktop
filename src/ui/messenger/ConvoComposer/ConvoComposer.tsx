import { ChangeEvent, computed, defineComponent, KeyboardEvent, onMounted, shallowRef } from 'vue'
import { Uploader } from 'env/Uploader'
import * as Convo from 'model/Convo'
import * as ConvoDraft from 'model/ConvoDraft'
import { sendMessage } from 'actions'
import { useEnv } from 'hooks'
import { isEventWithModifier } from 'misc/utils'
import { ComposerAttachPreview } from 'ui/messenger/ConvoComposer/ComposerAttachPreview'
import { ComposerMuteChannelButton } from 'ui/messenger/ConvoComposer/ComposerMuteChannelButton'
import { useComposerAttaches } from 'ui/messenger/ConvoComposer/useComposerAttaches'
import { ActionMenu } from 'ui/ui/ActionMenu/ActionMenu'
import { ActionMenuItem } from 'ui/ui/ActionMenuItem/ActionMenuItem'
import { ButtonIcon } from 'ui/ui/ButtonIcon/ButtonIcon'
import { Popper } from 'ui/ui/Popper/Popper'
import {
  Icon20PictureOutline,
  Icon24AddCircleOutline,
  Icon24Info,
  Icon24Send
} from 'assets/icons'
import './ConvoComposer.css'

type Props = {
  convo: Convo.Convo
}

export const ConvoComposer = defineComponent<Props>((props) => {
  const { lang } = useEnv()
  const $input = shallowRef<HTMLSpanElement | null>(null)

  const draft = ConvoDraft.get(props.convo.id)
  const {
    attachPreviews,
    removeAttachPreview,
    uploadPhoto
  } = useComposerAttaches(props.convo, draft)

  const canSendMessage = computed(() => (
    !ConvoDraft.isEmpty(draft) && draft.uploadingAttaches.length === 0
  ))

  onMounted(() => {
    if (!$input.value) {
      return
    }

    $input.value.focus()

    if (draft.text) {
      $input.value.innerText = draft.text

      const sel = window.getSelection()!
      sel.selectAllChildren($input.value)
      sel.collapseToEnd()
    }
  })

  const onMessageSend = () => {
    sendMessage(props.convo.id, draft.text, draft.attaches)

    ConvoDraft.reset(draft)

    if ($input.value) {
      $input.value.innerText = ''
    }
  }

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.code === 'Enter' && !isEventWithModifier(event)) {
      // Предотвращаем перенос строки
      event.preventDefault()

      if (!canSendMessage.value) {
        return
      }

      onMessageSend()
    }
  }

  const onInput = (event: ChangeEvent<HTMLElement>) => {
    draft.text = event.currentTarget.innerText ?? ''
  }

  const onPaste = (event: ClipboardEvent) => {
    for (const file of event.clipboardData?.files ?? []) {
      if (Uploader.isPhotoFile(file)) {
        event.preventDefault()
        uploadPhoto(file)
      }
    }
  }

  const openPhotoPicker = async () => {
    const fileHandles = await showOpenFilePicker({
      excludeAcceptAllOption: true,
      multiple: true,
      types: [{
        accept: {
          'image/*': ['.png', '.jpg', '.jpeg', '.gif']
        }
      }]
    }).catch(() => [])

    for (const fileHandle of fileHandles) {
      const file = await fileHandle.getFile()
      uploadPhoto(file)
    }
  }

  const renderPanel = () => {
    if (props.convo.kind === 'ChatConvo' && props.convo.status === 'kicked') {
      return (
        <div class="ConvoComposer__restriction">
          <Icon24Info color="var(--vkui--color_accent_orange)" />
          {lang.use('me_chat_kicked_status')}
        </div>
      )
    }

    if (Convo.isChannel(props.convo)) {
      return <ComposerMuteChannelButton convo={props.convo} />
    }

    return (
      <>
        <Popper
          placement="top-start"
          offset={{
            // Отступ слева кнопки, чтобы начало меню совпадало с началом поля ввода
            crossAxis: -6,
            // Отступ сверху кнопки (4px) + дефолтный отступ от элемента у поппера (4px)
            mainAxis: 8
          }}
          closeOnContentClick
          content={
            <ActionMenu>
              <ActionMenuItem
                icon={<Icon20PictureOutline />}
                text="Фото"
                onClick={openPhotoPicker}
              />
            </ActionMenu>
          }
        >
          <ButtonIcon class="ConvoComposer__addAttaches" icon={<Icon24AddCircleOutline />} />
        </Popper>

        <span
          class="ConvoComposer__input"
          contenteditable="plaintext-only"
          role="textbox"
          placeholder={lang.use('me_convo_composer_placeholder')}
          ref={$input}
          onKeydown={onKeyDown}
          onInput={onInput}
          onPaste={onPaste}
        />

        <ButtonIcon
          class="ConvoComposer__send"
          disabled={!canSendMessage.value}
          icon={<Icon24Send />}
          onClick={onMessageSend}
          // Предотвращаем сброс фокуса с поля ввода
          onMousedown={(event) => event.preventDefault()}
        />
      </>
    )
  }

  return () => (
    <div class="ConvoComposer">
      <div class="ConvoComposer__inner">
        {attachPreviews.value.length > 0 && (
          <div class="ConvoComposer__attaches">
            {attachPreviews.value.map((attachPreview) => (
              <ComposerAttachPreview
                attachPreview={attachPreview}
                onRemove={() => removeAttachPreview(attachPreview)}
              />
            ))}
          </div>
        )}

        <div class="ConvoComposer__panel">
          {renderPanel()}
        </div>
      </div>
    </div>
  )
}, {
  props: ['convo']
})
