import { defineComponent, KeepAlive, shallowRef, Transition, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useServices } from 'services'
import { useViewerStore } from 'store/viewer'
import { useGlobalModal, useKeyboardZones } from 'hooks'
import { ClassName } from 'misc/utils'
import { ConvoListView } from 'ui/messenger/ConvoListView/ConvoListView'
import { SearchView } from 'ui/messenger/SearchView/SearchView'
import { SyncStatus } from 'ui/messenger/SyncStatus/SyncStatus'
import { ActionMenu } from 'ui/ui/ActionMenu/ActionMenu'
import { ActionMenuItem } from 'ui/ui/ActionMenuItem/ActionMenuItem'
import { ButtonIcon } from 'ui/ui/ButtonIcon/ButtonIcon'
import { Input } from 'ui/ui/Input/Input'
import { Popper } from 'ui/ui/Popper/Popper'
import {
  Icon20MenuOutline,
  Icon24ChevronCompactLeft,
  Icon24DoorArrowRightOutline,
  Icon24GearOutline
} from 'assets/icons'
import './ConvoListPane.css'

type Props = {
  class?: ClassName
  compact?: boolean
}

export const ConvoListPane = defineComponent<Props>((props) => {
  const { lang } = useServices()
  const route = useRoute()
  const { logout } = useViewerStore()
  const { settingsModal } = useGlobalModal()
  const { registerZone } = useKeyboardZones()

  const $pane = shallowRef<HTMLElement | null>(null)
  const searchOpen = shallowRef(false)
  const searchQuery = shallowRef('')

  const openSearch = () => {
    if (props.compact) return
    searchOpen.value = true
  }

  const closeSearch = () => {
    searchOpen.value = false
    searchQuery.value = ''
  }

  watch(() => props.compact, (compact) => {
    if (compact) closeSearch()
  })

  registerZone('convoList', $pane)

  return () => (
    <div
      ref={$pane}
      tabindex={-1}
      class={['ConvoListPane', {
        'ConvoListPane--compact': props.compact,
        'ConvoListPane--searchOpen': searchOpen.value
      }]}
    >
      <div class="ConvoListPane__header">
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
            class="ConvoListPane__headerAction"
            icon={
              <Transition name="ConvoListPane__headerActionIcon" mode="out-in">
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
            class="ConvoListPane__searchInput"
            mode="search"
            size="small"
            placeholder={lang.use('input_search')}
            value={searchQuery.value}
            onClick={openSearch}
            onInput={(event) => {
              searchQuery.value = event.target.value
              if (event.target.value) openSearch()
            }}
            onKeydown={(event) => {
              if (event.key === 'Enter') openSearch()
              if (event.key !== 'Escape' || !searchOpen.value) return

              event.stopPropagation()
              if (searchQuery.value) searchQuery.value = ''
              else closeSearch()
            }}
          />
        )}
      </div>

      <div class="ConvoListPane__pages">
        <Transition name="ConvoListPane__page" css={!props.compact}>
          <KeepAlive>
            {searchOpen.value ? (
              <SearchView key="search" class="ConvoListPane__page" query={searchQuery.value} />
            ) : (
              <ConvoListView key="convos" class="ConvoListPane__page" compact={props.compact} />
            )}
          </KeepAlive>
        </Transition>
      </div>

      {!props.compact && (
        <SyncStatus edge="top" show={!searchOpen.value && route.name !== 'Convo'} />
      )}
    </div>
  )
}, {
  props: ['compact']
})
