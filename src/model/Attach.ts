import * as ILang from 'env/ILang'
import { NonEmptyArray } from 'misc/utils'

export type Attaches = {
  sticker?: Sticker
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

type Unknown = {
  kind: 'Unknown'
  type: string
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
    switch (attach[0].kind) {
      case 'Unknown':
        return previewUnknown(attach, lang)
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
    case 'geo':
    case 'call':
    case 'group_call_in_progress':
    case 'mini_app':
    case 'app_action':
    case 'video_message':
    case 'widget':
    case 'question':
    case 'donut_link':
      return lang.use(`me_message_attach_${firstType}`)

    default:
      return lang.use('me_unknown_attach')
  }
}
