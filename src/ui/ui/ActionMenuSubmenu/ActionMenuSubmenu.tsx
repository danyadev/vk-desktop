import { defineComponent } from 'vue'
import { ActionMenuItem, ActionMenuItemProps } from 'ui/ui/ActionMenuItem/ActionMenuItem'
import { Popper } from 'ui/ui/Popper/Popper'
import { Icon16ChevronRight } from 'assets/icons'

type InheritedProps = Omit<ActionMenuItemProps, 'after'>
type Props = {
  disabledMenu?: boolean
} & InheritedProps

export const ActionMenuSubmenu = defineComponent<Props>((props, { slots, attrs }) => {
  return () => (
    <Popper
      showOnHover
      placement="right-start"
      offset={0}
      content={slots.default?.()}
      disabled={props.disabledMenu}
      nested
    >
      <ActionMenuItem
        {...attrs as InheritedProps}
        after={!props.disabledMenu && (
          <Icon16ChevronRight color="var(--vkui--color_icon_secondary)" />
        )}
      />
    </Popper>
  )
}, {
  props: ['disabledMenu'],
  inheritAttrs: false
})
