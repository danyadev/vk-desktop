import { ChangeEvent, computed, defineComponent, KeyboardEvent, onMounted, shallowRef, watch } from 'vue'
import { useServices } from 'services'
import * as Convo from 'model/Convo'
import * as ConvoDraft from 'model/ConvoDraft'
import { useConvosStore } from 'store/convos'
import { editMessage, sendMessage } from 'actions'
import { useConvoSession, useModal } from 'hooks'
import { isEventWithModifier } from 'misc/utils'
import { ComposerAttaches } from 'ui/messenger/ConvoComposer/ComposerAttaches/ComposerAttaches'
import { ComposerMuteChannelButton } from 'ui/messenger/ConvoComposer/ComposerMuteChannelButton'
import { useComposerAttaches } from 'ui/messenger/ConvoComposer/useComposerAttaches'
import { DeleteMessageModal } from 'ui/messenger/DeleteMessageModal/DeleteMessageModal'
import { ReplyMessage } from 'ui/messenger/ReplyMessage/ReplyMessage'
import { Modal } from 'ui/modals/parts'
import { ActionMenu } from 'ui/ui/ActionMenu/ActionMenu'
import { ActionMenuItem } from 'ui/ui/ActionMenuItem/ActionMenuItem'
import { Button } from 'ui/ui/Button/Button'
import { ButtonIcon } from 'ui/ui/ButtonIcon/ButtonIcon'
import { Popper } from 'ui/ui/Popper/Popper'
import {
  Icon20PictureOutline,
  Icon20TrashOutline,
  Icon24AddCircleOutline,
  Icon24Cancel,
  Icon24CheckOutline,
  Icon24Info,
  Icon24Send
} from 'assets/icons'
import './ConvoComposer.css'

type Props = {
  convo: Convo.Convo
}

