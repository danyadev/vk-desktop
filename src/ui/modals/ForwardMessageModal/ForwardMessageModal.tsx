import { defineComponent } from 'vue'
import { useRouter } from 'vue-router'
import { useServices } from 'services'
import * as Convo from 'model/Convo'
import * as ConvoDraft from 'model/ConvoDraft'
import * as Message from 'model/Message'
import { useConvosStore } from 'store/convos'
import { NonEmptyArray } from 'misc/utils'
import { ConvoSelectModal } from 'ui/modals/ConvoSelectModal/ConvoSelectModal'

type Props = {
  opened: boolean
  onClose: () => void
  onSelect?: () => void
  messages: NonEmptyArray<Message.Foreign>
}

export const ForwardMessageModal = defineComponent<Props>((props) => {
  const router = useRouter()
  const { lang } = useServices()
  const { convoDrafts } = useConvosStore()

  const onSelect = (convo: Convo.Convo) => {
    const convoDraft = ConvoDraft.safeGet(convoDrafts, convo.id)
    // As we can't set different forwarded messages when editing, apply them only on normal draft
    const draft = convoDraft.editing?.previousDraft ?? convoDraft

    draft.replyMessage = undefined
    draft.forwardedMessages = props.messages
    ConvoDraft.touch(draft)

    props.onSelect?.()
    props.onClose()

    const route = router.currentRoute.value
    if (route.name !== 'Convo' || Number(route.params.peerId) !== convo.id) {
      router.push({
        name: 'Convo',
        params: { peerId: convo.id },
        query: { canGoBack: 1 }
      })
    }
  }

  const getDisabledReason = (convo: Convo.Convo) => {
    if (convo.kind === 'ChatConvo' && convo.status === 'kicked') {
      return lang.use('me_chat_kicked_status')
    }
    if (!convo.canWrite.allowed) return lang.use('forwardMessageModal_cannot_write')
  }

  return () => (
    <ConvoSelectModal
      opened={props.opened}
      onClose={props.onClose}
      title={lang.use('forwardMessageModal_title')}
      onSelect={onSelect}
      getDisabledReason={getDisabledReason}
    />
  )
}, {
  props: ['opened', 'onClose', 'onSelect', 'messages']
})
