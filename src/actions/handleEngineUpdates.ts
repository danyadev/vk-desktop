import * as IEngine from 'env/IEngine'
import { MessagesConversation } from 'model/api-types/objects/MessagesConversation'
import { MessagesGetDiffContentInput } from 'model/api-types/objects/MessagesGetDiffContentInput'
import { MessagesMessage } from 'model/api-types/objects/MessagesMessage'
import * as Convo from 'model/Convo'
import * as History from 'model/History'
import * as Lists from 'model/Lists'
import * as Message from 'model/Message'
import * as Peer from 'model/Peer'
import { useConvosStore } from 'store/convos'
import { usePeersStore } from 'store/peers'
import { insertConvos, insertPeers } from 'actions'
import { fromApiMessage, fromEngineMessage } from 'converters/MessageConverter'
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
          if (!apiConvosMap.has(peerId) && !message.isOut && Message.isUnread(message, convo)) {
            convo.unreadCount--

            if (convo.kind === 'ChatConvo') {
              convo.mentionedCmids.delete(message.cmid)
            }
          }

          Convo.removeMessage(convo, cmid)
          if (message.isOut) {
            Convo.removePendingMessage(convo, message.randomId)
          }
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

        const convo = peerId && convos.get(peerId)
        if (!convo) {
          break
        }

        const apiMessage = apiMessagesMap.get(peerId)?.get(cmid)
        const eventWithMessage = update.length === 11 && update
        const message =
          (apiMessage && fromApiMessage(apiMessage)) ??
          (eventWithMessage && fromEngineMessage(update, convo))

        if (!message) {
          break
        }

        if (flags & (Message.flags.deleted | Message.flags.spam)) {
          if (!apiConvosMap.has(peerId) && !message.isOut && Message.isUnread(message, convo)) {
            convo.unreadCount++

            if (convo.kind === 'ChatConvo' && message.kind === 'Normal' && message.hasMentioned) {
              convo.mentionedCmids.add(message.cmid)
            }
          }

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
        const message = apiMessage
          ? fromApiMessage(apiMessage)
          : IEngine.isIncompleteUpdate(update)
            ? undefined
            : fromEngineMessage(update, convo)

        if (!message) {
          break
        }

        if (!apiConvosMap.has(peerId)) {
          if (eventId === 10004) {
            convo.minorSortId = update[3]
            !message.isOut && convo.unreadCount++
          }

          if (convo.kind === 'ChatConvo' && !message.isOut && Message.isUnread(message, convo)) {
            if (message.kind === 'Normal' && message.hasMentioned) {
              convo.mentionedCmids.add(message.cmid)
            } else {
              convo.mentionedCmids.delete(message.cmid)
            }
          }
        }

        Convo.insertMessages(convo, [message], {
          up: true,
          down: eventId !== 10004,
          aroundId: cmid
        })
        if (message.isOut) {
          Convo.removePendingMessage(convo, message.randomId)
        }
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

        if (eventId === 10006) {
          convo.unreadCount = unreadCount
          convo.inReadBy = cmid

          if (convo.kind === 'ChatConvo') {
            for (const mentionedCmid of convo.mentionedCmids) {
              if (mentionedCmid <= cmid) {
                convo.mentionedCmids.delete(mentionedCmid)
              }
            }
          }

          if (unreadCount === 0) {
            Lists.refresh(lists, convo)
          }
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

      case 10013: {
        const [, rawPeerId, lastCmid] = update
        const peerId = Peer.resolveId(rawPeerId)
        const convo = convos.get(peerId)
        if (!convo) {
          break
        }

        History.clearHistory(convo.history, lastCmid)
        break
      }

      case 21: {
        const [, rawPeerId, minorId] = update
        const peerId = Peer.resolveId(rawPeerId)
        const convo = convos.get(peerId)
        if (!convo) {
          break
        }

        convo.minorSortId = minorId
        Lists.refresh(lists, convo)
        break
      }

      case 52: {
        const [, updateType, rawPeerId, extra] = update
        const peerId = Peer.resolveId(rawPeerId)
        const convo = convos.get(peerId)

        if (!convo) {
          break
        }

        switch (updateType) {
          // Закрепление / редактирование / открепление закрепленного сообщения
          case 5: {
            if (convo.kind !== 'ChatConvo') {
              break
            }

            // Если мы получили беседу из апи, значит мы уже применили закрепленное сообщение
            if (apiConvosMap.has(peerId)) {
              break
            }

            if (extra > 0) {
              const cmid = Message.resolveCmid(extra)
              const message = Convo.findMessage(convo, cmid)
              if (message && message.kind === 'Normal') {
                convo.pinnedMessage = Message.toPinned(message)
              }
            } else {
              convo.pinnedMessage = undefined
            }
            break
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

function isEngineMessageInsufficient(
  update: IEngine.MessageUpdate,
  convo: Convo.Convo | undefined
) {
  const attachments = update[0] === 10004 ? update[8] : update[7]

  // Кроме факта наличия вложений нам может прийти массив attachments, который на данный момент
  // может содержать только одно вложение: voice или sticker.
  // Поэтому просто проверяем, что в сообщении только одно вложение и оно есть в attachments,
  // иначе считаем что данных недостаточно
  if (attachments.attach1_type) {
    if (attachments.attach2_type) {
      return true
    }

    if (!attachments.attachments || attachments.attachments_count !== '1') {
      return true
    }
  }

  // fwd это признак как пересланного, так и реплая, при этом вместе они прийти не могут,
  // поэтому эта проверка проверяет наличие конкретно пересланных
  if (attachments.fwd && !attachments.reply) {
    return true
  }

  if (attachments.reply) {
    const replyId = JSON.parse(attachments.reply) as IEngine.ReplyMessageId
    const replyCmid = Message.resolveCmid(replyId.conversation_message_id)
    const message = convo && Convo.findMessage(convo, replyCmid)
    if (!message) {
      return true
    }
  }

  return false
}

type MissingDataMeta = {
  missingCmidsByConvo: Map<Peer.Id, Set<Message.Cmid>>
  missingConvos: Set<Peer.Id>
  missingUsers: Set<number>
  missingGroups: Set<number>
}

function collectMissingData(updates: IEngine.Update[]): MissingDataMeta {
  const { peers } = usePeersStore()
  const { convos, lists } = useConvosStore()
  const missingCmidsByConvo = new Map<Peer.Id, Set<Message.Cmid>>()
  const missingConvos = new Set<Peer.Id>()
  const missingUsers = new Set<number>()
  const missingGroups = new Set<number>()

  const addMissingCmid = (peerId: Peer.Id, cmid: Message.Cmid) => {
    const cmids = missingCmidsByConvo.get(peerId)
    if (cmids) {
      cmids.add(cmid)
    } else {
      missingCmidsByConvo.set(peerId, new Set([cmid]))
    }
  }

  const addMissingPeer = (peerId: Peer.Id) => {
    if (Peer.isUserPeerId(peerId)) {
      missingUsers.add(Peer.toRealId(peerId))
    } else if (Peer.isGroupPeerId(peerId)) {
      missingGroups.add(Peer.toRealId(peerId))
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

        const convo = convos.get(peerId)

        if (flags & (Message.flags.deleted | Message.flags.spam)) {
          // Удаление сообщения
          if (eventId === 10002 && convo) {
            const lastCmid = Convo.lastMessage(convo)?.cmid

            // Запрашиваем беседу (с последним сообщением), если удаляется последнее сообщение
            // и у нас не оказалось предыдущего сообщения для отображения
            if (lastCmid === cmid && !History.previousItem(convo.history, lastCmid)) {
              missingConvos.add(peerId)
            }
          }

          // Восстановление сообщения
          if (eventId === 10003) {
            // Если нет беседы, то мы не знаем, восстановилось последнее сообщение в чате
            // и оно поднимется в списке чатов (и нам надо его отобразить), или какое-то другое
            if (!convo) {
              missingConvos.add(peerId)
              break
            }

            if (!Convo.canInsertRestoredMessage(convo, cmid)) {
              break
            }

            const eventWithMessage = update.length === 11 && update
            const engineMessage = eventWithMessage && fromEngineMessage(eventWithMessage, convo)

            if (!eventWithMessage || isEngineMessageInsufficient(eventWithMessage, convo)) {
              addMissingCmid(peerId, cmid)
            } else if (engineMessage && !peers.has(engineMessage.authorId)) {
              addMissingPeer(engineMessage.authorId)
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

        const convo = convos.get(peerId)
        const localMessage = eventId !== 10004 && convo && Convo.findMessage(convo, cmid)
        const maybeMissingMessage = eventId === 10004 || localMessage

        // По какой-то причине движок решил не возвращать содержимое сообщения.
        // В подавляющем большинстве случаев это происходит когда сообщение уже удалено
        // и событие его удаления находится далее в списке событий.
        // Однако возможна и ситуация, когда у движка просто в моменте не оказалось сообщения
        if (IEngine.isIncompleteUpdate(update)) {
          if (maybeMissingMessage) {
            missingConvos.add(peerId)
            addMissingCmid(peerId, cmid)
          }
          break
        }

        if (eventId === 10004 && !convo) {
          missingConvos.add(peerId)
        }

        if (maybeMissingMessage && isEngineMessageInsufficient(update, convo)) {
          addMissingCmid(peerId, cmid)
          break
        }

        const engineMessage = fromEngineMessage(update, convo)
        if (eventId === 10004 && !peers.has(engineMessage.authorId)) {
          addMissingPeer(engineMessage.authorId)
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
            missingConvos.add(peerId)
            break
          }

          if (
            (flags & Convo.flags.markedUnread) &&
            (action === 'unset' || Lists.isInitialized(lists.unread))
          ) {
            missingConvos.add(peerId)
          }
        }
        break
      }

      case 52: {
        const [, updateType, rawPeerId, extra] = update
        const peerId = Peer.resolveId(rawPeerId)
        const convo = convos.get(peerId)

        if (!convo) {
          break
        }

        switch (updateType) {
          case 5: {
            if (extra > 0) {
              const cmid = Message.resolveCmid(extra)
              const message = Convo.findMessage(convo, cmid)

              if (!message) {
                missingConvos.add(peerId)
              }
            }
            break
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
      case 10013:
      case 21:
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
        [...missingCmidsByConvo].map(([peerId, cmids]) => ({
          peer_id: peerId,
          updated_cmids: [...cmids]
        })) satisfies MessagesGetDiffContentInput
      ),
      extended: 1,
      fields: PEER_FIELDS
    }),
    missingConvos.size && api.buildMethod('messages.getConversationsById', {
      peer_ids: [...missingConvos].join(','),
      with_last_messages: 1,
      extended: 1,
      fields: PEER_FIELDS
    }),
    missingUsers.size && api.buildMethod('users.get', {
      user_ids: [...missingUsers].join(','),
      fields: PEER_FIELDS
    }),
    missingGroups.size && api.buildMethod('groups.getById', {
      group_ids: [...missingGroups].join(','),
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
