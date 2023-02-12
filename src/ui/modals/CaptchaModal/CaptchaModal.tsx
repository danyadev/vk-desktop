import './CaptchaModal.css'
import { defineComponent } from 'vue'
import { Modal } from 'ui/modals/parts'
import { Button } from 'ui/ui/Button/Button'
import { useGlobalModal } from 'misc/hooks'

export const CaptchaModal = defineComponent(() => {
  const { captchaModal } = useGlobalModal()

  return () => (
    <Modal
      opened={captchaModal.opened}
      onClose={() => {
        captchaModal.close()
        captchaModal.meta?.onClose()
      }}
      title={'Введите капчу'}
      buttons={
        <Button onClick={() => captchaModal.meta?.onClose('код')}>Отправить</Button>
      }
      class="CaptchaModal"
    >
      капча епта
    </Modal>
  )
})
