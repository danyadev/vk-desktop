import { computed, defineComponent } from 'vue'
import * as Message from 'model/Message'
import * as Peer from 'model/Peer'
import { useEnv } from 'hooks'
import './ConvoMessage.css'

type Props = {
  message: Message.Normal
  showName: boolean
}

export const ConvoMessage = defineComponent<Props>((props) => {
  const { lang } = useEnv()
  const author = computed(() => Peer.safeGet(props.message.authorId))

  return () => (
    <div
      class={['ConvoMessage', {
        'ConvoMessage--out': props.message.isOut
      }]}
    >
      <div class="ConvoMessage__content">
        {props.showName && !props.message.isOut && (
          <div class="ConvoMessage__author">{Peer.name(author.value)}</div>
        )}
        <span class="ConvoMessage__text">{props.message.text}</span>
        <span class="ConvoMessage__time">
          {lang
            .dateTimeFormatter({ hour: '2-digit', minute: '2-digit' })
            .format(props.message.sentAt)}
        </span>
      </div>
    </div>
  )
}, {
  props: ['message', 'showName']
})
