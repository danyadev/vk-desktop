import { defineComponent } from 'vue'
import { useServices } from 'services'
import * as Attach from 'model/Attach'
import * as Message from 'model/Message'
import { ClassName } from 'misc/utils'
import { AttachVoice } from './AttachVoice/AttachVoice'
import { AttachLink } from 'ui/messenger/attaches/AttachLink/AttachLink'
import { AttachMedia } from 'ui/messenger/attaches/AttachMedia/AttachMedia'
import { AttachSticker } from 'ui/messenger/attaches/AttachSticker/AttachSticker'
import { AttachWall } from 'ui/messenger/attaches/AttachWall/AttachWall'
import './Attaches.css'

type Props = {
  attaches: Attach.Attaches
  message?: Message.Message | Message.Foreign
  class: ClassName
}

export const Attaches = defineComponent<Props>((props) => {
  const { lang } = useServices()

  return () => (
    <div class={['Attaches', props.class]}>
      {props.attaches.sticker && <AttachSticker sticker={props.attaches.sticker} />}
      {props.attaches.media && <AttachMedia media={props.attaches.media} />}
      {props.attaches.links?.map((link) => <AttachLink link={link} />)}
      {props.attaches.wall && <AttachWall wall={props.attaches.wall} />}
      {props.attaches.voice && <AttachVoice voice={props.attaches.voice} message={props.message} />}
      {props.attaches.unknown?.map((unknown) => (
        <div class="Attaches__unknown">
          {lang.use('me_unknown_attach')} ({unknown.type})
        </div>
      ))}
    </div>
  )
}, {
  props: ['attaches', 'message', 'class']
})
