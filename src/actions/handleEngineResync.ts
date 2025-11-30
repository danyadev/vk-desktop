import * as IEngine from 'env/IEngine'
import { MessagesGetDiffConversationInfo } from 'model/api-types/objects/MessagesGetDiffConversationInfo'
import { MessagesLongpollCredentials } from 'model/api-types/objects/MessagesLongpollCredentials'
import * as Convo from 'model/Convo'
import * as History from 'model/History'
import * as Lists from 'model/Lists'
import * as Message from 'model/Message'
import * as Peer from 'model/Peer'
import { useConvosStore } from 'store/convos'
import { insertConvos, insertPeers, loadMissingData } from 'actions'
import { fromApiMessage } from 'converters/MessageConverter'
import { useEnv } from 'hooks'
import { PEER_FIELDS } from 'misc/constants'

export async function handleEngineResync(
  lpVersion: number,
  pts: number
): Promise<MessagesLongpollCredentials> {
  const { api } = useEnv()
  const { lists } = useConvosStore()

  let conversationsSource: string | undefined
  const conversationsInfo: MessagesGetDiffConversationInfo[] = []

  const {
    conversations_info: conversationsInfoBatch,
    profiles,
    groups,
    credentials,
    server_version: newPts,
    conversations_source: nextConversationsSource,
    invalidate_all: invalidateAll
  } = await api.fetch('messages.getDiff', {
    lp_version: lpVersion,
    from_version: pts,
    fields: PEER_FIELDS,
    extended_filters: [
      'profiles',
      'groups',
      'counters',
      'messages',
      'server_version',
      'credentials'
    ].join(','),
    conversations_limit: 50
  }, { retries: Infinity })

  if (!credentials || !newPts) {
    throw new Error('[handleEngineResync] messages.getDiff haven\'t returned credentials')
  }

  if (invalidateAll) {
    throw new IEngine.ResyncInvalidateCacheError()
  }

  conversationsSource = nextConversationsSource
  conversationsInfo.push(...conversationsInfoBatch ?? [])
  insertPeers({ profiles, groups })

  while (conversationsSource) {
    const {
      conversations_info: conversationsInfoBatch,
      profiles,
      groups,
      conversations_source: nextConversationsSource,
      invalidate_all: invalidateAll
    } = await api.fetch('messages.getDiff', {
      lp_version: lpVersion,
      from_version: pts,
      to_version: newPts,
      fields: PEER_FIELDS,
      extended_filters: ['profiles', 'groups', 'messages'].join(','),
      conversations_source: conversationsSource,
      conversations_limit: 50
    }, { retries: Infinity })

    if (invalidateAll) {
      throw new IEngine.ResyncInvalidateCacheError()
    }

    conversationsSource = nextConversationsSource
    conversationsInfo.push(...conversationsInfoBatch ?? [])
    insertPeers({ profiles, groups })
  }

  const cmidsToUpdateByConvo = new Map<Peer.Id, Set<Message.Cmid>>()

  for (const conversationInfo of conversationsInfo) {
    const {
      conversation: apiConversation,
      message: [apiLastMessage] = [],
      range_deleted_cmids: deletedCmidsRanges = [],
      range_updated_cmids: updatedCmidsRanges = [],
      cmids_flags: cmidsFlags = [],
      invalidate: invalidateHistory
    } = conversationInfo

    if (!apiConversation) {
      continue
    }

    const peerId = Peer.resolveId(apiConversation.peer.id)
    const isNewConvo = !Convo.get(peerId)

    insertConvos(
      [{ conversation: apiConversation, last_message: apiLastMessage }],
      { invalidateHistory: !!invalidateHistory || !apiLastMessage }
    )

    const convo = Convo.safeGet(peerId)
    const lastMessage = Convo.lastMessage(convo)

    Lists.refresh(lists, convo)

    // Если мы сбросили историю или это новая беседа, нам неважны другие изменения в истории чата,
    // так как сообщений у нас в принципе нет
    if (invalidateHistory || !lastMessage || isNewConvo) {
      continue
    }

    const cmidsToUpdate = new Set<Message.Cmid>()
    const cmidsToDelete = new Set<Message.Cmid>()
    let deletedPointer = 0
    let updatedPointer = 0
    let flagsPointer = 0

    historyLoop:
    for (const node of convo.history) {
      for (let i = deletedPointer; i < deletedCmidsRanges.length; i++) {
        const { min, max } = deletedCmidsRanges[i]!
        const nodeStart = node.kind === 'Item' ? node.id : node.fromId
        const nodeEnd = node.kind === 'Item' ? node.id : node.toId

        // history: [ 1 2 3 4 5 ]
        // ranges:  [      [4 5]]
        // Например, мы находимся на nodeStart = nodeEnd = 1 и min = 4.
        // Указатель все еще верный, мы просто еще не дошли до него в истории.
        // history: [[1 2]3 4 5]
        // ranges:  [  [2 3]   ]
        // Но если мы находимся на nodeStart = 1, nodeEnd = 2 и min = 2, мы попадаем в рейндж.
        // То есть nodeStart < min не подойдет, только nodeEnd < min
        if (nodeEnd < min) {
          break
        }
        // history: [ 1 2 3 4 5 ]
        // ranges:  [[1 2] [4 5]]
        // Например, мы находимся на nodeStart = 3 и max = 2.
        // Мы вышли за пределы указанного рейнджа, идем к следующему
        if (nodeStart > max) {
          deletedPointer++
          continue
        }

        if (node.kind === 'Item') {
          cmidsToDelete.add(node.item.cmid)
          continue historyLoop
        }

        if (nodeStart >= min && nodeEnd <= max) {
          cmidsToDelete.add(Message.resolveCmid(nodeStart))
        } else if (nodeStart >= min) {
          node.fromId = max + 1
        } else if (nodeEnd <= max) {
          node.toId = min - 1
        }
      }

      // Далее мы только применяем изменения в сообщениях, нам нечего делать с гэпами
      if (node.kind === 'Gap') {
        continue
      }

      for (let i = updatedPointer; i < updatedCmidsRanges.length; i++) {
        const { min, max } = updatedCmidsRanges[i]!

        // См. объяснение в цикле выше
        if (node.id < min) {
          break
        }
        if (node.id > max) {
          updatedPointer++
          continue
        }

        cmidsToUpdate.add(node.item.cmid)
      }

      for (let i = flagsPointer; i < cmidsFlags.length; i++) {
        const { cmid, updated_flags: flags } = cmidsFlags[i]!

        // См. объяснение в цикле выше
        if (node.id < cmid) {
          break
        }
        flagsPointer++
        if (node.id > cmid) {
          continue
        }

        if (flags & 1) {
          cmidsToDelete.add(node.item.cmid)
        } else {
          cmidsToUpdate.add(node.item.cmid)
        }
      }
    }

    for (const cmid of cmidsToDelete) {
      History.removeNode(convo.history, cmid, true)
    }

    // messages.getDiff возвращает только последнее сообщение в чате и список измененных сообщений.
    // О новых сообщениях в период ресинка он никак не сообщает, что означает мы можем только
    // предполагать об их наличии и количестве. Поэтому мы будем считать что в каждом упомянутом
    // чате могут быть сообщения между актуальным последним сообщением и последним известным
    // сообщением до ресинка
    const nodeBeforeLast = convo.history.at(-2)

    if (nodeBeforeLast?.kind === 'Gap') {
      // Продлеваем гэп перед последним сообщением
      nodeBeforeLast.toId = lastMessage.cmid - 1
    } else if (nodeBeforeLast?.kind === 'Item') {
      // Вставляем гэп между последним и предпоследним сообщением
      if (nodeBeforeLast.id + 1 !== lastMessage.cmid) {
        const gap = History.toGap(nodeBeforeLast.id + 1, lastMessage.cmid - 1)
        convo.history.splice(-1, 0, gap)
      }
    } else if (lastMessage.cmid !== 1) {
      // В истории есть только последнее сообщение, вставляем гэп перед ним
      convo.history.unshift(History.toGap(1, lastMessage.cmid - 1))
    }

    if (cmidsToUpdate.size > 0) {
      cmidsToUpdateByConvo.set(convo.id, cmidsToUpdate)
    }
  }

  const {
    apiMessagesMap,
    profiles: missingProfiles,
    groups: missingGroups
  } = await loadMissingData({
    missingCmidsByConvo: cmidsToUpdateByConvo,
    missingConvos: new Set(),
    missingUsers: new Set(),
    missingGroups: new Set()
  })

  insertPeers({ profiles: missingProfiles, groups: missingGroups })

  for (const apiMessages of apiMessagesMap.values()) {
    for (const apiMessage of apiMessages.values()) {
      const message = fromApiMessage(apiMessage)
      const convo = Convo.safeGet(message.peerId)

      Convo.insertMessages(convo, [message], {
        up: true,
        down: true,
        aroundId: message.cmid
      })
    }
  }

  return {
    server: credentials.server_lp,
    key: credentials.key,
    ts: credentials.ts,
    pts: newPts
  }
}
