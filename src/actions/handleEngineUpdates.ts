import * as IEngine from 'env/IEngine'
import { MessagesConversation } from 'model/api-types/objects/MessagesConversation'
import { MessagesMessage } from 'model/api-types/objects/MessagesMessage'
import * as Convo from 'model/Convo'
import * as Message from 'model/Message'
import * as Peer from 'model/Peer'
import { useConvosStore } from 'store/convos'
import { usePeersStore } from 'store/peers'
import { insertConvos, insertPeers } from 'actions'
import { fromApiMessage } from 'converters/MessageConverter'
import { useEnv } from 'hooks'
import { getMapValueOrSetDefault } from 'misc/utils'
import { PEER_FIELDS } from 'misc/constants'

const MESSAGE_FLAGS = {
  spam: 1 << 6,
  deleted: 1 << 7
}

const TYPING_DURATION = 5000

export async function handleEngineUpdates(pts: number, updates: IEngine.Update[]) {
  const convosStore = useConvosStore()
  const {
    apiConvosMap,
    apiMessagesMap,
    profiles,
    groups
  } = await loadMissingData(pts, isDataMissing(updates))

  insertPeers({
    profiles,
    groups
  })

  for (const update of updates) {
    switch (update[0]) {
      case 10002: {
        const [, rawCmid, flags, rawPeerId] = update
        const isDeleteMessageUpdate = (flags & MESSAGE_FLAGS.deleted) > 0
        const peerId = Peer.resolveId(rawPeerId)
        const cmid = Message.resolveCmid(rawCmid)

        if (!convosStore.convos.has(peerId)) {
          break
        }

        const apiConvo = apiConvosMap.get(peerId)
        if (!apiConvo) {
          console.warn('[handleEngineUpdates] no convo', apiConvosMap, update)
          break
        }

        if (isDeleteMessageUpdate) {
          insertConvos([{ conversation: apiConvo }], {
            merge: true,
            addToList: false
          })

          const convo = Convo.safeGet(peerId)
          const message = Convo.findMessage(convo, cmid)

          if (!message) {
            break
          }

          Convo.removeMessage(convo, cmid)
          Convo.removePendingMessage(convo, message.randomId)

          const lastMessageCmid =
            apiConvo.last_conversation_message_id &&
            Message.resolveCmid(apiConvo.last_conversation_message_id)
          const apiLastMessage = lastMessageCmid && apiMessagesMap.get(peerId)?.get(lastMessageCmid)

          if (apiLastMessage && !Convo.lastMessage(convo)) {
            const message = fromApiMessage(apiLastMessage)
            Convo.insertMessages(convo, [message], {
              up: true,
              down: false,
              aroundId: message.cmid
            })
          }
          break
        }

        const apiMessage = apiMessagesMap.get(peerId)?.get(cmid)
        const message = apiMessage && fromApiMessage(apiMessage)
        if (!message) {
          console.warn('[handleEngineUpdates] no message', apiMessagesMap, update)
          break
        }

        insertConvos([{ conversation: apiConvo }], {
          merge: true,
          addToList: false
        })

        const convo = Convo.safeGet(peerId)

        Convo.insertMessages(convo, [message], {
          up: true,
          down: true,
          aroundId: cmid
        })
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
          update[0] === 10003 &&
          ((update[2] & MESSAGE_FLAGS.spam) > 0 || (update[2] & MESSAGE_FLAGS.deleted) > 0)

        const apiConvo = apiConvosMap.get(peerId)
        if (!apiConvo) {
          console.warn('[handleEngineUpdates] no convo', apiConvosMap, update)
          break
        }

        const apiMessage = apiMessagesMap.get(peerId)?.get(cmid)
        const message = apiMessage && fromApiMessage(apiMessage)
        if (!message) {
          console.warn('[handleEngineUpdates] no message', apiMessagesMap, update)
          break
        }

        insertConvos([{ conversation: apiConvo }], {
          merge: true,
          addToList: update[0] === 10004 || isRestoreMessageUpdate
        })

        const convo = Convo.safeGet(peerId)

        Convo.insertMessages(convo, [message], {
          up: true,
          down: true,
          aroundId: cmid
        })
        Convo.removePendingMessage(convo, message.randomId)

        if (update[0] === 10004 || update[0] === 10005) {
          convosStore.stopTyping(peerId, message.authorId)
        }
        break
      }

      case 10006:
      case 10007: {
        const [, rawPeerId] = update
        const peerId = Peer.resolveId(rawPeerId)
        const apiConvo = apiConvosMap.get(peerId)
        if (apiConvo) {
          insertConvos([{ conversation: apiConvo }], {
            merge: true,
            addToList: false
          })
        }
        break
      }

      case 63:
      case 64:
      case 65:
      case 66:
      case 67:
      case 68: {
        const [eventId, rawPeerId, rawTypingPeerIds, , timestamp] = update
        const peerId = Peer.resolveId(rawPeerId)
        const durationLeft = Date.now() + TYPING_DURATION - timestamp * 1000

        if (durationLeft <= 0) {
          break
        }

        const typingPeers = getMapValueOrSetDefault(convosStore.typings, peerId, [])

        for (const rawTypingPeerId of rawTypingPeerIds) {
          const typingPeerId = Peer.resolveId(rawTypingPeerId)
          const typingPeer = typingPeers.find(({ peerId }) => typingPeerId === peerId)

          const cancelTypingTimeoutId = window.setTimeout(
            () => convosStore.stopTyping(peerId, typingPeerId),
            durationLeft
          )

          if (typingPeer) {
            window.clearTimeout(typingPeer.cancelTypingTimeoutId)
            typingPeer.cancelTypingTimeoutId = cancelTypingTimeoutId
          } else {
            typingPeers.push({
              peerId: typingPeerId,
              type: ({
                63: 'text',
                64: 'voice',
                65: 'photo',
                66: 'video',
                67: 'file',
                68: 'videomessage'
              } as const)[eventId],
              cancelTypingTimeoutId
            })
          }
        }
        break
      }

      case 114: {
        const [, setting] = update
        const peerId = Peer.resolveId(setting.peer_id)

        const convo = Convo.get(peerId)
        if (!convo) {
          break
        }

        convo.notifications.enabled = setting.disabled_until === 0
        convo.notifications.disabledUntil = setting.disabled_until * 1000
        break
      }
    }
  }
}

