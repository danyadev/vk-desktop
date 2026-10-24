import { GroupsGroup } from 'services/contracts/api/objects/GroupsGroup'
import { UsersUser } from 'services/contracts/api/objects/UsersUser'
import { usePeersStore } from 'store/peers'
import { fromApiGroup, fromApiUser } from 'converters/PeerConverter'

type Props = {
  profiles?: UsersUser[]
  groups?: GroupsGroup[]
  withExtraFields?: boolean
}

export function insertPeers({ profiles, groups, withExtraFields }: Props) {
  const { peers } = usePeersStore()

  for (const apiUser of profiles ?? []) {
    const user = fromApiUser(apiUser, withExtraFields)
    const localUser = peers.get(user.id)

    if (localUser) {
      // Обновляем объект на месте, сохраняя его ссылку в store и не вызывая
      // лишних реактивных обновлений из-за замены объекта целиком.
      // Для корректной работы Object.assign важно решить проблему опциональных полей:
      // например, если попытаться обновить { optional: 1 } на {}, само поле никуда не денется.
      // Поэтому в моделях вместо опциональных полей теперь всегда явно выставляется undefined.
      // Это также позволяет сохранять стабильную форму объектов (см. V8 hidden class):
      // одинаковый набор и порядок свойств позволяют JS-движку переиспользовать
      // оптимизированные способы доступа к ним через inline caches
      Object.assign(localUser, user)
    } else {
      peers.set(user.id, user)
    }
  }

  for (const apiGroup of groups ?? []) {
    const group = fromApiGroup(apiGroup, withExtraFields)
    const localGroup = peers.get(group.id)

    if (localGroup) {
      Object.assign(localGroup, group)
    } else {
      peers.set(group.id, group)
    }
  }
}
