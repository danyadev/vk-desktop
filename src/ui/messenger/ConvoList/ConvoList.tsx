import { defineComponent, KeepAlive, shallowRef, Transition, watch } from 'vue'
import { useServices } from 'services'
import { useViewerStore } from 'store/viewer'
import { useGlobalModal, useKeyboardZones } from 'hooks'
import { ClassName } from 'misc/utils'
import { ConvoListPage } from 'ui/messenger/ConvoList/ConvoListPage'
import { ConvoSearchPage } from 'ui/messenger/ConvoList/ConvoSearchPage'
import { MessageSearchPage } from 'ui/messenger/ConvoList/MessageSearchPage'
import { ActionMenu } from 'ui/ui/ActionMenu/ActionMenu'
import { ActionMenuItem } from 'ui/ui/ActionMenuItem/ActionMenuItem'
import { ButtonIcon } from 'ui/ui/ButtonIcon/ButtonIcon'
import { Input } from 'ui/ui/Input/Input'
import { Popper } from 'ui/ui/Popper/Popper'
import { TabPage } from 'ui/ui/TabPage/TabPage'
import { TabView } from 'ui/ui/TabView/TabView'
import {
  Icon20MenuOutline,
  Icon24ChevronCompactLeft,
  Icon24DoorArrowRightOutline,
  Icon24GearOutline
} from 'assets/icons'
import './ConvoList.css'
import './SearchPage.css'

type Props = {
  class?: ClassName
  compact?: boolean
}

export const ConvoList = defineComponent<Props>((props) => {
  const { lang } = useServices()
  const { logout } = useViewerStore()
  const { settingsModal } = useGlobalModal()
  const { registerZone } = useKeyboardZones()
  const query = shallowRef('')
  const $convoList = shallowRef<HTMLElement | null>(null)
  const searchOpen = shallowRef(false)

  const openSearch = () => {
    if (props.compact) return
    searchOpen.value = true
  }

  const closeSearch = () => {
    searchOpen.value = false
    query.value = ''
  }

  watch(() => props.compact, (compact) => {
    if (compact) closeSearch()
  })

  registerZone('convoList', $convoList)

  return () => (
    <div
      ref={$convoList}
      tabindex={-1}
      class={['ConvoList', {
        'ConvoList--compact': props.compact,
        'ConvoList--searchOpen': searchOpen.value
      }]}
    >
      <div class="ConvoList__header">
        <Popper
          disabled={searchOpen.value}
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
            class="ConvoList__headerAction"
            icon={
              <Transition name="ConvoList__headerActionIcon" mode="out-in">
                {searchOpen.value
                  ? <Icon24ChevronCompactLeft key="back" />
                  : <Icon20MenuOutline key="menu" />}
              </Transition>
            }
            withHoverBackground
            shiftOnClick
            onClick={searchOpen.value ? closeSearch : undefined}
          />
        </Popper>

        {!props.compact && (
          <Input
            class="ConvoList__searchInput"
            mode="search"
            size="small"
            placeholder={lang.use('input_search')}
            value={query.value}
            onClick={openSearch}
            onInput={(event) => {
              query.value = event.target.value
              if (event.target.value) openSearch()
            }}
            onKeydown={(event) => {
              if (event.key === 'Enter') openSearch()
              if (event.key !== 'Escape' || !searchOpen.value) return

              event.stopPropagation()
              if (query.value) query.value = ''
              else closeSearch()
            }}
          />
        )}
      </div>

      <div class="ConvoList__pages">
        <Transition name="ConvoList__page" css={!props.compact}>
          <KeepAlive>
            {searchOpen.value ? (
              <TabView key="search" class={['ConvoList__page', 'SearchPage']} wide keepAlive>
                <TabPage key="convos" title={lang.use('me_convo_list_search_convos')}>
                  <ConvoSearchPage query={query.value} />
                </TabPage>
                <TabPage key="messages" title={lang.use('me_convo_list_search_messages')}>
                  <MessageSearchPage query={query.value} />
                </TabPage>
              </TabView>
            ) : (
              <ConvoListPage key="convos" compact={props.compact} />
            )}
          </KeepAlive>
        </Transition>
      </div>
    </div>
  )
}, {
  props: ['compact']
})
