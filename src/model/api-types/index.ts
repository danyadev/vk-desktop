import {
  AuthGetOauthTokenParams, AuthGetOauthTokenResponse,
  AuthValidatePhoneParams,
  AuthValidatePhoneResponse
} from 'model/api-types/methods/Auth'
import { CaptchaForceParams, CaptchaForceResponse } from 'model/api-types/methods/Captcha'
import { GroupsGetByIdParams, GroupsGetByIdResponse } from 'model/api-types/methods/Groups'
import {
  MessagesGetConversationsParams,
  MessagesGetConversationsResponse,
  MessagesGetLongPollServerParams,
  MessagesGetLongPollServerResponse
} from 'model/api-types/methods/Messages'
import { UsersGetParams, UsersGetResponse } from 'model/api-types/methods/Users'

/**
 * Disclaimer:
 * Здесь описана только та часть типов, которая необходима для приложения.
 * То есть приходящие объекты могут содержать больше полей, чем описано (но не меньше)
 */

export type CommonParams = {
  v?: string
  access_token?: string
  lang?: string
  captcha_sid?: string
  captcha_key?: string
}

export type Methods = {
  execute: {
    params: { code: string }
    response: unknown
  }

  'auth.validatePhone': {
    params: AuthValidatePhoneParams
    response: AuthValidatePhoneResponse
  }
  'auth.getOauthToken': {
    params: AuthGetOauthTokenParams
    response: AuthGetOauthTokenResponse
  }

  'captcha.force': {
    params: CaptchaForceParams
    response: CaptchaForceResponse
  }

  'groups.getById': {
    params: GroupsGetByIdParams
    response: GroupsGetByIdResponse
  }

  'messages.getConversations': {
    params: MessagesGetConversationsParams
    response: MessagesGetConversationsResponse
  }
  'messages.getLongPollServer': {
    params: MessagesGetLongPollServerParams
    response: MessagesGetLongPollServerResponse
  }

  'users.get': {
    params: UsersGetParams
    response: UsersGetResponse
  }
}
