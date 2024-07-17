import { GroupsGroup } from 'model/api-types/objects/GroupsGroup'
import { UsersUser } from 'model/api-types/objects/UsersUser'
import { usePeersStore } from 'store/peers'
import { fromApiGroup, fromApiUser } from 'converters/PeerConverter'

type Props = {
  profiles?: UsersUser[]
  groups?: GroupsGroup[]
}

export function insertPeers({ profiles, groups }: Props) {
  const { peers } = usePeersStore()

  for (const apiUser of profiles ?? []) {
    const user = fromApiUser(apiUser)
    peers.set(user.id, user)
  }
  for (const apiGroup of groups ?? []) {
    const group = fromApiGroup(apiGroup)
    peers.set(group.id, group)
  }
}
