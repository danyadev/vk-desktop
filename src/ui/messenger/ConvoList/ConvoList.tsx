import { defineComponent, shallowRef } from 'vue'
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
import { ButtonIcon } from 'ui/ui/ButtonIcon/ButtonIcon'
import { IntersectionWrapper } from 'ui/ui/IntersectionWrapper/IntersectionWrapper'
import { LoadError } from 'ui/ui/LoadError/LoadError'
import { Popper } from 'ui/ui/Popper/Popper'
import { Spinner } from 'ui/ui/Spinner/Spinner'
import { Icon24DoorArrowRightOutline, Icon24GearOutline, Icon24MoreHorizontal } from 'assets/icons'
import './ConvoList.css'
import { useConvoList } from 'ui/messenger/ConvoList/useConvoList'

type Props = {
  class?: ClassName
  compact?: boolean
}

export const ConvoList = defineComponent<Props>((props) => {
  const { lang } = useEnv()
  const viewer = useViewer()
  const { connection } = useConvosStore()
  const { settingsModal } = useGlobalModal()
  const unread = shallowRef(false)
  const { convoList } = useConvoList(unread)

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
                withHoverBackground
                shiftOnClick
              />
            </Popper>
          </>
        )}
      </div>

      <div class="ConvoList__list">
        {convoList.convos.map((convo) => (
          <ConvoListItem key={convo.id} convo={convo} compact={props.compact} />
        ))}

        {convoList.convos.length === 0 && convoList.status === 'loaded' && (
          <div class="ConvoList__empty">
            {lang.use('me_convo_list_empty')}
          </div>
        )}

        {convoList.status === 'error' && <LoadError onRetry={loadMoreConvos} />}

        {convoList.status === 'hasMore' && (
          <IntersectionWrapper onIntersect={loadMoreConvos} key={convoList.convos.length}>
            <Spinner size="regular" class="ConvoList__spinner" />
          </IntersectionWrapper>
        )}
      </div>
    </div>
  )
}, {
  props: ['compact']
})
