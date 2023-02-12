import './Auth.css'
import { computed, defineComponent, onMounted, reactive, ref, InputEvent } from 'vue'
import { useEnv } from 'misc/hooks'
import logo from 'assets/logo512.png'
import { Input } from 'ui/ui/Input/Input'
import { Button } from 'ui/ui/Button/Button'
import { Link } from 'ui/ui/Link/Link'
import { getAndroidToken, GetAndroidTokenPayload } from 'model/Auth'
import { exhaustivenessCheck } from 'misc/utils'
import { useViewerStore } from 'store/viewer'
import { userFields } from 'misc/constants'
import { fromApiUser } from 'misc/converter/PeerConverter'
import { format } from 'misc/date/utils'

/**
 * Чеклист по готовности авторизации:
 * - научиться обрабатывать капчу
 * - проверить работу Enter на всех страницах
 * - поддержать флоу Логин -> Код из приложения -> форс СМС
 * - научиться показывать второстепенные ошибки снекбарами
 */

type TwoFactorState = {
  phoneMask: string
  validationType: '2fa_sms' | '2fa_app'
  validationSid: string
  needValidateSendSms: boolean
}

type AuthState = {
  login: string
  password: string
  loading: boolean
  error: string | null
  twoFactorState: TwoFactorState | null
}

export const Auth = defineComponent(() => {
  const { api, lang, router } = useEnv()
  const viewer = useViewerStore()

  const state = reactive<AuthState>({
    login: '',
    password: '',
    loading: false,
    error: null,
    twoFactorState: null
  })

  function onSubmitAuth(login: string, password: string) {
    state.login = login
    state.password = password
    performAuth()
  }

  function onSubmitCode(code: string) {
    performAuth({ code })
  }

  function onCancelCode() {
    state.error = null
    state.twoFactorState = null
  }

  async function performAuth(payload: GetAndroidTokenPayload = {}) {
    state.error = null
    state.loading = true

    const result = await getAndroidToken(state.login, state.password, payload)
    console.log(result)

    switch (result.kind) {
      case 'Success': {
        if (result.trustedHash) {
          viewer.addTrustedHash(state.login, result.trustedHash)
        }

        try {
          const [apiUser] = await api.fetch('users.get', {
            access_token: result.accessToken,
            fields: userFields
          }, { retries: 3 })
          const user = fromApiUser(apiUser)

          viewer.addAccount({
            ...user,
            accessToken: result.accessToken
          })
          viewer.setDefaultAccount(user.id)

          router.push('/')
        } catch (err) {
          console.error(err)
          // TODO снекбар
          state.error = api.isApiError(err) ? 'Ошибка апи' : 'Неизвестная ошибка'
        }
        break
      }

      case 'InvalidCredentials': {
        state.error = result.errorMessage
        break
      }

      case 'RequireTwoFactor':
        state.twoFactorState = result
        break

      case 'InvalidTwoFactorCode': {
        state.error = result.errorMessage
        break
      }

      case 'Captcha': {
        // TODO модалка с капчей
        state.error = 'Captcha'
        break
      }

      case 'UserBanned': {
        // TODO модалка с предложением выйти из аккаунта
        state.error = result.banMessage
        break
      }

      case 'UnknownError': {
        console.warn('Неизвестная ошибка авторизации', result.payload)
        state.error = lang.use('unknown_error')
        break
      }

      default:
        exhaustivenessCheck(result)
    }

    state.loading = false
  }

  return () => (
    !state.twoFactorState ? (
      <AuthMain
        loading={state.loading}
        error={state.error}
        onSubmit={onSubmitAuth}
      />
    ) : (
      <AuthTwoFactor
        twoFactorState={state.twoFactorState}
        loading={state.loading}
        error={state.error}
        onSubmit={onSubmitCode}
        onCancel={onCancelCode}
      />
    )
  )
})

type AuthMainProps = {
  loading: boolean
  error: string | null
  onSubmit: (login: string, password: string) => void
}

