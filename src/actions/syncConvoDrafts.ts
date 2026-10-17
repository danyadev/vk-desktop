import * as Message from 'model/Message'
import * as Peer from 'model/Peer'
import { useConvosStore } from 'store/convos'

export function syncDraftMessage(
  peerId: Peer.Id,
  cmid: Message.Cmid,
  message: Message.Confirmed | undefined
) {
  const { convoDrafts } = useConvosStore()

  for (const draft of convoDrafts.values()) {
    const reply = draft.replyMessage
    if (reply?.peerId === peerId && reply.cmid === cmid) {
      draft.replyMessage = message?.kind === 'Normal'
        ? Message.toForeign(message)
        : undefined
    }
  }
}

export function syncDraftsOnHistoryClear(
  peerId: Peer.Id,
  upToCmid: Message.Cmid
) {
  const { convoDrafts } = useConvosStore()

  for (const draft of convoDrafts.values()) {
    const reply = draft.replyMessage
    if (reply?.peerId === peerId && reply.cmid !== undefined && reply.cmid <= upToCmid) {
      draft.replyMessage = undefined
    }
  }
}
