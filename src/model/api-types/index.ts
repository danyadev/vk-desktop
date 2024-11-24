import {
  AuthCheckAuthCodeParams,
  AuthCheckAuthCodeResponse,
  AuthExchangeSilentAuthTokenParams,
  AuthExchangeSilentAuthTokenResponse,
  AuthGetAnonymTokenParams,
  AuthGetAnonymTokenResponse,
  AuthGetAuthCodeParams,
  AuthGetAuthCodeResponse,
  AuthGetExchangeTokenParams,
  AuthGetExchangeTokenResponse,
  AuthGetOauthTokenParams,
  AuthGetOauthTokenResponse,
  AuthProcessAuthCodeParams,
  AuthProcessAuthCodeResponse,
  AuthValidateAccountParams,
  AuthValidateAccountResponse,
  AuthValidatePhoneParams,
  AuthValidatePhoneResponse
} from 'model/api-types/methods/Auth'
import { CaptchaForceParams, CaptchaForceResponse } from 'model/api-types/methods/Captcha'
import { GroupsGetByIdParams, GroupsGetByIdResponse } from 'model/api-types/methods/Groups'
import {
  MessagesGetConversationsParams,
  MessagesGetConversationsResponse,
  MessagesGetHistoryParams,
  MessagesGetHistoryResponse,
  MessagesGetLongPollHistoryParams,
  MessagesGetLongPollHistoryResponse,
  MessagesGetLongPollServerParams,
  MessagesGetLongPollServerResponse,
  MessagesSendParams,
  MessagesSendResponse
} from 'model/api-types/methods/Messages'
import { UsersGetParams, UsersGetResponse } from 'model/api-types/methods/Users'
import { AccountSetSilenceModeParams, AccountSetSilenceModeResponse } from './methods/Account'

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
  'auth.getAnonymToken': {
    params: AuthGetAnonymTokenParams
    response: AuthGetAnonymTokenResponse
  }
  'auth.getAuthCode': {
    params: AuthGetAuthCodeParams
    response: AuthGetAuthCodeResponse
  }
  'auth.checkAuthCode': {
    params: AuthCheckAuthCodeParams
    response: AuthCheckAuthCodeResponse
  }
  'auth.validateAccount': {
    params: AuthValidateAccountParams
    response: AuthValidateAccountResponse
  }
  'auth.processAuthCode': {
    params: AuthProcessAuthCodeParams
    response: AuthProcessAuthCodeResponse
  }
  'auth.exchangeSilentAuthToken': {
    params: AuthExchangeSilentAuthTokenParams
    response: AuthExchangeSilentAuthTokenResponse
  }
  'auth.getExchangeToken': {
    params: AuthGetExchangeTokenParams
    response: AuthGetExchangeTokenResponse
  }

  'captcha.force': {
    params: CaptchaForceParams
    response: CaptchaForceResponse
  }

  'account.setSilenceMode': {
    params: AccountSetSilenceModeParams
    response: AccountSetSilenceModeResponse
  }

  'groups.getById': {
    params: GroupsGetByIdParams
    response: GroupsGetByIdResponse
  }

  'messages.getConversations': {
    params: MessagesGetConversationsParams
    response: MessagesGetConversationsResponse
  }
  'messages.getHistory': {
    params: MessagesGetHistoryParams
    response: MessagesGetHistoryResponse
  }
  'messages.getLongPollServer': {
    params: MessagesGetLongPollServerParams
    response: MessagesGetLongPollServerResponse
  }
  'messages.getLongPollHistory': {
    params: MessagesGetLongPollHistoryParams
    response: MessagesGetLongPollHistoryResponse
  }

  'messages.send': {
    params: MessagesSendParams
    response: MessagesSendResponse
  }

  'users.get': {
    params: UsersGetParams
    response: UsersGetResponse
  }
}
