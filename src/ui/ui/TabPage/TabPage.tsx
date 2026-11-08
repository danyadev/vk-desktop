import { defineComponent } from 'vue'

type Props = {
  /** See TabView for this prop usage */
  title: string
}

export const TabPage = defineComponent<Props>((props, { slots }) => () => (
  <div class="TabView__page" role="tabpanel" aria-label={props.title}>
    {slots.default?.()}
  </div>
), {
  props: ['title']
})
