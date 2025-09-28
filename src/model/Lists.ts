import * as Convo from 'model/Convo'
import * as Peer from 'model/Peer'

export type Lists = {
  main: MainList
  archive: ArchiveList
  folders: FolderList[]
}
export type List = MainList | ArchiveList | FolderList

interface BaseList {
  peerIds: Set<Peer.Id>
  unreadPeerIds: Set<Peer.Id>
  status: 'hasMore' | 'loading' | 'loaded' | 'error'
  boundary: {
    majorId: number
    minorId: number
  }
}

export interface MainList extends BaseList {
  kind: 'Main'
}

export interface ArchiveList extends BaseList {
  kind: 'Archive'
}

interface FolderList extends BaseList {
  kind: 'Folder'
  // TODO: разобраться с форматом, я хз есть ли там айди
  id: number
}

export function defaults(): Lists {
  const getBaseList = (): BaseList => ({
    peerIds: new Set(),
    unreadPeerIds: new Set(),
    status: 'hasMore',
    boundary: {
      majorId: 0,
      minorId: 1
    }
  })

  return {
    main: { kind: 'Main', ...getBaseList() },
    archive: { kind: 'Archive', ...getBaseList() },
    folders: []
  }
}

export function refresh(lists: Lists, convo: Convo.Convo, ignoreMissing?: boolean) {
  console.log(lists, convo, ignoreMissing)
}
