import { defineComponent } from 'vue'
import { logout } from 'store/viewer'
import * as Peer from 'model/Peer'
import { ClassName } from 'misc/utils'
import { useViewer } from 'misc/hooks'
import { Avatar } from 'ui/ui/Avatar/Avatar'
import { ButtonIcon } from 'ui/ui/ButtonIcon/ButtonIcon'
import { Icon24DoorArrowRightOutline } from 'assets/icons'
import './ConvoList.css'

type Props = {
  class?: ClassName
}

export const ConvoList = defineComponent<Props>(() => {
  const viewer = useViewer()

  return () => (
    <div class="ConvoList">
      <div class="ConvoList__header">
        <Avatar class="ConvoList__headerAvatar" peer={viewer} size={32} />
        {Peer.name(viewer)}

        <ButtonIcon
          class="ConvoList__headerExitIcon"
          icon={<Icon24DoorArrowRightOutline color="var(--destructive)" />}
          onClick={logout}
        />
      </div>

      <div class="ConvoList__list">
        список диалогов
      </div>
    </div>
  )
})
