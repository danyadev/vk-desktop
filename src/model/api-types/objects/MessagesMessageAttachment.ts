import { BaseImage } from 'model/api-types/objects/BaseImage'
import { GroupsGroup } from 'model/api-types/objects/GroupsGroup'
import { PhotosPhoto } from 'model/api-types/objects/PhotosPhoto'
import { UsersUser } from 'model/api-types/objects/UsersUser'

export type MessagesMessageAttachment = {
  type: MessagesMessageAttachmentType
  photo?: PhotosPhoto
  audio?: unknown
  video?: unknown
  video_playlist?: unknown
  video_message?: unknown
  doc?: unknown
  link?: MessagesMessageAttachmentLink
  market?: unknown
  gift?: unknown
  sticker?: MessagesMessageAttachmentsSticker
  wall?: MessagesMessageAttachmentWall
  wall_reply?: unknown
  money_transfer?: unknown
  money_request?: unknown
  story?: unknown
  article?: unknown
  poll?: unknown
  audio_playlist?: unknown
  podcast?: unknown
  group?: unknown
  curator?: unknown
  widget?: unknown
  link_curator?: unknown
  vkpay?: unknown
  ugc_sticker?: unknown
  album?: unknown
  market_album?: unknown
  call?: unknown
  graffiti?: unknown
  audio_message?: unknown
  artist?: unknown
  event?: unknown
  mini_app?: unknown
  group_call_in_progress?: unknown
  donut_link?: unknown
  narrative?: unknown
  app_action?: unknown
  question?: unknown
  sticker_pack_preview?: unknown
}

export type MessagesMessageAttachmentType =
  | 'photo'
  | 'audio'
  | 'video'
  | 'video_playlist'
  | 'video_message'
  | 'doc'
  | 'link'
  | 'market'
  | 'gift'
  | 'sticker'
  | 'wall'
  | 'wall_reply'
  | 'money_transfer'
  | 'money_request'
  | 'story'
  | 'article'
  | 'poll'
  | 'audio_playlist'
  | 'podcast'
  | 'group'
  | 'curator'
  | 'widget'
  | 'link_curator'
  | 'vkpay'
  | 'ugc_sticker'
  | 'album'
  | 'market_album'
  | 'call'
  | 'graffiti'
  | 'audio_message'
  | 'artist'
  | 'event'
  | 'mini_app'
  | 'group_call_in_progress'
  | 'donut_link'
  | 'narrative'
  | 'app_action'
  | 'question'
  | 'sticker_pack_preview'

export type MessagesMessageAttachmentGeo = {
  coordinates?: {
    latitude: number
    longitude: number
  }
  place?: {
    address?: string
    checkins?: number
    city?: string
    country?: string
    created?: number
    icon?: string
    id?: number
    latitude?: number
    longitude?: number
    title?: string
    type?: string
  }
  showmap?: number
  type?: string
}

type MessagesMessageAttachmentsSticker = {
  inner_type: 'base_sticker_new'
  sticker_id?: number
  product_id?: number
  images?: BaseImage[]
  images_with_background?: BaseImage[]
  animation_url?: string
  animations?: Array<{
    type?: 'light' | 'dark'
    url?: string
  }>
  is_allowed?: boolean
  render?: {
    id?: string
    images: BaseImage[]
    is_stub?: boolean
    is_rendering?: boolean
  }
  vmoji?: {
    character_id: string
  }
  image_config_context?: {
    config_id?: number
    version?: number
  }
}

type MessagesMessageAttachmentLink = {
  url: string
  title?: string
  caption?: string
  photo?: PhotosPhoto
}

export type MessagesMessageAttachmentWall = {
  inner_type: 'wall_wallpost'
  id?: number
  /** Айди автора стены, иногда может не приходить */
  owner_id?: number
  /** Айди автора стены, если не пришел owner_id */
  to_id?: number
  /** Айди автора поста, может отличаться от автора стены */
  from_id?: number
  from?: UsersUser | GroupsGroup
  access_key?: string
  date?: number
  text?: string
  attachments?: MessagesMessageAttachment[]
  copy_history?: MessagesMessageAttachmentWall[]
  poster?: unknown
  views?: { count: number }
  is_deleted?: boolean
  deleted_reason?: string
  deleted_details?: string
  donut?: {
    is_donut: boolean
    placeholder?: { text: string }
  }
}
