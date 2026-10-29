import { defineComponent } from 'vue'
import { useServices } from 'services'
import { useConvoSession } from 'hooks'
import { ButtonIcon } from 'ui/ui/ButtonIcon/ButtonIcon'
import { Icon24Cancel } from 'assets/icons'
import './ConvoSelectionToolbar.css'

export const ConvoSelectionToolbar = defineComponent(() => {
  const { lang } = useServices()
  const session = useConvoSession()

  return () => (
    <div class="ConvoSelectionToolbar">
      <ButtonIcon
        class="ConvoSelectionToolbar__cancel"
        icon={<Icon24Cancel />}
        withHoverBackground
        onClick={() => session.selectedCmids.clear()}
      />
      <span>
        {lang.usePlural('me_message_selection_count', session.selectedCmids.size, {
          count: session.selectedCmids.size
        })}
      </span>
    </div>
  )
})
