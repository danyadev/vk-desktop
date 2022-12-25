import './Auth.css'
import { defineComponent, reactive, ref } from 'vue'
import { useEnv } from 'misc/hooks'
import logo from 'assets/logo512.png'
import { Input } from 'ui/ui/Input/Input'
import { Button } from 'ui/ui/Button/Button'
import { getAndroidToken } from 'model/Auth'

/**
 * Чеклист по готовности авторизации:
 * 1) кнопки "Зарегистрироваться" и "Забыли пароль?", ведущие на сайт
 * 2) поддержать флоу Логин -> СМС
 * 3) поддержать флоу Логин -> Код из приложения
 * 4) поддержать флоу Логин -> Код из приложения -> форс СМС
 * 5) научиться отображать ошибки в целом
 * 6) правильно показывать ошибку ввода логина/пароля; кода; о бане аккаунта
 * 7) научиться обрабатывать капчу
 */

type AuthState = {
  login: string
  password: string
  loading: boolean
  validationSid: string | null
  error: string | null
}

export const Auth = defineComponent(() => {
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
    console.log(result)

    state.loading = false
  }

  return () => (
    <div class="Auth">
      {state.validationSid ? (
        <AuthConfirmCode validationSid={state.validationSid} />
      ) : (
        <AuthMain authState={state} onSubmit={auth} />
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
  const loading = ref(false)

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
        loading={loading.value}
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
