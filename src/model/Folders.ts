import * as Convo from 'model/Convo'
import * as Peer from 'model/Peer'

export type Folders = {
  main: MainFolder
  archive: ArchiveFolder
}
export type Folder = Folders[keyof Folders]

interface BaseFolder {
  peerIds: Set<Peer.Id>
  unreadPeerIds: Set<Peer.Id>
  status: 'hasMore' | 'loading' | 'loaded' | 'error'
}

interface MainFolder extends BaseFolder {
  kind: 'Main'
}

interface ArchiveFolder extends BaseFolder {
  kind: 'Archive'
}

export function defaults(): Folders {
  const baseFilter: BaseFolder = {
    peerIds: new Set(),
    unreadPeerIds: new Set(),
    status: 'hasMore'
  }

  return {
    main: { kind: 'Main', ...baseFilter },
    archive: { kind: 'Archive', ...baseFilter }
  }
}

export function refresh(folders: Folders, convo: Convo.Convo, ignoreMissing?: boolean) {
  if (!ignoreMissing || folders.main.peerIds.has(convo.id)) {
    // a
  }
}
