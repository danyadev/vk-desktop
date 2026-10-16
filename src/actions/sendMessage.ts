import { useServices } from 'services'
import { MessagesForward } from 'services/contracts/api/objects/MessagesForward'
import * as Attach from 'model/Attach'
import * as Convo from 'model/Convo'
import * as Message from 'model/Message'
import * as Peer from 'model/Peer'
import { useConvosStore } from 'store/convos'
import { useViewer } from 'hooks'
import { random } from 'misc/utils'
import { INTEGER_BOUNDARY } from 'misc/constants'

export function sendMessage(
  peerId: Peer.Id,
  text: string,
  attaches: Attach.Attaches,
  replyMessage?: Message.Foreign
) {
  const { convos } = useConvosStore()
  const convo = Convo.safeGet(convos, peerId)
  const pendingMessage = toPendingMessage(peerId, text, attaches, replyMessage)

  convo.pendingMessages.push(pendingMessage)
  sendNextPendingMessage(convo)
}

export function retryPendingMessage(convo: Convo.Convo, message: Message.Pending) {
  message.isFailed = false
  sendNextPendingMessage(convo)
}

export function retryAllPendingMessages(convo: Convo.Convo) {
  for (const message of convo.pendingMessages) {
    message.isFailed = false
  }
  sendNextPendingMessage(convo)
}

async function sendNextPendingMessage(convo: Convo.Convo) {
  const { api } = useServices()
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
      attachment: Attach.ids(pending.attaches),
      forward: pending.replyMessage?.cmid
        ? JSON.stringify({
            peer_id: pending.peerId,
            cmids: [pending.replyMessage.cmid],
            is_reply: true
          } satisfies MessagesForward)
        : undefined
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
  attaches: Attach.Attaches,
  replyMessage: Message.Foreign | undefined
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
    replyMessage,
    forwardedMessages: undefined,
    isFailed: false
  }
}
