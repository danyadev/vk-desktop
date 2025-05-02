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
    const localUser = peers.get(user.id)

    if (localUser) {
      // Само присваивание нового объекта является триггером для перерисовки всех компонентов,
      // где был запрошен указанный пир, поэтому для дальнейшей оптимизации можно не создавать
      // новый объект, а перезаписывать его поля, многие их которых почти никогда не меняются.
      // Это безопасно: все объекты одинакового типа (kind) имеют полный и одинаковый набор полей,
      // опциональные поля всегда заполняются как явный undefined, сохраняя единую форму
      Object.assign(localUser, user)
    } else {
      peers.set(user.id, user)
    }
  }

  for (const apiGroup of groups ?? []) {
    const group = fromApiGroup(apiGroup)
    const localGroup = peers.get(group.id)

    if (localGroup) {
      Object.assign(localGroup, group)
    } else {
      peers.set(group.id, group)
    }
  }
}
