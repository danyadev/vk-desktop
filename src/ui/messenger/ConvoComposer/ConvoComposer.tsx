import { ChangeEvent, computed, defineComponent, KeyboardEvent, ref, shallowRef } from 'vue'
import { PhotosPhoto } from 'model/api-types/objects/PhotosPhoto'
import * as Attach from 'model/Attach'
import * as Convo from 'model/Convo'
import { sendMessage } from 'actions'
import { fromApiAttachPhoto } from 'converters/AttachConverter'
import { useEnv } from 'hooks'
import { isEventWithModifier } from 'misc/utils'
import { ConvoComposerMedia } from 'ui/messenger/ConvoComposer/ConvoComposerMedia'
import { ConvoComposerMuteChannel } from 'ui/messenger/ConvoComposer/ConvoComposerMuteChannel'
import { ActionMenu } from 'ui/ui/ActionMenu/ActionMenu'
import { ActionMenuItem } from 'ui/ui/ActionMenuItem/ActionMenuItem'
import { ButtonIcon } from 'ui/ui/ButtonIcon/ButtonIcon'
import { Popper } from 'ui/ui/Popper/Popper'
import {
  Icon20PictureOutline,
  Icon24AddCircleOutline,
  Icon24Info,
  Icon24Send
} from 'assets/icons'
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
  const { lang, uploader } = useEnv()
  const $input = shallowRef<HTMLSpanElement | null>(null)
  const text = shallowRef('')
  const uploadedMedia = ref<UploadedMediaItem[]>([]).value

  const canSendMessage = computed(() => {
    const hasAttaches = uploadedMedia.length > 0
    if (!hasAttaches && text.value.trim() === '') {
      return false
    }

    const allAttachesReady = uploadedMedia.every((media) => media.photo)
    if (!allAttachesReady) {
      return false
    }

    return true
  })

  const onMessageSend = () => {
    const attaches = uploadedMedia.reduce<Attach.Attaches>((attaches, media) => {
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

    uploadedMedia.length = 0
    text.value = ''

    if ($input.value) {
      $input.value.innerText = ''
    }
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
        uploadPhoto(file)
      }
    }
  }

  const uploadPhoto = (file: File) => {
    const length = uploadedMedia.push({
      kind: 'Photo',
      progress: 0,
      failed: false,
      file
    })
    // Достаем этот же объект из массива, чтобы получить реактивную версию объекта
    const media = uploadedMedia[length - 1]!

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

  const openPhotoPicker = async () => {
    const fileHandles = await showOpenFilePicker({
      excludeAcceptAllOption: true,
      multiple: true,
      types: [{
        accept: {
          'image/*': ['.png', '.jpg', '.jpeg', '.gif']
        }
      }]
    }).catch(() => [])

    for (const fileHandle of fileHandles) {
      const file = await fileHandle.getFile()
      uploadPhoto(file)
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
      return <ConvoComposerMuteChannel convo={props.convo} />
    }

    return (
      <>
        <Popper
          placement="top-start"
          offset={{
            // Отступ слева кнопки, чтобы начало меню совпадало с началом поля ввода
            crossAxis: -6,
            // Отступ сверху кнопки (4px) + дефолтный отступ от элемента у поппера (4px)
            mainAxis: 8
          }}
          closeOnContentClick
          content={
            <ActionMenu>
              <ActionMenuItem
                icon={<Icon20PictureOutline />}
                text="Фото"
                onClick={openPhotoPicker}
              />
            </ActionMenu>
          }
        >
          <ButtonIcon class="ConvoComposer__addAttaches" icon={<Icon24AddCircleOutline />} />
        </Popper>

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
        {uploadedMedia.length > 0 && (
          <div class="ConvoComposer__attaches">
            {uploadedMedia.map((media, index) => (
              <ConvoComposerMedia
                media={media}
                onRemove={() => uploadedMedia.splice(index, 1)}
              />
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
