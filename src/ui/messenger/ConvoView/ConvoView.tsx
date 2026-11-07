import { defineComponent, shallowRef } from 'vue'
import * as Convo from 'model/Convo'
import { useConvosStore } from 'store/convos'
import { provideConvoSession, useGlobalModal, useKeyboardZones } from 'hooks'
import { ConvoFooter } from 'ui/messenger/ConvoFooter/ConvoFooter'
import { ConvoHeader } from 'ui/messenger/ConvoHeader/ConvoHeader'
import { ConvoHistory } from 'ui/messenger/ConvoHistory/ConvoHistory'
import { PinnedMessage } from 'ui/messenger/PinnedMessage/PinnedMessage'
import { SyncStatus } from 'ui/messenger/SyncStatus/SyncStatus'
import './ConvoView.css'

type ConvoViewProps = {
  convo: Convo.Convo
}

export const ConvoView = defineComponent<ConvoViewProps>((props) => {
  const convosStore = useConvosStore()
  const { messageViewerModal } = useGlobalModal()
  const { registerZone } = useKeyboardZones()
  const $convoView = shallowRef<HTMLElement | null>(null)

  const session = convosStore.getDefaultSession(props.convo.id, props.convo.inReadBy)
  provideConvoSession(session)
  registerZone('convoView', $convoView)

  return () => {
    const pinnedMessage = props.convo.kind === 'ChatConvo' && props.convo.pinnedMessage
    const hiddenPinnedMessageCmid = convosStore.hiddenPinnedMessages.get(props.convo.id)

    return (
      <div class="ConvoView" ref={$convoView} tabindex={-1}>
        <ConvoHeader convo={props.convo} />
        {pinnedMessage && pinnedMessage.cmid !== hiddenPinnedMessageCmid && (
          <PinnedMessage
            pinnedMessage={pinnedMessage}
            onClick={() => {
              if (pinnedMessage.isUnavailable) {
                messageViewerModal.open({
                  peerId: props.convo.id,
                  cmid: pinnedMessage.cmid
                })
                return
              }
              session.navigationRequest = {
                kind: 'Message',
                cmid: pinnedMessage.cmid
              }
            }}
          />
        )}
        <SyncStatus edge="bottom" />
        <ConvoHistory convo={props.convo} />
        <ConvoFooter convo={props.convo} />
      </div>
    )
  }
}, {
  props: ['convo']
})
