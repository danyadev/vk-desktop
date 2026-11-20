import { defineComponent, onActivated } from 'vue'

type Props = {
  /** See TabView for this prop usage */
  title: string
}

export const TabPage = defineComponent<Props>((props, { slots }) => {
  let scrollElement: HTMLElement | undefined
  let scrollTop = 0

  onActivated(() => {
    if (scrollElement?.isConnected) {
      scrollElement.scrollTop = scrollTop
    }
  })

  const onScroll = (event: Event) => {
    const element = event.target
    if (!(element instanceof HTMLElement)) return

    scrollElement = element
    scrollTop = element.scrollTop
  }

  return () => (
    <div class="TabView__page" role="tabpanel" onScrollCapture={onScroll}>
      {slots.default?.()}
    </div>
  )
}, {
  props: ['title']
})
