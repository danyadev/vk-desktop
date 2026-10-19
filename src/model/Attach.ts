import { MessagesMessageAttachmentType } from 'services/contracts/api/objects/MessagesMessageAttachment'
import * as ILang from 'services/contracts/ILang'
import * as Peer from 'model/Peer'
import { Flatten, isObject, NonEmptyArray, typeguard } from 'misc/utils'

export type Attaches = {
  sticker?: Sticker
  photos?: NonEmptyArray<Photo>
  links?: NonEmptyArray<Link>
  voice?: Voice
  wall?: Wall
  unknown?: NonEmptyArray<Unknown>
}

type Attach = NonNullable<Attaches[keyof Attaches]>
export type SingleAttach = Flatten<Attach>

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
  ownerId: Peer.OwnerId
  accessKey?: string
  image: Image
  sizes: ImageSizes
}

export type Link = {
  kind: 'Link'
  url: string
  title: string
  caption: string
  imageSizes?: ImageSizes
}

export type Voice = {
  kind: 'Voice'
  id: number
  ownerId: Peer.OwnerId
  accessKey: string
  linkMp3: string
  linkOgg: string
  duration: number
  waveform: number[]
  wasListened: boolean
  transcript: string
  transcriptState: 'in_progress' | 'done' | 'error'
}