export const ConvoComposer = defineComponent<Props>((props) => {
  const { lang } = useServices()
  const { convoDrafts } = useConvosStore()
  const session = useConvoSession()
  const $input = shallowRef<HTMLSpanElement | null>(null)
  const isSaving = shallowRef(false)
  const cancelEditModal = useModal()
  const deleteEditModal = useModal()
  const editErrorModal = useModal()

  const draft = ConvoDraft.safeGet(convoDrafts, props.convo.id)
  const {
    attachPreviews,
    removeAttachPreview,
    uploadAttach,
    retryUploadingAttach,
    abortUploadingAttach
  } = useComposerAttaches(props.convo, draft)

  const isEmptyEditedMessage = computed(() => (
    !!draft.editing &&
    !ConvoDraft.hasContent(draft) &&
    !draft.replyMessage &&
    !draft.editing.message.forwardedMessages &&
    draft.uploadingAttaches.length === 0
  ))

  const canSubmit = computed(() => (
    !isSaving.value &&
    draft.uploadingAttaches.length === 0 &&
    (!!draft.editing || ConvoDraft.hasContent(draft))
  ))

  const isLoading = computed(() => (
    isSaving.value ||
    attachPreviews.value.some((preview) => (
      preview.kind === 'UploadingAttach' && !preview.attach.failed
    ))
  ))

  const cancelEditing = () => {
    if (!draft.editing || isSaving.value) return

    if (!ConvoDraft.isEdited(draft, draft.editing.message)) {
      ConvoDraft.finishEditing(draft)
    } else {
      cancelEditModal.open()
    }
  }

  const syncInput = () => {
    const input = $input.value
    if (!input) return

    input.innerText = draft.text
    input.focus()

    const selection = window.getSelection()
    selection?.selectAllChildren(input)
    selection?.collapseToEnd()
  }

  onMounted(syncInput)
  watch(() => draft.editing?.message.cmid, syncInput, { flush: 'post' })

  watch(() => draft.replyMessage?.cmid, (cmid) => {
    if (cmid) {
      $input.value?.focus()
    }
  }, { flush: 'post' })

  const onSubmit = async () => {
    if (!canSubmit.value) return

    if (isEmptyEditedMessage.value) {
      deleteEditModal.open()
      return
    }

    if (draft.editing) {
      if (!ConvoDraft.isEdited(draft, draft.editing.message)) {
        ConvoDraft.finishEditing(draft)
        return
      }

      isSaving.value = true
      try {
        await editMessage(
          props.convo.id,
          draft.editing.message.cmid,
          draft.text,
          draft.attaches,
          !!draft.replyMessage || !!draft.editing.message.forwardedMessages
        )
        ConvoDraft.finishEditing(draft)
      } catch (error) {
        console.warn('[ConvoComposer] Failed to edit message', error)
        editErrorModal.open()
      } finally {
        isSaving.value = false
      }
      return
    }

    sendMessage(props.convo.id, draft.text, draft.attaches, draft.replyMessage)
    ConvoDraft.reset(draft)
    if ($input.value) $input.value.innerText = ''
  }

  const onEscape = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Escape' && draft.editing && !isEventWithModifier(event)) {
      event.stopPropagation()
      cancelEditing()
    }
  }

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.code === 'Enter' && !isEventWithModifier(event)) {
      // Предотвращаем перенос строки
      event.preventDefault()
      onSubmit()
    }
  }

  const onInput = (event: ChangeEvent<HTMLElement>) => {
    draft.text = event.currentTarget.innerText ?? ''
  }

  const onPaste = (event: ClipboardEvent) => {
    for (const file of event.clipboardData?.files ?? []) {
      if (['image/png', 'image/jpeg', 'image/gif'].includes(file.type)) {
        event.preventDefault()
        uploadAttach('Photo', file)
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
      uploadAttach('Photo', await fileHandle.getFile())
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
                text={lang.use('me_convo_composer_menu_photo')}
                onClick={openPhotoPicker}
              />
            </ActionMenu>
          }
        >
          <ButtonIcon
            class="ConvoComposer__addAttaches"
            icon={<Icon24AddCircleOutline />}
            disabled={isSaving.value}
          />
        </Popper>

        <span
          class="ConvoComposer__input"
          contenteditable={isSaving.value ? 'false' : 'plaintext-only'}
          role="textbox"
          placeholder={lang.use('me_convo_composer_placeholder')}
          ref={$input}
          onKeydown={onKeyDown}
          onInput={onInput}
          onPaste={onPaste}
        />

        <ButtonIcon
          class={[
            'ConvoComposer__send',
            isEmptyEditedMessage.value && 'ConvoComposer__send--delete'
          ]}
          disabled={!canSubmit.value}
          loading={isLoading.value}
          icon={isEmptyEditedMessage.value
            ? <Icon20TrashOutline />
            : draft.editing ? <Icon24CheckOutline /> : <Icon24Send />}
          onClick={onSubmit}
          // Предотвращаем сброс фокуса с поля ввода
          onMousedown={(event) => event.preventDefault()}
        />
      </>
    )
  }

  return () => (
    <div
      class={['ConvoComposer', isSaving.value && 'ConvoComposer--saving']}
      onKeydown={onEscape}
    >
      <div class="ConvoComposer__inner">
        {draft.editing && (
          <div class="ConvoComposer__messageBar">
            <ReplyMessage
              reply={draft.editing.message}
              customName={lang.use('me_convo_composer_editing')}
              onClick={() => {
                session.navigationRequest = {
                  kind: 'Message',
                  cmid: draft.editing!.message.cmid
                }
              }}
            />
            <ButtonIcon
              class="ConvoComposer__messageBarCancel"
              icon={<Icon24Cancel />}
              withHoverBackground
              disabled={isSaving.value}
              onClick={cancelEditing}
            />
          </div>
        )}

        {draft.replyMessage && (
          <div class="ConvoComposer__messageBar">
            <ReplyMessage
              reply={draft.replyMessage}
              onClick={() => {
                if (draft.replyMessage?.cmid) {
                  session.navigationRequest = {
                    kind: 'Message',
                    cmid: draft.replyMessage.cmid
                  }
                }
              }}
            />
            <ButtonIcon
              class="ConvoComposer__messageBarCancel"
              icon={<Icon24Cancel />}
              withHoverBackground
              disabled={isSaving.value}
              onClick={() => {
                draft.replyMessage = undefined
                $input.value?.focus()
              }}
            />
          </div>
        )}

        {attachPreviews.value.length > 0 && (
          <ComposerAttaches
            previews={attachPreviews.value}
            disabled={isSaving.value}
            onRemove={removeAttachPreview}
            onRetry={retryUploadingAttach}
            onCancel={abortUploadingAttach}
          />
        )}

        <div class="ConvoComposer__panel">
          {renderPanel()}
        </div>
      </div>

      {draft.editing && (
        <DeleteMessageModal
          opened={deleteEditModal.opened}
          onClose={deleteEditModal.close}
          convo={props.convo}
          message={draft.editing.message}
          onDeleted={() => ConvoDraft.finishEditing(draft)}
        />
      )}

      <Modal
        opened={cancelEditModal.opened}
        onClose={cancelEditModal.close}
        title={lang.use('me_convo_composer_edit_cancel_title')}
        buttons={[
          <Button mode="secondary" onClick={cancelEditModal.close}>
            {lang.use('me_convo_composer_edit_cancel_dismiss')}
          </Button>,
          <Button
            mode="destructive"
            disabled={isSaving.value}
            onClick={() => {
              ConvoDraft.finishEditing(draft)
              cancelEditModal.close()
            }}
          >
            {lang.use('me_convo_composer_edit_cancel_submit')}
          </Button>
        ]}
      >
        {lang.use('me_convo_composer_edit_cancel_text')}
      </Modal>

      <Modal
        opened={editErrorModal.opened}
        onClose={editErrorModal.close}
        title={lang.use('me_convo_composer_edit_error_title')}
        buttons={<Button onClick={editErrorModal.close}>{lang.use('modal_close_label')}</Button>}
      >
        {lang.use('me_convo_composer_edit_error_text')}
      </Modal>
    </div>
  )
}, {
  props: ['convo']
})
