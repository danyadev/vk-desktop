import {
  computed,
  defineComponent,
  InputEvent,
  KeyboardEvent,
  onMounted,
  reactive,
  Ref,
  shallowReactive,
  shallowRef
} from 'vue'
import { useRouter } from 'vue-router'
import { useViewerStore, ViewerUser } from 'store/viewer'
import { getAndroidToken, GetAndroidTokenPayload, getAppToken } from 'model/Auth'
import * as Peer from 'model/Peer'
import { useEnv, useGlobalModal, useModal } from 'misc/hooks'
import { fromApiUser } from 'misc/converters/PeerConverter'
import { PEER_FIELDS } from 'misc/constants'
import { Modal } from 'ui/modals/parts'
import { Avatar } from 'ui/ui/Avatar/Avatar'
import { Button } from 'ui/ui/Button/Button'
import { ButtonIcon } from 'ui/ui/ButtonIcon/ButtonIcon'
import { ButtonText } from 'ui/ui/ButtonText/ButtonText'
import { Input } from 'ui/ui/Input/Input'
import { Link } from 'ui/ui/Link/Link'
import { Icon20TrashOutline, Icon24HideOutline, Icon24ViewOutline } from 'assets/icons'
import logo from 'assets/logo512.png'
import './Auth.css'

