import { defineComponent, KeyboardEvent, onMounted, onUnmounted, shallowReactive } from 'vue'
import vkqr from '@vkontakte/vk-qr'
import { QrCodeAuth, QrCodeAuthEvent } from 'model/QrCodeAuth'
import { useEnv } from 'hooks'
import { Modal } from 'ui/modals/parts'
import { Button } from 'ui/ui/Button/Button'
import { Link } from 'ui/ui/Link/Link'
import { Spinner } from 'ui/ui/Spinner/Spinner'

type Props = {
  onCancel: () => void
  onAuth: (androidToken: string) => void
}

type State = {
  qrCodeUrl: string | null
  qrCodeHtml: string | null
  loading: boolean
  error: string | null
}

export const AuthQRPage = defineComponent<Props>((props) => {
  const { api, lang } = useEnv()
  const qrCodeAuth = new QrCodeAuth(api, lang)
  const state = shallowReactive<State>({
    qrCodeUrl: null,
    qrCodeHtml: null,
    loading: false,
    error: null
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

        <Link class="Auth__QRLink" href={state.qrCodeUrl ?? ''}>
          {state.qrCodeUrl ?? <Spinner />}
        </Link>

        <Button
          wide
          onClick={props.onCancel}
          loading={state.loading}
          disabled={state.loading}
        >
          {lang.use('cancel')}
        </Button>
      </div>

      <Modal
        opened={!!state.error}
        onClose={onCloseErrorModal}
        title={lang.use('auth_error')}
        buttons={<Button onClick={onCloseErrorModal}>{lang.use('modal_close_label')}</Button>}
      >
        {state.error}
      </Modal>
    </div>
  )
}, {
  props: ['onCancel', 'onAuth']
})
