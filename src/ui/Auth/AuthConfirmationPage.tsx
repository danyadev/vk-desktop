import { defineComponent, InputEvent, KeyboardEvent, onMounted, Ref, shallowRef } from 'vue'
import { useEnv } from 'misc/hooks'
import { Button } from 'ui/ui/Button/Button'
import { ButtonText } from 'ui/ui/ButtonText/ButtonText'
import { Input } from 'ui/ui/Input/Input'

export type ConfirmationState = {
  phoneMask: string
  validationType: '2fa_sms' | '2fa_app'
  validationSid: string
  needValidateSendSms: boolean
}

type AuthConfirmationPageProps = {
  confirmationState: ConfirmationState
  loading: boolean
  error: string | null
  onSubmit: (code: string) => void
  onCancel: () => void
  onHideError: () => void
}

export const AuthConfirmationPage = defineComponent<AuthConfirmationPageProps>((props) => {
  const { lang, api } = useEnv()
  const code = shallowRef('')
  const resendSmsTimer = shallowRef(0)
  const isSendingSms = shallowRef(false)

  function onInput(event: InputEvent<HTMLInputElement>) {
    code.value = event.target.value

    if (!props.loading && code.value.length === 6) {
      props.onSubmit(code.value)
    }
  }

  function onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !props.loading && code.value.length > 0) {
      props.onSubmit(code.value)
    }
  }

  async function sendSms() {
    const DEFAULT_RESEND_INTERVAL = 60

    try {
      isSendingSms.value = true

      const { delay } = await api.fetch('auth.validatePhone', {
        sid: props.confirmationState.validationSid
      }, { retries: 3 })

      props.confirmationState.validationType = '2fa_sms'
      resendSmsTimer.value = delay
    } catch {
      // TODO: снекбар с ошибкой
      console.log('ошибка переотправки смс')
      resendSmsTimer.value = DEFAULT_RESEND_INTERVAL
    }

    isSendingSms.value = false
    tickTimer()
  }

  function tickTimer() {
    window.setTimeout(() => {
      resendSmsTimer.value && resendSmsTimer.value--
      resendSmsTimer.value && tickTimer()
    }, 1000)
  }

  onMounted(() => {
    if (
      props.confirmationState.validationType === '2fa_sms' &&
      props.confirmationState.needValidateSendSms
    ) {
      sendSms()
    }
  })

  return () => (
    <div class="Auth">
      <div class="Auth__content" onKeydown={onKeyDown}>
        <div class="Auth__confirmationHeader">
          {lang.use('auth_confirm_login')}
        </div>
        <div class="Auth__confirmationDescription">
          {props.confirmationState.validationType === '2fa_sms'
            ? lang.use('auth_sms_with_code_sent', { phone: props.confirmationState.phoneMask })
            : lang.use('auth_enter_code_from_code_gen_app')}
        </div>
        <Input
          placeholder={lang.use('auth_enter_code')}
          onInput={onInput}
          autofocus
        />
        <div class="Auth__confirmationButtonsWrapper">
          <Button
            mode="secondary"
            size="large"
            wide
            disabled={props.loading}
            onClick={props.onCancel}
          >
            {lang.use('cancel')}
          </Button>
          <Button
            size="large"
            wide
            disabled={props.loading || code.value.length === 0}
            loading={props.loading}
            onClick={() => props.onSubmit(code.value)}
          >
            {lang.use('auth_submit')}
          </Button>
        </div>
        {props.error && <div class="Auth__error" onClick={props.onHideError}>{props.error}</div>}
      </div>

      <div class="Auth__smsStatus">
        <SmsStatus
          validationType={props.confirmationState.validationType}
          sendSms={sendSms}
          isSendingSms={isSendingSms}
          resendSmsTimer={resendSmsTimer}
        />
      </div>
    </div>
  )
}, {
  props: ['confirmationState', 'loading', 'error', 'onSubmit', 'onCancel', 'onHideError']
})

type SmsStatusProps = {
  validationType: ConfirmationState['validationType']
  sendSms: () => void
  isSendingSms: Ref<boolean>
  resendSmsTimer: Ref<number>
}

const SmsStatus = defineComponent<SmsStatusProps>((props) => {
  const { lang } = useEnv()

  return () => {
    const { validationType, sendSms, isSendingSms, resendSmsTimer } = props

    if (isSendingSms.value) {
      return lang.use('auth_sms_is_sending')
    }

    if (resendSmsTimer.value) {
      return lang.use('auth_resend_sms_at', {
        time: lang.dateTimeFormatter({
          minute: '2-digit',
          second: '2-digit'
        }).format(resendSmsTimer.value * 1000)
      })
    }

    return (
      <ButtonText onClick={sendSms}>
        {validationType === '2fa_app'
          ? lang.use('auth_send_sms')
          : lang.use('auth_resend_sms')}
      </ButtonText>
    )
  }
}, {
  props: ['validationType', 'sendSms', 'isSendingSms', 'resendSmsTimer']
})
