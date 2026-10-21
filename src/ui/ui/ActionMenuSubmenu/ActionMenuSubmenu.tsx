import { defineComponent } from 'vue'
import { ActionMenuItem, ActionMenuItemProps } from 'ui/ui/ActionMenuItem/ActionMenuItem'
import { Popper } from 'ui/ui/Popper/Popper'
import { Icon16ChevronRight } from 'assets/icons'

type Props = Omit<ActionMenuItemProps, 'after'>

export const ActionMenuSubmenu = defineComponent<Props>((props, { slots, attrs }) => {
  return () => (
    <Popper
      showOnHover
      closeOnContentClick
      placement="right-start"
      offset={0}
      content={slots.default?.()}
    >
      <ActionMenuItem
        {...attrs as Props}
        after={<Icon16ChevronRight color="var(--vkui--color_icon_secondary)" />}
      />
    </Popper>
  )
}, {
  inheritAttrs: false
})
