import { GroupsGroup } from 'services/contracts/api/objects/GroupsGroup'
import { UsersUser } from 'services/contracts/api/objects/UsersUser'
import * as Peer from 'model/Peer'
import { usePeersStore } from 'store/peers'
import { fromApiGroup, fromApiUser } from 'converters/PeerConverter'

type Props = {
  profiles?: UsersUser[]
  groups?: GroupsGroup[]
  withExtraFields?: boolean
}

export function insertPeers({ profiles, groups, withExtraFields }: Props) {
  for (const apiUser of profiles ?? []) {
    insertPeerModel(fromApiUser(apiUser, withExtraFields))
  }

  for (const apiGroup of groups ?? []) {
    insertPeerModel(fromApiGroup(apiGroup, withExtraFields))
  }
}

export function insertPeerModel(peer: Peer.Peer) {
  const { peers } = usePeersStore()
  const localPeer = peers.get(peer.id)

  if (localPeer) {
    // Обновляем объект на месте, сохраняя его ссылку в store и не вызывая
    // лишних реактивных обновлений из-за замены объекта целиком.
    // Для корректной работы Object.assign важно решить проблему опциональных полей:
    // например, если попытаться обновить { optional: 1 } на {}, само поле никуда не денется.
    // Поэтому в моделях вместо опциональных полей теперь всегда явно выставляется undefined.
    // Это также позволяет сохранять стабильную форму объектов (см. V8 hidden class):
    // одинаковый набор и порядок свойств позволяют JS-движку переиспользовать
    // оптимизированные способы доступа к ним через inline caches
    Object.assign(localPeer, peer)
  } else {
    peers.set(peer.id, peer)
  }
}
