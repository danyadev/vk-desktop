import { reactive, shallowRef } from 'vue'
import { createSingletonHook } from 'misc/utils'
import { CaptchaModalParams } from 'ui/modals/CaptchaModal/CaptchaModal'
import { MessagePreviewModalProps } from 'ui/modals/MessagePreviewModal/MessagePreviewModal'
import { MessagesModalProps } from 'ui/modals/MessagesModal/MessagesModal'
import { PeerInfoModalProps } from 'ui/modals/PeerInfoModal/PeerInfoModal'
import { PhotoViewerModalProps } from 'ui/modals/PhotoViewerModal/PhotoViewerModal'

export const useGlobalModal = createSingletonHook(() => {
  return {
    captchaModal: createGlobalModal<CaptchaModalParams>(),
    photoViewerModal: createGlobalModal<PhotoViewerModalProps>(),
    settingsModal: createGlobalModal<object>(),
    peerInfoModal: createGlobalModal<PeerInfoModalProps>(),
    messagePreviewModal: createGlobalModal<MessagePreviewModalProps>(),
    messagesModal: createGlobalModal<MessagesModalProps>()
  }
})

function createGlobalModal<ModalParams>() {
  const opened = shallowRef(false)
  const visible = shallowRef(false)
  const params = shallowRef<ModalParams>()

  function open(modalParams: ModalParams) {
    params.value = modalParams
    opened.value = true
  }

  function close() {
    opened.value = false
  }

  function onVisibilityChange(isVisible: boolean) {
    visible.value = isVisible

    // Удаляем параметры только когда модалка полностью закрылась
    if (!opened.value && !visible.value) {
      params.value = undefined
    }
  }

  return reactive({
    opened,
    visible,
    params,
    open,
    close,
    onVisibilityChange
  })
}
