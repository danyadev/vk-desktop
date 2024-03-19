import { defineComponent } from 'vue'
import { useConvosStore } from 'store/convos'
import { logout } from 'store/viewer'
import * as Convo from 'model/Convo'
import * as Peer from 'model/Peer'
import { ClassName } from 'misc/utils'
import { useViewer } from 'misc/hooks'
import { ConvoListItem } from 'ui/messenger/ConvoListItem/ConvoListItem'
import { Avatar } from 'ui/ui/Avatar/Avatar'
import { ButtonIcon } from 'ui/ui/ButtonIcon/ButtonIcon'
import { Spinner } from 'ui/ui/Spinner/Spinner'
import { Icon24DoorArrowRightOutline } from 'assets/icons'
import './ConvoList.css'

type Props = {
  class?: ClassName
  compact?: boolean
}

export const ConvoList = defineComponent<Props>((props) => {
  const viewer = useViewer()
  const { convoList, connection } = useConvosStore()

  const convoListRenderer = () => {
    if (!convoList.length) {
      return (
        <div class="ConvoList__list ConvoList__list--loading">
          <Spinner size="regular" />
        </div>
      )
    }

    return (
      <div class="ConvoList__list">
        {convoList.map((id) => (
          <ConvoListItem key={id} convo={Convo.safeGet(id)} compact={props.compact} />
        ))}
      </div>
    )
  }

  return () => (
    <div class={['ConvoList', { 'ConvoList--compact': props.compact }]}>
      <div class="ConvoList__header">
        <Avatar class="ConvoList__headerAvatar" peer={viewer} size={32} />

        {!props.compact && (
          <>
            <span class="ConvoList__headerName">{Peer.name(viewer)}</span>
            <span class="ConvoList__headerStatus">{connection.status}</span>

            <ButtonIcon
              class="ConvoList__headerExitIcon"
              icon={<Icon24DoorArrowRightOutline color="var(--vkui--color_icon_negative)" />}
              onClick={logout}
            />
          </>
        )}
      </div>

      {convoListRenderer()}
    </div>
  )
}, {
  props: ['compact']
})
