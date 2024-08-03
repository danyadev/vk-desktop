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
        : 'unknown',
    onlineInfo: {
      visible: apiUser.online_info.visible,
      lastSeen: apiUser.online_info.last_seen
        ? apiUser.online_info.last_seen * 1000
        : undefined,
      isOnline: apiUser.online_info.is_online,
      isMobile: apiUser.online_info.is_mobile,
      status: apiUser.online_info.status,
      appId: apiUser.online_info.app_id
    }
  }
}

export function fromApiGroup(apiGroup: GroupsGroup): Peer.Group {
  return {
    kind: 'Group',
    id: Peer.resolveRealId(apiGroup.id, 'Group'),
    name: apiGroup.name,
    screenName: apiGroup.screen_name,
    photo50: apiGroup.photo_50,
    photo100: apiGroup.photo_100,
    membersCount: apiGroup.members_count ?? 0
  }
}
