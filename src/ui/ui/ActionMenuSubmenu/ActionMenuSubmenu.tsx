import { defineComponent, shallowRef, Transition } from 'vue'
import { flip, offset, shift } from '@floating-ui/dom'
import { JSXElement } from 'misc/utils'
import { ActionMenuItem } from 'ui/ui/ActionMenuItem/ActionMenuItem'
import { useFloatingUI } from 'ui/ui/Popper/useFloatingUI'
import { Icon16ChevronRight } from 'assets/icons'
import './ActionMenuSubmenu.css'

type Props = {
  icon?: JSXElement
  text: string
  disabled?: boolean
  loading?: boolean
  onClick?: () => void
}

export const ActionMenuSubmenu = defineComponent<Props>((props, { slots }) => {
  const opened = shallowRef(false)
  const { setTriggerRef, setContentRef } = useFloatingUI({
    placement: 'right-start',
    middleware: [offset(0), flip({ padding: 8 }), shift({ padding: 8, crossAxis: true })]
  })

  return () => (
    <div
      ref={setTriggerRef}
      class="ActionMenuSubmenu"
      onMouseenter={() => !props.disabled && !props.loading && (opened.value = true)}
      onMouseleave={() => (opened.value = false)}
    >
      <ActionMenuItem
        icon={props.icon}
        text={props.text}
        disabled={props.disabled}
        loading={props.loading}
        after={
          <Icon16ChevronRight
            width={20}
            height={20}
            color="var(--vkui--color_icon_secondary)"
          />
        }
        onClick={() => (opened.value = true)}
      />
      <Transition name="ActionMenuSubmenu-">
        {opened.value && (
          <div ref={setContentRef} class="ActionMenuSubmenu__content">
            {slots.default?.()}
          </div>
        )}
      </Transition>
    </div>
  )
}, {
  props: ['icon', 'text', 'disabled', 'loading', 'onClick']
})
