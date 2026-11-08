import {
  defineComponent,
  HTMLAttributes,
  KeepAlive,
  nextTick,
  shallowRef,
  Transition,
  VNode
} from 'vue'
import { TabPage } from 'ui/ui/TabPage/TabPage'
import { Tabs } from 'ui/ui/Tabs/Tabs'
import { TabsItem } from 'ui/ui/TabsItem/TabsItem'
import './TabView.css'

type Props = {
  wide?: boolean
  keepAlive?: boolean
} & HTMLAttributes

export const TabView = defineComponent<Props>((props, { slots }) => {
  const selectedKey = shallowRef<VNode['key']>()
  const animateForward = shallowRef(true)
  const $indicator = shallowRef<HTMLElement | null>(null)

  return () => {
    const pages = slots.default?.() ?? []
    const keys = new Set<VNode['key']>()

    for (const page of pages) {
      if (page.type !== TabPage || page.key === null || page.key === undefined) {
        throw new Error('TabView expects keyed TabPage children')
      }
      if (keys.has(page.key)) {
        throw new Error(`Duplicate TabPage key: ${String(page.key)}`)
      }
      keys.add(page.key)
    }

    if (pages.length === 0) return null

    const selectedIndex = Math.max(0, pages.findIndex((page) => page.key === selectedKey.value))

    const select = async (index: number) => {
      if (index === selectedIndex) return

      const indicator = $indicator.value
      const from = indicator?.getBoundingClientRect()
      if (!indicator || !from) return

      indicator.getAnimations().forEach((animation) => animation.cancel())
      animateForward.value = index > selectedIndex
      selectedKey.value = pages[index]!.key

      await nextTick()

      const to = indicator.getBoundingClientRect()
      indicator.animate([
        { transform: `translateX(${from.left - to.left}px)`, width: `${from.width}px` },
        { transform: 'none', width: `${to.width}px` }
      ], { duration: 200, easing: 'cubic-bezier(0.2, 0, 0, 1)' })
    }

    const currentPage = pages[selectedIndex]
    const content = props.keepAlive ? <KeepAlive>{currentPage}</KeepAlive> : currentPage

    return (
      <div
        class={['TabView', {
          'TabView--wide': props.wide,
          'TabView--animateForward': animateForward.value
        }]}
      >
        <Tabs wide={props.wide} class="TabView__tabs" role="tablist">
          <div class="TabView__indicator" ref={$indicator} />

          {pages.map((page, index) => (
            <TabsItem
              key={page.key!}
              active={index === selectedIndex}
              role="tab"
              aria-selected={index === selectedIndex}
              onClick={() => select(index)}
            >
              {page.props!.title}
            </TabsItem>
          ))}
        </Tabs>

        <div class="TabView__pages">
          <Transition name="TabView__page">
            {content}
          </Transition>
        </div>
      </div>
    )
  }
}, {
  props: ['wide', 'keepAlive']
})
