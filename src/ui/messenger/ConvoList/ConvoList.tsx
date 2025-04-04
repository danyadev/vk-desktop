import { defineComponent } from 'vue'
import * as Convo from 'model/Convo'
import * as Peer from 'model/Peer'
import { useConvosStore } from 'store/convos'
import { logout } from 'store/viewer'
import { loadMoreConvos } from 'actions'
import { useEnv, useGlobalModal, useViewer } from 'hooks'
import { ClassName } from 'misc/utils'
import { ConvoListItem } from 'ui/messenger/ConvoListItem/ConvoListItem'
import { ActionMenu } from 'ui/ui/ActionMenu/ActionMenu'
import { ActionMenuItem } from 'ui/ui/ActionMenuItem/ActionMenuItem'
import { Avatar } from 'ui/ui/Avatar/Avatar'
import { Button } from 'ui/ui/Button/Button'
import { ButtonIcon } from 'ui/ui/ButtonIcon/ButtonIcon'
import { IntersectionWrapper } from 'ui/ui/IntersectionWrapper/IntersectionWrapper'
import { Popper } from 'ui/ui/Popper/Popper'
import { Spinner } from 'ui/ui/Spinner/Spinner'
import { Icon24DoorArrowRightOutline, Icon24GearOutline, Icon24MoreHorizontal } from 'assets/icons'
import './ConvoList.css'

type Props = {
  class?: ClassName
  compact?: boolean
}

export const ConvoList = defineComponent<Props>((props) => {
  const { lang } = useEnv()
  const viewer = useViewer()
  const { convoList, connection } = useConvosStore()
  const { settingsModal } = useGlobalModal()

  return () => (
    <div class={['ConvoList', { 'ConvoList--compact': props.compact }]}>
      <div class="ConvoList__header">
        <Avatar class="ConvoList__headerAvatar" peer={viewer} size={32} />

        {!props.compact && (
          <>
            <span class="ConvoList__headerName">{Peer.name(viewer)}</span>
            <span class="ConvoList__headerStatus">{connection.status}</span>

            <Popper
              closeOnContentClick
              content={
                <ActionMenu>
                  <ActionMenuItem
                    onClick={() => settingsModal.open({})}
                    text="Настройки"
                    icon={
                      <Icon24GearOutline
                        width="20"
                        color="var(--vkui--color_icon_secondary)"
                      />
                    }
                  />
                  <ActionMenuItem
                    onClick={logout}
                    text="Выход"
                    icon={
                      <Icon24DoorArrowRightOutline
                        width="20"
                        color="var(--vkui--color_icon_negative)"
                      />
                    }
                  />
                </ActionMenu>
              }
            >
              <ButtonIcon
                class="ConvoList__burgerMenu"
                icon={<Icon24MoreHorizontal color="var(--vkui--color_icon_secondary)" />}
                shiftOnClick
              />
            </Popper>
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
