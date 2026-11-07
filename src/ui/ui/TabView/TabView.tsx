import { defineComponent, HTMLAttributes, KeepAlive, shallowRef, Transition, VNode } from 'vue'
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

    const select = (index: number) => {
      if (index === selectedIndex) return
      animateForward.value = index > selectedIndex
      selectedKey.value = pages[index]!.key
    }

    const currentPage = pages[selectedIndex]
    const content = props.keepAlive ? <KeepAlive>{currentPage}</KeepAlive> : currentPage

    return (
      <div
        class={['TabView', {
          'TabView--wide': props.wide,
          'TabView--animateForward': animateForward.value
        }]}
        style={props.wide ? {
          '--tab-count': pages.length,
          '--tab-gap-total': `${(pages.length - 1) * 6}px`,
          '--tab-offset': `${selectedIndex * 100}%`,
          '--tab-gap-offset': `${selectedIndex * 6}px`
        } : undefined}
      >
        <Tabs wide={props.wide} class="TabView__tabs" role="tablist">
          {pages.map((page, index) => (
            <TabsItem
              key={page.key!}
              active={index === selectedIndex}
              role="tab"
              tabindex={index === selectedIndex ? 0 : -1}
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
