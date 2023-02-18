import './CaptchaModal.css'
import { defineComponent, ref } from 'vue'
import { Modal } from 'ui/modals/parts'
import { Button } from 'ui/ui/Button/Button'
import { useEnv, useGlobalModal } from 'misc/hooks'
import { Input } from 'ui/ui/Input/Input'

export const CaptchaModal = defineComponent(() => {
  const { lang } = useEnv()
  const { captchaModal } = useGlobalModal()
  const captchaKey = ref('')

  function closeModal(key?: string) {
    captchaModal.meta?.onClose(key)
    captchaModal.close()
  }

  function updateImgUrl() {
    if (captchaModal.meta?.captchaImg) {
      captchaModal.meta.captchaImg += '1'
    }
  }

  return () => (
    <Modal
      title={lang.use('captchaModal_title')}
      opened={captchaModal.opened}
      onClose={() => closeModal()}
      buttons={
        <Button onClick={() => closeModal(captchaKey.value)}>
          {lang.use('modal_send_label')}
        </Button>
      }
      class="CaptchaModal"
    >
      <img
        src={captchaModal.meta?.captchaImg}
        class="CaptchaModal__img"
        onClick={updateImgUrl}
      />
      <Input
        class="CaptchaModal__input"
        placeholder={lang.use('captchaModal_enter_code')}
        onInput={(event) => (captchaKey.value = event.target.value)}
        onKeydown={(event) => event.key === 'Enter' && closeModal(captchaKey.value)}
        autofocus
        inLayer
      />
    </Modal>
  )
})
