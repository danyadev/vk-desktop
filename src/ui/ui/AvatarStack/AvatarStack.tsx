import { defineComponent } from 'vue'
import * as Peer from 'model/Peer'
import { ClassName } from 'misc/utils'
import { Avatar, AvatarSize } from 'ui/ui/Avatar/Avatar'
import './AvatarStack.css'

type Props = {
  peers: Peer.Peer[]
  size: AvatarSize
  class?: ClassName
}

export const AvatarStack = defineComponent<Props>((props) => {
  return () => (
    <span class="AvatarStack">
      {props.peers.map((peer) => (
        <Avatar key={peer.id} peer={peer} size={props.size} />
      ))}
    </span>
  )
}, {
  props: ['peers', 'size']
})
