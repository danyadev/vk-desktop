import * as Convo from 'model/Convo'
import * as Peer from 'model/Peer'

export type Lists = {
  main: MainList<'main'>
  unread: MainList<'unread'>
  archive: MainList<'archive'>
  folders: Map<number, {
    all: FolderList<'folder'>
    unread: FolderList<'unreadFolder'>
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

interface MainList<
  Name extends 'main' | 'unread' | 'archive' = 'main' | 'unread' | 'archive'
> extends BaseList {
  kind: 'MainList'
  name: Name
}

interface FolderList<
  Name extends 'folder' | 'unreadFolder' = 'folder' | 'unreadFolder'
> extends BaseList {
  kind: 'FolderList'
  name: Name
  // TODO: разобраться с форматом, я хз есть ли там айди
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
 * либо удаляет из списка, если больше не подходит
 */
export function refresh(lists: Lists, convo: Convo.Convo) {
  for (const folderId of convo.folderIds) {
    const folder = lists.folders.get(folderId)
    if (folder) {
      const sublist = Convo.isUnread(convo) ? 'unread' : 'all'
      refreshInList(folder[sublist], convo)
    }
  }

  if (Convo.hasFlag(convo, Convo.flags.archived)) {
    refreshInList(lists.archive, convo)
    return
  }

  if (Convo.isUnread(convo)) {
    refreshInList(lists.unread, convo)
  }

  refreshInList(lists.main, convo)
}

function refreshInList(list: List, convo: Convo.Convo) {
  // Когда список уже полностью загружен, можно принимать и чаты за пределами границы.
  // Например, может прийти восстановление чата, но этот чат находится ниже последнего
  // известного нам чата
  const allowOutsideBoundary = list.status === 'complete' && convo.minorSortId > 0

  if (isWithinBoundary(list, convo) || allowOutsideBoundary) {
    list.peerIds.add(convo.id)
  } else {
    list.peerIds.delete(convo.id)
  }
}

function isWithinBoundary(list: List, convo: Convo.Convo) {
  return (
    convo.majorSortId > list.boundary.majorId ||
    (convo.majorSortId === list.boundary.majorId && convo.minorSortId >= list.boundary.minorId)
  )
}
