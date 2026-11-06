import { defineComponent, shallowRef, Transition, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useServices } from 'services'
import { useConvosStore } from 'store/convos'
import { useViewerStore } from 'store/viewer'
import { loadMoreConvos } from 'actions'
import { useConvoSearch, useGlobalModal, useKeyboardZones } from 'hooks'
import { ClassName } from 'misc/utils'
import { ConvoActionMenu } from 'ui/messenger/ConvoActionMenu/ConvoActionMenu'
import { SearchView } from 'ui/messenger/ConvoList/SearchView'
import { useConvoList } from 'ui/messenger/ConvoList/useConvoList'
import { ConvoListItem } from 'ui/messenger/ConvoListItem/ConvoListItem'
import { SyncStatus } from 'ui/messenger/SyncStatus/SyncStatus'
import { ActionMenu } from 'ui/ui/ActionMenu/ActionMenu'
import { ActionMenuItem } from 'ui/ui/ActionMenuItem/ActionMenuItem'
import { ButtonIcon } from 'ui/ui/ButtonIcon/ButtonIcon'
import { Input } from 'ui/ui/Input/Input'
import { IntersectionWrapper } from 'ui/ui/IntersectionWrapper/IntersectionWrapper'
import { LoadError } from 'ui/ui/LoadError/LoadError'
import { Popper } from 'ui/ui/Popper/Popper'
import { Spinner } from 'ui/ui/Spinner/Spinner'
import { Tabs } from 'ui/ui/Tabs/Tabs'
import { TabsItem } from 'ui/ui/TabsItem/TabsItem'
import {
  Icon20MenuOutline,
  Icon24ChevronCompactLeft,
  Icon24DoorArrowRightOutline,
  Icon24GearOutline
} from 'assets/icons'
import './ConvoList.css'

type Props = {
  class?: ClassName
  compact?: boolean
}

export const ConvoList = defineComponent<Props>((props) => {
  const { lang } = useServices()
  const route = useRoute()
  const { logout } = useViewerStore()
  const { lists } = useConvosStore()
  const { settingsModal } = useGlobalModal()
  const { registerZone } = useKeyboardZones()
  const computedConvoList = useConvoList()
  const search = useConvoSearch()
  const $convoList = shallowRef<HTMLElement | null>(null)
  const searchOpen = shallowRef(false)

  const openSearch = () => {
    if (props.compact) return
    searchOpen.value = true
  }

  const closeSearch = () => {
    searchOpen.value = false
    search.query.value = ''
  }

  watch(() => props.compact, (compact) => {
    if (compact) closeSearch()
  })

  registerZone('convoList', $convoList)

  return () => {
    const { convoList, list, selectList } = computedConvoList.value

    return (
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
              value={search.query.value}
              onClick={openSearch}
              onInput={(event) => {
                search.query.value = event.target.value
                if (event.target.value) openSearch()
              }}
              onKeydown={(event) => {
                if (event.key === 'Enter') openSearch()
                if (event.key !== 'Escape' || !searchOpen.value) return

                event.stopPropagation()
                if (search.query.value) search.query.value = ''
                else closeSearch()
              }}
            />
          )}
        </div>

        <div class="ConvoList__pages">
          <Transition name="ConvoList__page" css={!props.compact}>
            {searchOpen.value ? (
              <div class="ConvoList__page" key="search">
                <SearchView
                  class="ConvoList__searchList"
                  query={search.query.value}
                  status={search.status.value}
                  results={search.results.value}
                  onRetry={search.search}
                />
              </div>
            ) : (
              <div class="ConvoList__page" key="convos">
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
                    <ConvoActionMenu key={convo.id} convo={convo} fromConvoList>
                      <ConvoListItem convo={convo} compact={props.compact} />
                    </ConvoActionMenu>
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

                {!props.compact && <SyncStatus edge="top" show={route.name !== 'Convo'} />}
              </div>
            )}
          </Transition>
        </div>
      </div>
    )
  }
}, {
  props: ['compact']
})