const AuthMain = defineComponent<AuthMainProps>((props) => {
  const { lang } = useEnv()

  const state = reactive({
    login: '',
    password: ''
  })
  const canSubmit = computed(() => !props.loading && state.login && state.password)

  function onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' && canSubmit.value) {
      props.onSubmit(state.login, state.password)
    }
  }

  return () => (
    <div class="Auth">
      <div class="Auth__content" onKeydown={onKeyDown}>
        <img class="Auth__logo" src={logo} />
        <Input
          placeholder={lang.use('auth_login_placeholder')}
          onInput={(event) => (state.login = event.target.value)}
          autofocus
        />
        <Input
          type="password"
          placeholder={lang.use('auth_password_placeholder')}
          onInput={(event) => (state.password = event.target.value)}
        />
        <Button
          size="large"
          wide
          disabled={!canSubmit.value}
          loading={props.loading}
          onClick={() => props.onSubmit(state.login, state.password)}
        >
          {lang.use('auth_submit')}
        </Button>
        {props.error && <div class="Auth__error">{props.error}</div>}
      </div>

      <div class="Auth__footerLinks">
        <Link href="https://vk.com/join">{lang.use('auth_register')}</Link>
        •
        <Link href="https://vk.com/restore">{lang.use('auth_forgot_password')}</Link>
      </div>
    </div>
  )
})

AuthMain.props = ['loading', 'error', 'onSubmit']

type AuthTwoFactorProps = {
  twoFactorState: TwoFactorState
  loading: boolean
  error: string | null
  onSubmit: (code: string) => void
  onCancel: () => void
}

const AuthTwoFactor = defineComponent<AuthTwoFactorProps>((props) => {
  const { lang, api } = useEnv()
  const code = ref('')
  const resendSmsTimer = ref<number | null>(null)

  function onInput(event: InputEvent<HTMLInputElement>) {
    code.value = event.target.value

    if (!props.loading && code.value.length === 6) {
      props.onSubmit(code.value)
    }
  }

  async function validateSendSms() {
    const DEFAULT_RESEND_INTERVAL = 60

    try {
      resendSmsTimer.value = null

      const { delay } = await api.fetch('auth.validatePhone', {
        sid: props.twoFactorState.validationSid
      }, { retries: 3 })

      resendSmsTimer.value = delay
    } catch {
      // TODO: снекбар с ошибкой
      console.log('ошибка переотправки смс')

      resendSmsTimer.value = DEFAULT_RESEND_INTERVAL
    }

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
      props.twoFactorState.validationType === '2fa_sms' &&
      props.twoFactorState.needValidateSendSms
    ) {
      validateSendSms()
    }
  })

  return () => (
    <div class="Auth">
      <div class="Auth__content">
        <div class="Auth__twoFactorHeader">
          {lang.use('auth_confirm_login')}
        </div>
        <div class="Auth__twoFactorDescription">
          {props.twoFactorState.validationType === '2fa_sms'
            ? lang.use('auth_sms_with_code_sent', [props.twoFactorState.phoneMask])
            : lang.use('auth_enter_code_from_code_gen_app')}
        </div>
        <Input
          placeholder={lang.use('auth_enter_code')}
          onInput={onInput}
          autofocus
        />
        <div class="Auth__twoFactorButtonsWrapper">
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
        {props.error && <div class="Auth__error">{props.error}</div>}
      </div>

      <div class="Auth__smsStatus">
        {resendSmsTimer.value === null ? (
          lang.use('auth_sms_is_sending')
        ) : resendSmsTimer.value > 0 ? (
          lang.use('auth_resend_sms_at', [format(new Date(resendSmsTimer.value * 1000), 'mm:ss')])
        ) : (
          <Link onClick={validateSendSms}>
            {lang.use('auth_resend_sms')}
          </Link>
        )}
      </div>
    </div>
  )
})

AuthTwoFactor.props = ['twoFactorState', 'loading', 'error', 'onSubmit', 'onCancel']
