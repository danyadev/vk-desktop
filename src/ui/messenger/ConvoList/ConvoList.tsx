import { defineComponent } from 'vue'
import { useServices } from 'services'
import * as Peer from 'model/Peer'
import { useConvosStore } from 'store/convos'
import { useViewerStore } from 'store/viewer'
import { loadMoreConvos } from 'actions'
import { useGlobalModal, useViewer } from 'hooks'
import { ClassName } from 'misc/utils'
import { useConvoList } from 'ui/messenger/ConvoList/useConvoList'
import { ConvoListItem } from 'ui/messenger/ConvoListItem/ConvoListItem'
import { ActionMenu } from 'ui/ui/ActionMenu/ActionMenu'
import { ActionMenuItem } from 'ui/ui/ActionMenuItem/ActionMenuItem'
import { Avatar } from 'ui/ui/Avatar/Avatar'
import { ButtonIcon } from 'ui/ui/ButtonIcon/ButtonIcon'
import { IntersectionWrapper } from 'ui/ui/IntersectionWrapper/IntersectionWrapper'
import { LoadError } from 'ui/ui/LoadError/LoadError'
import { Popper } from 'ui/ui/Popper/Popper'
import { Spinner } from 'ui/ui/Spinner/Spinner'
import { Tabs } from 'ui/ui/Tabs/Tabs'
import { TabsItem } from 'ui/ui/TabsItem/TabsItem'
import { Icon24DoorArrowRightOutline, Icon24GearOutline, Icon24MoreHorizontal } from 'assets/icons'
import './ConvoList.css'

type Props = {
  class?: ClassName
  compact?: boolean
}

export const ConvoList = defineComponent<Props>((props) => {
  const { lang } = useServices()
  const viewer = useViewer()
  const { logout } = useViewerStore()
  const { connection, lists } = useConvosStore()
  const { settingsModal } = useGlobalModal()
  const computedConvoList = useConvoList()

  return () => {
    const { convoList, list, selectList } = computedConvoList.value

    return (
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
                      icon={<Icon24GearOutline />}
                      text={lang.use('me_convo_list_menu_settings')}
                      onClick={() => settingsModal.open({})}
                    />
                    <ActionMenuItem
                      mode="destructive"
                      icon={<Icon24DoorArrowRightOutline />}
                      text={lang.use('me_convo_list_menu_logout')}
                      onClick={logout}
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

        {!props.compact && (
          <Tabs class="ConvoList__folders">
            {[lists.main, lists.unread, lists.archive].map((listItem) => (
              <TabsItem
                active={list.name === listItem.name}
                onClick={() => selectList({ name: listItem.name })}
              >
                {listItem.name}
              </TabsItem>
            ))}
          </Tabs>
        )}

        <div class="ConvoList__list">
          {convoList.map((convo) => (
            <ConvoListItem key={convo.id} convo={convo} compact={props.compact} />
          ))}

          {convoList.length === 0 && list.status === 'complete' && (
            <div class="ConvoList__empty">
              {lang.use('me_convo_list_empty')}
            </div>
          )}

          {list.status === 'error' && <LoadError onRetry={() => loadMoreConvos(list)} />}

          {(list.status === 'loading' || list.status === 'hasMore') && (
            <IntersectionWrapper
              onIntersect={() => loadMoreConvos(list)}
              key={convoList.length}
            >
              <Spinner size="regular" class="ConvoList__spinner" />
            </IntersectionWrapper>
          )}
        </div>
      </div>
    )
  }
}, {
  props: ['compact']
})
