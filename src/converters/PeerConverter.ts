import { GroupsGroup } from 'services/contracts/api/objects/GroupsGroup'
import { UsersUser } from 'services/contracts/api/objects/UsersUser'
import * as Peer from 'model/Peer'

export function fromApiUser(apiUser: UsersUser, withExtraFields = false): Peer.User {
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
      visible: !!apiUser.online_info?.visible,
      lastSeen: apiUser.online_info?.last_seen
        ? apiUser.online_info.last_seen * 1000
        : undefined,
      isOnline: apiUser.online_info?.is_online,
      isMobile: apiUser.online_info?.is_mobile,
      status: apiUser.online_info?.status,
      appId: apiUser.online_info?.app_id
    },
    blacklistedByMe: apiUser.blacklisted_by_me === 1,

    ...(withExtraFields && {
      photo200: apiUser.photo_200,
      photoOriginal: apiUser.crop_photo?.photo.orig_photo?.url ?? apiUser.photo_base,
      screenName: apiUser.screen_name,
      phone: apiUser.mobile_phone,
      status: apiUser.status,
      birthDate: apiUser.bdate,
      city: apiUser.city?.title,
      country: apiUser.country?.title,
      site: apiUser.site?.trim(),
      career: apiUser.career,
      universities: apiUser.universities
        ?.map(({ name }) => name)
        .filter((name): name is string => !!name),
      followersCount: apiUser.followers_count,
      deactivated: apiUser.deactivated,
      isClosed: apiUser.is_closed,
      canAccessClosed: apiUser.can_access_closed
    })
  }
}

export function fromApiGroup(apiGroup: GroupsGroup, withExtraFields = false): Peer.Group {
  return {
    kind: 'Group',
    id: Peer.resolveRealId(apiGroup.id, 'Group'),
    name: apiGroup.name,
    screenName: apiGroup.screen_name,
    photo50: apiGroup.photo_50,
    photo100: apiGroup.photo_100,
    membersCount: apiGroup.members_count ?? 0,
    messagesBlocked: apiGroup.is_messages_blocked === 1,

    ...(withExtraFields && {
      photo200: apiGroup.photo_200,
      photoOriginal: apiGroup.crop_photo?.photo.orig_photo?.url ?? apiGroup.photo_base,
      phone: apiGroup.phone,
      status: apiGroup.status,
      description: apiGroup.description,
      activity: apiGroup.activity,
      city: apiGroup.city?.title,
      country: apiGroup.country?.title,
      site: apiGroup.site?.trim()
    })
  }
}
