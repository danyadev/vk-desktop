import { defineComponent } from 'vue'
import * as Message from 'model/Message'
import * as Peer from 'model/Peer'
import { useFormatDate } from 'hooks'
import { MessagePreview } from 'ui/messenger/MessagePreview/MessagePreview'
import { Icon16Pin } from 'assets/icons'
import './PinnedMessage.css'

type Props = {
  pinnedMessage: Message.Pinned
}

export const PinnedMessage = defineComponent<Props>((props) => {
  const formatDate = useFormatDate({ relativeTime: false })

  return () => (
    <div class="PinnedMessage">
      <Icon16Pin class="PinnedMessage__icon" color="var(--vkui--color_icon_secondary)" />

      <div class="PinnedMessage__name">
        {Peer.name(Peer.safeGet(props.pinnedMessage.authorId))}
        <span class="PinnedMessage__date">
          {' '}
          {formatDate(props.pinnedMessage.sentAt)}
        </span>
      </div>

      <div class="PinnedMessage__content">
        <MessagePreview message={props.pinnedMessage} accent />
      </div>
    </div>
  )
}, {
  props: ['pinnedMessage']
})
