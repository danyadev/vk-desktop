import { reactive, shallowRef } from 'vue'
import { createSingletonHook } from 'misc/utils'
import { CaptchaModalParams } from 'ui/modals/CaptchaModal/CaptchaModal'

export const useGlobalModal = createSingletonHook(() => {
  return {
    captchaModal: createGlobalModal<CaptchaModalParams>('CaptchaModal')
  }
})

function createGlobalModal<ModalParams>(modalName: string) {
  const opened = shallowRef(false)
  const visible = shallowRef(false)
  const params = shallowRef<ModalParams>()

  function open(modalParams: ModalParams) {
    if (opened.value) {
      throw new Error(`Модалка ${modalName} уже открыта`)
    }

    opened.value = true
    params.value = modalParams
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
