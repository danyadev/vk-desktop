import * as Convo from 'model/Convo'
import * as Peer from 'model/Peer'

export type Lists = {
  main: MainList<'main'>
  unread: MainList<'unread'>
  archive: MainList<'archive'>
  folders: Array<{
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
    folders: []
  }
}

/**
 * Добавляет беседу в указанный лист
 */
export function push(list: List, convo: Convo.Convo) {
  if (
    convo.majorSortId < list.boundary.majorId ||
    (convo.majorSortId === list.boundary.majorId && convo.minorSortId < list.boundary.minorId)
  ) {
    list.boundary.majorId = convo.majorSortId
    list.boundary.minorId = convo.minorSortId
  }

  list.peerIds.add(convo.id)
}

// export function refresh(lists: Lists, convo: Convo.Convo) {
//   console.log('refresh', lists, convo)
// }
