import {
  Comment,
  defineComponent,
  HTMLAttributes,
  KeepAlive,
  nextTick,
  onMounted,
  shallowRef,
  Transition,
  VNode,
  watch
} from 'vue'
import { TabPage } from 'ui/ui/TabPage/TabPage'
import { Tabs } from 'ui/ui/Tabs/Tabs'
import { TabsItem } from 'ui/ui/TabsItem/TabsItem'
import './TabView.css'

type TabKey = NonNullable<VNode['key']>

type Props = {
  wide?: boolean
  keepAlive?: boolean
  noTabs?: boolean
  noAnimation?: boolean
  /** Optional alternative source of truth */
  selectedTab?: TabKey
  onTabChange?: (tab: TabKey) => void
} & HTMLAttributes

export const TabView = defineComponent<Props>((props, { slots }) => {
  const selectedTab = shallowRef<TabKey | undefined>(props.selectedTab)
  const animateForward = shallowRef(true)
  const $indicator = shallowRef<HTMLElement | null>(null)
  let tabs: TabKey[] = []
  let lastTabIndex = 0

  watch(() => props.selectedTab, (tab) => {
    selectedTab.value = tab
  }, { flush: 'sync' })

  watch(selectedTab, (tab) => {
    const tabIndex = tabs.indexOf(tab!)
    if (tabIndex !== -1) {
      animateForward.value = tabIndex > lastTabIndex
      lastTabIndex = tabIndex
    }
    if (tab !== undefined) {
      props.onTabChange?.(tab)
    }
  }, { flush: 'sync' })

  onMounted(() => {
    lastTabIndex = tabs.indexOf(selectedTab.value!)
  })

  const select = async (tab: TabKey) => {
    if (selectedTab.value === tab) return

    const indicator = $indicator.value
    const from = indicator?.getBoundingClientRect()
    if (!indicator || !from) return

    indicator.getAnimations().forEach((animation) => animation.cancel())
    selectedTab.value = tab

    await nextTick()

    const to = indicator.getBoundingClientRect()
    indicator.animate([
      { transform: `translateX(${from.left - to.left}px)`, width: `${from.width}px` },
      { transform: 'none', width: `${to.width}px` }
    ], { duration: 200, easing: 'cubic-bezier(0.2, 0, 0, 1)' })
  }

  return () => {
    const children: VNode[] = []
    let tabContent: VNode | undefined
    for (const vnode of slots.default?.() ?? []) {
      if (vnode.type === Comment) continue
      if (vnode.type !== TabPage || vnode.key === null || vnode.key === undefined) {
        throw new Error('TabView expects keyed TabPage children')
      }
      if (vnode.key === selectedTab.value) {
        tabContent = vnode
      }
      children.push(vnode)
    }
    tabs = children.map((vnode) => vnode.key!)

    if (children.length === 0) {
      return null
    }
    if (!tabContent) {
      selectedTab.value = tabs[0]!
      tabContent = children[0]!
    }

    return (
      <div
        class={['TabView', {
          'TabView--wide': props.wide,
          'TabView--animateForward': animateForward.value
        }]}
      >
        {!props.noTabs && (
          <Tabs wide={props.wide} class="TabView__tabs" role="tablist">
            <div class="TabView__indicator" ref={$indicator} />

            {children.map((page) => (
              <TabsItem
                key={page.key!}
                role="tab"
                active={page.key === selectedTab.value}
                aria-selected={page.key === selectedTab.value}
                onClick={() => select(page.key!)}
              >
                {page.props!.title}
              </TabsItem>
            ))}
          </Tabs>
        )}

        <div class="TabView__pages">
          <Transition name="TabView__page" css={!props.noAnimation}>
            {props.keepAlive ? <KeepAlive>{tabContent}</KeepAlive> : tabContent}
          </Transition>
        </div>
      </div>
    )
  }
}, {
  props: ['wide', 'keepAlive', 'noTabs', 'noAnimation', 'selectedTab', 'onTabChange']
})
