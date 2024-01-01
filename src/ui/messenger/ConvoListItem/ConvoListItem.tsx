import { defineComponent } from 'vue'
import { usePeersStore } from 'store/peers'
import * as Convo from 'model/Convo'
import * as Peer from 'model/Peer'
import { Avatar } from 'ui/ui/Avatar/Avatar'
import './ConvoListItem.css'

type Props = {
  convo: Convo.Convo
}

export const ConvoListItem = defineComponent<Props>(({ convo }) => {
  const { peers } = usePeersStore()
  const peer = Peer.safeGet(peers, convo.id)

  return () => (
    <div class="ConvoListItem">
      <Avatar peer={peer} size={48} />

      <span class="ConvoListItem__name">{Peer.name(peer)}</span>

      {convo.unreadCount > 0 && (
        <span class="ConvoListItem__unreadCount">
          {convo.unreadCount}
        </span>
      )}
    </div>
  )
}, {
  props: ['convo']
})