export type Wall = {
  kind: 'Wall'
  id: number
  ownerId: Peer.OwnerId
  authorId: Peer.OwnerId
  accessKey?: string
  createdAt: number
  text: string
  attaches: Attaches
  isDeleted: boolean
  donutPlaceholder?: string
  repost?: Wall
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

export type ImageSize =
  | 's' // сторона <= 75px
  | 'm' // сторона <= 130px
  | 'x' // сторона <= 604px
  | 'y' // сторона <= 807px
  | 'z' // размер <= 1080x1024px
  | 'w' // размер <= 2560x2048px
  | 'o' // кроп со стороной <= 130px; для preview документа - оригинальный размер
  | 'p' // кроп со стороной <= 200px
  | 'q' // кроп со стороной <= 320px
  | 'r' // кроп со стороной <= 510px
  | 'k' // ровно 1074x480px
  | 'l' // ровно 537x240px

export type ImageSizes = Map<ImageSize, Image>

export function kindsCount(attaches: Attaches): number {
  return Object.keys(attaches).length
}

export function count(attaches: Attaches): number {
  return Object.values(attaches).reduce((count, attach) => {
    const attachItemsLength = Array.isArray(attach) ? attach.length : 1

    return count + attachItemsLength
  }, 0)
}

export function ids(attaches: Attaches): string {
  return Object.values(attaches).flat().map(id).filter(Boolean).join(',')
}

export function id(attach: SingleAttach): string {
  const optionalAccessKey = (key?: string) => (key ? `_${key}` : '')

  switch (attach.kind) {
    case 'Photo':
      return `photo${attach.ownerId}_${attach.id}` + optionalAccessKey(attach.accessKey)
    case 'Wall':
      return `wall${attach.ownerId}_${attach.id}` + optionalAccessKey(attach.accessKey)
    case 'Voice':
      return `doc${attach.ownerId}_${attach.id}_${attach.accessKey}`
    case 'Link':
      return attach.url
    case 'Sticker':
      // Отправляется отдельным полем sticker_id
      break
    case 'Unknown':
      return idUnknown(attach)
  }

  return ''
}

function idUnknown({ type, raw }: Unknown): string {
  if (!isObject(raw)) return ''

  const data = (raw as Record<string, Record<string, unknown>>)[type]
  if (!isObject(data)) return ''

  const withOwner = (prefix: string) => {
    if (typeof data.owner_id !== 'number' || typeof data.id !== 'number') return ''

    const accessKey = typeof data.access_key === 'string' && data.access_key
      ? `_${data.access_key}`
      : ''

    return `${prefix}${data.owner_id}_${data.id}${accessKey}`
  }

  switch (type) {
    case 'audio':
    case 'video':
    case 'doc':
    case 'podcast':
    case 'market':
    case 'market_album':
    case 'wall_reply':
    case 'poll':
    case 'story':
    case 'narrative':
    case 'album':
    case 'question':
    case 'audio_playlist':
    case 'ugc_sticker':
    case 'article':
      return withOwner(type)

    case 'graffiti':
      return withOwner('doc')

    case 'artist':
    case 'curator':
      return (typeof data.id === 'number' || typeof data.id === 'string') && data.id !== ''
        ? `${type}${data.id}`
        : ''

    case 'event':
      return typeof data.id === 'number' ? `event${Math.abs(data.id)}` : ''

    case 'donut_link':
      return typeof data.owner_id === 'number' ? `donut_link${data.owner_id}` : ''

    case 'mini_app': {
      const { app } = data
      return isObject(app) && 'id' in app && typeof app.id === 'number'
        ? `mini_app${app.id}`
        : ''
    }

    case 'widget':
      return typeof data.id === 'number' ? `widget${data.id}` : ''

    default:
      return ''
  }
}

export function preview(attach: Attach, lang: ILang.Lang): string {
  if (Array.isArray(attach)) {
    const [firstAttach] = attach

    switch (firstAttach.kind) {
      case 'Photo':
      case 'Link': {
        const lowerCaseName = firstAttach.kind.toLowerCase() as Lowercase<typeof firstAttach.kind>
        return lang.usePlural(`me_message_attach_${lowerCaseName}`, attach.length)
      }

      case 'Unknown':
        return previewUnknown(attach as NonEmptyArray<Unknown>, lang)
    }
  }

  switch (attach.kind) {
    case 'Sticker':
    case 'Wall':
    case 'Voice': {
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

    case 'audio_message':
      return lang.use('me_message_attach_voice')

    case 'gift':
    case 'sticker':
    case 'ugc_sticker':
    case 'wall':
    case 'wall_reply':
    case 'event':
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

/** Поверхностное копирование объекта вложений */
export function copy(attaches: Attaches): Attaches {
  return Object.fromEntries(
    Object.entries(attaches).map(([key, value]) => [
      key,
      Array.isArray(value) ? [...value] : value
    ])
  )
}

export function add(attaches: Attaches, attach: SingleAttach) {
  switch (attach.kind) {
    case 'Photo':
      if (attaches.photos) {
        attaches.photos.push(attach)
      } else {
        attaches.photos = [attach]
      }
      break

    case 'Link':
      if (attaches.links) {
        attaches.links.push(attach)
      } else {
        attaches.links = [attach]
      }
      break

    case 'Unknown':
      if (attaches.unknown) {
        attaches.unknown.push(attach)
      } else {
        attaches.unknown = [attach]
      }
      break

    case 'Sticker':
      attaches.sticker = attach
      break

    case 'Voice':
      attaches.voice = attach
      break

    case 'Wall':
      attaches.wall = attach
      break
  }
}

export function remove(attaches: Attaches, attach: SingleAttach) {
  switch (attach.kind) {
    case 'Photo': {
      if (!attaches.photos) {
        break
      }

      const index = attaches.photos.indexOf(attach)
      if (index === -1) {
        break
      }

      if (attaches.photos.length === 1) {
        delete attaches.photos
      } else {
        attaches.photos.splice(index, 1)
      }
      break
    }

    case 'Link': {
      if (!attaches.links) {
        break
      }

      const index = attaches.links.indexOf(attach)
      if (index === -1) {
        break
      }

      if (attaches.links.length === 1) {
        delete attaches.links
      } else {
        attaches.links.splice(index, 1)
      }
      break
    }

    case 'Unknown': {
      if (!attaches.unknown) {
        break
      }

      const index = attaches.unknown.indexOf(attach)
      if (index === -1) {
        break
      }

      if (attaches.unknown.length === 1) {
        delete attaches.unknown
      } else {
        attaches.unknown.splice(index, 1)
      }
      break
    }

    case 'Sticker':
    case 'Voice':
    case 'Wall': {
      const name = attach.kind.toLowerCase() as Lowercase<typeof attach.kind>
      if (attaches[name] === attach) {
        delete attaches[name]
      }
      break
    }
  }
}
