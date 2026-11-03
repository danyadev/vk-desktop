import { useServices } from 'services'
import * as ConvoDraft from 'model/ConvoDraft'
import * as Message from 'model/Message'
import * as Peer from 'model/Peer'
import { useConvosStore } from 'store/convos'
import { insertPeers } from 'actions'
import { fromApiMessage } from 'converters/MessageConverter'
import { getMapValueOrCompute, isNonEmptyArray } from 'misc/utils'
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

      const forwards = draft.forwardedMessages
      const index = forwards?.findIndex((forward) => (
        forward.peerId === peerId && forward.cmid === cmid
      ))
      if (forwards && index !== undefined && index !== -1) {
        if (message?.kind === 'Normal') {
          forwards[index] = Message.toForeign(message)
        } else {
          forwards.splice(index, 1)
          if (forwards.length === 0) draft.forwardedMessages = undefined
        }
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

      if (draft.forwardedMessages) {
        const keptMessages = draft.forwardedMessages.filter((forward) => (
          forward.peerId !== peerId || forward.cmid === undefined || forward.cmid > upToCmid
        ))
        draft.forwardedMessages = isNonEmptyArray(keptMessages) ? keptMessages : undefined
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
      ...(convoDraft.forwardedMessages ?? []),
      convoDraft.editing?.message,
      convoDraft.editing?.previousDraft.replyMessage,
      ...(convoDraft.editing?.previousDraft.forwardedMessages ?? [])
    ]

    for (const message of messages) {
      if (!message?.peerId || !message.cmid) continue

      getMapValueOrCompute(messagesByPeer, message.peerId, () => new Set())
        .add(message.cmid)
    }
  }

  const requests = [...messagesByPeer].flatMap(([peerId, cmids]) => {
    const ids = [...cmids]
    const batches: Array<{ peerId: Peer.Id, cmids: Message.Cmid[] }> = []

    for (let i = 0; i < ids.length; i += 100) {
      batches.push({ peerId, cmids: ids.slice(i, i + 100) })
    }

    return batches
  })

  try {
    const responses = await api.fetchParallel(requests.map(({ peerId, cmids }) => (
      api.buildMethod('messages.getByConversationMessageId', {
        peer_id: peerId,
        conversation_message_ids: cmids.join(','),
        extended: 1,
        fields: PEER_FIELDS
      })
    )))

    responses.forEach(({ items, profiles, groups }, index) => {
      const { peerId, cmids } = requests[index]!
      insertPeers({ profiles, groups })

      const messages = new Map(items.map((message) => [
        Message.resolveCmid(message.conversation_message_id),
        message
      ]))

      for (const cmid of cmids) {
        const message = messages.get(cmid)
        syncDraftMessage(
          peerId,
          cmid,
          message && !message.deleted ? fromApiMessage(message) : undefined
        )
      }
    })
  } catch (error) {
    console.warn('[syncDraftsOnLoad] Failed to synchronize messages', error)
  }
}
