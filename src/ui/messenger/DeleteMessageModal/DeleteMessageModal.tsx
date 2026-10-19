import { defineComponent, shallowRef } from 'vue'
import { useServices } from 'services'
import * as Convo from 'model/Convo'
import * as Message from 'model/Message'
import { useSettingsStore } from 'store/settings'
import { useViewerStore } from 'store/viewer'
import { useModal } from 'hooks'
import { Modal } from 'ui/modals/parts'
import { Button } from 'ui/ui/Button/Button'
import { Checkbox } from 'ui/ui/Checkbox/Checkbox'
import './DeleteMessageModal.css'

type Props = {
  convo: Convo.Convo
  message: Message.Confirmed
  opened: boolean
  onClose: () => void
  onDeleted?: () => void
}

export const DeleteMessageModal = defineComponent<Props>((props) => {
  const { api, lang } = useServices()
  const viewer = useViewerStore()
  const settings = useSettingsStore()
  const errorModal = useModal()
  const isDeleting = shallowRef(false)

  const deleteMessage = async () => {
    if (isDeleting.value) return

    isDeleting.value = true
    try {
      const canDeleteForAll = Convo.canDeleteMessageForAll(props.convo, props.message, viewer.id)
      const results = await api.fetch('messages.delete', {
        peer_id: props.message.peerId,
        cmids: props.message.cmid,
        delete_for_all: canDeleteForAll && settings.deleteMessageForAllPreference ? 1 : 0
      })
      const result = results.find((item) => (
        item.conversation_message_id === props.message.cmid
      ))

      if (result?.response !== 1) {
        const { code, description } = result?.error ?? {}
        throw new Error(`[DeleteMessageModal] Message deletion failed: ${description} (${code})`)
      }

      props.onClose()
      props.onDeleted?.()
    } catch (error) {
      console.error('[DeleteMessageModal] Message deletion failed', error)
      props.onClose()
      errorModal.open()
    } finally {
      isDeleting.value = false
    }
  }

  return () => (
    <>
      <Modal
        opened={props.opened}
        onClose={props.onClose}
        title={lang.use('messageDeleteModal_confirm_title')}
        buttons={[
          <Button mode="secondary" onClick={props.onClose}>
            {lang.use('modal_cancel_label')}
          </Button>,
          <Button
            mode="destructive"
            disabled={isDeleting.value}
            loading={isDeleting.value}
            onClick={deleteMessage}
          >
            {lang.use('me_message_menu_delete')}
          </Button>
        ]}
        class="DeleteMessageModal"
      >
        {lang.use('messageDeleteModal_confirm_text')}
        {Convo.canDeleteMessageForAll(props.convo, props.message, viewer.id) && (
          <Checkbox
            label={lang.use('messageDeleteModal_delete_for_all')}
            checked={settings.deleteMessageForAllPreference}
            onChange={(checked) => (settings.deleteMessageForAllPreference = checked)}
          />
        )}
      </Modal>

      <Modal
        opened={errorModal.opened}
        onClose={errorModal.close}
        title={lang.use('messageDeleteModal_error_title')}
        buttons={<Button onClick={errorModal.close}>{lang.use('modal_close_label')}</Button>}
      >
        {lang.use('messageDeleteModal_error_text')}
      </Modal>
    </>
  )
}, {
  props: ['convo', 'message', 'opened', 'onClose', 'onDeleted']
})
