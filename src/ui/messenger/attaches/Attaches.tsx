import { defineComponent } from 'vue'
import * as Attach from 'model/Attach'
import { useEnv } from 'hooks'
import { ClassName } from 'misc/utils'
import { AttachLink } from 'ui/messenger/attaches/AttachLink/AttachLink'
import { AttachPhotos } from 'ui/messenger/attaches/AttachPhotos/AttachPhotos'
import { AttachSticker } from 'ui/messenger/attaches/AttachSticker/AttachSticker'
import { AttachWall } from 'ui/messenger/attaches/AttachWall/AttachWall'
import './Attaches.css'

type Props = {
  attaches: Attach.Attaches
  class: ClassName
}

export const Attaches = defineComponent<Props>((props) => {
  const { lang } = useEnv()

  return () => (
    <div class={['Attaches', props.class]}>
      {props.attaches.sticker && <AttachSticker sticker={props.attaches.sticker} />}
      {props.attaches.photos && <AttachPhotos photos={props.attaches.photos} />}
      {props.attaches.links?.map((link) => <AttachLink link={link} />)}
      {props.attaches.wall && <AttachWall wall={props.attaches.wall} />}
      {props.attaches.unknown?.map((unknown) => (
        <div class="Attaches__unknown">
          {lang.use('me_unknown_attach')} ({unknown.type})
        </div>
      ))}
    </div>
  )
}, {
  props: ['attaches', 'class']
})