import { defineComponent, KeyboardEvent, shallowRef } from 'vue'
import { useEnv, useGlobalModal } from 'misc/hooks'
import { Modal } from 'ui/modals/parts'
import { Button } from 'ui/ui/Button/Button'
import { Input } from 'ui/ui/Input/Input'
import './CaptchaModal.css'

export type CaptchaModalParams = {
  captchaImg: string
  onClose: (captchaKey?: string) => void
}

export const CaptchaModal = defineComponent<CaptchaModalParams>((params) => {
  const { lang } = useEnv()
  const { captchaModal } = useGlobalModal()
  const captchaKey = shallowRef('')
  const captchaImg = shallowRef(params.captchaImg)

  function closeModal(key?: string) {
    params.onClose(key)
    captchaModal.close()
  }

  function updateImgUrl() {
    /**
     * API возвращает ссылку на капчу с &s=1 на конце.
     * Изменяем ссылку на картинку, чтобы бэкенд сгенерировал новую картинку
     * и на ней появилась другая капча
     */
    captchaImg.value += '1'
  }

  function onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' && captchaKey.value) {
      closeModal(captchaKey.value)
    }
  }

  return () => (
    <Modal
      title={lang.use('captchaModal_title')}
      opened={captchaModal.opened}
      onClose={() => closeModal()}
      onVisibilityChange={captchaModal.onVisibilityChange}
      buttons={
        <Button disabled={!captchaKey.value} onClick={() => closeModal(captchaKey.value)}>
          {lang.use('modal_send_label')}
        </Button>
      }
      class="CaptchaModal"
    >
      <img
        src={captchaImg.value}
        class="CaptchaModal__img"
        onClick={updateImgUrl}
      />
      <Input
        class="CaptchaModal__input"
        placeholder={lang.use('captchaModal_enter_code')}
        onInput={(event) => (captchaKey.value = event.target.value)}
        onKeydown={onKeyDown}
        autofocus
        inLayer
      />
    </Modal>
  )
}, {
  props: ['captchaImg', 'onClose']
})
