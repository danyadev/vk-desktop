import { GroupsGroup } from 'model/api-types/objects/GroupsGroup'
import { UsersUser } from 'model/api-types/objects/UsersUser'
import * as Peer from 'model/Peer'

export function fromApiUser(apiUser: UsersUser): Peer.User {
  return {
    kind: 'User',
    id: Peer.resolveRealId(apiUser.id, 'User'),
    firstName: apiUser.first_name,
    firstNameAcc: apiUser.first_name_acc,
    lastName: apiUser.last_name,
    lastNameAcc: apiUser.last_name_acc,
    photo50: apiUser.photo_50,
    photo100: apiUser.photo_100,
    gender: apiUser.sex === 1
      ? 'female'
      : apiUser.sex === 2
        ? 'male'
        : 'unknown'
  }
}

export function fromApiGroup(apiGroup: GroupsGroup): Peer.Group {
  return {
    kind: 'Group',
    id: Peer.resolveRealId(apiGroup.id, 'Group'),
    name: apiGroup.name,
    screenName: apiGroup.screen_name,
    photo50: apiGroup.photo_50,
    photo100: apiGroup.photo_100
  }
}
