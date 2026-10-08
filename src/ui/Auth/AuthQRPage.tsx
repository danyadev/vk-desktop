import {
  computed,
  defineComponent,
  InputEvent,
  KeyboardEvent,
  onMounted,
  onUnmounted,
  shallowReactive,
  shallowRef
} from 'vue'
import * as vkqr from '@vkontakte/vk-qr'
import { useServices } from 'services'
import * as IQrCodeAuth from 'services/contracts/IQrCodeAuth'
import { Modal } from 'ui/modals/parts'
import { Button } from 'ui/ui/Button/Button'
import { ButtonText } from 'ui/ui/ButtonText/ButtonText'
import { Input } from 'ui/ui/Input/Input'
import { Spinner } from 'ui/ui/Spinner/Spinner'
import { Icon16CheckOutline, Icon16CopyOutline } from 'assets/icons'

type Props = {
  onCancel: () => void
  onAuth: (messengerToken: string) => void
}

type State = {
  url: string | null
  verificationRequested: boolean
  loading: boolean
  error: string | null
  fatalError: boolean
}

export const AuthQRPage = defineComponent<Props>((props) => {
  const { lang, qrCodeAuth } = useServices()
  const state = shallowReactive<State>({
    url: null,
    verificationRequested: false,
    loading: false,
    error: null,
    fatalError: false
  })

  function onEvent(event: IQrCodeAuth.Event) {
    switch (event.kind) {
      case 'UrlAcquired':
        state.url = event.url
        break

      case 'VerificationRequested':
        state.verificationRequested = true
        break

      case 'Success':
        props.onAuth(event.accessToken)
        // Показываем спиннер на период догрузки данных
        state.loading = true
        state.url = null
        break

      case 'Error':
        onError(event.message, true)
        break
    }
  }

  function onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape' && !state.loading) {
      props.onCancel()
    }
  }

  function onError(error: string, fatal: boolean) {
    state.error = error
    state.fatalError ||= fatal
  }

  function onCloseErrorModal() {
    state.error = null
    if (state.fatalError) props.onCancel()
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
        {state.verificationRequested
          ? <VerificationContent onError={onError} />
          : <QrCodeContent url={state.url} />}

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

type QrCodeContentProps = {
  url: string | null
}

const QrCodeContent = defineComponent<QrCodeContentProps>((props) => {
  const { lang } = useServices()

  const copyTimerId = shallowRef(0)
  const qrHtml = computed(() => {
    if (!props.url) return null
    return vkqr.createQR(props.url, {
      qrSize: 128,
      foregroundColor: 'black'
    })
  })

  async function onCopyLink() {
    if (!props.url) return
    await navigator.clipboard.writeText(props.url)
    window.clearTimeout(copyTimerId.value)
    copyTimerId.value = window.setTimeout(() => {
      copyTimerId.value = 0
    }, 2000)
  }

  return () => (
    <>
      <div class="Auth__QRHeader">
        {lang.use('auth_by_qr_code_title')}
      </div>

      <div class="Auth__QRDescription">
        {lang.use('auth_by_qr_code_description')}
      </div>

      {qrHtml.value
        ? <div class="Auth__QR" v-html={qrHtml.value} />
        : <div class="Auth__QR"><Spinner size="regular" /></div>}

      <ButtonText class="Auth__QRLink" onClick={onCopyLink}>
        {props.url ? (
          <>
            {copyTimerId.value ? <Icon16CheckOutline /> : <Icon16CopyOutline />}
            {props.url}
          </>
        ) : (
          <Spinner />
        )}
      </ButtonText>
    </>
  )
}, {
  props: ['url']
})

type VerificationContentProps = {
  onError: (error: string, fatal: boolean) => void
}

const VerificationContent = defineComponent<VerificationContentProps>((props) => {
  const { lang, qrCodeAuth } = useServices()

  const code = shallowRef('')
  const loading = shallowRef(false)

  function onInput(event: InputEvent<HTMLInputElement>) {
    code.value = event.target.value
  }

  async function validateCode() {
    if (!code.value || loading.value) return

    loading.value = true
    try {
      const status = await qrCodeAuth.validateCode(code.value)
      switch (status) {
        case 0:
          // Don't set loading to false, because now we're waiting on auth success event
          return
        case 1:
          props.onError(lang.use('auth_qr_code_invalid_code'), false)
          break
        case 2:
          props.onError(lang.use('auth_qr_code_expired'), true)
          break
        default:
          console.warn('[AuthQRPage] unknown code validation status', status)
          props.onError(lang.use('auth_qr_code_validation_error'), false)
      }
    } catch (err) {
      console.warn('[AuthQRPage] failed to validate code', err)
      props.onError(lang.use('auth_qr_code_validation_error'), false)
    }
    loading.value = false
  }

  return () => (
    <>
      <div class="Auth__QRHeader">
        {lang.use('auth_qr_code_verification_title')}
      </div>

      <div class="Auth__QRDescription">
        {lang.use('auth_qr_code_verification_description')}
      </div>

      <Input
        value={code.value}
        disabled={loading.value}
        onInput={onInput}
        onKeydown={(event) => event.key === 'Enter' && validateCode()}
        placeholder={lang.use('auth_enter_code')}
        inputmode="numeric"
        autofocus
      />

      <Button
        wide
        onClick={validateCode}
        disabled={!code.value || loading.value}
        loading={loading.value}
      >
        {lang.use('auth_submit')}
      </Button>
    </>
  )
}, {
  props: ['onError']
})
