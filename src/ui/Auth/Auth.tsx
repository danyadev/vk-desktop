import { defineComponent, reactive } from 'vue'
import { useRouter } from 'vue-router'
import * as AuthModel from 'model/Auth'
import { useViewerStore } from 'store/viewer'
import { fromApiUser } from 'converters/PeerConverter'
import { useEnv, useGlobalModal } from 'hooks'
import { PEER_FIELDS } from 'misc/constants'
import { AuthConfirmationPage, ConfirmationState } from 'ui/Auth/AuthConfirmationPage'
import { AuthMainPage } from 'ui/Auth/AuthMainPage'
import { AuthQRPage } from 'ui/Auth/AuthQRPage'
import './Auth.css'

type AuthState = {
  login: string
  password: string
  loading: boolean
  error: string | null
  confirmationState: ConfirmationState | null
  isQrCodePage: boolean
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
    confirmationState: null,
    isQrCodePage: false
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
    state.confirmationState = null
  }

  function onOpenQrCodePage() {
    state.isQrCodePage = true
  }

  function onCloseQrCode() {
    state.isQrCodePage = false
  }

  function onHideError() {
    state.error = null
  }

  async function performAuth(payload: AuthModel.GetMessengerTokenPayload = {}): Promise<void> {
    state.loading = true

    const result = await AuthModel.getMessengerToken(state.login, state.password, payload)

    switch (result.kind) {
      case 'Success': {
        if (result.trustedHash) {
          viewer.addTrustedHash(state.login, result.trustedHash)
        }

        await completeAuthWithMessengerToken(result.messengerToken)
        break
      }

      case 'InvalidCredentials':
      case 'InvalidTwoFactorCode':
      case 'FloodControl': {
        state.error = result.errorMessage
        break
      }

      case 'RequireTwoFactor':
        state.confirmationState = result
        break

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
        }

        return performAuth(payload)
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

  async function completeAuthWithMessengerToken(messengerToken: string) {
    const appToken = await AuthModel.getAppToken(messengerToken, api).catch(() => null)

    if (!appToken) {
      state.isQrCodePage = false
      state.error = lang.use('auth_get_app_token_error')
      return
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
        messengerToken
      })
      viewer.setCurrentAccount(user.id)

      router.replace('/')
    } catch (err) {
      console.warn('Ошибка получения юзера', err)
      state.isQrCodePage = false
      state.error = lang.use('auth_user_load_error')
    }
  }

  return () => {
    if (state.isQrCodePage) {
      return (
        <AuthQRPage onCancel={onCloseQrCode} onAuth={completeAuthWithMessengerToken} />
      )
    }

    if (state.confirmationState) {
      return (
        <AuthConfirmationPage
          confirmationState={state.confirmationState}
          onSubmit={onSubmitCode}
          onCancel={onCancelCode}
          loading={state.loading}
          error={state.error}
          onHideError={onHideError}
        />
      )
    }

    return (
      <AuthMainPage
        onSubmit={onSubmitAuth}
        loading={state.loading}
        error={state.error}
        onHideError={onHideError}
        openQrCodePage={onOpenQrCodePage}
      />
    )
  }
})
