import { defineComponent } from 'vue'
import { useRouter } from 'vue-router'
import * as Convo from 'model/Convo'
import * as Peer from 'model/Peer'
import { usePeersStore } from 'store/peers'
import { useConvoSubtitle, useGlobalModal } from 'hooks'
import { ConvoActionMenu } from 'ui/messenger/ConvoActionMenu/ConvoActionMenu'
import { Avatar } from 'ui/ui/Avatar/Avatar'
import { ButtonBase } from 'ui/ui/ButtonBase/ButtonBase'
import { ButtonIcon } from 'ui/ui/ButtonIcon/ButtonIcon'
import { Icon16Muted, Icon24ChevronCompactLeft, Icon24MoreHorizontal } from 'assets/icons'
import './ConvoHeader.css'

type Props = {
  convo: Convo.Convo
}

export const ConvoHeader = defineComponent<Props>((props) => {
  const router = useRouter()
  const { peers } = usePeersStore()
  const peer = Peer.safeGet(peers, props.convo.id)

  const getConvoSubtitle = useConvoSubtitle()
  const { peerInfoModal } = useGlobalModal()

  return () => (
    <div class="ConvoHeader">
      <ButtonIcon
        icon={<Icon24ChevronCompactLeft color="var(--vkui--color_icon_secondary)" />}
        class="ConvoHeader__back"
        withHoverBackground
        onClick={() => {
          if (router.currentRoute.value.query.canGoBack) {
            router.back()
          } else {
            router.replace({ name: 'NoConvo' })
          }
        }}
      />

      <ButtonBase
        class="ConvoHeader__peer"
        disabled={peer.kind === 'Chat'}
        onClick={() => {
          if (peer.kind !== 'Chat') peerInfoModal.open({ peerId: peer.id })
        }}
      >
        <Avatar class="ConvoHeader__avatar" peer={peer} size={32} />
        <div class="ConvoHeader__name">
          <span class="ConvoHeader__nameText">{Peer.name(peer)}</span>
          <span class="ConvoHeader__nameIcons">
            {!props.convo.notifications.enabled && (
              <Icon16Muted color="var(--vkui--color_icon_tertiary)" />
            )}
          </span>
        </div>
        <span class="ConvoHeader__info">{getConvoSubtitle(props.convo, peer)}</span>
      </ButtonBase>

      <ConvoActionMenu convo={props.convo}>
        <ButtonIcon
          class="ConvoHeader__actions"
          icon={<Icon24MoreHorizontal color="var(--vkui--color_icon_secondary)" />}
          withHoverBackground
          shiftOnClick
        />
      </ConvoActionMenu>
    </div>
  )
}, {
  props: ['convo']
})
