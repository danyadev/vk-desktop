import * as Convo from 'model/Convo'
import * as Peer from 'model/Peer'

export type Lists = {
  main: ListCouple<MainList>
  archive: ListCouple<ArchiveList>
  folders: Array<ListCouple<FolderList>>
}
type ListCouple<T extends BaseList> = { all: T, unread: T }
export type List = MainList | ArchiveList | FolderList

interface BaseList {
  peerIds: Set<Peer.Id>
  unread: boolean
  status: 'hasMore' | 'loading' | 'complete' | 'error'
  boundary: {
    majorId: number
    minorId: number
  }
}

export interface MainList extends BaseList {
  name: 'main'
}

export interface ArchiveList extends BaseList {
  name: 'archive'
}

interface FolderList extends BaseList {
  name: 'folder'
  // TODO: разобраться с форматом, я хз есть ли там айди
  id: number
}

export function defaults(): Lists {
  const getBaseList = (): BaseList => ({
    peerIds: new Set(),
    unread: false,
    status: 'hasMore',
    boundary: {
      majorId: 0,
      minorId: 0
    }
  })

  return {
    main: {
      all: { ...getBaseList(), name: 'main', status: 'loading' },
      unread: { ...getBaseList(), name: 'main', unread: true }
    },
    archive: {
      all: { ...getBaseList(), name: 'archive' },
      unread: { ...getBaseList(), name: 'archive', unread: true }
    },
    folders: []
  }
}

/**
 * Добавляет беседу в указанный лист
 */
export function push(list: List, convo: Convo.Convo) {
  console.log('Lists.push', list, convo.id)

  if (convo.majorSortId < list.boundary.majorId) {
    list.boundary.majorId = convo.majorSortId
    list.boundary.minorId = convo.minorSortId
  } else if (convo.minorSortId < list.boundary.minorId) {
    list.boundary.minorId = convo.minorSortId
  }

  list.peerIds.add(convo.id)
}

// export function refresh(lists: Lists, convo: Convo.Convo) {
//   console.log('refresh', lists, convo)
// }
