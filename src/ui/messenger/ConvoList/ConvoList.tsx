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
}

export const ConvoList = defineComponent<Props>(() => {
  const viewer = useViewer()
  const { convos, convoList } = useConvosStore()

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
          <ConvoListItem key={id} convo={Convo.safeGet(convos, id)} />
        ))}
      </div>
    )
  }

  return () => (
    <div class="ConvoList">
      <div class="ConvoList__header">
        <Avatar class="ConvoList__headerAvatar" peer={viewer} size={32} />
        {Peer.name(viewer)}

        <ButtonIcon
          class="ConvoList__headerExitIcon"
          icon={<Icon24DoorArrowRightOutline color="var(--vkui--color_icon_negative)" />}
          onClick={logout}
        />
      </div>

      {convoListRenderer()}
    </div>
  )
})
