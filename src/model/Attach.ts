import * as ILang from 'env/ILang'
import { NonEmptyArray } from 'misc/utils'

export type Attaches = {
  unknown?: NonEmptyArray<Unknown>
}

type Attach = NonNullable<Attaches[keyof Attaches]>

type Unknown = {
  kind: 'Unknown'
  type: string
  raw: unknown
}

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
  switch (attach[0].type) {
    case 'photo':
    case 'video':
    case 'audio':
    case 'doc':
    case 'link':
      return lang.usePlural(`me_message_attach_${attach[0].type}`, attach.length)

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
      return lang.use(`me_message_attach_${attach[0].type}`)

    default:
      return lang.use('me_unknown_attach')
  }
}
