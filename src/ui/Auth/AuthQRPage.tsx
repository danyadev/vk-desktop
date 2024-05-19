import { defineComponent, KeyboardEvent, onMounted, onUnmounted, shallowRef, watch } from 'vue'
import vkqr from '@vkontakte/vk-qr'
import { QrCodeAuth, QrCodeAuthEvent } from 'model/QrCodeAuth'
import { useEnv } from 'misc/hooks'
import { Button } from 'ui/ui/Button/Button'
import { Link } from 'ui/ui/Link/Link'
import { Spinner } from 'ui/ui/Spinner/Spinner'

type Props = {
  onCancel: () => void
  onAuth: (androidToken: string) => void
}

export const AuthQRPage = defineComponent<Props>((props) => {
  const { api, lang } = useEnv()
  const qrCodeUrl = shallowRef<string | null>(null)
  const qrCodeRaw = shallowRef<string | null>(null)
  const qrCodeAuth = new QrCodeAuth(api, onEvent)

  function onEvent(event: QrCodeAuthEvent) {
    switch (event.kind) {
      case 'UrlUpdated':
        qrCodeUrl.value = event.url
        break
      case 'UrlInvalidated':
        qrCodeUrl.value = null
        break
      case 'Success':
        props.onAuth(event.androidToken)
        break
      case 'Error':
        props.onCancel()
        break
    }
  }

  function onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      props.onCancel()
    }
  }

  watch(qrCodeUrl, () => {
    if (qrCodeUrl.value) {
      qrCodeRaw.value = vkqr.createQR(qrCodeUrl.value, {
        qrSize: 128,
        foregroundColor: 'black'
      })
    } else {
      qrCodeRaw.value = null
    }
  })

  onMounted(() => {
    qrCodeAuth.subscribe().catch(props.onCancel)
  })

  onUnmounted(() => {
    qrCodeAuth.unsubscribe()
  })

  return () => (
    <div class="Auth">
      <div class="Auth__content" onKeydown={onKeyDown} tabindex={-1}>
        <div class="Auth__QRHeader">Вход по QR-коду</div>
        <div class="Auth__QRDescription">
          Отсканируйте QR-код, либо перейдите по ссылке в браузере, где вы уже авторизованы
        </div>
        {qrCodeRaw.value
          ? <div class="Auth__QR" v-html={qrCodeRaw.value} />
          : <div class="Auth__QR"><Spinner size="regular" /></div>}
        <Link class="Auth__QRLink" href={qrCodeUrl.value ?? ''}>
          {qrCodeUrl.value ?? <Spinner />}
        </Link>
        <Button wide onClick={props.onCancel}>{lang.use('cancel')}</Button>
      </div>
    </div>
  )
}, {
  props: ['onCancel', 'onAuth']
})
