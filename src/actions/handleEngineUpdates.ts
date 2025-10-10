import * as IEngine from 'env/IEngine'
import { MessagesConversation } from 'model/api-types/objects/MessagesConversation'
import { MessagesGetDiffContentInput } from 'model/api-types/objects/MessagesGetDiffContentInput'
import { MessagesMessage } from 'model/api-types/objects/MessagesMessage'
import * as Convo from 'model/Convo'
import * as Lists from 'model/Lists'
import * as Message from 'model/Message'
import * as Peer from 'model/Peer'
import { useConvosStore } from 'store/convos'
import { usePeersStore } from 'store/peers'
import { insertConvos, insertPeers } from 'actions'
import { fromApiMessage } from 'converters/MessageConverter'
import { useEnv } from 'hooks'
import { getMapValueWithDefaults } from 'misc/utils'
import { PEER_FIELDS } from 'misc/constants'

const TYPING_DURATION = 5000

export async function handleEngineUpdates(updates: IEngine.Update[]) {
  const convosStore = useConvosStore()
  const { convos, lists, typings } = convosStore
  const {
    apiConvosMap,
    apiMessagesMap,
    profiles,
    groups
  } = await loadMissingData(collectMissingData(updates))

  insertPeers({
    profiles,
    groups
  })

  insertConvos([...apiConvosMap.entries()].map(([peerId, apiConvo]) => {
    const cmid = apiConvo.last_conversation_message_id
      ? Message.resolveCmid(apiConvo.last_conversation_message_id)
      : undefined

    return {
      conversation: apiConvo,
      last_message: cmid && apiMessagesMap.get(peerId)?.get(cmid)
    }
  }))

  for (const update of updates) {
    switch (update[0]) {
      case 10002: {
        const [, rawCmid, flags, rawPeerId] = update
        const isDeleteMessageUpdate = (flags & (Message.flags.deleted | Message.flags.spam)) > 0
        const peerId = Peer.resolveId(rawPeerId)
        const cmid = Message.resolveCmid(rawCmid)

        const convo = convos.get(peerId)
        if (!convo) {
          break
        }

        const message = Convo.findMessage(convo, cmid)
        if (!message) {
          break
        }

        if (isDeleteMessageUpdate) {
          // Мы уже загрузили беседу из апи вместо сложного обновления ее полей вручную:
          // - Если сообщение было непрочитанным, нужно уменьшить счетчик
          // - Если сообщение было на границе непрочитанности, нужно сдвинуть границу
          // - Если сообщение было последним в списке, нужно заменить его на предыдущее
          // - Если сообщение было с упоминанием/реакцией/исчезанием, нужно обновить их список
          Convo.removeMessage(convo, cmid)
          Convo.removePendingMessage(convo, message.randomId)
          Lists.refresh(lists, convo)
          break
        }

        if (flags & Message.flags.voiceListened) {
          const voice = message.kind === 'Normal' && message.attaches.voice
          if (voice) {
            voice.wasListened = true
          }
        }
        break
      }

      case 10003: {
        const [, rawCmid, flags, rawPeerId] = update
        const peerId = rawPeerId && Peer.resolveId(rawPeerId)
        const cmid = Message.resolveCmid(rawCmid)

        // TODO: проверить кейс с восстановлением непрочитанного сообщения с упоминанием:
        // в таком случае мы должны обновить счетчик непрочитанных
        const convo = peerId && convos.get(peerId)
        if (!convo) {
          break
        }

        const apiMessage = apiMessagesMap.get(peerId)?.get(cmid)
        const message = apiMessage && fromApiMessage(apiMessage)
        if (!message) {
          break
        }

        if (flags & (Message.flags.deleted | Message.flags.spam)) {
          Convo.restoreMessage(convo, message)
          Lists.refresh(lists, convo)
        }
        break
      }

      case 10004:
      case 10005:
      case 10018: {
        const [eventId, rawCmid] = update
        const rawPeerId = eventId === 10004 ? update[4] : update[3]
        const peerId = Peer.resolveId(rawPeerId)
        const cmid = Message.resolveCmid(rawCmid)

        const convo = convos.get(peerId)
        if (!convo) {
          break
        }

        const apiMessage = apiMessagesMap.get(peerId)?.get(cmid)
        const message = apiMessage && fromApiMessage(apiMessage)
        if (!message) {
          break
        }

        Convo.insertMessages(convo, [message], {
          up: true,
          down: eventId !== 10004,
          aroundId: cmid
        })
        Convo.removePendingMessage(convo, message.randomId)
        Lists.refresh(lists, convo)

        if (eventId === 10004 || eventId === 10005) {
          convosStore.stopTyping(peerId, message.authorId)
        }
        break
      }

      case 10006:
      case 10007: {
        const [eventId, rawPeerId, rawCmid, unreadCount] = update
        const peerId = Peer.resolveId(rawPeerId)
        const cmid = Message.resolveCmid(rawCmid)

        const convo = convos.get(peerId)
        if (!convo) {
          break
        }

        // TODO: обновлять счетчик упоминаний
        if (eventId === 10006) {
          convo.unreadCount = unreadCount
          convo.inReadBy = cmid
        } else {
          convo.outReadBy = cmid
        }
        break
      }

      case 10:
      case 12: {
        const [eventId, rawPeerId, flags] = update
        const peerId = Peer.resolveId(rawPeerId)
        const isFlagSet = eventId === 12

        const convo = convos.get(peerId)
        if (convo) {
          if (flags & Convo.flags.archived) {
            convo.isArchived = isFlagSet
          }
          if (flags & Convo.flags.markedUnread) {
            convo.isMarkedUnread = isFlagSet
          }

          if (flags & (Convo.flags.archived | Convo.flags.markedUnread)) {
            Lists.refresh(lists, convo)
          }
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

        if (!convos.has(peerId) || durationLeft <= 0) {
          break
        }

        const typingPeers = getMapValueWithDefaults(typings, peerId, [])

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

        const convo = convos.get(peerId)
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
  missingCmidsByConvo: Map<Peer.Id, Message.Cmid[]>
  missingConvos: Peer.Id[]
  missingUsers: number[]
  missingGroups: number[]
}

function collectMissingData(updates: IEngine.Update[]): MissingDataMeta {
  const { peers } = usePeersStore()
  const { convos, lists } = useConvosStore()
  const missingCmidsByConvo = new Map<Peer.Id, Message.Cmid[]>()
  const missingConvos: Peer.Id[] = []
  const missingUsers: number[] = []
  const missingGroups: number[] = []

  const addMissingCmid = (peerId: Peer.Id, cmid: Message.Cmid) => {
    const cmids = missingCmidsByConvo.get(peerId)
    if (cmids) {
      cmids.push(cmid)
    } else {
      missingCmidsByConvo.set(peerId, [cmid])
    }
  }

  const addMissingPeer = (peerId: Peer.Id) => {
    if (Peer.isUserPeerId(peerId)) {
      missingUsers.push(Peer.toRealId(peerId))
    } else if (Peer.isGroupPeerId(peerId)) {
      missingGroups.push(Peer.toRealId(peerId))
    }
  }

  for (const update of updates) {
    switch (update[0]) {
      case 10002:
      case 10003: {
        const [eventId, rawCmid, flags, rawPeerId] = update
        const peerId = rawPeerId && Peer.resolveId(rawPeerId)
        const cmid = Message.resolveCmid(rawCmid)

        if (!peerId) {
          break
        }

        if (flags & (Message.flags.deleted | Message.flags.spam)) {
          // Удаление сообщения.
          // Нужна беседа для обновления счетчиков и последнее сообщение (они вернутся вместе),
          // если его удалят и предыдущего не окажется в кеше
          if (eventId === 10002 && convos.has(peerId)) {
            missingConvos.push(peerId)
          }

          // Восстановление сообщения.
          // Нужна беседа (счетчики тоже могут поменяться) и сообщение для восстановления
          if (eventId === 10003) {
            const convo = convos.get(peerId)
            if (!convo || Convo.canInsertRestoredMessage(convo, cmid)) {
              missingConvos.push(peerId)
              addMissingCmid(peerId, cmid)
            }
          }
        }
        break
      }

      case 10004:
      case 10005:
      case 10018: {
        const [eventId, rawCmid] = update
        const rawPeerId = eventId === 10004 ? update[4] : update[3]
        const peerId = Peer.resolveId(rawPeerId)
        const cmid = Message.resolveCmid(rawCmid)

        // Беседа нужна для обновления счетчиков. Даже при редактировании сообщения может
        // поменяться количество упоминаний в чате
        if (eventId === 10004 || convos.has(peerId)) {
          missingConvos.push(peerId)
          addMissingCmid(peerId, cmid)
        }
        break
      }

      case 10:
      case 12: {
        const [eventId, rawPeerId, flags] = update
        const peerId = Peer.resolveId(rawPeerId)
        const action = eventId === 10 ? 'unset' : 'set'

        // Если беседа переносится в другой лист, например из общего списка чата далеко снизу
        // в уже загруженный небольшой архив, у нас в кеше не будет беседы, но ее нужно показать
        // в архиве, так как он уже загружен либо беседа может находиться выше нижней границы
        if (!convos.has(peerId)) {
          // грузим беседу если она переходит main <- archive,
          // либо main -> archive, но только если архив уже имеет определенную границу
          if (
            (flags & Convo.flags.archived) &&
            (action === 'unset' || Lists.isInitialized(lists.archive))
          ) {
            missingConvos.push(peerId)
            break
          }

          if (
            (flags & Convo.flags.markedUnread) &&
            (action === 'unset' || Lists.isInitialized(lists.unread))
          ) {
            missingConvos.push(peerId)
          }
        }
        break
      }

      case 63:
      case 64:
      case 65:
      case 66:
      case 67:
      case 68: {
        const [, rawPeerId, rawTypingPeerIds, , timestamp] = update
        const peerId = Peer.resolveId(rawPeerId)
        const durationLeft = Date.now() + TYPING_DURATION - timestamp * 1000

        if (!convos.has(peerId) || durationLeft <= 0) {
          break
        }

        for (const rawPeerId of rawTypingPeerIds) {
          const peerId = Peer.resolveId(rawPeerId)
          if (!peers.has(peerId)) {
            addMissingPeer(peerId)
          }
        }
        break
      }

      case 10006:
      case 10007:
      case 114:
        break
    }
  }

  return {
    missingCmidsByConvo,
    missingConvos,
    missingUsers,
    missingGroups
  }
}

async function loadMissingData({
  missingCmidsByConvo,
  missingConvos,
  missingUsers,
  missingGroups
}: MissingDataMeta) {
  const { api } = useEnv()

  const [
    getDiffContentResponse,
    convosResponse,
    usersResponse,
    groupsResponse
  ] = await api.fetchParallel([
    missingCmidsByConvo.size && api.buildMethod('messages.getDiffContent', {
      conversation_messages: JSON.stringify(
        [...missingCmidsByConvo.entries()].map(([peerId, cmids]) => ({
          peer_id: peerId,
          updated_cmids: cmids
        })) satisfies MessagesGetDiffContentInput
      ),
      extended: 1,
      fields: PEER_FIELDS
    }),
    missingConvos.length && api.buildMethod('messages.getConversationsById', {
      peer_ids: missingConvos.join(','),
      with_last_messages: 1,
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

  const apiConvosMap = new Map<Peer.Id, MessagesConversation>()
  const apiMessagesMap = new Map<Peer.Id, Map<Message.Cmid, MessagesMessage>>()

  for (const contentEntry of getDiffContentResponse?.items ?? []) {
    const { peer_id: rawPeerId, requested_messages: apiMessages } = contentEntry
    if (!apiMessages) {
      continue
    }

    const peerId = Peer.resolveId(rawPeerId)
    const mapWithMessages = getMapValueWithDefaults(apiMessagesMap, peerId, new Map())

    for (const apiMessage of apiMessages) {
      const cmid = Message.resolveCmid(apiMessage.conversation_message_id)
      mapWithMessages.set(cmid, apiMessage)
    }
  }

  for (const apiConvo of convosResponse?.items ?? []) {
    const peerId = Peer.resolveId(apiConvo.peer.id)
    apiConvosMap.set(peerId, apiConvo)
  }

  for (const apiMessage of convosResponse?.last_messages ?? []) {
    const peerId = Peer.resolveId(apiMessage.peer_id)
    const cmid = Message.resolveCmid(apiMessage.conversation_message_id)
    const mapWithMessages = getMapValueWithDefaults(apiMessagesMap, peerId, new Map())
    mapWithMessages.set(cmid, apiMessage)
  }

  return {
    apiConvosMap,
    apiMessagesMap,
    profiles: [
      ...getDiffContentResponse?.profiles ?? [],
      ...convosResponse?.profiles ?? [],
      ...usersResponse ?? [],
      ...groupsResponse?.profiles ?? []
    ],
    groups: [
      ...getDiffContentResponse?.groups ?? [],
      ...convosResponse?.groups ?? [],
      ...groupsResponse?.groups ?? []
    ]
  }
}
