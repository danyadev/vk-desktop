import './Auth.css'
import { defineComponent, reactive } from 'vue'
import { useEnv } from 'misc/hooks'
import logo from 'assets/logo512.png'
import { Input } from 'ui/ui/Input/Input'
import { Button } from 'ui/ui/Button/Button'

export const Auth = defineComponent(() => {
  const { lang } = useEnv()

  const state = reactive({
    login: '',
    password: ''
  })

  return () => (
    <div class="Auth">
      <div class="Auth__content">
        <img class="Auth__logo" src={logo} />
        <Input
          placeholder={lang.use('auth_login_placeholder')}
          onInput={(event) => (state.login = event.target.value)}
        />
        <Input
          type="password"
          placeholder={lang.use('auth_password_placeholder')}
          onInput={(event) => (state.password = event.target.value)}
        />
        <Button
          size="large"
          wide
          disabled={!state.login || !state.password}
        >
          {lang.use('auth_submit')}
        </Button>
      </div>
    </div>
  )
})
