import { defineComponent } from 'vue'
import * as Convo from 'model/Convo'
import * as Peer from 'model/Peer'
import { useConvosStore } from 'store/convos'
import { logout } from 'store/viewer'
import { loadMoreConvos } from 'actions'
import { useEnv, useViewer } from 'hooks'
import { ClassName } from 'misc/utils'
import { ConvoListItem } from 'ui/messenger/ConvoListItem/ConvoListItem'
import { Avatar } from 'ui/ui/Avatar/Avatar'
import { Button } from 'ui/ui/Button/Button'
import { ButtonIcon } from 'ui/ui/ButtonIcon/ButtonIcon'
import { IntersectionWrapper } from 'ui/ui/IntersectionWrapper/IntersectionWrapper'
import { Spinner } from 'ui/ui/Spinner/Spinner'
import { Icon24DoorArrowRightOutline } from 'assets/icons'
import './ConvoList.css'

type Props = {
  class?: ClassName
  compact?: boolean
}

export const ConvoList = defineComponent<Props>((props) => {
  const { lang } = useEnv()
  const viewer = useViewer()
  const { convoList, connection } = useConvosStore()

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

      <div class="ConvoList__list">
        {convoList.peerIds.map((id) => (
          <ConvoListItem key={id} convo={Convo.safeGet(id)} compact={props.compact} />
        ))}

        {convoList.peerIds.length === 0 && !convoList.hasMore && (
          <div class="ConvoList__empty">
            {lang.use('me_convo_list_empty')}
          </div>
        )}

        {convoList.loadError && (
          <div class="ConvoList__error">
            {lang.use('me_convo_list_loading_error')}
            <Button onClick={loadMoreConvos}>
              {lang.use('me_convo_list_retry_loading')}
            </Button>
          </div>
        )}

        {convoList.hasMore && !convoList.loadError && (
          <IntersectionWrapper onIntersect={loadMoreConvos} key={convoList.peerIds.length}>
            <Spinner size="regular" class="ConvoList__spinner" />
          </IntersectionWrapper>
        )}
      </div>
    </div>
  )
}, {
  props: ['compact']
})
