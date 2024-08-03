import * as ILang from 'env/ILang'
import { MessagesMessageAttachmentType } from 'model/api-types/objects/MessagesMessageAttachment'
import * as Peer from 'model/Peer'
import { NonEmptyArray, typeguard } from 'misc/utils'

export type Attaches = {
  sticker?: Sticker
  photos?: NonEmptyArray<Photo>
  unknown?: NonEmptyArray<Unknown>
}

type Attach = NonNullable<Attaches[keyof Attaches]>

export type Sticker = {
  kind: 'Sticker'
  id: number
  packId: number
  images?: ImageList
  imagesWithBackground?: ImageList
}

export type Photo = {
  kind: 'Photo'
  id: number
  ownerId: Peer.UserId | Peer.GroupId
  accessKey?: string
  image: Image
}

type Unknown = {
  kind: 'Unknown'
  type: MessagesMessageAttachmentType
  raw: unknown
}

type Image = {
  url: string
  width: number
  height: number
}

export type ImageList = NonEmptyArray<Image>

export function kindsCount(attaches: Attaches): number {
  return Object.keys(attaches).length
}

export function count(attaches: Attaches): number {
  return Object.values(attaches).reduce((count, attach) => {
    const attachItemsLength = Array.isArray(attach) ? attach.length : 1

    return count + attachItemsLength
  }, 0)
}

export function preview(attach: Attach, lang: ILang.Lang): string {
  if (Array.isArray(attach)) {
    const [firstAttach] = attach

    switch (firstAttach.kind) {
      case 'Photo': {
        const lowerCaseName = firstAttach.kind.toLowerCase() as Lowercase<typeof firstAttach.kind>
        return lang.usePlural(`me_message_attach_${lowerCaseName}`, attach.length)
      }

      case 'Unknown':
        return previewUnknown(attach as NonEmptyArray<Unknown>, lang)
    }
  }

  switch (attach.kind) {
    case 'Sticker': {
      const lowerCaseName = attach.kind.toLowerCase() as Lowercase<typeof attach.kind>
      return lang.use(`me_message_attach_${lowerCaseName}`)
    }
  }
}

function previewUnknown(unknown: NonNullable<Attaches['unknown']>, lang: ILang.Lang) {
  const firstType = unknown[0].type

  switch (firstType) {
    case 'photo':
    case 'video':
    case 'audio':
    case 'doc':
    case 'link':
      return lang.usePlural(
        `me_message_attach_${firstType}`,
        unknown.filter(({ type }) => type === firstType).length
      )

    case 'gift':
    case 'sticker':
    case 'ugc_sticker':
    case 'wall':
    case 'wall_reply':
    case 'event':
    case 'audio_message':
    case 'audio_playlist':
    case 'artist':
    case 'curator':
    case 'article':
    case 'poll':
    case 'story':
    case 'narrative':
    case 'graffiti':
    case 'market':
    case 'podcast':
    case 'money_request':
    case 'money_transfer':
    case 'call':
    case 'group_call_in_progress':
    case 'mini_app':
    case 'app_action':
    case 'video_message':
    case 'widget':
    case 'question':
    case 'donut_link':
      return lang.use(`me_message_attach_${firstType}`)

    case 'video_playlist':
    case 'group':
    case 'link_curator':
    case 'vkpay':
    case 'album':
    case 'market_album':
    case 'sticker_pack_preview':
      return lang.use('me_unknown_attach')

    default:
      typeguard(firstType)
      return lang.use('me_unknown_attach')
  }
}
