import './Auth.css'
import { defineComponent, reactive } from 'vue'
import { useEnv } from 'misc/hooks'
import logo from 'assets/logo512.png'
import { Input } from 'ui/ui/Input/Input'
import { Button } from 'ui/ui/Button/Button'
import { Link } from 'ui/ui/Link/Link'
import { getAndroidToken } from 'model/Auth'
import { exhaustivenessCheck } from 'misc/utils'

/**
 * Чеклист по готовности авторизации:
 * - поддержать флоу Логин -> СМС
 * - поддержать флоу Логин -> Код из приложения
 * - поддержать флоу Логин -> Код из приложения -> форс СМС
 * - научиться отображать ошибки в целом
 * - правильно показывать ошибку ввода логина/пароля; кода; о бане аккаунта
 * - научиться обрабатывать капчу
 */

type AuthState = {
  login: string
  password: string
  loading: boolean
  validationSid: string | null
  error: string | null
}

export const Auth = defineComponent(() => {
  const { lang } = useEnv()

  const state = reactive<AuthState>({
    login: '',
    password: '',
    loading: false,
    validationSid: null,
    error: null
  })

  async function auth() {
    state.loading = true

    const result = await getAndroidToken(state.login, state.password)

    switch (result.kind) {
      case 'Success':
      case 'InvalidCredentials':
      case 'RequireTwoFactor':
      case 'InvalidTwoFactorCode':
      case 'Captcha':
      case 'UserBanned':
      case 'UnknownError':
        console.log(result)
        break

      default:
        exhaustivenessCheck(result)
    }

    state.loading = false
  }

  return () => (
    <div class="Auth">
      {state.validationSid ? (
        <AuthConfirmCode validationSid={state.validationSid} />
      ) : (
        <AuthMain authState={state} onSubmit={auth} />
      )}

      {!state.validationSid && (
        <div class="Auth__footerLinks">
          <Link href="https://vk.com/join">{lang.use('auth_register')}</Link>
          •
          <Link href="https://vk.com/restore">{lang.use('auth_forgot_password')}</Link>
        </div>
      )}
    </div>
  )
})

type AuthMainProps = {
  authState: AuthState
  onSubmit: () => void
}

const AuthMain = defineComponent<AuthMainProps>(({ authState, onSubmit }) => {
  const { lang } = useEnv()

  return () => (
    <div class="Auth__content">
      <img class="Auth__logo" src={logo} />
      <Input
        placeholder={lang.use('auth_login_placeholder')}
        onInput={(event) => (authState.login = event.target.value)}
      />
      <Input
        type="password"
        placeholder={lang.use('auth_password_placeholder')}
        onInput={(event) => (authState.password = event.target.value)}
      />
      <Button
        size="large"
        wide
        disabled={!authState.login || !authState.password}
        loading={authState.loading}
        onClick={onSubmit}
      >
        {lang.use('auth_submit')}
      </Button>
    </div>
  )
})

AuthMain.props = ['authState', 'onSubmit']

type AuthConfirmCodeProps = {
  validationSid: string
}

const AuthConfirmCode = defineComponent<AuthConfirmCodeProps>(({ validationSid }) => {
  return () => (
    <div class="Auth__content">
      ты не пройдешь
      {validationSid}
    </div>
  )
})

AuthConfirmCode.props = ['validationSid']
