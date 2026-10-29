import { defineComponent } from 'vue'
import { useServices } from 'services'
import * as Convo from 'model/Convo'
import { useConvoSession } from 'hooks'
import { ConvoComposer } from 'ui/messenger/ConvoComposer/ConvoComposer'
import { ConvoMuteChannelButton } from 'ui/messenger/ConvoFooter/ConvoMuteChannelButton'
import { ConvoSelectionToolbar } from 'ui/messenger/ConvoFooter/ConvoSelectionToolbar'
import { AutoHeightTransition } from 'ui/ui/AutoHeightTransition/AutoHeightTransition'
import { Icon24Info } from 'assets/icons'
import './ConvoFooter.css'

type Props = {
  convo: Convo.Convo
}

export const ConvoFooter = defineComponent<Props>((props) => {
  const { lang } = useServices()
  const session = useConvoSession()

  const renderPanel = () => {
    if (session.selectedCmids.size > 0) {
      return <ConvoSelectionToolbar />
    }

    if (props.convo.kind === 'ChatConvo' && props.convo.status === 'kicked') {
      return (
        <div class="ConvoFooter__panel" key="restriction">
          <Icon24Info color="var(--vkui--color_accent_orange)" />
          {lang.use('me_chat_kicked_status')}
        </div>
      )
    }

    if (Convo.isChannel(props.convo)) {
      return (
        <div class="ConvoFooter__panel" key="channel">
          <ConvoMuteChannelButton convo={props.convo} />
        </div>
      )
    }

    return <ConvoComposer convo={props.convo} />
  }

  return () => (
    <AutoHeightTransition class="ConvoFooter" anchor="bottom">
      {renderPanel()}
    </AutoHeightTransition>
  )
}, {
  props: ['convo']
})
