import { computed, defineComponent, shallowRef, watch } from 'vue'
import { useServices } from 'services'
import * as Convo from 'model/Convo'
import * as Message from 'model/Message'
import { useSettingsStore } from 'store/settings'
import { useViewerStore } from 'store/viewer'
import { NonEmptyArray } from 'misc/utils'
import { Modal } from 'ui/modals/parts'
import { Button } from 'ui/ui/Button/Button'
import { Checkbox } from 'ui/ui/Checkbox/Checkbox'
import './DeleteMessageModal.css'

type Props = {
  convo: Convo.Convo
  messages: NonEmptyArray<Message.Confirmed>
  opened: boolean
  onClose: () => void
  onDeleted?: (deletedCmids: Set<Message.Cmid>) => void
}

export const DeleteMessageModal = defineComponent<Props>((props) => {
  const { api, lang } = useServices()
  const viewer = useViewerStore()
  const settings = useSettingsStore()

  const isDeleting = shallowRef(false)
  const erroredDeletions = shallowRef(0)

  watch(() => props.opened, () => {
    if (props.opened) {
      isDeleting.value = false
      erroredDeletions.value = 0
    }
  })

  const canDeleteForAll = computed(() => {
    return props.messages.every((message) => (
      Convo.canDeleteMessageForAll(props.convo, message, viewer.id)
    ))
  })

  const deleteMessages = async () => {
    if (isDeleting.value) return

    isDeleting.value = true
    erroredDeletions.value = 0

    try {
      const result = await api.fetch('messages.delete', {
        peer_id: props.convo.id,
        cmids: props.messages.map(({ cmid }) => cmid).join(','),
        delete_for_all: canDeleteForAll.value && settings.deleteMessageForAllPreference ? 1 : 0
      })

      const deleted = result.filter((item) => (
        item.response === 1
      ))
      const errored = result.filter((item) => (
        item.response !== 1
      ))

      if (deleted.length > 0) {
        const cmids = deleted.map((item) => Message.resolveCmid(item.conversation_message_id))
        props.onDeleted?.(new Set(cmids))
      }

      if (errored.length > 0) {
        console.error('[DeleteMessageModal] Messages deletion failed', errored)
        erroredDeletions.value = errored.length
      } else {
        props.onClose()
      }
    } catch (error) {
      console.error('[DeleteMessageModal] Message deletion failed', error)
      erroredDeletions.value = props.messages.length
    } finally {
      isDeleting.value = false
    }
  }

  return () => (
    <Modal
      opened={props.opened}
      onClose={props.onClose}
      title={lang.usePlural('messageDeleteModal_confirm_title', props.messages.length)}
      buttons={[
        <Button mode="secondary" onClick={props.onClose}>
          {lang.use('modal_cancel_label')}
        </Button>,
        <Button
          mode="destructive"
          disabled={isDeleting.value}
          loading={isDeleting.value}
          onClick={deleteMessages}
        >
          {lang.use('me_message_menu_delete')}
        </Button>
      ]}
      class="DeleteMessageModal"
    >
      {lang.use(props.messages.length === 1
        ? 'messageDeleteModal_confirm_text'
        : 'messageDeleteModal_confirm_text_multiple')}
      {canDeleteForAll.value && (
        <Checkbox
          label={lang.use('messageDeleteModal_delete_for_all')}
          checked={settings.deleteMessageForAllPreference}
          disabled={isDeleting.value}
          onChange={(checked) => (settings.deleteMessageForAllPreference = checked)}
        />
      )}
      {erroredDeletions.value > 0 && (
        <div class="DeleteMessageModal__error">
          {lang.usePlural('messageDeleteModal_error', erroredDeletions.value)}
        </div>
      )}
    </Modal>
  )
}, {
  props: ['convo', 'messages', 'opened', 'onClose', 'onDeleted']
})
