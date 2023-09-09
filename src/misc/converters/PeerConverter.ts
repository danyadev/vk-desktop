import { UsersUser } from 'model/api-types/objects/UsersUser'
import * as Peer from 'model/Peer'

export function fromApiUser(apiUser: UsersUser): Peer.User {
  return {
    kind: 'User',
    id: Peer.resolveRealId(apiUser.id, 'User'),
    firstName: apiUser.first_name,
    lastName: apiUser.last_name,
    photo50: apiUser.photo_50,
    photo100: apiUser.photo_100
  }
}
