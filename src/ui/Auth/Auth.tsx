import { defineComponent, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useViewerStore } from 'store/viewer'
import { getAndroidToken, GetAndroidTokenPayload, getAppToken } from 'model/Auth'
import { fromApiUser } from 'converters/PeerConverter'
import { useEnv, useGlobalModal } from 'misc/hooks'
import { PEER_FIELDS } from 'misc/constants'
import { AuthConfirmationPage, ConfirmationState } from 'ui/Auth/AuthConfirmationPage'
import { AuthMainPage } from 'ui/Auth/AuthMainPage'
import './Auth.css'

type AuthState = {
  login: string
  password: string
  loading: boolean
  error: string | null
  confirmationState: ConfirmationState | null
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
    confirmationState: null
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
    state.confirmationState = null
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
        state.confirmationState = result
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
    !state.confirmationState ? (
      <AuthMainPage
        loading={state.loading}
        error={state.error}
        onSubmit={onSubmitAuth}
        onHideError={onHideError}
      />
    ) : (
      <AuthConfirmationPage
        confirmationState={state.confirmationState}
        loading={state.loading}
        error={state.error}
        onSubmit={onSubmitCode}
        onCancel={onCancelCode}
        onHideError={onHideError}
      />
    )
  )
})
