import { computed, defineComponent, KeyboardEvent, shallowReactive, shallowRef } from 'vue'
import { useEnv } from 'hooks'
import { AuthMultiaccount } from 'ui/Auth/AuthMultiaccount'
import { Modal } from 'ui/modals/parts'
import { Button } from 'ui/ui/Button/Button'
import { ButtonIcon } from 'ui/ui/ButtonIcon/ButtonIcon'
import { Input } from 'ui/ui/Input/Input'
import { Link } from 'ui/ui/Link/Link'
import { Icon24HideOutline, Icon24ViewOutline } from 'assets/icons'
import logo from 'assets/logo512.png'

type AuthMainPageProps = {
  onSubmit: (login: string, password: string) => void
  loading: boolean
  error: string | null
  onHideError: () => void
  openQrCodePage: () => void
}

export const AuthMainPage = defineComponent<AuthMainPageProps>((props) => {
  const { lang } = useEnv()
  const showPassword = shallowRef(false)

  const state = shallowReactive({
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
          disabled={props.loading}
          onInput={(event) => (state.login = event.target.value)}
          autofocus
        />
        <Input
          type={showPassword.value ? 'text' : 'password'}
          placeholder={lang.use('auth_password_placeholder')}
          disabled={props.loading}
          after={
            <ButtonIcon
              icon={showPassword.value ? <Icon24HideOutline /> : <Icon24ViewOutline />}
              title={lang.use(showPassword.value ? 'auth_hide_password' : 'auth_show_password')}
              onClick={() => (showPassword.value = !showPassword.value)}
              stretched
            />
          }
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
        <Button
          mode="secondary"
          size="large"
          wide
          disabled={props.loading}
          onClick={props.openQrCodePage}
        >
          {lang.use('auth_by_qr_code')}
        </Button>

        <AuthMultiaccount />
      </div>

      <div class="Auth__footerLinks">
        <Link href="https://vk.com/join">{lang.use('auth_register')}</Link>
        •
        <Link href="https://vk.com/restore">{lang.use('auth_forgot_password')}</Link>
      </div>

      <Modal
        opened={!!props.error}
        onClose={props.onHideError}
        title={lang.use('auth_error')}
        buttons={<Button onClick={props.onHideError}>{lang.use('modal_close_label')}</Button>}
      >
        {props.error}
      </Modal>
    </div>
  )
}, {
  props: ['onSubmit', 'loading', 'error', 'onHideError', 'openQrCodePage']
})
