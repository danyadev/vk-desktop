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
 * Проверяет, что в листе определились границы (после добавления хотя бы одной беседы)
 * и он может принимать другие беседы
 */
export function isInitialized(list: List) {
  return list.boundary.majorId !== Infinity || list.status === 'complete'
}

/**
 * Добавляет беседу в указанный лист и увеличивает нижнюю границу при необходимости
 */
export function push(list: List, convo: Convo.Convo) {
  if (!isWithinBoundary(list, convo, false)) {
    list.boundary.majorId = convo.majorSortId
    list.boundary.minorId = convo.minorSortId
  }

  list.peerIds.add(convo.id)
}

/**
 * Рассчитывает, в каких листах должна находиться беседа, и добавляет или удаляет беседу из них
 */
export function refresh(lists: Lists, convo: Convo.Convo) {
  const allLists = getAllLists(lists)
  const targetLists = getTargetLists(lists, convo)

  for (const list of allLists) {
    if (targetLists.has(list)) {
      push(list, convo)
    } else {
      list.peerIds.delete(convo.id)
    }
  }
}

/**
 * Проверяет, что беседа находится в рамках границы листа и может быть добавлена без появления гэпа
 */
function isWithinBoundary(list: List, convo: Convo.Convo, respectCompletedList = true) {
  // Когда список уже полностью загружен, можно принимать чаты и за пределами границы.
  // Например, может прийти восстановление чата, но этот чат находится ниже последнего
  // известного нам чата
  if (respectCompletedList && list.status === 'complete' && !Convo.isHidden(convo)) {
    return true
  }

  return (
    convo.majorSortId > list.boundary.majorId ||
    (convo.majorSortId === list.boundary.majorId && convo.minorSortId >= list.boundary.minorId)
  )
}

/**
 * Проверяет, что беседа относится к листу
 */
export function matches(list: List, convo: Convo.Convo) {
  switch (list.name) {
    case 'main':
      return !convo.isArchived
    case 'unread':
      return !convo.isArchived && Convo.isUnread(convo)
    case 'archive':
      return convo.isArchived
    case 'folder':
      return convo.folderIds.includes(list.id)
    case 'unreadFolder':
      return convo.folderIds.includes(list.id) && Convo.isUnread(convo)
  }
}

/**
 * Возвращает все листы в виде массива
 */
function getAllLists(lists: Lists): List[] {
  return [
    lists.main,
    lists.unread,
    lists.archive,
    ...[...lists.folders.values()]
      .map((folder) => [folder.all, folder.unread])
      .flat()
  ]
}

/**
 * Определяет список листов, в которых должна находиться беседа
 */
function getTargetLists(lists: Lists, convo: Convo.Convo) {
  return new Set(
    getAllLists(lists)
      .filter((list) => matches(list, convo) && isWithinBoundary(list, convo))
  )
}
