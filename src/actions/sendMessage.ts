import * as Attach from 'model/Attach'
import * as Convo from 'model/Convo'
import * as Message from 'model/Message'
import * as Peer from 'model/Peer'
import { useConvosStore } from 'store/convos'
import { useEnv, useViewer } from 'hooks'
import { random } from 'misc/utils'
import { INTEGER_BOUNDARY } from 'misc/constants'

export function sendMessage(peerId: Peer.Id, text: string, attaches: Attach.Attaches) {
  const convo = Convo.safeGet(peerId)
  const pendingMessage = toPendingMessage(peerId, text, attaches)

  convo.pendingMessages.push(pendingMessage)
  sendNextPendingMessage(convo)
}

async function sendNextPendingMessage(convo: Convo.Convo) {
  const { api } = useEnv()
  const { sendMessageLock } = useConvosStore()

  if (sendMessageLock.has(convo.id)) {
    return
  }

  const pending = convo.pendingMessages.find(
    (pending) => !pending.isFailed && !pending.cmid
  )
  if (!pending) {
    return
  }

  sendMessageLock.add(convo.id)

  try {
    const { cmid } = await api.fetch('messages.send', {
      peer_id: pending.peerId,
      random_id: pending.randomId,
      message: pending.text,
      attachment: Attach.ids(pending.attaches)
    })
    pending.cmid = Message.resolveCmid(cmid)
  } catch (err) {
    console.warn('[sendMessage] failed', err)
    pending.isFailed = true
  }

  sendMessageLock.delete(convo.id)
  sendNextPendingMessage(convo)
}

function toPendingMessage(
  peerId: Peer.Id,
  text: string,
  attaches: Attach.Attaches
): Message.Pending {
  const viewer = useViewer()
  const randomId = random(-INTEGER_BOUNDARY, INTEGER_BOUNDARY)

  return {
    kind: 'Pending',
    peerId,
    cmid: undefined,
    randomId,
    authorId: viewer.id,
    isOut: true,
    sentAt: Date.now(),
    updatedAt: undefined,
    text,
    attaches,
    replyMessage: undefined,
    forwardedMessages: undefined,
    isFailed: false
  }
}
