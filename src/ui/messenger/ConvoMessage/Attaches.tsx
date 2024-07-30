import { defineComponent } from 'vue'
import * as Attach from 'model/Attach'
import { useEnv } from 'hooks'
import { AttachSticker } from 'ui/messenger/attaches/AttachSticker/AttachSticker'

type Props = {
  attaches: Attach.Attaches
}

export const Attaches = defineComponent<Props>((props) => {
  const { lang } = useEnv()

  return () => (
    <div>
      {props.attaches.sticker && <AttachSticker sticker={props.attaches.sticker} />}
      {props.attaches.unknown?.map((unknown) => (
        <div class="ConvoMessage__unknownAttach">
          {lang.use('me_unknown_attach')} ({unknown.type})
        </div>
      ))}
    </div>
  )
}, {
  props: ['attaches']
})
