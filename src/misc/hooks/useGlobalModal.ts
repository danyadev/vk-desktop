import { reactive, ref } from 'vue'
import { createSingletonHook } from 'misc/utils'

type CaptchaModalMeta = {
  onClose: (captchaKey?: string) => void
}

export const useGlobalModal = createSingletonHook(() => {
  return {
    captchaModal: createGlobalModal<CaptchaModalMeta>('CaptchaModal')
  }
})

function createGlobalModal<Meta>(modalName: string) {
  const opened = ref(false)
  const meta = ref<Meta>()

  function open(metaData?: Meta) {
    if (opened.value) {
      throw new Error(`Модалка ${modalName} уже открыта`)
    }

    opened.value = true
    meta.value = metaData
  }

  function close() {
    opened.value = false
    meta.value = undefined
  }

  return reactive({
    opened,
    meta,
    open,
    close
  })
}
