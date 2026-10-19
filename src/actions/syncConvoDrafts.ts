import { useServices } from 'services'
import * as ConvoDraft from 'model/ConvoDraft'
import * as Message from 'model/Message'
import * as Peer from 'model/Peer'
import { useConvosStore } from 'store/convos'
import { insertPeers } from 'actions'
import { fromApiMessage } from 'converters/MessageConverter'
import { getMapValueOrCompute } from 'misc/utils'
import { PEER_FIELDS } from 'misc/constants'

export function syncDraftMessage(
  peerId: Peer.Id,
  cmid: Message.Cmid,
  message: Message.Confirmed | undefined
) {
  const { convoDrafts } = useConvosStore()

  for (const convoDraft of convoDrafts.values()) {
    const { editing } = convoDraft
    if (editing?.message.peerId === peerId && editing.message.cmid === cmid) {
      if (message?.kind === 'Normal') {
        editing.message = message
      } else {
        ConvoDraft.finishEditing(convoDraft)
      }
    }

    for (const draft of [convoDraft, convoDraft.editing?.previousDraft]) {
      if (!draft) continue
      const reply = draft.replyMessage
      if (reply?.peerId === peerId && reply.cmid === cmid) {
        draft.replyMessage = message?.kind === 'Normal'
          ? Message.toForeign(message)
          : undefined
      }
    }
  }
}

export function syncDraftsOnHistoryClear(
  peerId: Peer.Id,
  upToCmid: Message.Cmid
) {
  const { convoDrafts } = useConvosStore()

  for (const convoDraft of convoDrafts.values()) {
    const editingMessage = convoDraft.editing?.message
    if (editingMessage?.peerId === peerId && editingMessage.cmid <= upToCmid) {
      ConvoDraft.finishEditing(convoDraft)
    }

    for (const draft of [convoDraft, convoDraft.editing?.previousDraft]) {
      if (!draft) continue
      const reply = draft.replyMessage
      if (reply?.peerId === peerId && reply.cmid !== undefined && reply.cmid <= upToCmid) {
        draft.replyMessage = undefined
      }
    }
  }
}

export async function syncDraftsOnLoad() {
  const { api } = useServices()
  const { convoDrafts } = useConvosStore()

  const messagesByPeer = new Map<Peer.Id, Set<Message.Cmid>>()

  for (const convoDraft of convoDrafts.values()) {
    const messages = [
      convoDraft.replyMessage,
      convoDraft.editing?.message,
      convoDraft.editing?.previousDraft.replyMessage
    ]

    for (const message of messages) {
      if (!message?.peerId || !message.cmid) continue

      getMapValueOrCompute(messagesByPeer, message.peerId, () => new Set())
        .add(message.cmid)
    }
  }

  await Promise.all([...messagesByPeer].map(async ([peerId, cmids]) => {
    try {
      const {
        items: apiMessages,
        profiles,
        groups
      } = await api.fetch('messages.getByConversationMessageId', {
        peer_id: peerId,
        conversation_message_ids: [...cmids].join(','),
        extended: 1,
        fields: PEER_FIELDS
      })

      insertPeers({ profiles, groups })

      const messages = new Map(apiMessages.map((apiMessage) => [
        Message.resolveCmid(apiMessage.conversation_message_id),
        apiMessage
      ]))

      for (const cmid of cmids) {
        const apiMessage = messages.get(cmid)

        syncDraftMessage(
          peerId,
          cmid,
          apiMessage && !apiMessage.deleted
            ? fromApiMessage(apiMessage)
            : undefined
        )
      }
    } catch (error) {
      console.warn('[syncDraftsOnLoad] Failed to synchronize messages', peerId, error)
    }
  }))
}