/**
 * Чеклист по готовности авторизации:
 * - научиться показывать второстепенные ошибки снекбарами
 * - переделать мультиаккаунт
 * - авторизовываться через вебвью и получать токен веба?
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
  const { api, lang } = useEnv()
  const router = useRouter()
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

  function onHideError() {
    state.error = null
  }

  async function performAuth(payload: GetAndroidTokenPayload = {}): Promise<void> {
    state.error = null
    state.loading = true

    const result = await getAndroidToken(state.login, state.password, payload)

    switch (result.kind) {
      case 'Success': {
        if (result.trustedHash) {
          viewer.addTrustedHash(state.login, result.trustedHash)
        }

        const appToken = await getAppToken(result.androidToken, api)
        if (!appToken) {
          state.error = lang.use('auth_app_token_getting_error')
          break
        }

        try {
          const [apiUser] = await api.fetch('users.get', {
            access_token: appToken,
            fields: PEER_FIELDS
          }, { retries: 3 })

          if (!apiUser) {
            throw new Error('API не вернул пользователя')
          }

          const user = fromApiUser(apiUser)

          viewer.addAccount({
            ...user,
            accessToken: appToken,
            androidToken: result.androidToken
          })
          viewer.setCurrentAccount(user.id)

          router.replace('/')
        } catch (err) {
          console.warn('Ошибка получения юзера', err)
          state.error = lang.use('auth_user_load_error')
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
        const captchaKey = await new Promise<string | undefined>((resolve) => {
          const { captchaModal } = useGlobalModal()
          captchaModal.open({
            captchaImg: result.captchaImg,
            onClose(captchaKey) {
              resolve(captchaKey)
            }
          })
        })

        if (captchaKey) {
          return performAuth({
            ...payload,
            captcha_key: captchaKey,
            captcha_sid: result.captchaSid
          })
        } else {
          state.error = lang.use('auth_captcha_enter_error')
        }
        break
      }

      case 'UserBanned': {
        state.error = result.banMessage
        break
      }

      case 'NetworkError': {
        state.error = lang.use('auth_network_error')
        break
      }

      case 'UnknownError': {
        console.warn('Неизвестная ошибка авторизации', result.payload)
        state.error = lang.use('auth_unknown_error')
        break
      }
    }

    state.loading = false
  }

  return () => (
    !state.twoFactorState ? (
      <AuthMain
        loading={state.loading}
        error={state.error}
        onSubmit={onSubmitAuth}
        onHideError={onHideError}
      />
    ) : (
      <AuthTwoFactor
        twoFactorState={state.twoFactorState}
        loading={state.loading}
        error={state.error}
        onSubmit={onSubmitCode}
        onCancel={onCancelCode}
        onHideError={onHideError}
      />
    )
  )
})

type AuthMainProps = {
  loading: boolean
  error: string | null
  onSubmit: (login: string, password: string) => void
  onHideError: () => void
}

const AuthMain = defineComponent<AuthMainProps>((props) => {
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
          onInput={(event) => (state.login = event.target.value)}
          autofocus
        />
        <Input
          type={showPassword.value ? 'text' : 'password'}
          placeholder={lang.use('auth_password_placeholder')}
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

        {props.error ? (
          <div class="Auth__error" onClick={props.onHideError}>{props.error}</div>
        ) : (
          <AuthAccounts />
        )}
      </div>

      <div class="Auth__footerLinks">
        <Link href="https://vk.com/join">{lang.use('auth_register')}</Link>
        •
        <Link href="https://vk.com/restore">{lang.use('auth_forgot_password')}</Link>
      </div>
    </div>
  )
}, {
  props: ['loading', 'error', 'onSubmit', 'onHideError']
})

type AuthTwoFactorProps = {
  twoFactorState: TwoFactorState
  loading: boolean
  error: string | null
  onSubmit: (code: string) => void
  onCancel: () => void
  onHideError: () => void
}

const AuthTwoFactor = defineComponent<AuthTwoFactorProps>((props) => {
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
        sid: props.twoFactorState.validationSid
      }, { retries: 3 })

      props.twoFactorState.validationType = '2fa_sms'
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
      props.twoFactorState.validationType === '2fa_sms' &&
      props.twoFactorState.needValidateSendSms
    ) {
      sendSms()
    }
  })

  return () => (
    <div class="Auth">
      <div class="Auth__content" onKeydown={onKeyDown}>
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
        {props.error && <div class="Auth__error" onClick={props.onHideError}>{props.error}</div>}
      </div>

      <div class="Auth__smsStatus">
        <SmsStatus
          validationType={props.twoFactorState.validationType}
          sendSms={sendSms}
          isSendingSms={isSendingSms}
          resendSmsTimer={resendSmsTimer}
        />
      </div>
    </div>
  )
}, {
  props: ['twoFactorState', 'loading', 'error', 'onSubmit', 'onCancel', 'onHideError']
})

type SmsStatusProps = {
  validationType: TwoFactorState['validationType']
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
      return lang.use('auth_resend_sms_at', [
        lang.formatDate(resendSmsTimer.value * 1000, 'mm:ss')
      ])
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

const AuthAccounts = defineComponent(() => {
  const viewer = useViewerStore()
  const router = useRouter()
  const { lang } = useEnv()

  const isDeleteModeActive = shallowRef(false)
  const confirmDeleteModal = useModal()
  const userToDelete = shallowRef<ViewerUser>()

  function openAccount(userId: Peer.UserId) {
    viewer.setCurrentAccount(userId)
    router.replace('/')
  }

  function confirmDeleteAccount(userId: Peer.UserId) {
    userToDelete.value = viewer.accounts.get(userId)
    confirmDeleteModal.open()
  }

  function deleteAccount() {
    if (!userToDelete.value) {
      return
    }

    viewer.deleteAccount(userToDelete.value.id)
    confirmDeleteModal.close()
  }

  return () => {
    if (!viewer.accounts.size) {
      return null
    }

    return (
      <div class={['Auth__accounts', isDeleteModeActive.value && 'Auth__accounts--deleteMode']}>
        {[...viewer.accounts.values()].map((account) => (
          <div class="Auth__account">
            <div class="Auth__accountContent" onClick={() => openAccount(account.id)}>
              <Avatar peer={account} size={56} />
              <div class="Auth__accountName">
                {account.firstName}
              </div>
            </div>

            <ButtonText
              class="Auth__accountDeleteButton"
              disabled={!isDeleteModeActive.value}
              onClick={() => confirmDeleteAccount(account.id)}
            >
              {lang.use('auth_account_delete')}
            </ButtonText>
          </div>
        ))}

        <ButtonIcon
          class="Auth__accountToggleDeleteModeButton"
          onClick={() => (isDeleteModeActive.value = !isDeleteModeActive.value)}
        >
          <Icon20TrashOutline
            color={
              isDeleteModeActive.value
                ? 'var(--vkui--color_button_icon)'
                : 'var(--vkui--color_icon_negative)'
            }
          />
        </ButtonIcon>

        {userToDelete.value && (
          <Modal
            opened={confirmDeleteModal.opened}
            onClose={confirmDeleteModal.close}
            onVisibilityChange={(isVisible) => !isVisible && (userToDelete.value = undefined)}
            title={lang.use('confirmAccountDelete_title')}
            buttons={[
              <Button mode="destructive" onClick={deleteAccount}>
                {lang.use('modal_delete_label')}
              </Button>,
              <Button onClick={confirmDeleteModal.close}>
                {lang.use('modal_cancel_label')}
              </Button>
            ]}
          >
            {lang.use('confirmAccountDelete_confirm', [Peer.name(userToDelete.value)])}
          </Modal>
        )}
      </div>
    )
  }
})
