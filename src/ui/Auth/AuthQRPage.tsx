import { defineComponent, KeyboardEvent, onMounted, onUnmounted, shallowReactive } from 'vue'
import vkqr from '@vkontakte/vk-qr'
import { QrCodeAuth, QrCodeAuthEvent } from 'env/QrCodeAuth'
import { useEnv } from 'hooks'
import { Modal } from 'ui/modals/parts'
import { Button } from 'ui/ui/Button/Button'
import { ButtonText } from 'ui/ui/ButtonText/ButtonText'
import { Spinner } from 'ui/ui/Spinner/Spinner'
import { Icon16CheckOutline, Icon16CopyOutline } from 'assets/icons'

type Props = {
  onCancel: () => void
  onAuth: (messengerToken: string) => void
}

type State = {
  qrCodeUrl: string | null
  qrCodeHtml: string | null
  loading: boolean
  error: string | null
  copyTimerId: number
}

export const AuthQRPage = defineComponent<Props>((props) => {
  const { api, lang } = useEnv()
  const qrCodeAuth = new QrCodeAuth(api, lang)
  const state = shallowReactive<State>({
    qrCodeUrl: null,
    qrCodeHtml: null,
    loading: false,
    error: null,
    copyTimerId: 0
  })

  function onEvent(event: QrCodeAuthEvent) {
    switch (event.kind) {
      case 'UrlAcquired':
        state.qrCodeUrl = event.url
        state.qrCodeHtml = vkqr.createQR(event.url, {
          qrSize: 128,
          foregroundColor: 'black'
        })
        break

      case 'Success':
        props.onAuth(event.accessToken)
        // Показываем спиннер на период догрузки данных
        state.loading = true
        state.qrCodeUrl = null
        state.qrCodeHtml = null
        break

      case 'Error':
        state.error = event.message
        break
    }
  }

  function onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape' && !state.loading) {
      props.onCancel()
    }
  }

  async function onCopyLink() {
    if (!state.qrCodeUrl) {
      return
    }

    await navigator.clipboard.writeText(state.qrCodeUrl)
    window.clearTimeout(state.copyTimerId)
    state.copyTimerId = window.setTimeout(() => {
      state.copyTimerId = 0
    }, 2000)
  }

  function onCloseErrorModal() {
    state.error = null
    props.onCancel()
  }

  onMounted(() => {
    qrCodeAuth.start(onEvent)
  })

  onUnmounted(() => {
    qrCodeAuth.stop()
  })

  return () => (
    <div class="Auth">
      <div class="Auth__content" onKeydown={onKeyDown} tabindex={-1}>
        <div class="Auth__QRHeader">{lang.use('auth_by_qr_code_title')}</div>

        <div class="Auth__QRDescription">
          {lang.use('auth_by_qr_code_description')}
        </div>

        {state.qrCodeHtml
          ? <div class="Auth__QR" v-html={state.qrCodeHtml} />
          : <div class="Auth__QR"><Spinner size="regular" /></div>}

        <ButtonText class="Auth__QRLink" onClick={onCopyLink}>
          {state.qrCodeUrl ? (
            <>
              {state.copyTimerId ? <Icon16CheckOutline /> : <Icon16CopyOutline />}
              {state.qrCodeUrl}
            </>
          ) : (
            <Spinner />
          )}
        </ButtonText>

        <Button
          wide
          onClick={props.onCancel}
          loading={state.loading}
          disabled={state.loading}
        >
          {lang.use('auth_cancel')}
        </Button>
      </div>

      <Modal
        opened={!!state.error}
        onClose={onCloseErrorModal}
        title={lang.use('auth_error_modal_title')}
        buttons={<Button onClick={onCloseErrorModal}>{lang.use('modal_close_label')}</Button>}
      >
        {state.error}
      </Modal>
    </div>
  )
}, {
  props: ['onCancel', 'onAuth']
})
