import { computed, reactive, shallowRef } from 'vue'
import { createSingletonHook } from 'misc/utils'
import { CaptchaModalParams } from 'ui/modals/CaptchaModal/CaptchaModal'
import { MessageViewerParams } from 'ui/modals/MessageViewerModal/MessageViewerModal'
import { PeerInfoModalProps } from 'ui/modals/PeerInfoModal/PeerInfoModal'
import { PhotoViewerModalProps } from 'ui/modals/PhotoViewerModal/PhotoViewerModal'

export const useGlobalModal = createSingletonHook(() => {
  return {
    captchaModal: createGlobalModal<CaptchaModalParams>(),
    photoViewerModal: createGlobalModal<PhotoViewerModalProps>(),
    settingsModal: createGlobalModal<object>(),
    peerInfoModal: createGlobalModal<PeerInfoModalProps>(),
    messageViewerModal: createGlobalHistoryModal((params: MessageViewerParams, id) => ({
      id,
      params,
      scrollTop: 0
    }))
  }
})

function createGlobalModal<ModalParams>() {
  const opened = shallowRef(false)
  const params = shallowRef<ModalParams>()

  function open(modalParams: ModalParams) {
    params.value = modalParams
    opened.value = true
  }

  function close() {
    opened.value = false
  }

  function onVisibilityChange(isVisible: boolean) {
    // Удаляем параметры только когда модалка полностью закрылась
    if (!opened.value && !isVisible) {
      params.value = undefined
    }
  }

  return reactive({
    opened,
    params,
    open,
    close,
    onVisibilityChange
  })
}

function createGlobalHistoryModal<Params, Entry>(
  createEntry: (params: Params, id: number) => Entry
) {
  const opened = shallowRef(false)
  const history = shallowRef<Entry[]>([])
  const current = computed(() => history.value.at(-1))
  const canGoBack = computed(() => history.value.length > 1)
  let nextId = 0

  function open(params: Params) {
    const entry = createEntry(params, nextId++)

    history.value = opened.value
      ? [...history.value, entry]
      : [entry]

    opened.value = true
  }

  function close() {
    opened.value = false
  }

  function back() {
    if (canGoBack.value) {
      history.value = history.value.slice(0, -1)
    }
  }

  function onVisibilityChange(isVisible: boolean) {
    if (!opened.value && !isVisible) {
      history.value = []
    }
  }

  return reactive({
    opened,
    current,
    canGoBack,
    open,
    close,
    back,
    onVisibilityChange
  })
}
