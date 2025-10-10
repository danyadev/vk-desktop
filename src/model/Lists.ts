import * as Convo from 'model/Convo'
import * as Peer from 'model/Peer'

export type Lists = {
  main: MainList
  unread: MainList
  archive: MainList
  folders: Map<number, {
    all: FolderList
    unread: FolderList
  }>
}
export type List = MainList | FolderList

interface BaseList {
  peerIds: Set<Peer.Id>
  status: 'hasMore' | 'loading' | 'complete' | 'error'
  boundary: {
    majorId: number
    minorId: number
  }
}

interface MainList extends BaseList {
  kind: 'MainList'
  name: 'main' | 'unread' | 'archive'
}

interface FolderList extends BaseList {
  kind: 'FolderList'
  name: 'folder' | 'unreadFolder'
  id: number
}

export function defaults(): Lists {
  const getBaseList = (): BaseList => ({
    peerIds: new Set(),
    status: 'hasMore',
    boundary: {
      majorId: Infinity,
      minorId: Infinity
    }
  })

  return {
    main: { ...getBaseList(), kind: 'MainList', name: 'main', status: 'loading' },
    unread: { ...getBaseList(), kind: 'MainList', name: 'unread' },
    archive: { ...getBaseList(), kind: 'MainList', name: 'archive' },
    folders: new Map()
  }
}

/**
 * Проверяет, что лист хотя бы раз загружал беседы и как следствие может
 * добавлять беседы в рамках List.refresh
 */
export function isInitialized(list: List) {
  return list.boundary.majorId !== Infinity || list.status === 'complete'
}

/**
 * Добавляет беседу в указанный лист и увеличивает нижнюю границу при необходимости
 */
export function push(list: List, convo: Convo.Convo) {
  if (!isWithinBoundary(list, convo)) {
    list.boundary.majorId = convo.majorSortId
    list.boundary.minorId = convo.minorSortId
  }

  list.peerIds.add(convo.id)
}

/**
 * Добавляет беседу в списки, если она подходит по условиям и находится в рамках известных границ,
 * либо удаляет из списков, если больше не подходит
 */
export function refresh(lists: Lists, convo: Convo.Convo) {
  for (const folderId of convo.folderIds) {
    const folder = lists.folders.get(folderId)
    if (folder) {
      folder.all.peerIds.delete(convo.id)
      folder.unread.peerIds.delete(convo.id)

      pushIfWithinBoundary(folder.all, convo)
      if (Convo.isUnread(convo)) {
        pushIfWithinBoundary(folder.unread, convo)
      }
    }
  }

  lists.archive.peerIds.delete(convo.id)
  lists.unread.peerIds.delete(convo.id)
  lists.main.peerIds.delete(convo.id)

  if (convo.isArchived) {
    pushIfWithinBoundary(lists.archive, convo)
    return
  }

  if (Convo.isUnread(convo)) {
    pushIfWithinBoundary(lists.unread, convo)
  }

  pushIfWithinBoundary(lists.main, convo)
}

function pushIfWithinBoundary(list: List, convo: Convo.Convo) {
  // Когда список уже полностью загружен, можно принимать чаты и за пределами границы.
  // Например, может прийти восстановление чата, но этот чат находится ниже последнего
  // известного нам чата
  const allowOutsideBoundary = list.status === 'complete' && !Convo.isHidden(convo)

  if (isWithinBoundary(list, convo) || allowOutsideBoundary) {
    push(list, convo)
  }
}

function isWithinBoundary(list: List, convo: Convo.Convo) {
  return (
    convo.majorSortId > list.boundary.majorId ||
    (convo.majorSortId === list.boundary.majorId && convo.minorSortId >= list.boundary.minorId)
  )
}