type MissingDataMeta = {
  needLongPollHistory: boolean
  missingUsers: number[]
  missingGroups: number[]
}

function isDataMissing(updates: IEngine.Update[]): MissingDataMeta {
  const { peers } = usePeersStore()
  const missingPeers = []
  let needLongPollHistory = false

  for (const update of updates) {
    switch (update[0]) {
      case 10002:
      case 10003:
      case 10004:
      case 10005:
      case 10018:
        needLongPollHistory = true
        break

      case 10006:
      case 10007:
        needLongPollHistory = true
        break

      case 63:
      case 64:
      case 65:
      case 66:
      case 67:
      case 68: {
        const [, , rawTypingPeerIds, , timestamp] = update
        const durationLeft = Date.now() + TYPING_DURATION - timestamp * 1000

        if (durationLeft <= 0) {
          break
        }

        missingPeers.push(
          ...rawTypingPeerIds
            .map(Peer.resolveId)
            .filter((peerId) => !peers.has(peerId))
        )
        break
      }

      case 114:
        break
    }
  }

  const missingUsers = missingPeers.filter(Peer.isUserPeerId).map(Peer.toRealId)
  const missingGroups = missingPeers.filter(Peer.isGroupPeerId).map(Peer.toRealId)

  return {
    needLongPollHistory,
    missingUsers,
    missingGroups
  }
}

async function loadMissingData(
  pts: number,
  { needLongPollHistory, missingUsers, missingGroups }: MissingDataMeta
) {
  const { api } = useEnv()

  const [glphResponse, usersResponse, groupsResponse] = await api.fetchParallel([
    needLongPollHistory && api.buildMethod('messages.getLongPollHistory', {
      pts,
      lp_version: IEngine.VERSION,
      msgs_limit: 1100,
      events_limit: 1100,
      last_n: 1000,
      extended: 1,
      fields: PEER_FIELDS
    }),
    missingUsers.length && api.buildMethod('users.get', {
      user_ids: missingUsers.join(','),
      fields: PEER_FIELDS
    }),
    missingGroups.length && api.buildMethod('groups.getById', {
      group_ids: missingGroups.join(','),
      fields: PEER_FIELDS
    })
  ], { retries: Infinity })

  if (glphResponse && glphResponse.from_pts > pts) {
    throw new Error('[loadMissingData] glph история обрезалась')
  }

  const apiConvosMap = new Map<Peer.Id, MessagesConversation>()
  const apiMessagesMap = new Map<Peer.Id, Map<Message.Cmid, MessagesMessage>>()

  for (const apiConvo of glphResponse?.conversations ?? []) {
    const peerId = Peer.resolveId(apiConvo.peer.id)
    apiConvosMap.set(peerId, apiConvo)
  }

  for (const apiMessage of glphResponse?.messages.items ?? []) {
    const peerId = Peer.resolveId(apiMessage.peer_id)
    const cmid = Message.resolveCmid(apiMessage.conversation_message_id)

    const mapWithMessages = getMapValueOrSetDefault(apiMessagesMap, peerId, new Map())
    mapWithMessages.set(cmid, apiMessage)
  }

  return {
    apiConvosMap,
    apiMessagesMap,
    profiles: [
      ...glphResponse?.profiles ?? [],
      ...usersResponse ?? [],
      ...groupsResponse?.profiles ?? []
    ],
    groups: [
      ...glphResponse?.groups ?? [],
      ...groupsResponse?.groups ?? []
    ]
  }
}
