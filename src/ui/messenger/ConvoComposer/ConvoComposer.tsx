import { ChangeEvent, computed, defineComponent, KeyboardEvent, ref, shallowRef } from 'vue'
import { PhotosPhoto } from 'model/api-types/objects/PhotosPhoto'
import * as Attach from 'model/Attach'
import * as Convo from 'model/Convo'
import { sendMessage } from 'actions'
import { fromApiAttachPhoto } from 'converters/AttachConverter'
import { useEnv } from 'hooks'
import { isEventWithModifier } from 'misc/utils'
import { ConvoComposerMedia } from 'ui/messenger/ConvoComposer/ConvoComposerMedia'
import { Button } from 'ui/ui/Button/Button'
import { ButtonIcon } from 'ui/ui/ButtonIcon/ButtonIcon'
import { Icon24Info, Icon24MuteOutline, Icon24Send, Icon24VolumeOutline } from 'assets/icons'
import './ConvoComposer.css'

type Props = {
  convo: Convo.Convo
}

export type UploadedMediaItem = {
  kind: 'Photo'
  progress: number
  failed: boolean
  file: File
  photo?: PhotosPhoto
}

export const ConvoComposer = defineComponent<Props>((props) => {
  const { lang, api, uploader } = useEnv()
  const $input = shallowRef<HTMLSpanElement | null>(null)
  const areNotificationsUpdating = shallowRef(false)
  const text = shallowRef('')
  const uploadedMedia = ref<UploadedMediaItem[]>([])

  const canSendMessage = computed(() => {
    const hasAttaches = uploadedMedia.value.length > 0
    if (!hasAttaches && text.value.trim() === '') {
      return false
    }

    const allAttachesReady = uploadedMedia.value.every((media) => media.photo)
    if (!allAttachesReady) {
      return false
    }

    return true
  })

  const onMessageSend = () => {
    const attaches = uploadedMedia.value.reduce<Attach.Attaches>((attaches, media) => {
      const photo = media.photo && fromApiAttachPhoto(media.photo)
      if (!photo) {
        return attaches
      }

      if (attaches.photos) {
        attaches.photos.push(photo)
      } else {
        attaches.photos = [photo]
      }

      return attaches
    }, {})

    sendMessage(props.convo.id, text.value, attaches)

    uploadedMedia.value = []
    text.value = ''
    $input.value && ($input.value.innerText = '')
  }

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.code === 'Enter' && !isEventWithModifier(event)) {
      // Предотвращаем перенос строки
      event.preventDefault()

      if (!canSendMessage.value) {
        return
      }

      onMessageSend()
    }
  }

  const onInput = (event: ChangeEvent<HTMLElement>) => {
    text.value = event.currentTarget.innerText ?? ''
  }

  const onPaste = (event: ClipboardEvent) => {
    for (const file of event.clipboardData?.files ?? []) {
      if (uploader.isPhotoFile(file)) {
        event.preventDefault()

        const length = uploadedMedia.value.push({
          kind: 'Photo',
          progress: 0,
          failed: false,
          file
        })
        const media = uploadedMedia.value[length - 1]
        if (!media) {
          return
        }

        uploader
          .uploadPhoto(file, props.convo.id, (progress: number) => {
            media.progress = progress
          })
          .then((photo) => {
            media.photo = photo
          })
          .catch(() => {
            media.failed = true
          })
      }
    }
  }

  const toggleNotifications = async () => {
    try {
      areNotificationsUpdating.value = true

      await api.fetch('account.setSilenceMode', {
        peer_id: props.convo.id,
        sound: props.convo.notifications.enabled ? 0 : 1,
        time: props.convo.notifications.enabled ? -1 : 0
      })

      props.convo.notifications.enabled = !props.convo.notifications.enabled
    } finally {
      areNotificationsUpdating.value = false
    }
  }

  const renderPanel = () => {
    if (props.convo.kind === 'ChatConvo' && props.convo.status === 'kicked') {
      return (
        <div class="ConvoComposer__restriction">
          <Icon24Info color="var(--vkui--color_accent_orange)" />
          {lang.use('me_chat_kicked_status')}
        </div>
      )
    }

    if (Convo.isChannel(props.convo)) {
      return (
        <Button
          class="ConvoComposer__muteChannelButton"
          mode="tertiary"
          loading={areNotificationsUpdating.value}
          onClick={toggleNotifications}
          before={
            props.convo.notifications.enabled
              ? <Icon24MuteOutline />
              : <Icon24VolumeOutline />
          }
        >
          {props.convo.notifications.enabled
            ? lang.use('me_convo_disable_notifications')
            : lang.use('me_convo_enable_notifications')}
        </Button>
      )
    }

    return (
      <>
        <span
          class="ConvoComposer__input"
          contenteditable="plaintext-only"
          role="textbox"
          placeholder={lang.use('me_convo_composer_placeholder')}
          ref={$input}
          onKeydown={onKeyDown}
          onInput={onInput}
          onPaste={onPaste}
        />
        <ButtonIcon
          class="ConvoComposer__send"
          disabled={!canSendMessage.value}
          icon={<Icon24Send />}
          withHoverBackground={false}
          onClick={onMessageSend}
          // Предотвращаем сброс фокуса с поля ввода
          onMousedown={(event) => event.preventDefault()}
        />
      </>
    )
  }

  return () => (
    <div class="ConvoComposer">
      <div class="ConvoComposer__inner">
        {uploadedMedia.value.length > 0 && (
          <div class="ConvoComposer__attaches">
            {uploadedMedia.value.map((media) => (
              <ConvoComposerMedia media={media} />
            ))}
          </div>
        )}

        <div class="ConvoComposer__panel">
          {renderPanel()}
        </div>
      </div>
    </div>
  )
}, {
  props: ['convo']
})
