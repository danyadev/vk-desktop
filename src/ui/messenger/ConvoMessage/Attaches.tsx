import { defineComponent } from 'vue'
import * as Attach from 'model/Attach'
import { useEnv } from 'hooks'
import { ClassName } from 'misc/utils'
import { AttachPhotos } from 'ui/messenger/attaches/AttachPhotos/AttachPhotos'
import { AttachSticker } from 'ui/messenger/attaches/AttachSticker/AttachSticker'

type Props = {
  attaches: Attach.Attaches
  class: ClassName
}

export const Attaches = defineComponent<Props>((props) => {
  const { lang } = useEnv()

  return () => (
    <div class={props.class}>
      {props.attaches.sticker && <AttachSticker sticker={props.attaches.sticker} />}
      {props.attaches.photos && <AttachPhotos photos={props.attaches.photos} />}
      {props.attaches.unknown?.map((unknown) => (
        <div class="ConvoMessage__unknownAttach">
          {lang.use('me_unknown_attach')} ({unknown.type})
        </div>
      ))}
    </div>
  )
}, {
  props: ['attaches', 'class']
})
