import * as IEngine from 'env/IEngine'
import * as Convo from 'model/Convo'
import * as History from 'model/History'
import * as Message from 'model/Message'
import * as Peer from 'model/Peer'
import { insertConvos, insertPeers } from 'actions'
import { fromApiMessage } from 'converters/MessageConverter'
import { useEnv } from 'hooks'
import { PEER_FIELDS } from 'misc/constants'

export async function handleEngineUpdates(fromPts: number, updates: IEngine.Update[]) {
  const { api } = useEnv()

  const hasUsefulUpdates = updates.some(([eventId]) => (
    (eventId >= 10002 && eventId <= 10007) || eventId === 10018 || eventId === 114
  ))
  if (!hasUsefulUpdates) {
    return
  }

  const glphResponse = await api.fetch('messages.getLongPollHistory', {
    pts: fromPts,
    lp_version: IEngine.VERSION,
    msgs_limit: 1100,
    events_limit: 1100,
    last_n: 1000,
    extended: 1,
    fields: PEER_FIELDS
  })

  if (glphResponse.from_pts > fromPts) {
    throw new Error('[handleEngineUpdates] glph история обрезалась')
  }

  for (const update of updates) {
    switch (update[0]) {
      case 10002: {
        const [, rawCmid, flags, rawPeerId] = update
        const isDeleteMessageUpdate = flags & 128
        const peerId = Peer.resolveId(rawPeerId)
        const cmid = Message.resolveCmid(rawCmid)

        const apiConvo = glphResponse.conversations.find((apiConvo) => (
          apiConvo.peer.id === peerId
        ))
        if (!apiConvo) {
          console.warn('[handleEngineUpdates] no convo', glphResponse, update)
          break
        }

        const apiMessage = glphResponse.messages.items.find((message) => (
          message.peer_id === peerId && message.conversation_message_id === cmid
        ))
        const message = apiMessage && fromApiMessage(apiMessage)
        if (!message && !isDeleteMessageUpdate) {
          console.warn('[handleEngineUpdates] no message', glphResponse, update)
          break
        }

        const convo = Convo.get(peerId)
        if (!convo) {
          break
        }

        if (isDeleteMessageUpdate) {
          History.removeNode(convo.history, cmid)
        } else if (message) {
          insertConvos([{ conversation: apiConvo }], {
            merge: true,
            addToList: false
          })

          Convo.insertMessages(convo, [message], {
            up: true,
            down: true,
            aroundId: cmid
          })
        }
        break
      }

      case 10003:
      case 10004:
      case 10005:
      case 10018: {
        const rawCmid = update[1]
        const rawPeerId = update[0] === 10004 ? update[4] : update[3]
        const peerId = Peer.resolveId(rawPeerId)
        const cmid = Message.resolveCmid(rawCmid)
        const isRestoreMessageUpdate =
          update[0] === 10003 && ((update[2] & 64) > 0 || (update[2] & 128) > 0)

        const apiConvo = glphResponse.conversations.find((apiConvo) => (
          apiConvo.peer.id === peerId
        ))
        if (!apiConvo) {
          console.warn('[handleEngineUpdates] no convo', glphResponse, update)
          break
        }

        const apiMessage = glphResponse.messages.items.find((message) => (
          message.peer_id === peerId && message.conversation_message_id === cmid
        ))
        const message = apiMessage && fromApiMessage(apiMessage)
        if (!message) {
          console.warn('[handleEngineUpdates] no message', glphResponse, update)
          break
        }

        insertConvos([{ conversation: apiConvo }], {
          merge: true,
          addToList: update[0] === 10004 || isRestoreMessageUpdate
        })
        insertPeers({
          profiles: glphResponse.profiles,
          groups: glphResponse.groups
        })

        const convo = Convo.safeGet(peerId)

        Convo.insertMessages(convo, [message], {
          up: true,
          down: true,
          aroundId: cmid
        })
        break
      }

      case 10006:
      case 10007: {
        const [, rawPeerId] = update
        const peerId = Peer.resolveId(rawPeerId)
        const apiConvo = glphResponse.conversations.find((apiConvo) => (
          apiConvo.peer.id === peerId
        ))
        if (apiConvo) {
          insertConvos([{ conversation: apiConvo }], {
            merge: true,
            addToList: false
          })
        }
        break
      }

      case 114: {
        const [, setting] = update
        const peerId = Peer.resolveId(setting.peer_id)

        const apiConvo = glphResponse.conversations.find((apiConvo) => (
          apiConvo.peer.id === peerId
        ))

        if (apiConvo) {
          const convo = Convo.safeGet(peerId)

          convo.notifications.enabled = setting.disabled_until === 0 && true
          convo.notifications.disabledUntil = setting.disabled_until * 1000
        }
        break
      }
    }
  }
}
