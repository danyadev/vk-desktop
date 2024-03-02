import { defineComponent } from 'vue'
import { useRouter } from 'vue-router'
import * as Convo from 'model/Convo'
import * as Peer from 'model/Peer'
import { Avatar } from 'ui/ui/Avatar/Avatar'
import { ButtonIcon } from 'ui/ui/ButtonIcon/ButtonIcon'
import { Icon24ChevronCompactLeft } from 'assets/icons'
import './ConvoHeader.css'

type Props = {
  convo: Convo.Convo
}

export const ConvoHeader = defineComponent<Props>(({ convo }) => {
  const router = useRouter()
  const peer = Peer.safeGet(convo.id)

  return () => (
    <div class="ConvoHeader">
      <ButtonIcon
        icon={<Icon24ChevronCompactLeft color="var(--vkui--color_icon_secondary)" />}
        class="ConvoHeader__back"
        onClick={() => router.back()}
      />
      <Avatar peer={peer} size={32} class="ConvoHeader__avatar" />
      {Peer.name(peer)}
    </div>
  )
}, {
  props: ['convo']
})
