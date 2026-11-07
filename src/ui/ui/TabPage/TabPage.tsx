import { defineComponent } from 'vue'

type Props = {
  title: string
}

export const TabPage = defineComponent<Props>((props, { slots }) => () => (
  <div class="TabView__page" role="tabpanel" aria-label={props.title} tabindex={0}>
    {slots.default?.()}
  </div>
), {
  props: ['title']
})
