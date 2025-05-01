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
    const existingUser = peers.get(user.id)

    if (existingUser) {
      // Большинство полей являются примитивами, которые меняются крайне редко, поэтому
      // выгодно сохранить старый объект, чтобы был меньше шанс перерисовки
      Object.assign(existingUser, user)
    } else {
      peers.set(user.id, user)
    }
  }

  for (const apiGroup of groups ?? []) {
    const group = fromApiGroup(apiGroup)
    const existingGroup = peers.get(group.id)

    if (existingGroup) {
      Object.assign(existingGroup, group)
    } else {
      peers.set(group.id, group)
    }
  }
}
